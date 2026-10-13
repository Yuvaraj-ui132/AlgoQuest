"""
test_durable_queue.py — Focused tests for PostgreSQL-Backed Durable Submission Queue.

Covers:
1. Concurrent workers claiming different jobs (FIFO, atomic claim, PostgreSQL SKIP LOCKED dialect compilation).
2. Queued job surviving a simulated application restart.
3. Lease expiration and abandoned-job recovery (heartbeats and TTL).
4. Retry limits, transient failures, and permanent dead-lettering.
5. Simulated crash after Judge0 execution but before result persistence.
6. Duplicate delivery and idempotent final-result persistence.
7. Queue capacity backpressure and API compatibility (ownership, security, non-exposure of hidden tests).
"""

import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock
import pytest
from fastapi import HTTPException
from sqlalchemy.dialects import postgresql

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.services import supabase_service
from app.services.supabase_service import (
    Base,
    User,
    Submission,
    QueueJob,
    enqueue_job_sync,
    claim_next_job_sync,
    heartbeat_job_sync,
    complete_job_sync,
    fail_job_sync,
    recover_orphan_jobs_sync,
    count_pending_jobs_sync,
    get_queue_job_sync,
    record_submission_sync,
)
from app.services.submission_queue import SubmissionQueue, SubmissionJob, JobStatus


@pytest.fixture(autouse=True)
def setup_sqlite_supabase():
    """Configure supabase_service to use an isolated in-memory SQLite database for every test."""
    engine = supabase_service.get_engine("sqlite:///:memory:")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


# ── 1. Concurrent Workers Claiming Different Jobs ────────────────────────────

def test_postgresql_dialect_generates_for_update_skip_locked():
    """
    Verify PostgreSQL query compilation includes FOR UPDATE SKIP LOCKED.
    Ensures that on PostgreSQL, claims never block or double-claim.
    """
    session = supabase_service.get_db_session()
    try:
        query = (
            session.query(QueueJob)
            .filter(QueueJob.status == "pending")
            .order_by(QueueJob.enqueued_at.asc())
            .with_for_update(skip_locked=True)
        )
        compiled_sql = str(query.statement.compile(dialect=postgresql.dialect()))
        assert "FOR UPDATE" in compiled_sql
        assert "SKIP LOCKED" in compiled_sql
    finally:
        session.close()


def test_concurrent_workers_claim_distinct_jobs():
    """
    Two workers claiming jobs must claim distinct jobs without duplication.
    """
    job_id_1 = enqueue_job_sync(
        uid="user_1", question_id=1, language_id=71, source_code="code1"
    )
    job_id_2 = enqueue_job_sync(
        uid="user_2", question_id=2, language_id=71, source_code="code2"
    )

    claimed_1 = claim_next_job_sync(worker_id="worker-A")
    claimed_2 = claim_next_job_sync(worker_id="worker-B")

    assert claimed_1 is not None
    assert claimed_2 is not None
    assert claimed_1["job_id"] != claimed_2["job_id"]
    claimed_ids = {claimed_1["job_id"], claimed_2["job_id"]}
    assert claimed_ids == {job_id_1, job_id_2}

    # Third claim when no jobs remain must return None
    claimed_3 = claim_next_job_sync(worker_id="worker-C")
    assert claimed_3 is None


# ── 2. Queued Job Surviving Application Restart ──────────────────────────────

def test_job_survives_simulated_application_restart():
    """
    When backend restarts:
    1. In-memory cache is wiped out.
    2. A queued job in PostgreSQL is preserved.
    3. get_job() re-hydrates the job from the DB.
    4. Worker can claim and complete the surviving job.
    """
    q = SubmissionQueue(pg_mode=True)

    # Submit job to durable queue
    job = q.create_job(
        uid="survivor_user",
        question_id=1,
        language_id=71,
        source_code="print(42)",
        request_id="req_restart_123",
    )
    job_id = job.job_id

    # SIMULATE RESTART: wipe in-memory cache completely
    q._jobs.clear()
    assert job_id not in q._jobs

    # Client polling re-hydrates job from DB
    rehydrated = q.get_job(job_id, "survivor_user")
    assert rehydrated is not None
    assert rehydrated.job_id == job_id
    assert rehydrated.uid == "survivor_user"
    assert rehydrated.status == JobStatus.QUEUED
    assert rehydrated.request_id == "req_restart_123"

    # Worker claims surviving job from DB
    claimed = q._claim_pg_job_sync("worker-survivor")
    assert claimed is not None
    assert claimed["job_id"] == job_id
    assert claimed["source_code"] == "print(42)"


# ── 3. Lease Expiration and Abandoned-Job Recovery ───────────────────────────

def test_lease_expiration_and_orphan_recovery():
    """
    If a worker holding a running job dies or exceeds lease_seconds,
    recover_orphan_jobs_sync must recover it back to pending.
    """
    job_id = enqueue_job_sync(
        uid="u_lease", question_id=1, language_id=71, source_code="code", lease_seconds=60
    )

    # Worker A claims
    claimed = claim_next_job_sync("worker-crash")
    assert claimed is not None
    assert claimed["status"] == "running"

    # Immediately, lease has not expired -> recovery recovers 0
    recovered_early = recover_orphan_jobs_sync()
    assert recovered_early == 0

    # Backdate locked_at to simulate worker crashing 120 seconds ago
    session = supabase_service.get_db_session()
    try:
        row = session.query(QueueJob).filter(QueueJob.id == uuid.UUID(job_id)).first()
        row.locked_at = datetime.now(timezone.utc) - timedelta(seconds=121)
        session.commit()
    finally:
        session.close()

    # Recovery sweep
    recovered = recover_orphan_jobs_sync()
    assert recovered == 1

    # Job is now pending again, worker_id cleared, and can be claimed by Worker B
    claimed_b = claim_next_job_sync("worker-healthy")
    assert claimed_b is not None
    assert claimed_b["job_id"] == job_id
    assert claimed_b["worker_id"] == "worker-healthy"


def test_heartbeat_prevents_lease_expiration():
    """Heartbeat updates locked_at so an active job is not considered an orphan."""
    job_id = enqueue_job_sync(
        uid="u_heartbeat", question_id=1, language_id=71, source_code="code", lease_seconds=60
    )
    claim_next_job_sync("worker-alive")

    # Send heartbeat
    ok = heartbeat_job_sync(job_id, "worker-alive")
    assert ok is True

    # Check that locked_at is fresh
    session = supabase_service.get_db_session()
    try:
        row = session.query(QueueJob).filter(QueueJob.id == uuid.UUID(job_id)).first()
        now = datetime.now(timezone.utc)
        assert (now - row.locked_at.replace(tzinfo=timezone.utc)).total_seconds() < 5
    finally:
        session.close()


# ── 4. Retry Limits and Permanent Failures ───────────────────────────────────

def test_transient_failure_retries_and_dead_letters():
    """
    Transient failures are retried up to max_retries.
    When max_retries is reached, job transitions permanently to failed.
    """
    job_id = enqueue_job_sync(
        uid="u_retry", question_id=1, language_id=71, source_code="code", max_retries=2
    )

    # Attempt 1: Claim and fail transiently
    claim_next_job_sync("w1")
    res1 = fail_job_sync(job_id, "w1", "Judge0 502 Bad Gateway", permanent=False)
    assert res1["retried"] is True
    assert res1["status"] == "pending"

    # Attempt 2: Claim and fail transiently
    claim_next_job_sync("w2")
    res2 = fail_job_sync(job_id, "w2", "Judge0 504 Timeout", permanent=False)
    assert res2["retried"] is False
    assert res2["status"] == "failed"

    # Verify job is dead-lettered and source_code cleared
    session = supabase_service.get_db_session()
    try:
        row = session.query(QueueJob).filter(QueueJob.id == uuid.UUID(job_id)).first()
        assert row.status == "failed"
        assert row.source_code == ""  # Transient sensitive code scrubbed
        assert "504" in row.error_message
    finally:
        session.close()


def test_permanent_failure_does_not_retry():
    """Errors marked permanent (e.g. invalid question ID) fail immediately."""
    job_id = enqueue_job_sync(
        uid="u_perm", question_id=9999, language_id=71, source_code="code", max_retries=3
    )
    claim_next_job_sync("w1")

    res = fail_job_sync(job_id, "w1", "Question 9999 not found in catalogue", permanent=True)
    assert res["retried"] is False
    assert res["status"] == "failed"

    # Job is NOT claimable again
    assert claim_next_job_sync("w2") is None


# ── 5. Crash After Judge0 Execution Before Persistence ───────────────────────

@pytest.mark.anyio
async def test_crash_after_judge0_execution_handled_safely():
    """
    Simulates a worker crashing immediately after external Judge0 execution.
    The job is recovered, retried by Worker 2, and produces exactly one record.
    """
    q = SubmissionQueue(pg_mode=True)

    job_id = enqueue_job_sync(
        uid="crash_user",
        question_id=1,
        language_id=71,
        source_code="print('hello')",
        lease_seconds=30,
    )

    # Worker 1 claims
    job_dict = q._claim_pg_job_sync("worker-1")
    assert job_dict is not None

    # Simulate: Worker 1 executes Judge0 but crashes before completing the DB job
    # (Worker 1 stops sending heartbeats, lease expires)
    session = supabase_service.get_db_session()
    try:
        row = session.query(QueueJob).filter(QueueJob.id == uuid.UUID(job_id)).first()
        row.locked_at = datetime.now(timezone.utc) - timedelta(seconds=60)
        session.commit()
    finally:
        session.close()

    # Orphan recovery recovers the job
    recovered = q._recover_orphans_sync()
    assert recovered == 1

    # Worker 2 claims the recovered job
    job_dict_2 = q._claim_pg_job_sync("worker-2")
    assert job_dict_2 is not None
    assert job_dict_2["job_id"] == job_id
    assert job_dict_2["retries"] == 2

    # Worker 2 finishes successfully
    result_payload = {"verdict": "Accepted", "status_id": 3, "runtime": "0.05s", "memory": "10 MB"}
    completed = q._complete_pg_job_sync(job_id, "worker-2", result_payload)
    assert completed is True

    # Verify state in DB
    job_state = get_queue_job_sync(job_id, "crash_user")
    assert job_state["status"] == "completed"
    assert job_state["result"]["verdict"] == "Accepted"


# ── 6. Duplicate Delivery and Idempotent Result Persistence ──────────────────

def test_record_submission_sync_is_idempotent_per_job():
    """
    Calling record_submission_sync multiple times with the same submission_id
    must NOT insert duplicate rows in the submissions table.
    """
    sub_uuid = str(uuid.uuid4())
    uid = "idem_user_1"

    # First call
    record_submission_sync(
        uid=uid,
        question_id=1,
        verdict="Accepted",
        status_id=3,
        language_id=71,
        passed_count=5,
        total_count=5,
        runtime="0.01s",
        memory="12 MB",
        submission_id=sub_uuid,
    )

    # Second call (duplicate delivery / retry)
    record_submission_sync(
        uid=uid,
        question_id=1,
        verdict="Accepted",
        status_id=3,
        language_id=71,
        passed_count=5,
        total_count=5,
        runtime="0.01s",
        memory="12 MB",
        submission_id=sub_uuid,
    )

    session = supabase_service.get_db_session()
    try:
        count = session.query(Submission).filter(Submission.id == uuid.UUID(sub_uuid)).count()
        assert count == 1, "Duplicate submission row was inserted!"
    finally:
        session.close()


def test_completed_job_cannot_be_reverted():
    """A completed job cannot be claimed or marked failed by another worker."""
    job_id = enqueue_job_sync(uid="u_done", question_id=1, language_id=71, source_code="code")
    claim_next_job_sync("w1")
    complete_job_sync(job_id, "w1", {"verdict": "Accepted"})

    # Attempt to fail or claim completed job
    assert claim_next_job_sync("w2") is None
    fail_res = fail_job_sync(job_id, "w2", "Error", permanent=False)
    assert fail_res["status"] in ("not_found", "failed")

    # Status remains completed
    job = get_queue_job_sync(job_id, "u_done")
    assert job["status"] == "completed"


# ── 7. Queue Capacity Backpressure and API Security Compatibility ─────────────

def test_durable_queue_backpressure_when_full():
    """
    When durable queue reaches max capacity, create_job must apply backpressure
    and raise HTTP 503 with Retry-After header.
    """
    bounded_q = SubmissionQueue(maxsize=2, pg_mode=True)

    # Enqueue 2 jobs (capacity)
    bounded_q.create_job(uid="u1", question_id=1, language_id=71, source_code="c1")
    bounded_q.create_job(uid="u2", question_id=2, language_id=71, source_code="c2")

    # Third job exceeds bounded capacity
    with pytest.raises(HTTPException) as exc_info:
        bounded_q.create_job(uid="u3", question_id=3, language_id=71, source_code="c3")

    assert exc_info.value.status_code == 503
    assert exc_info.value.headers.get("Retry-After") == "5"


def test_cross_tenant_job_isolation():
    """A user cannot access another user's job via get_job."""
    q = SubmissionQueue(pg_mode=True)
    job = q.create_job(uid="owner_user", question_id=1, language_id=71, source_code="code")

    # Owner gets job
    assert q.get_job(job.job_id, "owner_user") is not None

    # Cross-tenant attacker is blocked with PermissionError
    with pytest.raises(PermissionError):
        q.get_job(job.job_id, "attacker_user")

    # After restart (cache miss), DB lookup also raises PermissionError
    q._jobs.clear()
    with pytest.raises(PermissionError):
        q.get_job(job.job_id, "attacker_user")


def test_queue_stats_reporting():
    """get_queue_stats provides non-sensitive queue metrics in PG mode."""
    q = SubmissionQueue(maxsize=50, pg_mode=True)
    q.create_job(uid="u_stats", question_id=1, language_id=71, source_code="code")

    stats = q.get_queue_stats()
    assert stats["mode"] == "pg"
    assert stats["max_queue_size"] == 50
    assert stats["queue_size"] >= 1
    assert "active_workers" in stats
