"""
test_risky_behaviors.py — Regression and boundary tests for high-risk critical paths.

Coverage:
1. Authorization & Cross-user access (IDOR on jobs, history, and user data).
2. Input validation & Malformed request rejection (bad languages, empty code, invalid question bounds).
3. External Judge0 network errors, timeouts, and failure boundaries.
4. Database failures, session safety, and transaction rollback.
5. Submission history keyset pagination consistency and cursor stability.
6. Stale worker lease fencing and queue concurrency boundaries.
"""

import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, AsyncMock
import httpx
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.config import settings
from app.services import supabase_service
from app.services.submission_queue import submission_queue
from app.services.supabase_service import (
    Base,
    User,
    Submission,
    UserBookmark,
    QueueJob,
    enqueue_job_sync,
    claim_next_job_sync,
    complete_job_sync,
    heartbeat_job_sync,
    get_queue_job_sync,
)

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_sqlite_supabase():
    """Configure supabase_service with a fresh in-memory SQLite database for every test."""
    orig_backend = settings.database_backend
    orig_queue_pg = settings.queue_enable_pg_backend
    orig_pg_mode = submission_queue._pg_mode

    settings.database_backend = "supabase"
    settings.queue_enable_pg_backend = True
    submission_queue._pg_mode = True

    engine = supabase_service.get_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    yield engine

    Base.metadata.drop_all(bind=engine)
    settings.database_backend = orig_backend
    settings.queue_enable_pg_backend = orig_queue_pg
    submission_queue._pg_mode = orig_pg_mode


# ── 1. Authorization & Cross-User Access ─────────────────────────────────────


def test_authorization_cross_user_job_polling_forbidden():
    """User B polling User A's queued job must be rejected with HTTP 403 Forbidden."""
    uid_a = "user_victim_a"
    uid_b = "user_attacker_b"

    # Enqueue a job owned by User A
    job_id = enqueue_job_sync(
        uid=uid_a,
        question_id=1,
        language_id=71,
        source_code="print('hello')",
        compiler_options="",
    )

    # User B attempts to access User A's job status
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid_b}):
        res = client.get(
            f"/api/submissions/{job_id}",
            headers={"Authorization": "Bearer token_b"},
        )
    assert res.status_code == 403
    assert "permission" in res.json().get("detail", "").lower()


def test_authorization_cross_user_submission_history_isolated():
    """User B fetching submission history must never see User A's submissions."""
    uid_a = "user_history_a"
    uid_b = "user_history_b"

    # Seed User A submission
    supabase_service.record_submission_sync(
        uid=uid_a,
        question_id=42,
        verdict="Accepted",
        status_id=3,
        language_id=71,
        passed_count=5,
        total_count=5,
        runtime="1 ms",
        memory="1 MB",
    )

    # User B requests history
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid_b}):
        res = client.get(
            "/api/submissions/history",
            headers={"Authorization": "Bearer token_b"},
        )
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 0
    assert data["hasMore"] is False


def test_authorization_cross_user_data_isolation():
    """User B calling /api/user/all must only see their own state."""
    uid_a = "user_data_a"
    uid_b = "user_data_b"

    # User A has progress and bookmarks
    supabase_service.update_progress_sync(uid=uid_a, question_id=10)
    session = supabase_service.get_db_session()
    try:
        session.add(UserBookmark(user_id=uid_a, question_id=10))
        session.commit()
    finally:
        session.close()

    # User B requests /api/user/all
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid_b}):
        res = client.get(
            "/api/user/all",
            headers={"Authorization": "Bearer token_b"},
        )
    assert res.status_code == 200
    data = res.json()
    assert data["progress"]["solved"] == []
    assert data["bookmarks"]["bookmarks"] == []


# ── 2. Input Validation & Malformed Requests ─────────────────────────────────


def test_input_validation_empty_source_code_rejected():
    """Empty source code must return HTTP 422."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "u1"}):
        res = client.post(
            "/api/submissions",
            headers={"Authorization": "Bearer tok"},
            json={
                "source_code": "",
                "language_id": 71,
                "execution_type": "run",
                "question_id": 1,
            },
        )
    assert res.status_code == 422


def test_input_validation_unsupported_language_rejected():
    """Unsupported language_id (e.g. 9999) must be rejected with HTTP 422."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "u1"}):
        res = client.post(
            "/api/submissions",
            headers={"Authorization": "Bearer tok"},
            json={
                "source_code": "print(1)",
                "language_id": 9999,
                "execution_type": "run",
                "question_id": 1,
            },
        )
    assert res.status_code == 422
    assert "unsupported language_id" in str(res.json()).lower()


def test_input_validation_invalid_question_id_bounds():
    """Invalid question_id (0, negative, or > 10000) must return HTTP 422."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "u1"}):
        for invalid_qid in [0, -1, 10001]:
            res = client.post(
                "/api/submissions",
                headers={"Authorization": "Bearer tok"},
                json={
                    "source_code": "print(1)",
                    "language_id": 71,
                    "execution_type": "run",
                    "question_id": invalid_qid,
                },
            )
            assert res.status_code == 422


def test_input_validation_missing_question_id_for_dsa_submit():
    """Submitting DSA 'run' or 'submit' without question_id must return HTTP 422."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "u1"}):
        res = client.post(
            "/api/submissions",
            headers={"Authorization": "Bearer tok"},
            json={
                "source_code": "print(1)",
                "language_id": 71,
                "execution_type": "submit",
            },
        )
    assert res.status_code == 422


def test_input_validation_history_pagination_limits():
    """History pagination limit < 1 or > 50 must be rejected with HTTP 422."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "u1"}):
        res_low = client.get("/api/submissions/history?limit=0", headers={"Authorization": "Bearer tok"})
        assert res_low.status_code == 422

        res_high = client.get("/api/submissions/history?limit=51", headers={"Authorization": "Bearer tok"})
        assert res_high.status_code == 422


def test_sample_tests_endpoint_nonexistent_question():
    """Non-existent question ID must return 404."""
    res = client.get("/api/questions/9999/sample-tests")
    assert res.status_code == 404


# ── 3. External Judge0 Failure Handling ──────────────────────────────────────


def test_judge0_network_connect_error_handled_cleanly():
    """Judge0 network connection failure during execution must be handled cleanly as 500/502 without traceback."""
    safe_client = TestClient(app, raise_server_exceptions=False)
    with patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mock_exec:
        mock_exec.side_effect = httpx.ConnectError("Connection refused to Judge0 endpoint")

        with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "u1"}):
            res = safe_client.post(
                "/api/submissions",
                headers={"Authorization": "Bearer tok"},
                json={
                    "source_code": "print(1)",
                    "language_id": 71,
                    "execution_type": "general",
                },
            )
        assert res.status_code in (500, 502, 503)
        assert "password" not in res.text.lower()
        assert "secret" not in res.text.lower()


def test_judge0_timeout_error_handled_cleanly():
    """Judge0 read timeout during execution must be handled gracefully as 500/502/504."""
    safe_client = TestClient(app, raise_server_exceptions=False)
    with patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mock_exec:
        mock_exec.side_effect = httpx.ReadTimeout("Judge0 timed out")

        with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "u1"}):
            res = safe_client.post(
                "/api/submissions",
                headers={"Authorization": "Bearer tok"},
                json={
                    "source_code": "print(1)",
                    "language_id": 71,
                    "execution_type": "general",
                },
            )
        assert res.status_code in (500, 502, 504)


# ── 4. Database Transaction Rollback & Resilience ────────────────────────────


def test_database_failure_transaction_rollback():
    """Simulated database failure during progress update rolls back cleanly without leaking dirty session."""
    uid = "user_tx_rollback"

    # 1. Normal user initialization
    supabase_service.init_user_document(uid=uid, email="tx@test.com")

    # 2. Simulate failure during write
    with patch("sqlalchemy.orm.Session.commit", side_effect=RuntimeError("Simulated DB Disk Full")):
        with pytest.raises(RuntimeError):
            session = supabase_service.get_db_session()
            try:
                user = session.query(User).filter_by(id=uid).first()
                user.name = "Corrupted Name"
                session.commit()
            except Exception:
                session.rollback()
                raise
            finally:
                session.close()

    # 3. Verify session was rolled back and subsequent query reads clean state
    clean_session = supabase_service.get_db_session()
    try:
        user_after = clean_session.query(User).filter_by(id=uid).first()
        assert user_after.name is None or user_after.name != "Corrupted Name"
    finally:
        clean_session.close()


# ── 5. Submission History Keyset Pagination Consistency ──────────────────────


@pytest.mark.anyio
async def test_submission_history_keyset_pagination_consistency():
    """Verify keyset pagination produces exact 1-to-1 ordering without skipping or duplicates."""
    uid = "user_pagination_test"
    base_time = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

    # Insert 7 submissions with distinct descending timestamps directly into session
    session = supabase_service.get_db_session()
    try:
        if not session.query(User).filter(User.id == uid).first():
            supabase_service.init_user_document(uid, session=session)
        for i in range(7):
            sub_time = base_time + timedelta(minutes=i)
            sub = Submission(
                id=uuid.uuid4(),
                user_id=uid,
                question_id=100 + i,
                verdict="Accepted",
                status_id=3,
                language="python",
                language_id=71,
                passed_count=5,
                total_count=5,
                runtime="1 ms",
                memory="1 MB",
                submitted_at=sub_time,
            )
            session.add(sub)
        session.commit()
    finally:
        session.close()

    # Page 1: limit 3
    p1 = await supabase_service.get_submission_history(uid=uid, limit=3)
    assert len(p1["items"]) == 3
    assert p1["hasMore"] is True
    assert p1["nextCursor"] is not None

    # Page 2: limit 3
    p2 = await supabase_service.get_submission_history(uid=uid, limit=3, after_doc_id=p1["nextCursor"])
    assert len(p2["items"]) == 3
    assert p2["hasMore"] is True
    assert p2["nextCursor"] is not None

    # Page 3: limit 3 (should return last 1 item)
    p3 = await supabase_service.get_submission_history(uid=uid, limit=3, after_doc_id=p2["nextCursor"])
    assert len(p3["items"]) == 1
    assert p3["hasMore"] is False
    assert p3["nextCursor"] is None

    # Verify no duplicates across pages
    all_qids = [item["questionId"] for item in p1["items"] + p2["items"] + p3["items"]]
    assert len(all_qids) == 7
    assert len(set(all_qids)) == 7
    # Verify newest-first order
    assert all_qids == [106, 105, 104, 103, 102, 101, 100]


# ── 6. Stale Worker Lease Fencing ────────────────────────────────────────────


def test_stale_worker_heartbeat_fencing():
    """Worker whose lease has expired cannot update or heartbeat a reclaimed job."""
    jid = enqueue_job_sync(uid="u_fence", question_id=1, language_id=71, source_code="c")

    # Worker A claims job
    job_a = claim_next_job_sync(worker_id="worker_A")
    assert job_a is not None
    assert job_a["job_id"] == jid

    # Simulate worker A's lease expiring and job being reclaimed by Worker B
    session = supabase_service.get_db_session()
    try:
        row = session.query(QueueJob).filter_by(id=uuid.UUID(jid)).first()
        row.worker_id = "worker_B"
        row.locked_at = datetime.now(timezone.utc)
        session.commit()
    finally:
        session.close()

    # Worker A attempts late heartbeat
    ok = heartbeat_job_sync(job_id=jid, worker_id="worker_A")
    # Must be fenced out (returns False)
    assert ok is False

    # Worker A attempts late completion
    comp_ok = complete_job_sync(
        job_id=jid,
        worker_id="worker_A",
        result={"verdict": "Accepted"},
    )
    # Must be fenced out (returns False)
    assert comp_ok is False

    # Verify job in DB is still held by Worker B
    job_db = get_queue_job_sync(jid, uid="u_fence")
    assert job_db["worker_id"] == "worker_B"
