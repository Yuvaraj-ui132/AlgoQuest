"""
test_security_hardening.py — Phase Two Security Verification Tests.
Tests:
  1. Authentication & token validation edge cases (missing, invalid, expired, missing uid).
  2. Cross-user job isolation (User A cannot access User B's job -> 403).
  3. Hidden-test confidentiality (inputs and expected outputs never leaked).
  4. Delimiter robustness (empty test output preservation, extra delimiter handling).
  5. Request validation bounds (min_length, invalid language IDs).
"""

import unittest
from unittest.mock import AsyncMock, patch
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from fastapi.security import HTTPAuthorizationCredentials

from app.main import app
from app.dependencies import get_current_user
from app.services.submission_queue import SubmissionQueue, JobStatus
import firebase_admin.auth as firebase_auth


client = TestClient(app)


class TestSecurityTokenAuthentication(unittest.IsolatedAsyncioTestCase):
    """Verify that Firebase token authentication is strictly enforced without information leakage."""

    def test_missing_auth_token_returns_401(self):
        """Requesting protected endpoint without Bearer token must return 401."""
        response = client.get("/api/progress")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Missing authentication token", response.json()["detail"])

    @patch("firebase_admin.auth.verify_id_token")
    async def test_invalid_token_returns_401_with_sanitized_message(self, mock_verify):
        """Invalid token must raise 401 with generic message, never raw exception details."""
        mock_verify.side_effect = firebase_auth.InvalidIdTokenError("Internal signature mismatch: xyz123")
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="bad_token")
        with self.assertRaises(HTTPException) as ctx:
            await get_current_user(creds)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertEqual(ctx.exception.detail, "Invalid or revoked Firebase ID token.")
        self.assertNotIn("xyz123", ctx.exception.detail)

    @patch("firebase_admin.auth.verify_id_token")
    async def test_expired_token_returns_401(self, mock_verify):
        """Expired token must raise 401 asking user to refresh session."""
        mock_verify.side_effect = firebase_auth.ExpiredIdTokenError("Token expired at timestamp 1700000000", cause=None)
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="expired_token")
        with self.assertRaises(HTTPException) as ctx:
            await get_current_user(creds)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("expired", ctx.exception.detail.lower())

    @patch("firebase_admin.auth.verify_id_token")
    async def test_token_without_uid_returns_401(self, mock_verify):
        """Decoded token payload missing 'uid' must be rejected with 401."""
        mock_verify.return_value = {"email": "user@example.com"}  # no uid
        creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials="no_uid_token")
        with self.assertRaises(HTTPException) as ctx:
            await get_current_user(creds)
        self.assertEqual(ctx.exception.status_code, 401)
        self.assertIn("missing uid", ctx.exception.detail.lower())


class TestCrossUserAuthorization(unittest.TestCase):
    """Verify strict multi-tenant isolation across all endpoints."""

    def setUp(self):
        app.dependency_overrides.clear()

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_cross_user_job_polling_forbidden(self):
        """User B polling User A's job must receive PermissionError in internal queue."""
        queue = SubmissionQueue()
        job = queue.create_job(uid="user_A", question_id=1, language_id=71, source_code="print(1)")

        # User A can get the job
        found = queue.get_job(job.job_id, "user_A")
        self.assertIsNotNone(found)

        # User B must be denied
        with self.assertRaises(PermissionError):
            queue.get_job(job.job_id, "user_B")

    def test_cross_user_api_poll_returns_403(self):
        """API endpoint GET /api/submissions/{job_id} must return 403 when user does not own job."""
        from app.services.submission_queue import submission_queue
        job = submission_queue.create_job(uid="user_A", question_id=1, language_id=71, source_code="print(1)")

        # Authenticate as user_B
        async def dep(): return "user_B"
        app.dependency_overrides[get_current_user] = dep

        response = client.get(f"/api/submissions/{job.job_id}")
        self.assertEqual(response.status_code, 403)
        self.assertIn("permission", response.json()["detail"].lower())


class TestHiddenTestCaseConfidentiality(unittest.IsolatedAsyncioTestCase):
    """Verify that hidden test case inputs and expected outputs are never returned to client."""

    async def test_hidden_tests_never_exposed_in_worker_result(self):
        """Async worker result must never include input or expected output for hidden tests."""
        queue = SubmissionQueue()
        job = queue.create_job(uid="user_test", question_id=1, language_id=71, source_code="code")

        with patch("app.services.submission_queue._get_question_test_data_sync") as mock_data, \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mock_j0, \
             patch("app.services.submission_queue._record_submission_sync"), \
             patch("app.services.submission_queue._update_progress_sync"):

            mock_data.return_value = {
                "sampleTests": [
                    {"input": "sample_in", "expected": "sample_exp", "expectedRaw": "sample_exp", "stdin": "s\n"}
                ],
                "hiddenTests": [
                    {"input": "SUPER_SECRET_INPUT_1", "expected": "SECRET_EXP_1", "expectedRaw": "SECRET_EXP_1", "stdin": "h1\n"},
                    {"input": "SUPER_SECRET_INPUT_2", "expected": "SECRET_EXP_2", "expectedRaw": "SECRET_EXP_2", "stdin": "h2\n"},
                ],
                "compareMode": "ordered",
            }

            mock_j0.return_value = {
                "status_id": 3,
                "verdict": "Accepted",
                "stdout": "sample_exp\n---END_TC---\nSECRET_EXP_1\n---END_TC---\nSECRET_EXP_2\n---END_TC---\n",
                "stderr": "",
                "compile_output": "",
                "time": "0.02",
                "memory": "2048",
                "message": "",
            }

            await queue._process_job(job)

        self.assertEqual(job.status, JobStatus.COMPLETED)
        tc_results = job.result["test_cases"]
        self.assertEqual(len(tc_results), 3)

        # Sample test case: allowed to have input and expected
        self.assertFalse(tc_results[0]["is_hidden"])
        self.assertEqual(tc_results[0]["input"], "sample_in")
        self.assertEqual(tc_results[0]["expected"], "sample_exp")

        # Hidden test cases: MUST NOT have input or expected keys
        for htc in tc_results[1:]:
            self.assertTrue(htc["is_hidden"])
            self.assertNotIn("input", htc)
            self.assertNotIn("expected", htc)


class TestDelimiterRobustness(unittest.TestCase):
    """Verify execution framing and output parser edge cases."""

    def test_structured_delimiter_collision_immunity(self):
        """User code printing ---END_TC--- must NOT break test case slicing in structured protocol."""
        from app.routes.submissions import parse_test_outputs
        stdout = (
            "__AQ_TC_START_0__\n"
            "user output containing ---END_TC--- deliberately\n"
            "__AQ_TC_END_0__\n"
            "__AQ_TC_START_1__\n"
            "\n"
            "__AQ_TC_END_1__\n"
            "__AQ_TC_START_2__\n"
            "line 1\nline 2\n"
            "__AQ_TC_END_2__\n"
        )
        parsed = parse_test_outputs(stdout, expected_count=3)
        self.assertEqual(len(parsed), 3)
        self.assertEqual(parsed[0], "user output containing ---END_TC--- deliberately")
        self.assertEqual(parsed[1], "")
        self.assertEqual(parsed[2], "line 1\nline 2")

    def test_empty_output_captured_accurately(self):
        """Functions that produce no output must return empty string, not None or marker fragments."""
        from app.routes.submissions import parse_test_outputs
        stdout = (
            "__AQ_TC_START_0__\n"
            "__AQ_TC_END_0__\n"
            "__AQ_TC_START_1__\n"
            "   \n"
            "__AQ_TC_END_1__\n"
        )
        parsed = parse_test_outputs(stdout, expected_count=2)
        self.assertEqual(parsed, ["", ""])

    def test_multiline_output_preserves_internal_newlines(self):
        """Multiline output (matrices, trees) must preserve internal newlines."""
        from app.routes.submissions import parse_test_outputs
        stdout = (
            "__AQ_TC_START_0__\n"
            "1 0 0\n0 1 0\n0 0 1\n"
            "__AQ_TC_END_0__\n"
        )
        parsed = parse_test_outputs(stdout, expected_count=1)
        self.assertEqual(parsed, ["1 0 0\n0 1 0\n0 0 1"])

    def test_output_containing_indexed_markers_in_user_data(self):
        """User program output printing fake end marker is contained via boundary resolution."""
        from app.routes.submissions import parse_test_outputs
        stdout = (
            "__AQ_TC_START_0__\n"
            "First part\n__AQ_TC_END_0__\nSecond part\n"
            "__AQ_TC_END_0__\n"
            "__AQ_TC_START_1__\n"
            "Next test\n"
            "__AQ_TC_END_1__\n"
        )
        parsed = parse_test_outputs(stdout, expected_count=2)
        self.assertEqual(len(parsed), 2)
        # Bounded by reverse search before next start tag, capturing the true end marker
        self.assertIn("Second part", parsed[0])
        self.assertEqual(parsed[1], "Next test")

    def test_missing_markers_due_to_early_exit(self):
        """Process terminating before printing end marker must assign empty string and continue safely."""
        from app.routes.submissions import parse_test_outputs
        stdout = (
            "__AQ_TC_START_0__\n"
            "valid test 0\n"
            "__AQ_TC_END_0__\n"
            "__AQ_TC_START_1__\n"
            "crash before end marker..."
        )
        parsed = parse_test_outputs(stdout, expected_count=2)
        self.assertEqual(len(parsed), 2)
        self.assertEqual(parsed[0], "valid test 0")
        self.assertEqual(parsed[1], "")  # Missing end marker -> empty

    def test_completely_empty_stdout(self):
        """Empty stdout must return expected_count empty strings."""
        from app.routes.submissions import parse_test_outputs
        parsed = parse_test_outputs("", expected_count=3)
        self.assertEqual(parsed, ["", "", ""])

    def test_legacy_delimiter_preserves_empty_test_outputs(self):
        """Legacy delimiter parser must preserve empty test outputs without shifting test indices."""
        from app.routes.submissions import parse_test_outputs
        stdout = "5\n---END_TC---\n---END_TC---\n10\n---END_TC---\n"
        parsed = parse_test_outputs(stdout, expected_count=3)

        self.assertEqual(len(parsed), 3)
        self.assertEqual(parsed[0], "5")
        self.assertEqual(parsed[1], "")   # Empty output preserved!
        self.assertEqual(parsed[2], "10")

    def test_legacy_delimiter_single_test_output(self):
        """Single test output with trailing delimiter must parse to a 1-element list."""
        from app.routes.submissions import parse_test_outputs
        stdout = "42\n---END_TC---\n"
        parsed = parse_test_outputs(stdout, expected_count=1)

        self.assertEqual(parsed, ["42"])


class TestRequestValidationHardening(unittest.TestCase):
    """Verify input validation limits and reject malformed requests."""

    def setUp(self):
        async def dep(): return "user_val"
        app.dependency_overrides[get_current_user] = dep

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_empty_source_code_rejected(self):
        """Submission with empty source code must fail Pydantic validation (422)."""
        response = client.post("/api/submissions", json={
            "source_code": "",
            "language_id": 71,
            "execution_type": "run",
            "question_id": 1,
        })
        self.assertEqual(response.status_code, 422)

    def test_unsupported_language_id_rejected(self):
        """Unsupported language ID (e.g. 999) must return 422."""
        response = client.post("/api/submissions", json={
            "source_code": "print(1)",
            "language_id": 999,
            "execution_type": "run",
            "question_id": 1,
        })
        self.assertEqual(response.status_code, 422)
        self.assertIn("unsupported language_id", response.json()["detail"].lower())


class TestMultiLanguageExecutionFlows(unittest.TestCase):
    """Verify Run and Submit flows across all 4 supported languages (Python, JS, C++, Java)."""

    def setUp(self):
        async def dep(): return "flow_tester"
        app.dependency_overrides[get_current_user] = dep

    def tearDown(self):
        app.dependency_overrides.clear()

    def _verify_language_flows(self, lang_id: int, sample_code: str):
        # 1. Synchronous 'run' flow
        with patch("app.routes.submissions._get_question_test_data") as mtd, \
             patch("app.routes.submissions.judge0_service.execute", new_callable=AsyncMock) as mj0:
            mtd.return_value = {
                "sampleTests": [{"stdin": "1\n", "expectedRaw": "2", "input": "1", "expected": "2"}],
                "hiddenTests": [],
                "compareMode": "ordered",
            }
            mj0.return_value = {
                "status_id": 3,
                "verdict": "Accepted",
                "stdout": "__AQ_TC_START_0__\n2\n__AQ_TC_END_0__\n",
                "stderr": "",
                "compile_output": "",
                "time": "0.01",
                "memory": "1024",
                "message": "",
            }

            resp = client.post("/api/submissions", json={
                "source_code": sample_code,
                "language_id": lang_id,
                "execution_type": "run",
                "question_id": 1,
            })
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertEqual(data["verdict"], "Accepted")
            self.assertEqual(data["status_id"], 3)
            self.assertEqual(len(data["test_cases"]), 1)
            self.assertEqual(data["test_cases"][0]["actual"], "2")

        # 2. Asynchronous 'submit' flow
        with patch("app.services.submission_queue._get_question_test_data_sync") as mtd_q, \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0_q, \
             patch("app.services.submission_queue._record_submission_sync"), \
             patch("app.services.submission_queue._update_progress_sync"):
            mtd_q.return_value = {
                "sampleTests": [{"stdin": "1\n", "expectedRaw": "2", "input": "1", "expected": "2"}],
                "hiddenTests": [{"stdin": "2\n", "expectedRaw": "4", "input": "2", "expected": "4"}],
                "compareMode": "ordered",
            }
            mj0_q.return_value = {
                "status_id": 3,
                "verdict": "Accepted",
                "stdout": "__AQ_TC_START_0__\n2\n__AQ_TC_END_0__\n__AQ_TC_START_1__\n4\n__AQ_TC_END_1__\n",
                "stderr": "",
                "compile_output": "",
                "time": "0.02",
                "memory": "2048",
                "message": "",
            }

            submit_resp = client.post("/api/submissions", json={
                "source_code": sample_code,
                "language_id": lang_id,
                "execution_type": "submit",
                "question_id": 1,
            })
            self.assertEqual(submit_resp.status_code, 202)
            job_id = submit_resp.json()["job_id"]
            self.assertTrue(job_id)

    def test_python_run_and_submit_flows(self):
        self._verify_language_flows(71, "def solve(): return 2")

    def test_javascript_run_and_submit_flows(self):
        self._verify_language_flows(63, "function solve() { return 2; }")

    def test_cpp_run_and_submit_flows(self):
        self._verify_language_flows(76, "int solve() { return 2; }")

    def test_java_run_and_submit_flows(self):
        self._verify_language_flows(62, "class Solution { int solve() { return 2; } }")


if __name__ == "__main__":
    unittest.main()

