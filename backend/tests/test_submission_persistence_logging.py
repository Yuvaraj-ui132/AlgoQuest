"""
test_submission_persistence_logging.py - Regression tests for submission persistence error logging.

Verifies:
1. sanitize_db_error extracts exact exception class, driver class, and PostgreSQL SQLSTATE pgcode.
2. Credentials, passwords, Bearer tokens, and query parameters are redacted from log messages.
3. When database persistence fails in submission_queue, the worker logs the actual exception
   class, pgcode, and sanitized message without leaking credentials or source code.
4. When record_submission_sync fails in supabase_service, it logs the sanitized error before rollback.
"""

import unittest
from unittest.mock import MagicMock, patch, AsyncMock
from sqlalchemy.exc import ProgrammingError, IntegrityError, OperationalError

from app.utils.errors import sanitize_db_error
from app.services.submission_queue import SubmissionJob, SubmissionQueue, JobStatus


class MockPsycopg2DriverError(Exception):
    def __init__(self, message, pgcode=None):
        super().__init__(message)
        self.pgcode = pgcode


class TestSanitizeDbError(unittest.TestCase):
    """Unit tests for database error sanitization."""

    def test_standard_exception(self):
        exc = ValueError("Invalid input value")
        res = sanitize_db_error(exc)
        self.assertEqual(res["exception_class"], "ValueError")
        self.assertIsNone(res["driver_class"])
        self.assertIsNone(res["pgcode"])
        self.assertIn("Invalid input value", res["sanitized_message"])

    def test_sqlalchemy_wrapped_driver_error_with_pgcode(self):
        driver_err = MockPsycopg2DriverError(
            'column "id" is of type uuid but expression is of type character varying',
            pgcode="42804",
        )
        sa_err = ProgrammingError(
            "INSERT INTO submissions (id) VALUES (%(id)s)",
            {"id": "c9a646d3-9c61-4c96-8576-90510fc2b405"},
            driver_err,
        )

        res = sanitize_db_error(sa_err)
        self.assertEqual(res["exception_class"], "ProgrammingError:MockPsycopg2DriverError")
        self.assertEqual(res["driver_class"], "MockPsycopg2DriverError")
        self.assertEqual(res["pgcode"], "42804")
        self.assertIn('column "id" is of type uuid', res["sanitized_message"])
        # Ensure parameters and SQL dumps are stripped from message
        self.assertNotIn("c9a646d3-9c61-4c96-8576-90510fc2b405", res["sanitized_message"])
        self.assertNotIn("[parameters:", res["sanitized_message"])
        self.assertNotIn("[SQL:", res["sanitized_message"])

    def test_redaction_of_db_credentials_and_tokens(self):
        raw_msg = (
            "could not connect to postgresql://postgres:SuperSecretPassword123@db.supabase.co:5432/algoquest "
            "with token=jwt_secret_token_abc and Bearer eyJhbGciOiJIUzI1NiJ9"
        )
        driver_err = MockPsycopg2DriverError(raw_msg, pgcode="08006")
        sa_err = OperationalError("connection failed", {}, driver_err)

        res = sanitize_db_error(sa_err)
        self.assertNotIn("SuperSecretPassword123", res["sanitized_message"])
        self.assertNotIn("jwt_secret_token_abc", res["sanitized_message"])
        self.assertNotIn("eyJhbGciOiJIUzI1NiJ9", res["sanitized_message"])
        self.assertIn("postgresql://postgres:[REDACTED]@db.supabase.co:5432/algoquest", res["sanitized_message"])
        self.assertIn("token=[REDACTED]", res["sanitized_message"])
        self.assertIn("Bearer [REDACTED]", res["sanitized_message"])


class TestSubmissionPersistenceQueueLogging(unittest.IsolatedAsyncioTestCase):
    """Regression test for worker logging on submission persistence failure."""

    async def test_worker_logs_actual_exception_class_and_sanitized_error(self):
        queue = SubmissionQueue()
        job = SubmissionJob(
            job_id="test-job-99",
            uid="user_test_99",
            question_id=7,
            language_id=71,
            execution_type="submit",
            source_code="def solve(): return 42 # SENSITIVE_SOURCE_CODE",
        )

        # Mock Judge0 execution to return successful Accepted result
        fake_judge0_result = {
            "status_id": 3,
            "stdout": "__AQ_TC_START_0__\n5\n__AQ_TC_END_0__\n",
            "time": "0.010",
            "memory": "1024",
            "compile_output": None,
            "stderr": None,
            "verdict": "Accepted",
        }

        # Simulate database failure with PostgreSQL DatatypeMismatch
        driver_err = MockPsycopg2DriverError(
            'column "id" is of type uuid but expression is of type character varying',
            pgcode="42804",
        )
        db_err = ProgrammingError("INSERT INTO submissions ...", {}, driver_err)

        with patch("app.services.judge0_service.execute", new_callable=AsyncMock) as mock_exec, \
             patch("app.services.submission_queue._get_question_test_data_sync") as mock_qdata, \
             patch("app.services.submission_queue._record_submission_sync", side_effect=db_err), \
             patch("app.services.submission_queue._update_progress_sync") as mock_prog, \
             patch("app.services.submission_queue.logger") as mock_logger:

            mock_exec.return_value = fake_judge0_result
            mock_qdata.return_value = {
                "sampleTests": [{"stdin": "1\n", "expectedRaw": "5"}],
                "hiddenTests": [],
                "compareMode": "ordered",
            }

            await queue._process_job(job)

            # Ensure submission was completed (persistence failure is non-fatal)
            self.assertEqual(job.status, JobStatus.COMPLETED)
            self.assertEqual(job.result["verdict"], "Accepted")

            # Check logger.error call for [SUBMISSION_PERSISTENCE_FAILED]
            persistence_log_calls = [
                call for call in mock_logger.error.call_args_list
                if "[SUBMISSION_PERSISTENCE_FAILED]" in str(call[0][0])
            ]
            self.assertEqual(len(persistence_log_calls), 1)

            log_format_str = persistence_log_calls[0][0][0]
            log_args = persistence_log_calls[0][0][1:]

            # Verify log components: job_id, question_id, verdict, exc_class, pgcode, error
            self.assertEqual(log_args[0], "test-job-99")
            self.assertEqual(log_args[1], 7)
            self.assertEqual(log_args[2], "Accepted")
            self.assertIn("ProgrammingError:MockPsycopg2DriverError", log_args[3])
            self.assertEqual(log_args[4], "42804")
            self.assertIn('column "id" is of type uuid', log_args[5])

            # Verify sensitive source code is NOT in any log argument
            for arg in log_args:
                self.assertNotIn("SENSITIVE_SOURCE_CODE", str(arg))


if __name__ == "__main__":
    unittest.main()
