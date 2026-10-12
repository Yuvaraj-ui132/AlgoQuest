"""
test_phase2_security.py

Phase 2: Comprehensive Backend Security, Hardening & Cleanup Regression Test Suite.
Verifies:
1. Information leakage & error sanitization (CWE-209 fail-secure in production).
2. Database exception sanitization strips passwords, tokens, URLs, and SQL dumps.
3. Authentication failure handling (missing, expired, invalid, and malformed tokens).
4. Token payload integrity (missing uid rejection).
5. Cross-user authorization isolation (IDOR protection on submission jobs and user routes).
6. Input validation & DoS controls (oversized source code, invalid language, invalid question_id).
7. Rate limiting enforcement (HTTP 429 before queue/execution).
8. User profile bootstrap error sanitization.
"""

import sys
import os
import json
import time
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
import firebase_admin.auth as firebase_auth

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.config import settings
from app.utils.errors import sanitize_db_error
from app.services.submission_queue import submission_queue, JobStatus


client = TestClient(app, raise_server_exceptions=False)


# ── 1. Information Disclosure & Error Sanitization (CWE-209) ───────────────────

def test_production_mode_unhandled_exception_hides_internals():
    """
    In production mode, unhandled exceptions must return a generic 500 detail.
    Database IPs, usernames, passwords, and tracebacks must NEVER be exposed.
    """
    settings.app_env = "production"

    with patch("app.routes.bookmarks.db_service.get_all_bookmarks", side_effect=Exception(
        'OperationalError: connection to server at "52.68.3.1", port 6543 failed: '
        'FATAL: password authentication failed for user "postgres.secret_db_user"'
    )):
        with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "test_user_sec"}):
            response = client.get(
                "/api/bookmarks",
                headers={"Authorization": "Bearer valid_test_token"},
            )
            assert response.status_code == 500
            data = response.json()
            assert data["detail"] == "An internal server error occurred."
            # Confirm no IP, credentials, or internal class names leaked
            assert "52.68.3.1" not in response.text
            assert "postgres.secret_db_user" not in response.text
            assert "OperationalError" not in response.text


def test_sanitize_db_error_strips_sensitive_data():
    """
    sanitize_db_error must strip database URLs, user:password pairs,
    bearer tokens, and SQL statement dumps from exception text.
    """
    class MockOrig:
        __class__ = type("OperationalError", (), {})
        pgcode = "28P01"
        def __str__(self):
            return (
                'FATAL: password authentication failed for user "postgres.myuser"\n'
                'URL: postgresql://postgres.myuser:SuperSecretPassword123!@aws-0-us-west.pooler.supabase.com:6543/postgres\n'
                'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret\n'
                '[SQL: SELECT users.id FROM users WHERE users.id = :id_1]\n'
                '[parameters: {\'id_1\': \'attacker_input\'}]\n'
                '(Background on this error at: https://sqlalche.me/e/20/e3q8)'
            )

    exc = Exception("Wrapped SQLAlchemy error")
    exc.orig = MockOrig()

    result = sanitize_db_error(exc)
    sanitized_msg = result["sanitized_message"]

    assert "SuperSecretPassword123!" not in sanitized_msg
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in sanitized_msg
    assert "[SQL:" not in sanitized_msg
    assert "[parameters:" not in sanitized_msg
    assert "(Background on this error" not in sanitized_msg
    assert "[REDACTED]" in sanitized_msg
    assert result["pgcode"] == "28P01"


def test_user_init_sanitized_error_on_db_failure():
    """
    POST /api/user/init must return generic detail on failure without
    interpolating raw database exception strings into the client response.
    """
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "user_init_test"}):
        with patch("app.routes.user.db_service.init_user_document", side_effect=RuntimeError("Secret internal DB failure")):
            response = client.post(
                "/api/user/init",
                json={"name": "Alice", "email": "alice@example.com"},
                headers={"Authorization": "Bearer valid_token"},
            )
            assert response.status_code == 500
            data = response.json()
            assert data["detail"] == "Failed to initialize user profile."
            assert "Secret internal DB failure" not in response.text


# ── 2. Authentication & Authorization Failure Safety ──────────────────────────

def test_missing_authentication_token_returns_401():
    """Requests without Authorization header must fail with HTTP 401."""
    response = client.get("/api/progress")
    assert response.status_code == 401
    assert "Missing authentication token" in response.json()["detail"]


def test_malformed_authorization_header_returns_401():
    """Empty or non-Bearer authorization credentials must fail with HTTP 401."""
    response = client.get(
        "/api/progress",
        headers={"Authorization": "Bearer "},
    )
    assert response.status_code == 401


def test_expired_token_returns_401():
    """Expired Firebase ID token must fail with HTTP 401."""
    with patch("app.dependencies.firebase_auth.verify_id_token", side_effect=firebase_auth.ExpiredIdTokenError("Token expired", None)):
        response = client.get(
            "/api/progress",
            headers={"Authorization": "Bearer expired_token"},
        )
        assert response.status_code == 401
        assert "expired" in response.json()["detail"].lower()


def test_invalid_token_returns_401():
    """Invalid or forged Firebase ID token must fail with HTTP 401."""
    with patch("app.dependencies.firebase_auth.verify_id_token", side_effect=firebase_auth.InvalidIdTokenError("Invalid token")):
        response = client.get(
            "/api/progress",
            headers={"Authorization": "Bearer forged_token"},
        )
        assert response.status_code == 401
        assert "Invalid or revoked" in response.json()["detail"]


def test_token_missing_uid_returns_401():
    """Decoded token lacking 'uid' claim must fail with HTTP 401."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"email": "no_uid@example.com"}):
        response = client.get(
            "/api/progress",
            headers={"Authorization": "Bearer token_no_uid"},
        )
        assert response.status_code == 401
        assert "missing uid" in response.json()["detail"].lower()


# ── 3. Cross-User Authorization & IDOR Isolation ─────────────────────────────

def test_cross_user_job_status_access_forbidden():
    """
    User B must be strictly forbidden (HTTP 403) from polling a job created by User A.
    """
    # Create job owned by user_A
    job = submission_queue.create_job(
        uid="user_A",
        question_id=1,
        language_id=71,
        source_code="print('hello')",
    )

    # Attempt to poll job as user_B
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "user_B"}):
        response = client.get(
            f"/api/submissions/{job.job_id}",
            headers={"Authorization": "Bearer user_B_token"},
        )
        assert response.status_code == 403
        assert "do not have permission" in response.json()["detail"]

    # Owner user_A can successfully poll
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "user_A"}):
        response = client.get(
            f"/api/submissions/{job.job_id}",
            headers={"Authorization": "Bearer user_A_token"},
        )
        assert response.status_code == 200
        assert response.json()["job_id"] == job.job_id


# ── 4. Input Validation & DoS Protection (CWE-20) ──────────────────────────────

def test_submission_rejects_unsupported_language_id():
    """Submissions with invalid / unsupported language IDs must fail with HTTP 422."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "user_val"}):
        response = client.post(
            "/api/submissions",
            json={
                "source_code": "print('hello')",
                "language_id": 9999,  # unsupported
                "execution_type": "run",
                "question_id": 1,
            },
            headers={"Authorization": "Bearer valid_token"},
        )
        assert response.status_code == 422
        assert "Unsupported language_id" in response.json()["detail"]


def test_submission_rejects_negative_or_zero_question_id():
    """Submissions with negative or zero question_id must fail with HTTP 422."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "user_val"}):
        response = client.post(
            "/api/submissions",
            json={
                "source_code": "print('hello')",
                "language_id": 71,
                "execution_type": "run",
                "question_id": -1,
            },
            headers={"Authorization": "Bearer valid_token"},
        )
        assert response.status_code == 422


def test_submission_rejects_missing_question_id_for_dsa_mode():
    """'run' and 'submit' execution modes must provide question_id."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "user_val"}):
        response = client.post(
            "/api/submissions",
            json={
                "source_code": "print('hello')",
                "language_id": 71,
                "execution_type": "submit",
                "question_id": None,
            },
            headers={"Authorization": "Bearer valid_token"},
        )
        assert response.status_code == 422
        assert "question_id is required" in response.json()["detail"]


def test_submission_rejects_oversized_source_code():
    """Submissions exceeding 300,000 characters must fail with HTTP 422 (DoS prevention)."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "user_val"}):
        huge_code = "A" * 300_001
        response = client.post(
            "/api/submissions",
            json={
                "source_code": huge_code,
                "language_id": 71,
                "execution_type": "run",
                "question_id": 1,
            },
            headers={"Authorization": "Bearer valid_token"},
        )
        assert response.status_code == 422


def test_editor_code_rejects_unsupported_language():
    """Editor save endpoint must reject invalid languages."""
    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": "user_val"}):
        response = client.put(
            "/api/editor/1",
            json={
                "language": "ruby",  # unsupported
                "code": "puts 'hello'",
            },
            headers={"Authorization": "Bearer valid_token"},
        )
        assert response.status_code == 422


# ── 5. Rate Limiting Enforcement ──────────────────────────────────────────────

def test_rate_limiting_triggers_429_before_execution():
    """
    Submitting more than 10 requests within 60 seconds from the same UID
    must trigger HTTP 429 Too Many Requests with Retry-After header.
    """
    rate_limited_uid = f"rate_limit_user_{time.time()}"

    with patch("app.dependencies.firebase_auth.verify_id_token", return_value={"uid": rate_limited_uid}):
        with patch("app.services.judge0_service.execute", return_value={
            "verdict": "Accepted", "status_id": 3, "time": "0.01", "memory": "1000",
            "stdout": "", "compile_output": "", "stderr": ""
        }):
            # Send 10 rapid submissions (allowed)
            for _ in range(10):
                resp = client.post(
                    "/api/submissions",
                    json={
                        "source_code": "print('hello')",
                        "language_id": 71,
                        "execution_type": "general",
                    },
                    headers={"Authorization": "Bearer valid_token"},
                )
                assert resp.status_code == 200

            # 11th request must be blocked by rate limiter
            resp11 = client.post(
                "/api/submissions",
                json={
                    "source_code": "print('hello')",
                    "language_id": 71,
                    "execution_type": "general",
                },
                headers={"Authorization": "Bearer valid_token"},
            )
            assert resp11.status_code == 429
            assert "Rate limit exceeded" in resp11.json()["detail"]
            assert "Retry-After" in resp11.headers


# ── 6. CORS Origins Verification ───────────────────────────────────────────────

def test_cors_origin_headers_handling():
    """CORS origins in settings must be correctly reflected in headers."""
    assert "https://algoquest-9aab0.web.app" in settings.allowed_origins
    assert "https://algoquest-9aab0.firebaseapp.com" in settings.allowed_origins

    response = client.options(
        "/api/progress",
        headers={
            "Origin": "https://algoquest-9aab0.web.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://algoquest-9aab0.web.app"
