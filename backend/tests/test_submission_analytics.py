"""
test_submission_analytics.py — Comprehensive tests for lifetime submission analytics.

Validates:
1. Authentication & Security:
   - /api/submissions/analytics requires verified Firebase ID token (401 without auth).
   - User identity is always derived from token (User B cannot see User A's stats).
2. Complete Aggregation:
   - All persisted submissions are included in totals regardless of History pagination.
   - Accurate total_submissions, accepted_submissions, acceptance_rate, attempted_count.
   - Accurate verdict distribution, language distribution, top attempted problems, recent daily activity.
3. Backend Parity:
   - Supabase / PostgreSQL aggregation.
   - Firestore aggregation.
4. Zero-State Safety:
   - Handles users with zero submissions gracefully (no division by zero).
"""

import os
import sys
import pytest
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.services import supabase_service, firestore_service
from app.services.supabase_service import Base
from app.config import settings

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_sqlite():
    """Configure in-memory SQLite database for Supabase backend tests."""
    orig_backend = settings.database_backend
    settings.database_backend = "supabase"
    engine = supabase_service.get_engine("sqlite:///:memory:")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    settings.database_backend = orig_backend


# ── 1. Authentication Enforcement ─────────────────────────────────────────────

def test_submission_analytics_unauthenticated():
    """Unauthenticated or malformed requests must be rejected with 401."""
    res_no_auth = client.get("/api/submissions/analytics")
    assert res_no_auth.status_code == 401

    res_bad_auth = client.get(
        "/api/submissions/analytics",
        headers={"Authorization": "InvalidScheme token"},
    )
    assert res_bad_auth.status_code == 401


# ── 2. User Isolation & Security ─────────────────────────────────────────────

def test_submission_analytics_user_isolation():
    """User B fetching analytics must never see User A's submission stats."""
    uid_a = "analytics_user_a"
    uid_b = "analytics_user_b"

    # Seed User A submissions
    supabase_service.record_submission_sync(
        uid=uid_a, question_id=1, verdict="Accepted", status_id=3, language_id=71,
        passed_count=5, total_count=5, runtime="1 ms", memory="1 MB"
    )
    supabase_service.record_submission_sync(
        uid=uid_a, question_id=2, verdict="Wrong Answer", status_id=4, language_id=54,
        passed_count=2, total_count=5, runtime="2 ms", memory="1 MB"
    )

    # User B requests analytics -> should be completely empty (0 total)
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid_b}):
        res_b = client.get(
            "/api/submissions/analytics",
            headers={"Authorization": "Bearer token_b"},
        )
    assert res_b.status_code == 200
    b_data = res_b.json()
    assert b_data["total_submissions"] == 0
    assert b_data["accepted_submissions"] == 0
    assert b_data["acceptance_rate"] == 0.0
    assert b_data["attempted_count"] == 0
    assert b_data["verdicts"] == {}
    assert b_data["languages"] == {}
    assert b_data["top_problems"] == []
    assert b_data["recent_activity"] == []

    # User A requests analytics -> sees own stats
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid_a}):
        res_a = client.get(
            "/api/submissions/analytics",
            headers={"Authorization": "Bearer token_a"},
        )
    assert res_a.status_code == 200
    a_data = res_a.json()
    assert a_data["total_submissions"] == 2
    assert a_data["accepted_submissions"] == 1
    assert a_data["acceptance_rate"] == 50.0
    assert a_data["attempted_count"] == 2


# ── 3. Full Backend Aggregation (Supabase / PostgreSQL) ───────────────────────

def test_submission_analytics_full_aggregation():
    """Analytics must correctly calculate lifetime aggregations across all submissions."""
    uid = "analytics_full_user"

    # Progress: 2 solved questions
    supabase_service.update_progress_sync(uid=uid, question_id=10)
    supabase_service.update_progress_sync(uid=uid, question_id=20)

    # 3 submissions on question 10: 1 Accepted (Python), 2 Wrong Answer (Python)
    supabase_service.record_submission_sync(
        uid=uid, question_id=10, verdict="Accepted", status_id=3, language_id=71,
        passed_count=5, total_count=5, runtime="1 ms", memory="1 MB"
    )
    supabase_service.record_submission_sync(
        uid=uid, question_id=10, verdict="Wrong Answer", status_id=4, language_id=71,
        passed_count=2, total_count=5, runtime="1 ms", memory="1 MB"
    )
    supabase_service.record_submission_sync(
        uid=uid, question_id=10, verdict="Wrong Answer", status_id=4, language_id=71,
        passed_count=3, total_count=5, runtime="1 ms", memory="1 MB"
    )

    # 2 submissions on question 20: 1 Compilation Error (Java), 1 Accepted (Java)
    supabase_service.record_submission_sync(
        uid=uid, question_id=20, verdict="Compilation Error", status_id=6, language_id=62,
        passed_count=0, total_count=5, runtime="0 ms", memory="0 MB"
    )
    supabase_service.record_submission_sync(
        uid=uid, question_id=20, verdict="Accepted", status_id=3, language_id=62,
        passed_count=5, total_count=5, runtime="10 ms", memory="2 MB"
    )

    # 1 submission on question 30: 1 Time Limit Exceeded (C++)
    supabase_service.record_submission_sync(
        uid=uid, question_id=30, verdict="Time Limit Exceeded", status_id=5, language_id=54,
        passed_count=1, total_count=5, runtime="2000 ms", memory="5 MB"
    )

    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid}):
        res = client.get(
            "/api/submissions/analytics",
            headers={"Authorization": "Bearer tok"},
        )
    assert res.status_code == 200
    data = res.json()

    assert data["total_submissions"] == 6
    assert data["accepted_submissions"] == 2
    assert data["acceptance_rate"] == 33.33
    assert data["attempted_count"] == 3
    assert data["solved_count"] == 2

    # Verdicts
    assert data["verdicts"]["Accepted"] == 2
    assert data["verdicts"]["Wrong Answer"] == 2
    assert data["verdicts"]["Compilation Error"] == 1
    assert data["verdicts"]["Time Limit Exceeded"] == 1

    # Languages
    assert data["languages"]["python"] == 3
    assert data["languages"]["java"] == 2
    assert data["languages"]["cpp"] == 1

    # Top problems: ranked by attempts descending
    top = data["top_problems"]
    assert len(top) == 3
    assert top[0]["questionId"] == 10
    assert top[0]["attempts"] == 3
    assert top[0]["accepted"] is True

    assert top[1]["questionId"] == 20
    assert top[1]["attempts"] == 2
    assert top[1]["accepted"] is True

    assert top[2]["questionId"] == 30
    assert top[2]["attempts"] == 1
    assert top[2]["accepted"] is False

    # Recent activity
    assert len(data["recent_activity"]) >= 1
    today_act = data["recent_activity"][0]
    assert today_act["total"] == 6
    assert today_act["accepted"] == 2


# ── 4. History Pagination Independence ────────────────────────────────────────

def test_history_pagination_does_not_limit_analytics():
    """
    Submissions endpoint with small limit must not truncate /submissions/analytics.
    Analytics must aggregate all 5 submissions even when history is fetched with limit=2.
    """
    uid = "analytics_paging_user"

    for i in range(5):
        supabase_service.record_submission_sync(
            uid=uid, question_id=100 + i, verdict="Accepted", status_id=3, language_id=71,
            passed_count=5, total_count=5, runtime="1 ms", memory="1 MB"
        )

    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": uid}):
        # First: fetch history with limit=2
        hist_res = client.get(
            "/api/submissions/history?limit=2",
            headers={"Authorization": "Bearer tok"},
        )
        assert hist_res.status_code == 200
        hist_data = hist_res.json()
        assert len(hist_data["items"]) == 2
        assert hist_data["hasMore"] is True

        # Second: fetch analytics -> must reflect all 5, NOT 2!
        ana_res = client.get(
            "/api/submissions/analytics",
            headers={"Authorization": "Bearer tok"},
        )
        assert ana_res.status_code == 200
        ana_data = ana_res.json()
        assert ana_data["total_submissions"] == 5
        assert ana_data["accepted_submissions"] == 5
        assert ana_data["attempted_count"] == 5
        assert ana_data["acceptance_rate"] == 100.0


# ── 5. Firestore Backend Parity ───────────────────────────────────────────────

@pytest.mark.anyio
async def test_firestore_service_analytics_aggregation():
    """firestore_service.get_user_analytics computes accurate aggregations."""
    uid = "fs_analytics_user"

    # Mock progress docs
    mock_p1 = MagicMock()
    mock_p1.to_dict.return_value = {"solved": True, "rev1": True, "rev2": False}
    mock_p2 = MagicMock()
    mock_p2.to_dict.return_value = {"solved": False, "rev1": False, "rev2": False}

    # Mock submission docs
    now = datetime(2026, 10, 18, 12, 0, 0, tzinfo=timezone.utc)
    mock_s1 = MagicMock()
    mock_s1.to_dict.return_value = {
        "questionId": 1, "verdict": "Accepted", "language": "cpp",
        "languageId": 54, "submittedAt": now
    }
    mock_s2 = MagicMock()
    mock_s2.to_dict.return_value = {
        "questionId": 1, "verdict": "Wrong Answer", "language": "cpp",
        "languageId": 54, "submittedAt": now
    }
    mock_s3 = MagicMock()
    mock_s3.to_dict.return_value = {
        "questionId": 2, "verdict": "Accepted", "language": "python",
        "languageId": 71, "submittedAt": now
    }

    mock_db = MagicMock()
    mock_user_doc = MagicMock()

    mock_progress_col = MagicMock()
    mock_progress_col.stream.return_value = [mock_p1, mock_p2]

    mock_subs_col = MagicMock()
    mock_subs_query = MagicMock()
    mock_subs_query.stream.return_value = [mock_s1, mock_s2, mock_s3]
    mock_subs_col.select.return_value = mock_subs_query

    def col_side_effect(name):
        if name == "progress":
            return mock_progress_col
        if name == "submissions":
            return mock_subs_col
        return MagicMock()

    mock_user_doc.collection.side_effect = col_side_effect
    mock_db.collection.return_value.document.return_value = mock_user_doc

    with patch("app.services.firestore_service._db", return_value=mock_db), \
         patch("app.services.firestore_service._user_ref", return_value=mock_user_doc):
        data = await firestore_service.get_user_analytics(uid)

    assert data["total_submissions"] == 3
    assert data["accepted_submissions"] == 2
    assert data["acceptance_rate"] == 66.67
    assert data["solved_count"] == 1
    assert data["attempted_count"] == 2
    assert data["verdicts"]["Accepted"] == 2
    assert data["verdicts"]["Wrong Answer"] == 1
    assert data["languages"]["cpp"] == 2
    assert data["languages"]["python"] == 1
    assert len(data["top_problems"]) == 2
    assert data["top_problems"][0]["questionId"] == 1
    assert data["top_problems"][0]["attempts"] == 2
    assert data["top_problems"][0]["accepted"] is True
    assert len(data["recent_activity"]) == 1
    assert data["recent_activity"][0]["date"] == "2026-10-18"
    assert data["recent_activity"][0]["total"] == 3
    assert data["recent_activity"][0]["accepted"] == 2
