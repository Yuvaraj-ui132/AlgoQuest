"""
test_async_submission.py - Tests for the async submission queue system.
Covers all 25 required test cases.
"""

import asyncio
import time
import threading
import unittest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient


VALID_SUBMIT_BODY = {
    "source_code": "dGVzdA==",
    "language_id": 71,
    "execution_type": "submit",
    "question_id": 1,
}

VALID_RUN_BODY = {
    "source_code": "dGVzdA==",
    "language_id": 71,
    "execution_type": "run",
    "question_id": 1,
}


class TestQueueUnit(unittest.IsolatedAsyncioTestCase):
    """Unit tests for SubmissionQueue in isolation."""

    def setUp(self):
        from app.services.submission_queue import SubmissionQueue
        self.queue = SubmissionQueue()

    # Test 3 & 4: create_job
    def test_create_job_returns_queued(self):
        from app.services.submission_queue import JobStatus
        job = self.queue.create_job(uid="ua", question_id=1, language_id=71, source_code="abc")
        self.assertIsNotNone(job.job_id)
        self.assertEqual(job.status, JobStatus.QUEUED)
        self.assertIsNone(job.result)

    # Test 14: UID isolation
    def test_uid_isolation(self):
        job = self.queue.create_job(uid="ua", question_id=1, language_id=71, source_code="abc")
        found = self.queue.get_job(job.job_id, "ua")
        self.assertIsNotNone(found)
        with self.assertRaises(PermissionError):
            self.queue.get_job(job.job_id, "ub")

    # Test 15: unknown job returns None
    def test_unknown_job_none(self):
        self.assertIsNone(self.queue.get_job("no-such-job", "ua"))

    # Test 5: QUEUED->RUNNING->COMPLETED
    async def test_worker_accepted(self):
        from app.services.submission_queue import JobStatus
        job = self.queue.create_job(uid="ua", question_id=1, language_id=71, source_code="abc")

        with patch("app.services.submission_queue._get_question_test_data_sync") as mtd, \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0, \
             patch("app.services.submission_queue._record_submission_sync"), \
             patch("app.services.submission_queue._update_progress_sync"):

            mtd.return_value = {
                "sampleTests": [{"stdin": "s\n", "expectedRaw": "0 1", "input": "i", "expected": "e"}],
                "hiddenTests": [], "compareMode": "unordered",
            }
            mj0.return_value = {
                "status_id": 3, "verdict": "Accepted",
                "stdout": "0 1\n---END_TC---\n",
                "stderr": "", "compile_output": "", "time": "0.05", "memory": "5120", "message": "",
            }
            await self.queue._process_job(job)

        self.assertEqual(job.status, JobStatus.COMPLETED)
        self.assertEqual(job.result["verdict"], "Accepted")

    # Test 16: Worker failure -> FAILED
    async def test_worker_judge0_failure(self):
        from app.services.submission_queue import JobStatus
        job = self.queue.create_job(uid="ua", question_id=1, language_id=71, source_code="abc")

        with patch("app.services.submission_queue._get_question_test_data_sync") as mtd, \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0:
            mtd.return_value = {
                "sampleTests": [{"stdin": "s\n", "expectedRaw": "x", "input": "i", "expected": "e"}],
                "hiddenTests": [], "compareMode": "ordered",
            }
            mj0.side_effect = Exception("API error")
            await self.queue._process_job(job)

        self.assertEqual(job.status, JobStatus.FAILED)
        self.assertIn("Judge0 error", job.error)

    # Test 7: Accepted -> progress update
    async def test_accepted_updates_progress(self):
        job = self.queue.create_job(uid="ua", question_id=1, language_id=71, source_code="abc")

        with patch("app.services.submission_queue._get_question_test_data_sync") as mtd, \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0, \
             patch("app.services.submission_queue._record_submission_sync"), \
             patch("app.services.submission_queue._update_progress_sync") as mprog:

            mtd.return_value = {
                "sampleTests": [{"stdin": "s\n", "expectedRaw": "0 1", "input": "i", "expected": "e"}],
                "hiddenTests": [], "compareMode": "unordered",
            }
            mj0.return_value = {
                "status_id": 3, "verdict": "Accepted",
                "stdout": "0 1\n---END_TC---\n",
                "stderr": "", "compile_output": "", "time": "0.05", "memory": "5120", "message": "",
            }
            await self.queue._process_job(job)

        mprog.assert_called_once_with("ua", 1)

    # Test 8: Accepted -> exactly one history record
    async def test_accepted_one_history_record(self):
        job = self.queue.create_job(uid="ua", question_id=1, language_id=71, source_code="abc")

        with patch("app.services.submission_queue._get_question_test_data_sync") as mtd, \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0, \
             patch("app.services.submission_queue._record_submission_sync") as mrec, \
             patch("app.services.submission_queue._update_progress_sync"):

            mtd.return_value = {
                "sampleTests": [{"stdin": "s\n", "expectedRaw": "0 1", "input": "i", "expected": "e"}],
                "hiddenTests": [], "compareMode": "unordered",
            }
            mj0.return_value = {
                "status_id": 3, "verdict": "Accepted",
                "stdout": "0 1\n---END_TC---\n",
                "stderr": "", "compile_output": "", "time": "0.05", "memory": "5120", "message": "",
            }
            await self.queue._process_job(job)

        self.assertEqual(mrec.call_count, 1)

    # Test 9: Wrong Answer -> history, no progress
    async def test_wrong_answer_history_no_progress(self):
        from app.services.submission_queue import JobStatus
        job = self.queue.create_job(uid="ua", question_id=1, language_id=71, source_code="abc")

        with patch("app.services.submission_queue._get_question_test_data_sync") as mtd, \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0, \
             patch("app.services.submission_queue._record_submission_sync") as mrec, \
             patch("app.services.submission_queue._update_progress_sync") as mprog:

            mtd.return_value = {
                "sampleTests": [{"stdin": "s\n", "expectedRaw": "0 1", "input": "i", "expected": "e"}],
                "hiddenTests": [], "compareMode": "ordered",
            }
            mj0.return_value = {
                "status_id": 3, "verdict": "Accepted",
                "stdout": "99\n---END_TC---\n",
                "stderr": "", "compile_output": "", "time": "0.05", "memory": "5120", "message": "",
            }
            await self.queue._process_job(job)

        self.assertEqual(job.result["verdict"], "Wrong Answer")
        self.assertEqual(mrec.call_count, 1)
        mprog.assert_not_called()

    # Test 10: Compile Error -> history with compileError
    async def test_compile_error_history_with_compile_error(self):
        job = self.queue.create_job(uid="ua", question_id=1, language_id=71, source_code="abc")

        with patch("app.services.submission_queue._get_question_test_data_sync") as mtd, \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0, \
             patch("app.services.submission_queue._record_submission_sync") as mrec, \
             patch("app.services.submission_queue._update_progress_sync") as mprog:

            mtd.return_value = {
                "sampleTests": [{"stdin": "s\n", "expectedRaw": "0 1", "input": "i", "expected": "e"}],
                "hiddenTests": [], "compareMode": "ordered",
            }
            mj0.return_value = {
                "status_id": 6, "verdict": "Compilation Error",
                "stdout": "", "stderr": "", "compile_output": "SyntaxError: bad syntax",
                "time": None, "memory": None, "message": "",
            }
            await self.queue._process_job(job)

        args = mrec.call_args[0]
        self.assertEqual(args[9], "SyntaxError: bad syntax")
        mprog.assert_not_called()

    # Test 23: Hidden tests not in result
    async def test_hidden_tests_not_in_result(self):
        job = self.queue.create_job(uid="ua", question_id=1, language_id=71, source_code="abc")

        with patch("app.services.submission_queue._get_question_test_data_sync") as mtd, \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0, \
             patch("app.services.submission_queue._record_submission_sync"), \
             patch("app.services.submission_queue._update_progress_sync"):

            mtd.return_value = {
                "sampleTests": [{"stdin": "s\n", "expectedRaw": "0 1", "input": "visible_i", "expected": "visible_e"}],
                "hiddenTests":  [{"stdin": "h\n", "expectedRaw": "9 8", "input": "HIDDEN_I", "expected": "HIDDEN_E"}],
                "compareMode": "unordered",
            }
            mj0.return_value = {
                "status_id": 3, "verdict": "Accepted",
                "stdout": "0 1\n---END_TC---\n9 8\n---END_TC---\n",
                "stderr": "", "compile_output": "", "time": "0.05", "memory": "5120", "message": "",
            }
            await self.queue._process_job(job)

        tc_results = job.result["test_cases"]
        hidden_tc = tc_results[1]
        self.assertTrue(hidden_tc["is_hidden"])
        self.assertNotIn("input", hidden_tc)
        self.assertNotIn("expected", hidden_tc)

    # Cleanup test
    def test_cleanup_removes_old_jobs(self):
        from app.services.submission_queue import JobStatus, JOB_RETENTION_SECONDS
        job = self.queue.create_job(uid="ua", question_id=1, language_id=71, source_code="abc")
        job.status = JobStatus.COMPLETED
        job.result = {"verdict": "Accepted"}
        job.created_at = time.monotonic() - JOB_RETENTION_SECONDS - 10
        self.queue._cleanup_now()
        self.assertIsNone(self.queue.get_job(job.job_id, "ua"))


class TestSubmissionRoutes(unittest.TestCase):
    """HTTP-level route tests."""

    @classmethod
    def setUpClass(cls):
        from app.main import app
        from app.services.submission_queue import submission_queue
        submission_queue._jobs.clear()
        cls.app = app
        cls.sq = submission_queue
        cls.client = TestClient(app)

    def _auth(self, uid="u1"):
        from app.dependencies import get_current_user
        async def dep(): return uid
        self.app.dependency_overrides[get_current_user] = dep

    def tearDown(self):
        self.app.dependency_overrides.clear()
        self.sq._jobs.clear()

    # Test 2: Submit returns 202
    def test_submit_returns_202(self):
        self._auth("u202")
        r = self.client.post("/api/submissions", json=VALID_SUBMIT_BODY)
        self.assertEqual(r.status_code, 202)

    # Test 3: Submit creates job
    def test_submit_creates_job(self):
        self._auth("u_cj")
        r = self.client.post("/api/submissions", json=VALID_SUBMIT_BODY)
        self.assertEqual(r.status_code, 202)
        data = r.json()
        self.assertIn("job_id", data)
        self.assertEqual(data["status"], "queued")
        self.assertIsNotNone(self.sq.get_job(data["job_id"], "u_cj"))

    # Test 4: Job initially QUEUED
    def test_job_initially_queued(self):
        from app.services.submission_queue import JobStatus
        self._auth("u_q")
        r = self.client.post("/api/submissions", json=VALID_SUBMIT_BODY)
        job_id = r.json()["job_id"]
        self.assertEqual(self.sq.get_job(job_id, "u_q").status, JobStatus.QUEUED)

    # Test 6: Judge0 NOT called by request handler for submit
    def test_submit_does_not_call_judge0(self):
        self._auth("u_j0")
        with patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0:
            r = self.client.post("/api/submissions", json=VALID_SUBMIT_BODY)
        self.assertEqual(r.status_code, 202)
        mj0.assert_not_called()

    # Test 1: Run is synchronous and calls Judge0
    def test_run_is_synchronous(self):
        self._auth("u_run")
        with patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0, \
             patch("app.routes.submissions._get_question_test_data") as mtd:
            mtd.return_value = {
                "sampleTests": [{"stdin": "s\n", "expectedRaw": "0 1", "input": "i", "expected": "e"}],
                "hiddenTests": [], "compareMode": "unordered",
            }
            mj0.return_value = {
                "status_id": 3, "verdict": "Accepted",
                "stdout": "0 1\n---END_TC---\n",
                "stderr": "", "compile_output": "", "time": "0.05", "memory": "5120", "message": "",
            }
            r = self.client.post("/api/submissions", json=VALID_RUN_BODY)
        self.assertEqual(r.status_code, 200)
        mj0.assert_called_once()
        self.assertIn("verdict", r.json())
        self.assertNotIn("job_id", r.json())

    # Test 11: Run creates no history record
    def test_run_no_history(self):
        self._auth("u_rh")
        with patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mj0, \
             patch("app.routes.submissions._get_question_test_data") as mtd, \
             patch("app.services.firestore_service.record_submission", new_callable=AsyncMock) as mrec:
            mtd.return_value = {
                "sampleTests": [{"stdin": "s\n", "expectedRaw": "0 1", "input": "i", "expected": "e"}],
                "hiddenTests": [], "compareMode": "unordered",
            }
            mj0.return_value = {
                "status_id": 3, "verdict": "Accepted",
                "stdout": "0 1\n---END_TC---\n",
                "stderr": "", "compile_output": "", "time": "0.05", "memory": "5120", "message": "",
            }
            r = self.client.post("/api/submissions", json=VALID_RUN_BODY)
        self.assertEqual(r.status_code, 200)
        mrec.assert_not_called()

    # Test 12 & 13: Rate limiting
    def test_rate_limit_blocks_and_no_job_created(self):
        from app.routes.submissions import _rate_store, _rate_lock, RATE_LIMIT_MAX
        test_uid = "u_rl_999"
        self._auth(test_uid)
        now = time.monotonic()
        with _rate_lock:
            _rate_store[test_uid] = [now - 1] * RATE_LIMIT_MAX
        initial = self.sq.job_count
        r = self.client.post("/api/submissions", json=VALID_SUBMIT_BODY)
        self.assertEqual(r.status_code, 429)
        self.assertEqual(self.sq.job_count, initial)
        with _rate_lock:
            _rate_store.pop(test_uid, None)

    # Test 14: Cross-user job access -> 403
    def test_cross_user_job_forbidden(self):
        from app.dependencies import get_current_user
        job = self.sq.create_job(uid="ua_cross", question_id=1, language_id=71, source_code="abc")
        async def dep(): return "ub_cross"
        self.app.dependency_overrides[get_current_user] = dep
        r = self.client.get(f"/api/submissions/{job.job_id}")
        self.assertEqual(r.status_code, 403)

    # Test 15: Unknown job -> 404
    def test_unknown_job_404(self):
        self._auth("u_404")
        r = self.client.get("/api/submissions/totally-fake-job-id")
        self.assertEqual(r.status_code, 404)

    # Test 20: History endpoint works
    def test_history_endpoint_works(self):
        self._auth("u_hist")
        with patch("app.services.firestore_service.get_submission_history", new_callable=AsyncMock) as mhist:
            mhist.return_value = {"items": [], "hasMore": False, "nextCursor": None}
            r = self.client.get("/api/submissions/history")
        self.assertEqual(r.status_code, 200)
        self.assertIn("items", r.json())

    # Test: completed job returns result
    def test_completed_job_returns_result(self):
        from app.services.submission_queue import JobStatus
        job = self.sq.create_job(uid="u_comp", question_id=1, language_id=71, source_code="abc")
        job.status = JobStatus.COMPLETED
        job.result = {
            "verdict": "Accepted", "status_id": 3, "runtime": "0.05s", "memory": "5.0 MB",
            "passed_count": 1, "total_count": 1,
            "compile_output": None, "stderr": None,
            "test_cases": [{"index": 1, "passed": True, "actual": "0 1", "is_hidden": False,
                            "input": "i", "expected": "e"}],
        }
        self._auth("u_comp")
        r = self.client.get(f"/api/submissions/{job.job_id}")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "completed")
        self.assertEqual(r.json()["result"]["verdict"], "Accepted")

    # Test 23: Hidden tests not exposed via API
    def test_api_hidden_tests_not_exposed(self):
        from app.services.submission_queue import JobStatus
        job = self.sq.create_job(uid="u_hid", question_id=1, language_id=71, source_code="abc")
        job.status = JobStatus.COMPLETED
        job.result = {
            "verdict": "Accepted", "status_id": 3, "runtime": "--", "memory": "--",
            "passed_count": 2, "total_count": 2,
            "compile_output": None, "stderr": None,
            "test_cases": [
                {"index": 1, "passed": True, "actual": "0 1", "is_hidden": False, "input": "i", "expected": "e"},
                {"index": 2, "passed": True, "actual": "9 8", "is_hidden": True},
            ],
        }
        self._auth("u_hid")
        r = self.client.get(f"/api/submissions/{job.job_id}")
        tc_list = r.json()["result"]["test_cases"]
        hidden = tc_list[1]
        self.assertTrue(hidden["is_hidden"])
        self.assertIsNone(hidden.get("input"))
        self.assertIsNone(hidden.get("expected"))


class TestHelpers(unittest.TestCase):
    """Tests for pure helper functions."""

    # Test 24: module importable
    def test_module_importable(self):
        import importlib
        import app.services.submission_queue as sq
        self.assertTrue(hasattr(sq, "submission_queue"))
        self.assertTrue(hasattr(sq, "SubmissionQueue"))
        self.assertTrue(hasattr(sq, "JobStatus"))

    def test_compare_ordered(self):
        from app.services.submission_queue import _compare_sync
        self.assertTrue(_compare_sync("1 2 3", "1 2 3", "ordered"))
        self.assertFalse(_compare_sync("3 2 1", "1 2 3", "ordered"))

    def test_compare_unordered(self):
        from app.services.submission_queue import _compare_sync
        self.assertTrue(_compare_sync("0 1", "1 0", "unordered"))
        self.assertFalse(_compare_sync("1 2", "1 3", "unordered"))

    def test_compare_float(self):
        from app.services.submission_queue import _compare_sync
        self.assertTrue(_compare_sync("2.00001", "2.00000", "float"))
        self.assertFalse(_compare_sync("2.1", "2.0", "float"))

    def test_compare_any_of(self):
        from app.services.submission_queue import _compare_sync
        self.assertTrue(_compare_sync("foo", "foo | bar", "any_of"))
        self.assertFalse(_compare_sync("qux", "foo | bar", "any_of"))

    def test_build_stdin_sync(self):
        from app.services.submission_queue import _build_stdin_sync
        tcs = [{"stdin": "3\n1 2 3\n"}, {"stdin": "4\n4 5 6 7"}]
        combined = _build_stdin_sync(tcs)
        self.assertTrue(combined.startswith("2\n"))

    def test_fmt_time(self):
        from app.services.submission_queue import _fmt_time
        self.assertEqual(_fmt_time("0.050"), "0.050s")
        self.assertEqual(_fmt_time(None), "--")

    def test_fmt_memory(self):
        from app.services.submission_queue import _fmt_memory
        self.assertEqual(_fmt_memory("5120"), "5.0 MB")
        self.assertEqual(_fmt_memory(None), "--")


class TestOpenAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        from app.main import app
        cls.client = TestClient(app)

    def test_new_endpoints_in_schema(self):
        r = self.client.get("/openapi.json")
        paths = r.json().get("paths", {})
        self.assertIn("/api/submissions/{job_id}", paths)
        self.assertIn("/api/submissions/history", paths)

    def test_history_not_matched_as_job_id(self):
        # history must return 401 (auth required), not 404 (not found)
        r = self.client.get("/api/submissions/history")
        self.assertEqual(r.status_code, 401)


if __name__ == "__main__":
    unittest.main()
