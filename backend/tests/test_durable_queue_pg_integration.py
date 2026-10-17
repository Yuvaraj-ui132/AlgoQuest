"""
test_durable_queue_pg_integration.py — Real PostgreSQL 16 Concurrency and Reliability Verification.

Executes integration tests directly against a real local PostgreSQL 16 database.
Validates:
1. Schema & Migration Integrity (V1 + V2 applied cleanly to fresh PostgreSQL 16 database).
2. Job Persistence across simulated process restarts.
3. Concurrent Job Claiming (atomicity, race-condition barrier, SKIP LOCKED concurrency across threads).
4. Worker Lease Expiry, Heartbeats, and Orphan Recovery (short TTL testing).
5. Retry Limits, Transient Failures, Terminal Dead-Lettering, and Sensitive Code Scrubbing.
6. Deduplication and External Execution Semantics (At-least-once Judge0 execution + idempotent DB persistence).
7. Queue Capacity Backpressure (HTTP 503 + Retry-After: 5) and Cache-Miss Polling Parity.
"""

import os
import sys
import time
import uuid
import threading
import subprocess
import pytest
from fastapi import HTTPException
import psycopg2

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import supabase_service
from app.services.supabase_service import (
    Submission,
    enqueue_job_sync,
    claim_next_job_sync,
    heartbeat_job_sync,
    complete_job_sync,
    fail_job_sync,
    recover_orphan_jobs_sync,
    count_pending_jobs_sync,
    get_queue_job_sync,
    delete_old_jobs_sync,
    record_submission_sync,
)
from app.services.submission_queue import SubmissionQueue, JobStatus


# ── PostgreSQL 16 Lifecycle & Test Database Setup ─────────────────────────────

WORKSPACE_BIN = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".pgsql", "bin"))
SCRATCH_BIN = os.path.abspath(r"C:\Users\Shree\.gemini\antigravity-ide\brain\07208254-08f9-489b-a9a3-c78298a2e1a0\scratch\pg16\node_modules\@embedded-postgres\windows-x64\native\bin")

if os.path.exists(os.path.join(WORKSPACE_BIN, "postgres.exe")):
    BIN_DIR = WORKSPACE_BIN
elif os.path.exists(os.path.join(SCRATCH_BIN, "postgres.exe")):
    BIN_DIR = SCRATCH_BIN
else:
    BIN_DIR = WORKSPACE_BIN

POSTGRES_EXE = os.path.join(BIN_DIR, "postgres.exe")
PG_CTL_EXE = os.path.join(BIN_DIR, "pg_ctl.exe")
INITDB_EXE = os.path.join(BIN_DIR, "initdb.exe")
DATA_DIR = os.path.abspath(r"C:\Users\Shree\.gemini\antigravity-ide\brain\07208254-08f9-489b-a9a3-c78298a2e1a0\scratch\pgdata_clean")
PG_PORT = int(os.environ.get("PG_PORT", 5434))
PG_TEST_URL = os.environ.get("TEST_PG_URL", f"postgresql://postgres@localhost:{PG_PORT}/algoquest_test")
PG_ADMIN_URL = os.environ.get("TEST_PG_ADMIN_URL", f"postgresql://postgres@localhost:{PG_PORT}/postgres")


@pytest.fixture(scope="session", autouse=True)
def postgresql16_service():
    """
    Spawns or connects to the PostgreSQL 16 server for the test session.
    Applies V1, V2, and V3 migrations to a clean algoquest_test database.
    """
    import psycopg2

    # Check if already running / accessible
    already_running = False
    try:
        test_conn = psycopg2.connect(PG_ADMIN_URL, connect_timeout=2)
        test_conn.close()
        already_running = True
    except Exception:
        already_running = False

    proc = None
    if not already_running:
        if os.path.exists(POSTGRES_EXE) and os.path.exists(INITDB_EXE):
            # Initialize cluster if needed
            if not os.path.exists(DATA_DIR):
                subprocess.run([INITDB_EXE, "-D", DATA_DIR, "-U", "postgres", "--auth=trust", "-E", "UTF8"], check=True)

            # Start PostgreSQL 16
            proc = subprocess.Popen([POSTGRES_EXE, "-D", DATA_DIR, "-p", str(PG_PORT)])
        else:
            pytest.skip("PostgreSQL 16 instance is not accessible and local binary not found. Skipping PG integration tests.")

    # Wait for PostgreSQL to become fully ready to accept connections (bounded polling)
    ready = False
    start_wait = time.time()
    last_err = None
    timeout_seconds = 20
    while time.time() - start_wait < timeout_seconds:
        try:
            test_conn = psycopg2.connect(PG_ADMIN_URL, connect_timeout=1)
            test_conn.close()
            ready = True
            break
        except Exception as e:
            last_err = e
            time.sleep(0.5)

    if not ready:
        if proc:
            proc.terminate()
        raise TimeoutError(
            f"PostgreSQL 16 instance on {PG_ADMIN_URL} did not become ready within {timeout_seconds}s. "
            f"Last connection error: {last_err}"
        )

    # Create clean test database
    admin_conn = psycopg2.connect(PG_ADMIN_URL)
    admin_conn.autocommit = True
    admin_cur = admin_conn.cursor()
    admin_cur.execute("DROP DATABASE IF EXISTS algoquest_test")
    admin_cur.execute("CREATE DATABASE algoquest_test")
    admin_cur.close()
    admin_conn.close()

    # Apply V1 and V2 migrations
    db_conn = psycopg2.connect(PG_TEST_URL)
    db_conn.autocommit = True
    db_cur = db_conn.cursor()

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    v1_path = os.path.join(repo_root, "backend", "migrations", "V1__initial_schema.sql")
    v2_path = os.path.join(repo_root, "backend", "migrations", "V2__durable_queue.sql")
    v3_path = os.path.join(repo_root, "backend", "migrations", "V3__indexing_and_query_optimization.sql")

    with open(v1_path, "r", encoding="utf-8") as f:
        db_cur.execute(f.read())

    with open(v2_path, "r", encoding="utf-8") as f:
        db_cur.execute(f.read())

    if os.path.exists(v3_path):
        with open(v3_path, "r", encoding="utf-8") as f:
            db_cur.execute(f.read())

    db_cur.close()
    db_conn.close()

    # Configure supabase_service to connect to PostgreSQL 16
    engine = supabase_service.get_engine(PG_TEST_URL)
    assert engine.dialect.name == "postgresql"

    yield engine

    # Clean shutdown
    if proc is not None:
        subprocess.run([PG_CTL_EXE, "-D", DATA_DIR, "stop", "-m", "fast"], check=False)
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.terminate()


@pytest.fixture(autouse=True)
def clean_database_tables(postgresql16_service):
    """Truncate tables between test runs for complete test isolation in PostgreSQL 16."""
    import psycopg2
    conn = psycopg2.connect(PG_TEST_URL)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("TRUNCATE queue_jobs, submissions, user_progress, users CASCADE;")
    cur.close()
    conn.close()
    yield


# ── 1. Migration & Schema Validation on PostgreSQL 16 ─────────────────────────

def test_postgresql16_schema_and_indexes_applied():
    """Verify that V1, V2, and V3 created tables, check constraints, and optimized indexes on PostgreSQL 16."""
    import psycopg2
    conn = psycopg2.connect(PG_TEST_URL)
    cur = conn.cursor()

    # Verify tables
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    tables = {r[0] for r in cur.fetchall()}
    assert "queue_jobs" in tables
    assert "submissions" in tables
    assert "users" in tables

    # Verify queue_jobs indexes (V2 + V3)
    cur.execute("SELECT indexname FROM pg_indexes WHERE tablename='queue_jobs'")
    q_indexes = {r[0] for r in cur.fetchall()}
    assert "idx_queue_jobs_claim" in q_indexes
    assert "idx_queue_jobs_orphan" in q_indexes
    assert "idx_queue_jobs_uid" in q_indexes
    assert "idx_queue_jobs_active_count" in q_indexes
    assert "idx_queue_jobs_cleanup" in q_indexes

    # Verify submissions indexes (V1 preserved, V3 additions deferred)
    cur.execute("SELECT indexname FROM pg_indexes WHERE tablename='submissions'")
    s_indexes = {r[0] for r in cur.fetchall()}
    assert "idx_submissions_user_submitted" in s_indexes
    assert "idx_submissions_user_verdict" not in s_indexes
    assert "idx_submissions_question_id" not in s_indexes

    # Verify redundant single-column prefix indexes were dropped in V3
    cur.execute("SELECT tablename, indexname FROM pg_indexes WHERE schemaname='public'")
    all_indexes = {(r[0], r[1]) for r in cur.fetchall()}
    assert ("user_progress", "idx_user_progress_user") not in all_indexes
    assert ("user_progress", "uq_user_progress_user_question") in all_indexes
    assert ("user_bookmarks", "idx_user_bookmarks_user") not in all_indexes
    assert ("user_bookmarks", "uq_user_bookmarks_user_question") in all_indexes
    assert ("user_notes", "idx_user_notes_user") not in all_indexes
    assert ("user_notes", "uq_user_notes_user_question") in all_indexes
    assert ("user_editor_drafts", "idx_user_editor_drafts_user") not in all_indexes
    assert ("user_editor_drafts", "uq_user_editor_drafts_user_question") in all_indexes
    assert ("user_compiler_drafts", "idx_user_compiler_drafts_user") not in all_indexes
    assert ("user_compiler_drafts", "uq_user_compiler_drafts_user_lang") in all_indexes

    cur.close()
    conn.close()


# ── 2. Job Persistence across Application Restart ────────────────────────────

def test_queued_job_survives_restart_and_processes_on_postgresql16():
    """
    Verify:
    1. A job queued before restart survives in PostgreSQL 16.
    2. Wiping in-memory state simulates process crash/restart.
    3. Re-hydration from PostgreSQL 16 restores the job state accurately.
    4. Worker claims, processes, and persists terminal status in PostgreSQL 16.
    """
    q1 = SubmissionQueue(pg_mode=True)
    job = q1.create_job(
        uid="usr_restart_test",
        question_id=1,
        language_id=71,
        source_code="print('restart_ok')",
        request_id="req_restart_999",
    )
    job_id = job.job_id

    # SIMULATE CRASH & RESTART: wipe in-memory cache and discard q1
    q1._jobs.clear()
    del q1

    # New backend instance starts up
    q2 = SubmissionQueue(pg_mode=True)

    # Client polls before worker claims -> cache miss re-hydrates from PostgreSQL 16
    rehydrated = q2.get_job(job_id, "usr_restart_test")
    assert rehydrated is not None
    assert rehydrated.job_id == job_id
    assert rehydrated.uid == "usr_restart_test"
    assert rehydrated.status == JobStatus.QUEUED
    assert rehydrated.request_id == "req_restart_999"

    # Worker on new instance claims surviving job from PostgreSQL 16
    claimed = q2._claim_pg_job_sync("worker-survivor-1")
    assert claimed is not None
    assert claimed["job_id"] == job_id
    assert claimed["status"] == "running"
    assert claimed["worker_id"] == "worker-survivor-1"
    assert claimed["retries"] == 1

    # Worker finishes execution
    safe_result = {"verdict": "Accepted", "status_id": 3, "runtime": "0.02s", "memory": "11 MB"}
    ok = q2._complete_pg_job_sync(job_id, "worker-survivor-1", safe_result)
    assert ok is True

    # Wipe in-memory cache again to verify persistent completed state
    q2._jobs.clear()
    polled = q2.get_job(job_id, "usr_restart_test")
    assert polled is not None
    assert polled.status == JobStatus.COMPLETED
    assert polled.result["verdict"] == "Accepted"


# ── 3. Concurrent Job Claiming via FOR UPDATE SKIP LOCKED ──────────────────────

def test_concurrent_workers_claim_distinct_jobs_under_high_contention():
    """
    Launch 10 concurrent worker threads competing simultaneously against 10 queued jobs.
    Uses a synchronization barrier to force all threads into claim_next_job_sync at
    the exact same instant.
    Asserts:
    - Every worker claims a distinct job.
    - No two workers ever claim the same job (FOR UPDATE SKIP LOCKED guarantees this).
    - Exactly 10 unique jobs are claimed without deadlocks.
    """
    # Enqueue 10 jobs
    job_ids = []
    for i in range(10):
        jid = enqueue_job_sync(
            uid=f"user_c_{i}",
            question_id=i + 1,
            language_id=71,
            source_code=f"code_{i}",
        )
        job_ids.append(jid)

    barrier = threading.Barrier(10)
    claimed_results = []
    claimed_lock = threading.Lock()

    def worker_thread(worker_num: int):
        barrier.wait()  # synchronize release
        claimed = claim_next_job_sync(f"concurrent-worker-{worker_num}")
        if claimed:
            with claimed_lock:
                claimed_results.append((worker_num, claimed["job_id"]))

    threads = [threading.Thread(target=worker_thread, args=(i,)) for i in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(claimed_results) == 10
    claimed_job_ids = [cid for _, cid in claimed_results]
    assert len(set(claimed_job_ids)) == 10, "Collision! Workers claimed duplicate jobs!"
    assert set(claimed_job_ids) == set(job_ids)


def test_concurrent_claim_on_single_job_prevents_duplicate_activation():
    """
    Launch 5 concurrent worker threads all attempting to claim ONE single pending job.
    Exactly 1 worker must succeed; the other 4 must receive None without blocking.
    """
    jid = enqueue_job_sync(uid="single_u", question_id=1, language_id=71, source_code="c")

    barrier = threading.Barrier(5)
    successful_claims = []
    lock = threading.Lock()

    def claim_attempt(worker_num: int):
        barrier.wait()
        claimed = claim_next_job_sync(f"race-worker-{worker_num}")
        if claimed:
            with lock:
                successful_claims.append(f"race-worker-{worker_num}")

    threads = [threading.Thread(target=claim_attempt, args=(i,)) for i in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(successful_claims) == 1, f"Expected exactly 1 claim, got: {successful_claims}"


# ── 4. Worker Lease Expiry, Heartbeats, and Orphan Recovery ────────────────────

def test_lease_expiry_and_orphan_recovery_in_postgresql16():
    """
    Verify:
    1. A job claimed with lease_seconds=1 becomes an orphan when worker dies.
    2. Before lease expiry: recover_orphan_jobs_sync does not prematurely steal it.
    3. After lease expiry: recover_orphan_jobs_sync resets it to pending.
    4. Worker 2 claims and completes the recovered job.
    """
    jid = enqueue_job_sync(
        uid="u_orphan",
        question_id=1,
        language_id=71,
        source_code="orphan_code",
        lease_seconds=1,
    )

    claimed_1 = claim_next_job_sync("worker-dead")
    assert claimed_1 is not None
    assert claimed_1["status"] == "running"

    # Immediately: lease has NOT expired
    recovered_early = recover_orphan_jobs_sync()
    assert recovered_early == 0

    # Wait for the 1-second lease to expire
    time.sleep(1.2)

    # Orphan sweep
    recovered = recover_orphan_jobs_sync()
    assert recovered == 1

    # Worker 2 claims the recovered job
    claimed_2 = claim_next_job_sync("worker-alive")
    assert claimed_2 is not None
    assert claimed_2["job_id"] == jid
    assert claimed_2["worker_id"] == "worker-alive"
    assert claimed_2["retries"] == 2


def test_heartbeat_renews_lease_preventing_recovery():
    """
    Verify that calling heartbeat_job_sync keeps locked_at fresh,
    preventing orphan recovery even after original lease duration elapses.
    """
    jid = enqueue_job_sync(
        uid="u_hb",
        question_id=1,
        language_id=71,
        source_code="hb_code",
        lease_seconds=2,
    )
    claim_next_job_sync("worker-active")

    # Sleep 1s, send heartbeat (extends lease another 2s)
    time.sleep(1.0)
    ok = heartbeat_job_sync(jid, "worker-active")
    assert ok is True

    # Sleep 1.2s (total 2.2s since claim, but only 1.2s since heartbeat)
    time.sleep(1.2)

    # Sweep should NOT recover because heartbeat renewed lease
    recovered = recover_orphan_jobs_sync()
    assert recovered == 0


# ── 5. Bounded Retries, Terminal Failure & Code Scrubbing ──────────────────────

def test_transient_failure_retries_and_terminal_dead_lettering():
    """
    Verify:
    1. Transient failures increment retries up to max_retries.
    2. Reaching max_retries permanently dead-letters the job to 'failed'.
    3. Transient source_code is scrubbed to '' on terminal failure for security.
    4. Completed jobs cannot accidentally revert or be claimed again.
    """
    jid = enqueue_job_sync(
        uid="u_retry_pg",
        question_id=1,
        language_id=71,
        source_code="sensitive_user_code_123",
        max_retries=2,
    )

    # Claim 1 & transient fail
    claim_next_job_sync("w1")
    res1 = fail_job_sync(jid, "w1", "Judge0 504 Gateway Timeout", permanent=False)
    assert res1["retried"] is True
    assert res1["status"] == "pending"

    # Claim 2 & transient fail (exhausting max_retries=2)
    claim_next_job_sync("w2")
    res2 = fail_job_sync(jid, "w2", "Judge0 502 Bad Gateway", permanent=False)
    assert res2["retried"] is False
    assert res2["status"] == "failed"

    # Verify PostgreSQL row state
    job_row = get_queue_job_sync(jid, "u_retry_pg")
    assert job_row["status"] == "failed"
    assert job_row["source_code"] == "", "Source code was not cleared on failure!"
    assert "502" in job_row["error"]

    # Dead-lettered job cannot be claimed
    assert claim_next_job_sync("w3") is None


def test_permanent_failure_terminates_immediately():
    """Invalid question / catalogue errors must not waste retries."""
    jid = enqueue_job_sync(
        uid="u_perm",
        question_id=9999,
        language_id=71,
        source_code="bad_code",
        max_retries=3,
    )
    claim_next_job_sync("w1")
    res = fail_job_sync(jid, "w1", "Question 9999 not found in catalogue", permanent=True)
    assert res["retried"] is False
    assert res["status"] == "failed"
    assert claim_next_job_sync("w2") is None


# ── 6. Deduplication and At-Least-Once External Execution Semantics ───────────

def test_submission_history_deduplication_by_job_id():
    """
    Verify:
    Calling record_submission_sync multiple times with the same submission_id
    (e.g. after a worker crash following Judge0 execution) produces exactly
    ONE record in the submissions table in PostgreSQL 16.
    """
    sub_id = str(uuid.uuid4())
    uid = "u_dedup_test"

    # Simulate: Worker 1 executes Judge0 and writes history, but crashes before completing queue_job
    record_submission_sync(
        uid=uid,
        question_id=1,
        verdict="Accepted",
        status_id=3,
        language_id=71,
        passed_count=10,
        total_count=10,
        runtime="0.04s",
        memory="14 MB",
        submission_id=sub_id,
    )

    # Simulate: Worker 2 recovers job, re-executes Judge0, and calls record_submission_sync
    record_submission_sync(
        uid=uid,
        question_id=1,
        verdict="Accepted",
        status_id=3,
        language_id=71,
        passed_count=10,
        total_count=10,
        runtime="0.04s",
        memory="14 MB",
        submission_id=sub_id,
    )

    session = supabase_service.get_db_session()
    try:
        count = session.query(Submission).filter(Submission.id == uuid.UUID(sub_id)).count()
        assert count == 1, "Duplicate submission record was inserted in PostgreSQL!"
    finally:
        session.close()


def test_completed_job_cannot_be_reverted_or_claimed():
    """Completed jobs cannot be claimed, failed, or reverted in PostgreSQL 16."""
    jid = enqueue_job_sync(uid="u_comp", question_id=1, language_id=71, source_code="code")
    claim_next_job_sync("w1")
    complete_job_sync(jid, "w1", {"verdict": "Accepted"})

    # Attempt to claim
    assert claim_next_job_sync("w2") is None

    # Attempt to fail
    fail_res = fail_job_sync(jid, "w2", "Error", permanent=False)
    assert fail_res["status"] in ("not_found", "failed")

    # Status remains completed
    row = get_queue_job_sync(jid, "u_comp")
    assert row["status"] == "completed"


# ── 7. Queue Backpressure and Polling Parity ─────────────────────────────────

def test_durable_queue_backpressure_enforcement():
    """
    When active jobs in PostgreSQL 16 reach max capacity, create_job must raise
    HTTP 503 with Retry-After: 5.
    """
    bounded_q = SubmissionQueue(maxsize=3, pg_mode=True)

    # Enqueue 3 jobs (fill capacity)
    j1 = bounded_q.create_job(uid="u1", question_id=1, language_id=71, source_code="c1")
    j2 = bounded_q.create_job(uid="u2", question_id=2, language_id=71, source_code="c2")
    j3 = bounded_q.create_job(uid="u3", question_id=3, language_id=71, source_code="c3")

    assert count_pending_jobs_sync() == 3

    # 4th job must be rejected with 503
    with pytest.raises(HTTPException) as exc_info:
        bounded_q.create_job(uid="u4", question_id=4, language_id=71, source_code="c4")

    assert exc_info.value.status_code == 503
    assert exc_info.value.headers.get("Retry-After") == "5"

    # Once a worker completes a job, capacity is freed
    claim_next_job_sync("w1")
    complete_job_sync(j1.job_id, "w1", {"verdict": "Accepted"})

    # Now a new job can be queued
    j4 = bounded_q.create_job(uid="u4", question_id=4, language_id=71, source_code="c4")
    assert j4 is not None


def test_polling_cache_miss_parity_and_cross_tenant_security():
    """
    Verify:
    1. Polling a job loaded from PostgreSQL 16 returns exact fields as in-memory.
    2. Polling across users raises PermissionError (403).
    3. Polling non-existent job returns None (404).
    """
    q = SubmissionQueue(pg_mode=True)
    job = q.create_job(uid="owner_123", question_id=1, language_id=71, source_code="code")
    jid = job.job_id

    # In-memory lookup
    job_mem = q.get_job(jid, "owner_123")
    assert job_mem is not None
    assert job_mem.job_id == jid

    # Clear memory cache (cache miss -> PostgreSQL 16 lookup)
    q._jobs.clear()
    job_db = q.get_job(jid, "owner_123")
    assert job_db is not None
    assert job_db.job_id == jid
    assert job_db.uid == "owner_123"
    assert job_db.question_id == 1

    # Cross-tenant unauthorized access raises PermissionError
    with pytest.raises(PermissionError):
        q.get_job(jid, "attacker_456")

    # Non-existent job
    assert q.get_job(str(uuid.uuid4()), "owner_123") is None


# ── 8. Concurrency, Fencing & Retention Edge Cases ────────────────────────────

def test_repeated_and_concurrent_orphan_recovery_no_duplicate_claims():
    """
    Verify:
    1. Multiple orphan jobs with expired leases are recovered.
    2. Concurrent recovery threads running simultaneously do not cause duplicate
       pending transitions or multiple active claims.
    3. Exactly the recovered jobs can be claimed, no more and no less.
    """
    job_ids = []
    for i in range(3):
        jid = enqueue_job_sync(
            uid=f"u_rep_{i}",
            question_id=i + 1,
            language_id=71,
            source_code=f"code_{i}",
            lease_seconds=1,
        )
        claim_next_job_sync(f"dead-worker-{i}")
        job_ids.append(jid)

    # Wait for the 1-second lease to elapse
    time.sleep(1.2)

    # Launch 4 concurrent recovery sweeps simultaneously
    barrier = threading.Barrier(4)
    sweep_counts = []
    count_lock = threading.Lock()

    def sweep():
        barrier.wait()
        c = recover_orphan_jobs_sync()
        with count_lock:
            sweep_counts.append(c)

    threads = [threading.Thread(target=sweep) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    # Total recovered across all threads must be exactly 3 (no duplicate recoveries)
    assert sum(sweep_counts) == 3

    # Now claim recovered jobs
    claimed_ids = []
    for i in range(3):
        claimed = claim_next_job_sync(f"reclaim-worker-{i}")
        assert claimed is not None
        claimed_ids.append(claimed["job_id"])

    assert set(claimed_ids) == set(job_ids)
    assert len(claimed_ids) == 3
    # No extra claims possible
    assert claim_next_job_sync("reclaim-worker-extra") is None


def test_stale_worker_fenced_after_lease_recovery_in_postgresql16():
    """
    Verify:
    1. Worker A claims a job with a short lease.
    2. Worker A stalls (stops heartbeats), lease expires.
    3. Orphan recovery resets the job to pending.
    4. Worker B claims the job and becomes the authoritative owner.
    5. Worker A wakes up and attempts to complete the job. Worker A MUST BE REJECTED.
    6. Worker B successfully completes the job.
    7. Database reflects Worker B's completion; Worker A cannot cause unintended
       duplicate or corrupted database finalization.
    """
    jid = enqueue_job_sync(
        uid="u_fenced",
        question_id=1,
        language_id=71,
        source_code="print('fence')",
        lease_seconds=1,
    )

    claimed_a = claim_next_job_sync("worker-slow-A")
    assert claimed_a is not None
    assert claimed_a["job_id"] == jid

    # Lease expires
    time.sleep(1.2)

    # Orphan sweep recovers job
    recovered = recover_orphan_jobs_sync()
    assert recovered == 1

    # Worker B claims the recovered job
    claimed_b = claim_next_job_sync("worker-fast-B")
    assert claimed_b is not None
    assert claimed_b["job_id"] == jid

    # Stale Worker A wakes up and attempts to finalize
    res_a = complete_job_sync(jid, "worker-slow-A", {"verdict": "Wrong Answer"})
    assert res_a is False, "Stale worker was not fenced off from finalization!"

    # Authoritative Worker B completes the job
    res_b = complete_job_sync(jid, "worker-fast-B", {"verdict": "Accepted"})
    assert res_b is True

    # Verify final state in PostgreSQL 16
    final_job = get_queue_job_sync(jid, "u_fenced")
    assert final_job["status"] == "completed"
    assert final_job["worker_id"] == "worker-fast-B"
    assert final_job["result"]["verdict"] == "Accepted"


def test_cleanup_preserves_jobs_within_retention_period_in_postgresql16():
    """
    Verify:
    1. Completed/failed jobs created recently (within retention window) are NOT deleted.
    2. Pending and running jobs are NEVER deleted regardless of age.
    3. Completed/failed jobs older than the retention cutoff (e.g. 1800s) ARE deleted.
    """
    # 1. Old completed job (artificially set enqueued_at to 40 minutes ago in PostgreSQL 16)
    j_old_comp = enqueue_job_sync(uid="u_clean_old_c", question_id=1, language_id=71, source_code="code")
    claim_next_job_sync("w_old_c")
    ok = complete_job_sync(j_old_comp, "w_old_c", {"verdict": "Accepted"})
    assert ok is True

    # 2. Old failed job (artificially set enqueued_at to 45 minutes ago)
    j_old_fail = enqueue_job_sync(uid="u_clean_old_f", question_id=2, language_id=71, source_code="code")
    claim_next_job_sync("w_old_f")
    fail_res = fail_job_sync(j_old_fail, "w_old_f", "Fatal error", permanent=True)
    assert fail_res["status"] == "failed"

    # 3. Recent completed job (enqueued now -> must survive 1800s retention)
    j_recent_comp = enqueue_job_sync(uid="u_clean_recent", question_id=3, language_id=71, source_code="code")
    claim_next_job_sync("w_recent")
    ok = complete_job_sync(j_recent_comp, "w_recent", {"verdict": "Accepted"})
    assert ok is True

    # 4. Running job (must survive)
    j_running = enqueue_job_sync(uid="u_clean_run", question_id=4, language_id=71, source_code="code")
    claim_next_job_sync("w_running")

    # 5. Pending job (must survive)
    j_pending = enqueue_job_sync(uid="u_clean_pend", question_id=5, language_id=71, source_code="code")

    # Set enqueued_at backwards in PostgreSQL for the two old jobs
    conn = psycopg2.connect(PG_TEST_URL)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute(
        "UPDATE queue_jobs SET enqueued_at = NOW() - INTERVAL '40 minutes' WHERE id = %s",
        (j_old_comp,)
    )
    cur.execute(
        "UPDATE queue_jobs SET enqueued_at = NOW() - INTERVAL '45 minutes' WHERE id = %s",
        (j_old_fail,)
    )
    cur.close()
    conn.close()

    # Execute cleanup with 1800 seconds (30 minutes) retention
    deleted = delete_old_jobs_sync(older_than_seconds=1800)
    assert deleted == 2, f"Expected 2 old jobs deleted, got {deleted}"

    # Verify rows in PostgreSQL 16
    assert get_queue_job_sync(j_pending, "u_clean_pend") is not None
    assert get_queue_job_sync(j_running, "u_clean_run") is not None
    assert get_queue_job_sync(j_recent_comp, "u_clean_recent") is not None
    assert get_queue_job_sync(j_old_comp, "u_clean_old_c") is None
    assert get_queue_job_sync(j_old_fail, "u_clean_old_f") is None


def test_at_least_once_external_execution_with_deduplicated_history_persistence():
    """
    Verify:
    1. Worker 1 claims job, calls Judge0, writes submission history, but crashes before complete_job_sync.
    2. Lease expires and job is recovered.
    3. Worker 2 re-claims and re-executes Judge0 (demonstrating AT-LEAST-ONCE external execution).
    4. Worker 2 calls record_submission_sync with deterministic submission_id=job_id.
    5. Deduplication ensures exactly ONE submission record exists in the submissions table.
    6. Completed state is finalized in PostgreSQL 16.
    """
    uid = "u_at_least_once"
    q_id = 1
    jid = enqueue_job_sync(
        uid=uid,
        question_id=q_id,
        language_id=71,
        source_code="print('at_least_once')",
        lease_seconds=1,
    )

    # Worker 1 claims job
    c1 = claim_next_job_sync("worker-crash-1")
    assert c1 is not None

    # Worker 1 executes external Judge0 (Side Effect #1)
    # and records submission in DB, but then CRASHES before complete_job_sync
    record_submission_sync(
        uid=uid,
        question_id=q_id,
        verdict="Accepted",
        status_id=3,
        language_id=71,
        passed_count=5,
        total_count=5,
        runtime="0.03s",
        memory="12 MB",
        submission_id=jid,
    )
    # Simulate Worker 1 crash -> no complete_job_sync called

    # Lease expires
    time.sleep(1.2)
    assert recover_orphan_jobs_sync() == 1

    # Worker 2 claims the recovered job
    c2 = claim_next_job_sync("worker-recover-2")
    assert c2 is not None
    assert c2["job_id"] == jid
    assert c2["retries"] == 2

    # Worker 2 executes external Judge0 (Side Effect #2 -> AT-LEAST-ONCE external execution)
    # Worker 2 records submission with same deterministic submission_id
    record_submission_sync(
        uid=uid,
        question_id=q_id,
        verdict="Accepted",
        status_id=3,
        language_id=71,
        passed_count=5,
        total_count=5,
        runtime="0.03s",
        memory="12 MB",
        submission_id=jid,
    )
    # Worker 2 completes queue job
    ok = complete_job_sync(jid, "worker-recover-2", {"verdict": "Accepted"})
    assert ok is True

    # Assert exactly ONE submission history record exists in PostgreSQL 16
    session = supabase_service.get_db_session()
    try:
        count = session.query(Submission).filter(Submission.id == uuid.UUID(jid)).count()
        assert count == 1, "Duplicate submission record inserted in PostgreSQL!"
    finally:
        session.close()

    # Verify queue job state
    job_row = get_queue_job_sync(jid, uid)
    assert job_row["status"] == "completed"
    assert job_row["worker_id"] == "worker-recover-2"
    assert job_row["source_code"] == ""

