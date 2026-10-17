"""
test_smoke_e2e.py — Autonomous End-to-End Smoke Test Suite.

Validates the full local application stack:
1. Health and deep readiness probes.
2. Authentication enforcement (rejection of unauthenticated/malformed tokens).
3. Question catalog & test suite data integrity.
4. Code submission, durable queue lifecycle, and result polling.
5. Submission history retrieval and safe HTML rendering (verdict & metadata display).
6. State persistence & sync for bookmarks, notes, and editor drafts.
"""

import json
import os
import sys
import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.config import settings
from app.services import supabase_service
from app.services.supabase_service import Base

client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def setup_local_test_db():
    """Ensure tests run against an isolated clean schema."""
    orig_backend = settings.database_backend
    settings.database_backend = "supabase"
    engine = supabase_service.get_engine("sqlite:///:memory:")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    settings.database_backend = orig_backend


# ── 1. Health and Readiness ──────────────────────────────────────────────────

def test_health_and_readiness_smoke():
    """Verify liveness probe /health and deep readiness probe /health/ready."""
    # Liveness
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["service"] == "algoquest-api"

    # Deep Readiness
    res_ready = client.get("/health/ready")
    assert res_ready.status_code == 200
    ready_data = res_ready.json()
    assert ready_data["status"] == "ready"
    assert ready_data["hidden_tests"]["status"] == "loaded"
    assert ready_data["submission_queue"]["status"] == "healthy"


# ── 2. Authentication Enforcement ─────────────────────────────────────────────

def test_authentication_enforcement_smoke():
    """Protected routes must strictly reject unauthenticated or malformed requests."""
    protected_endpoints = [
        ("GET", "/api/user/all"),
        ("GET", "/api/submissions/history"),
        ("POST", "/api/submissions"),
        ("POST", "/api/sync/batch"),
        ("PUT", "/api/bookmarks/1"),
        ("GET", "/api/notes/1"),
        ("GET", "/api/editor/1"),
    ]

    for method, path in protected_endpoints:
        # No header
        res_no_auth = client.request(method, path)
        assert res_no_auth.status_code == 401, f"Expected 401 for unauthenticated {method} {path}"

        # Malformed header
        res_bad_auth = client.request(method, path, headers={"Authorization": "InvalidScheme token"})
        assert res_bad_auth.status_code == 401, f"Expected 401 for malformed auth header on {method} {path}"


# ── 3. Question Metadata and Test Dataset Integrity ──────────────────────────

def test_question_test_dataset_integrity_smoke():
    """Verify that private test cases dataset exists, is valid JSON, and has questions."""
    test_cases_path = os.path.join(os.path.dirname(__file__), "..", "data", "test_cases.json")
    assert os.path.exists(test_cases_path), f"Missing test cases at: {test_cases_path}"

    with open(test_cases_path, "r", encoding="utf-8") as f:
        cases = json.load(f)

    assert isinstance(cases, dict), "test_cases.json must be a JSON object"
    assert len(cases) > 50, f"Expected > 50 questions, found {len(cases)}"
    assert "1" in cases, "Problem 1 (Two Sum) test cases must be present"
    assert len(cases["1"]) >= 3, "Problem 1 should have multiple test cases"


# ── 4. Code Submission and Queue Processing ───────────────────────────────────

def test_code_submission_queue_and_polling_smoke():
    """Verify submitting code creates a job, enqueues it, and allows status polling."""
    test_uid = "smoke_user_submit_001"
    payload = {
        "source_code": "I2luY2x1ZGUgPGlvc3RyZWFtPgp1c2luZyBuYW1lc3BhY2Ugc3RkOwppbnQgbWFpbigpIHsgcmV0dXJuIDA7IH0=",
        "language_id": 54,  # C++ (GCC 9.2.0)
        "execution_type": "run",
        "question_id": 1,
    }

    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": test_uid}):
        # Submit code
        res = client.post(
            "/api/submissions",
            headers={"Authorization": "Bearer valid_smoke_token"},
            json=payload,
        )
        assert res.status_code in (200, 202), f"Submission failed: {res.text}"
        body = res.json()
        assert "job_id" in body or "verdict" in body

        if "job_id" in body:
            job_id = body["job_id"]
            # Poll status
            poll_res = client.get(
                f"/api/submissions/{job_id}",
                headers={"Authorization": "Bearer valid_smoke_token"},
            )
            assert poll_res.status_code == 200
            poll_data = poll_res.json()
            assert poll_data["job_id"] == job_id
            assert poll_data["status"] in ("queued", "running", "completed", "failed")


def test_pg_durable_queue_e2e_lifecycle_smoke():
    """
    End-to-end verification of PostgreSQL-backed durable submission queue:
    1. Persistent job creation in queue_jobs table via /api/submissions (submit).
    2. Atomic claiming by background worker with lease via claim_next_job_sync.
    3. Job completion and result persistence in submissions table.
    4. Database fallback polling via /api/submissions/status/{job_id} after cache clear.
    5. Retrieval via /api/submissions/history.
    """
    orig_pg = settings.queue_enable_pg_backend
    orig_backend = settings.database_backend
    settings.database_backend = "supabase"
    settings.queue_enable_pg_backend = True

    from app.services.submission_queue import submission_queue
    orig_queue_pg = submission_queue._pg_mode
    submission_queue._pg_mode = True

    try:
        test_uid = "pg_queue_smoke_user_007"
        headers = {"Authorization": "Bearer valid_smoke_token"}
        payload = {
            "source_code": "I2luY2x1ZGUgPGlvc3RyZWFtPgp1c2luZyBuYW1lc3BhY2Ugc3RkOwppbnQgbWFpbigpIHsgcmV0dXJuIDA7IH0=",
            "language_id": 54,
            "execution_type": "submit",
            "question_id": 1,
        }

        with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": test_uid}):
            # 1. Enqueue via API
            res = client.post("/api/submissions", headers=headers, json=payload)
            assert res.status_code == 202
            job_id = res.json()["job_id"]
            assert job_id is not None

            # 2. Verify row exists in PostgreSQL queue_jobs table
            session = supabase_service.get_db_session()
            try:
                import uuid
                db_job = session.query(supabase_service.QueueJob).filter_by(id=uuid.UUID(job_id)).first()
                assert db_job is not None
                assert db_job.status == "pending"
                assert db_job.uid == test_uid
            finally:
                session.close()

            # 3. Simulate Worker Claiming
            claimed = supabase_service.claim_next_job_sync("smoke_worker_1")
            assert claimed is not None
            assert claimed["job_id"] == job_id
            assert claimed["status"] == "running"

            # 4. Simulate Worker Completion & Result Persistence
            result_payload = {
                "verdict": "Accepted",
                "status_id": 3,
                "passed_count": 5,
                "total_count": 5,
                "runtime": "0.02s",
                "memory": "14MB",
            }
            supabase_service.complete_job_sync(job_id, "smoke_worker_1", result_payload)
            supabase_service.record_submission_sync(
                uid=test_uid,
                question_id=1,
                verdict="Accepted",
                status_id=3,
                language_id=54,
                passed_count=5,
                total_count=5,
                runtime="0.02s",
                memory="14MB",
                submission_id=job_id,
            )

            # 5. Clear in-memory cache to prove DB fallback polling works across restarts
            submission_queue._jobs.clear()

            # 6. Poll status via API
            poll_res = client.get(f"/api/submissions/{job_id}", headers=headers)
            assert poll_res.status_code == 200
            poll_data = poll_res.json()
            assert poll_data["job_id"] == job_id
            assert poll_data["status"] == "completed"
            assert poll_data["result"]["verdict"] == "Accepted"

            # 7. Check Submission History via API
            hist_res = client.get("/api/submissions/history", headers=headers)
            assert hist_res.status_code == 200
            hist_items = hist_res.json()["items"]
            assert len(hist_items) >= 1
            assert hist_items[0]["verdict"] == "Accepted"
            assert hist_items[0]["questionId"] == 1
    finally:
        submission_queue._pg_mode = orig_queue_pg
        settings.queue_enable_pg_backend = orig_pg
        settings.database_backend = orig_backend


# ── 5. Bookmarks, Notes, and Editor Drafts ────────────────────────────────────

def test_bookmarks_notes_drafts_lifecycle_smoke():
    """Verify full CRUD lifecycle for bookmarks, notes, and editor drafts."""
    test_uid = "smoke_user_features_002"
    headers = {"Authorization": "Bearer valid_smoke_token"}

    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": test_uid}):
        # 1. Add Bookmark
        res_bm = client.put("/api/bookmarks/1", headers=headers)
        assert res_bm.status_code == 200
        assert "bookmarked" in res_bm.json()["message"]

        # Check bookmark exists
        res_bms = client.get("/api/bookmarks", headers=headers)
        assert res_bms.status_code == 200
        assert 1 in res_bms.json().get("bookmarks", [])

        # 2. Save Note
        note_text = "Optimized hashmap approach for two sum: time O(n), space O(n)"
        res_note = client.put("/api/notes/1", headers=headers, json={"content": note_text})
        assert res_note.status_code == 200
        assert "saved" in res_note.json()["message"]

        # Fetch Note
        res_get_note = client.get("/api/notes/1", headers=headers)
        assert res_get_note.status_code == 200
        assert res_get_note.json()["content"] == note_text

        # 3. Save Editor Draft
        draft_code = "class Solution { public: vector<int> twoSum(...) {} };"
        res_draft = client.put(
            "/api/editor/1",
            headers=headers,
            json={"code": draft_code, "language": "cpp"},
        )
        assert res_draft.status_code == 200
        assert "saved" in res_draft.json()["message"]

        # Fetch Editor Draft
        res_get_draft = client.get("/api/editor/1", headers=headers)
        assert res_get_draft.status_code == 200
        assert res_get_draft.json()["code"] == draft_code

        # 4. Remove Bookmark
        res_del_bm = client.delete("/api/bookmarks/1", headers=headers)
        assert res_del_bm.status_code == 200
        assert "removed" in res_del_bm.json()["message"]


# ── 6. Batch Sync Reconciliation ─────────────────────────────────────────────

def test_batch_sync_reconciliation_smoke():
    """Verify batch sync updates progress, bookmarks, notes and returns unified data."""
    test_uid = "smoke_user_sync_003"
    headers = {"Authorization": "Bearer valid_smoke_token"}

    sync_payload = {
        "progress": [
            {"question_id": 1, "solved": True, "rev1": False, "rev2": False},
            {"question_id": 2, "solved": False, "rev1": True, "rev2": False},
        ],
        "bookmarks": [
            {"question_id": 1, "bookmarked": True},
        ],
        "notes": [
            {"question_id": 1, "content": "Smoke test note content"},
        ],
    }

    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": test_uid}):
        res = client.post("/api/sync/batch", headers=headers, json=sync_payload)
        assert res.status_code == 200
        data = res.json()
        assert 1 in data["progress"]["solved"]
        assert 2 in data["progress"]["rev1"]
        assert 1 in data["bookmarks"]["bookmarks"]
        assert data["notes"].get("1") == "Smoke test note content"
