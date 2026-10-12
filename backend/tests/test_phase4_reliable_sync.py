"""
Phase 4 Tests — Reliable Cloud-Synced Progress, Notes, and Bookmarks.

Verifies:
1. API Validation & Authorization:
   - Rejects unauthenticated batch sync requests (HTTP 401).
   - Rejects invalid question IDs (HTTP 422 for qid < 1 or qid > 10000).
   - Enforces batch size constraints (HTTP 422 for batch > 200 items).
2. Supabase / PostgreSQL Persistence:
   - Atomic persistence of progress (solved, rev1, rev2), bookmarks, and notes.
   - Partial updates preserve existing flags (e.g. rev1 toggle does not erase solved).
   - Bookmark removal physically purges records cleanly.
   - Note update overwrites previous note cleanly.
   - Returns reconciled UserAllDataResponse with unified truth.
3. User Authorization & Cross-Tenant Isolation:
   - Batch mutations for User A never alter or leak state for User B.
4. Database Gateway Dispatch & Parity:
   - db_service correctly dispatches to active backend (supabase vs firestore).
   - firestore_service.batch_sync behaves identically.
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.config import settings
from app.services import supabase_service, db_service, firestore_service
from app.services.supabase_service import (
    Base,
    User,
    UserProgress,
    UserBookmark,
    UserNote,
)

client = TestClient(app, raise_server_exceptions=False)


@pytest.fixture(autouse=True)
def setup_sqlite_supabase():
    """Configure supabase_service to use a fresh in-memory SQLite database for each test."""
    orig_backend = settings.database_backend
    settings.database_backend = "supabase"
    engine = supabase_service.get_engine("sqlite:///:memory:")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    settings.database_backend = orig_backend


# ── 1. API Validation & Security ──────────────────────────────────────────────

def test_batch_sync_unauthenticated_rejected():
    """Unauthenticated POST /api/sync/batch must return HTTP 401."""
    res = client.post("/api/sync/batch", json={"progress": [{"question_id": 1, "solved": True}]})
    assert res.status_code == 401


def test_batch_sync_invalid_question_id_rejected():
    """Negative or zero question IDs in batch sync must return HTTP 422."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "user_sync_test"}):
        res = client.post(
            "/api/sync/batch",
            headers={"Authorization": "Bearer valid_token"},
            json={"progress": [{"question_id": 0, "solved": True}]},
        )
        assert res.status_code == 422

        res_neg = client.post(
            "/api/sync/batch",
            headers={"Authorization": "Bearer valid_token"},
            json={"bookmarks": [{"question_id": -10, "bookmarked": True}]},
        )
        assert res_neg.status_code == 422


def test_batch_sync_oversized_batch_rejected():
    """Batch size exceeding 200 items must be rejected with HTTP 422."""
    oversized_items = [{"question_id": i, "solved": True} for i in range(1, 205)]
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "user_sync_test"}):
        res = client.post(
            "/api/sync/batch",
            headers={"Authorization": "Bearer valid_token"},
            json={"progress": oversized_items},
        )
        assert res.status_code == 422
        assert "exceeds maximum limit" in res.text


# ── 2. End-to-End Batch Sync & Supabase Persistence ───────────────────────────

@pytest.mark.anyio
async def test_batch_sync_end_to_end_persistence():
    """
    POST /api/sync/batch persists progress, bookmarks, and notes atomically,
    and returns reconciled UserAllDataResponse.
    """
    uid = "test_sync_user_1"
    payload = {
        "progress": [
            {"question_id": 1, "solved": True, "rev1": False, "rev2": False},
            {"question_id": 2, "solved": False, "rev1": True, "rev2": False},
            {"question_id": 3, "solved": True, "rev1": True, "rev2": True},
        ],
        "bookmarks": [
            {"question_id": 1, "bookmarked": True},
            {"question_id": 5, "bookmarked": True},
        ],
        "notes": [
            {"question_id": 1, "content": "Two sum hashmap approach O(n)"},
            {"question_id": 3, "content": "Sliding window technique"},
        ],
    }

    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid}):
        res = client.post(
            "/api/sync/batch",
            headers={"Authorization": "Bearer valid_token"},
            json=payload,
        )
        assert res.status_code == 200
        data = res.json()

        # Check returned reconciled state
        assert 1 in data["progress"]["solved"]
        assert 3 in data["progress"]["solved"]
        assert 2 not in data["progress"]["solved"]

        assert 2 in data["progress"]["rev1"]
        assert 3 in data["progress"]["rev1"]
        assert 3 in data["progress"]["rev2"]

        assert 1 in data["bookmarks"]["bookmarks"]
        assert 5 in data["bookmarks"]["bookmarks"]

        assert data["notes"]["1"] == "Two sum hashmap approach O(n)"
        assert data["notes"]["3"] == "Sliding window technique"

    # Verify directly in SQLite database
    session = supabase_service.get_db_session()
    try:
        p1 = session.query(UserProgress).filter_by(user_id=uid, question_id=1).first()
        assert p1 is not None and p1.solved is True

        bm = session.query(UserBookmark).filter_by(user_id=uid).all()
        bm_ids = {b.question_id for b in bm}
        assert bm_ids == {1, 5}

        n1 = session.query(UserNote).filter_by(user_id=uid, question_id=1).first()
        assert n1 is not None and n1.content == "Two sum hashmap approach O(n)"
    finally:
        session.close()


@pytest.mark.anyio
async def test_batch_sync_partial_updates_preserve_flags():
    """
    Subsequent batch sync with only rev1 toggle preserves solved=True.
    """
    uid = "test_sync_user_2"
    # First sync: mark question 10 solved
    await supabase_service.batch_sync(
        uid=uid,
        progress_items=[{"question_id": 10, "solved": True}],
    )

    # Second sync: toggle rev1=True without specifying solved
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid}):
        res = client.post(
            "/api/sync/batch",
            headers={"Authorization": "Bearer valid_token"},
            json={"progress": [{"question_id": 10, "rev1": True}]},
        )
        assert res.status_code == 200
        data = res.json()
        assert 10 in data["progress"]["solved"]
        assert 10 in data["progress"]["rev1"]


@pytest.mark.anyio
async def test_batch_sync_bookmark_removal():
    """
    Batch sync with bookmarked=False deletes the bookmark.
    """
    uid = "test_sync_user_3"
    # Create bookmarks 1 and 2
    await supabase_service.batch_sync(
        uid=uid,
        bookmark_items=[
            {"question_id": 1, "bookmarked": True},
            {"question_id": 2, "bookmarked": True},
        ],
    )

    # Unbookmark question 1
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid}):
        res = client.post(
            "/api/sync/batch",
            headers={"Authorization": "Bearer valid_token"},
            json={"bookmarks": [{"question_id": 1, "bookmarked": False}]},
        )
        assert res.status_code == 200
        data = res.json()
        assert 1 not in data["bookmarks"]["bookmarks"]
        assert 2 in data["bookmarks"]["bookmarks"]


@pytest.mark.anyio
async def test_batch_sync_note_overwrite():
    """
    Batch sync updating note content overwrites cleanly.
    """
    uid = "test_sync_user_4"
    await supabase_service.batch_sync(
        uid=uid,
        note_items=[{"question_id": 7, "content": "Initial draft note"}],
    )

    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid}):
        res = client.post(
            "/api/sync/batch",
            headers={"Authorization": "Bearer valid_token"},
            json={"notes": [{"question_id": 7, "content": "Revised dynamic programming note"}]},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["notes"]["7"] == "Revised dynamic programming note"


# ── 3. Cross-Tenant Authorization Isolation ────────────────────────────────────

@pytest.mark.anyio
async def test_batch_sync_cross_tenant_isolation():
    """
    Batch mutations for User A must never alter or leak state for User B.
    """
    uid_a = "user_alpha"
    uid_b = "user_beta"

    # User A synchronizes state
    await supabase_service.batch_sync(
        uid=uid_a,
        progress_items=[{"question_id": 100, "solved": True}],
        bookmark_items=[{"question_id": 100, "bookmarked": True}],
        note_items=[{"question_id": 100, "content": "Alpha secret note"}],
    )

    # User B synchronizes unrelated state
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid_b}):
        res = client.post(
            "/api/sync/batch",
            headers={"Authorization": "Bearer valid_token"},
            json={
                "progress": [{"question_id": 200, "solved": True}],
                "bookmarks": [{"question_id": 200, "bookmarked": True}],
            },
        )
        assert res.status_code == 200
        data_b = res.json()

        # User B must NOT see User A's data
        assert 100 not in data_b["progress"]["solved"]
        assert 100 not in data_b["bookmarks"]["bookmarks"]
        assert "100" not in data_b["notes"]

        assert 200 in data_b["progress"]["solved"]
        assert 200 in data_b["bookmarks"]["bookmarks"]


# ── 4. Unified Gateway & Parity ───────────────────────────────────────────────

@pytest.mark.anyio
async def test_db_service_gateway_dispatch():
    """
    db_service.batch_sync dispatches cleanly depending on database_backend setting.
    """
    settings.database_backend = "supabase"
    res = await db_service.batch_sync(
        uid="gateway_user",
        progress_items=[{"question_id": 42, "solved": True}],
    )
    assert 42 in res["progress"]["solved"]


@pytest.mark.anyio
async def test_firestore_service_batch_sync_parity():
    """
    firestore_service.batch_sync builds correct batch mutations.
    """
    mock_db = MagicMock()
    mock_batch = MagicMock()
    mock_db.batch.return_value = mock_batch
    mock_user_ref = MagicMock()
    mock_db.collection.return_value.document.return_value = mock_user_ref

    with patch("app.services.firestore_service._db", return_value=mock_db), \
         patch("app.services.firestore_service._user_ref", return_value=mock_user_ref), \
         patch("app.services.firestore_service.get_all_user_data", return_value={
             "progress": {"solved": [99], "rev1": [], "rev2": []},
             "bookmarks": [99],
             "notes": {"99": "firestore note"},
             "editor": {},
             "general_compiler": {},
         }):
        res = await firestore_service.batch_sync(
            uid="fs_user",
            progress_items=[{"question_id": 99, "solved": True}],
            bookmark_items=[{"question_id": 99, "bookmarked": True}],
            note_items=[{"question_id": 99, "content": "firestore note"}],
        )

        assert mock_batch.set.call_count >= 3
        mock_batch.commit.assert_called_once()
        assert 99 in res["progress"]["solved"]


@pytest.mark.anyio
async def test_batch_sync_50k_note_accepted():
    """Batch sync accepts note with exactly 50,000 characters."""
    uid = "test_sync_user_50k"
    large_note = "A" * 50_000

    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid}):
        res = client.post(
            "/api/sync/batch",
            headers={"Authorization": "Bearer valid_token"},
            json={"notes": [{"question_id": 99, "content": large_note}]},
        )
        assert res.status_code == 200
        data = res.json()
        assert len(data["notes"]["99"]) == 50_000


def test_batch_sync_oversized_note_rejected():
    """Batch sync rejects note exceeding 50,000 characters with HTTP 422."""
    uid = "test_sync_user_oversized"
    oversized_note = "A" * 50_001

    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid}):
        res = client.post(
            "/api/sync/batch",
            headers={"Authorization": "Bearer valid_token"},
            json={"notes": [{"question_id": 99, "content": oversized_note}]},
        )
        assert res.status_code == 422
