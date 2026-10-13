"""
test_hidden_test_migration.py

Comprehensive security and regression test suite verifying the AlgoQuest
hidden test migration:
1. Missing secret file in production fails closed (never produces Accepted).
2. Malformed secret file in production fails closed.
3. Incomplete question coverage in production fails closed.
4. Sample-only mode requires explicit opt-in and NEVER produces production Accepted or updates progress.
5. Production submission executes private tests and masks all hidden inputs, expected outputs, and stderr.
6. Incorrect solution produces Wrong Answer and never updates progress.
7. Public sample tests endpoint never exposes hidden tests.
8. Authoritative suite covers all 174 questions with valid schema and edge cases.
"""

import asyncio
import json
import os
import sys
import tempfile
import pytest
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.config import settings
from app.routes.submissions import (
    reset_test_data_cache,
    _get_question_test_data,
    get_question_submission_data,
    validate_hidden_tests_on_startup,
)
from app.services.submission_queue import (
    SubmissionJob,
    JobStatus,
    submission_queue,
)


@pytest.fixture(autouse=True)
def clean_cache():
    """Ensure cache is reset before and after every test."""
    reset_test_data_cache()
    yield
    reset_test_data_cache()


# ── 1. Production Fail-Closed on Missing Secret ───────────────────────────────

def test_missing_secret_file_fails_closed_in_production(monkeypatch):
    """In production, missing private secret file must return an error and fail closed."""
    monkeypatch.setattr(settings, "allow_sample_only_grading", False)
    monkeypatch.setattr(settings, "hidden_tests_path", "/nonexistent/path/hidden.json")
    reset_test_data_cache()

    q_data, err, is_sample_only = get_question_submission_data(1)
    assert q_data is None
    assert err is not None
    assert "Private hidden test suite is not configured or missing" in err
    assert is_sample_only is False


def test_queue_job_fails_when_private_tests_missing(monkeypatch):
    """Worker must mark job FAILED and never produce Accepted or update progress."""
    async def _run():
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", "/nonexistent/path/hidden.json")
        reset_test_data_cache()

        job = SubmissionJob(
            job_id="test-job-missing-secret",
            uid="user123",
            question_id=1,
            language_id=71,
            execution_type="submit",
            source_code="class Solution: def twoSum(self, n, t): return [0, 1]",
        )

        with patch("app.services.submission_queue._update_progress_sync") as mock_progress, \
             patch("app.services.judge0_service.execute") as mock_judge:
            await submission_queue._process_job(job)

            assert job.status == JobStatus.FAILED
            assert "Private hidden test suite is not configured or missing" in job.error
            assert job.result is None
            mock_judge.assert_not_called()
            mock_progress.assert_not_called()

    asyncio.run(_run())


# ── 2. Production Fail-Closed on Malformed Secret ──────────────────────────────

def test_malformed_secret_file_fails_closed_in_production(monkeypatch):
    """Malformed/invalid JSON in private test secret must fail closed."""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        f.write("{ invalid json corrupted content ...")
        temp_path = f.name

    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        q_data, err, is_sample_only = get_question_submission_data(1)
        assert q_data is None
        assert err is not None
        assert "Malformed private hidden test file" in err
        assert is_sample_only is False
    finally:
        os.remove(temp_path)


# ── 3. Incomplete Question Coverage Fails Closed ──────────────────────────────

def test_incomplete_question_coverage_fails_closed(monkeypatch):
    """If hidden test suite is missing tests for the target question, fail closed."""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        # Only contains question 2, missing question 1
        json.dump({"2": [{"stdin": "test", "expectedRaw": "1"}]}, f)
        temp_path = f.name

    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        q_data, err, is_sample_only = get_question_submission_data(1)
        assert q_data is None
        assert err is not None
        assert "private hidden tests missing for question 1" in err
    finally:
        os.remove(temp_path)


# ── 4. Explicit Sample-Only Dev Mode ──────────────────────────────────────────

def test_sample_only_mode_requires_explicit_opt_in(monkeypatch):
    """Sample-only mode is active only when ALLOW_SAMPLE_ONLY_GRADING is True."""
    monkeypatch.setattr(settings, "allow_sample_only_grading", True)
    monkeypatch.setattr(settings, "hidden_tests_path", "/nonexistent/path/hidden.json")
    reset_test_data_cache()

    q_data, err, is_sample_only = get_question_submission_data(1)
    assert q_data is not None
    assert err is None
    assert is_sample_only is True
    assert q_data["hiddenTests"] == []


def test_sample_only_mode_never_produces_accepted_or_updates_progress(monkeypatch):
    """In sample-only mode, passing all tests yields 'Sample Accepted (Dev Only)' and NEVER updates progress."""
    async def _run():
        monkeypatch.setattr(settings, "allow_sample_only_grading", True)
        monkeypatch.setattr(settings, "hidden_tests_path", "/nonexistent/path/hidden.json")
        reset_test_data_cache()

        job = SubmissionJob(
            job_id="test-job-sample-only",
            uid="user_dev",
            question_id=1,
            language_id=71,
            execution_type="submit",
            source_code="class Solution: def twoSum(self, nums, target): return [0, 1]",
        )

        mock_judge_result = {
            "verdict": "Accepted",
            "status_id": 3,
            "time": 0.05,
            "memory": 1024,
            "stdout": "__AQ_test_START_0__\n0 1\n\n__AQ_test_END_0__\n__AQ_test_START_1__\n1 2\n\n__AQ_test_END_1__\n",
            "compile_output": None,
            "stderr": None,
        }

        with patch("app.services.judge0_service.execute", new_callable=AsyncMock, return_value=mock_judge_result), \
             patch("app.routes.submissions.prepare_dsa_source", return_value=("mock_code", True)), \
             patch("app.routes.submissions.parse_test_outputs", return_value=["0 1", "1 2"]), \
             patch("app.services.submission_queue._record_submission_sync") as mock_record, \
             patch("app.services.submission_queue._update_progress_sync") as mock_progress:

            await submission_queue._process_job(job)

            assert job.status == JobStatus.COMPLETED
            assert job.result is not None
            assert job.result["verdict"] == "Sample Accepted (Dev Only)"
            mock_progress.assert_not_called()
            mock_record.assert_called_once()
            call_args = mock_record.call_args[0]
            assert call_args[2] == "Sample Accepted (Dev Only)"

    asyncio.run(_run())


# ── 5. Production Execution With Private Hidden Tests ─────────────────────────

def test_production_submission_executes_hidden_tests_and_masks_leakage(monkeypatch):
    """Production submission runs full suite, returns Accepted, and masks all hidden test details."""
    async def _run():
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        local_hidden_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "data", "hidden_test_cases.json")
        )
        monkeypatch.setattr(settings, "hidden_tests_path", local_hidden_path)
        reset_test_data_cache()

        q_data, err, is_sample_only = get_question_submission_data(1)
        assert err is None
        assert is_sample_only is False
        assert len(q_data["hiddenTests"]) >= 3
        total_expected = len(q_data["sampleTests"]) + len(q_data["hiddenTests"])

        job = SubmissionJob(
            job_id="test-job-prod-submit",
            uid="prod_user",
            question_id=1,
            language_id=71,
            execution_type="submit",
            source_code="class Solution: def twoSum(self, nums, target): return [0, 1]",
        )

        mock_outputs = [tc.get("expectedRaw", "") for tc in q_data["sampleTests"]] + [tc.get("expectedRaw", "") for tc in q_data["hiddenTests"]]
        mock_stdout_slices = "".join(f"__AQ_n_START_{i}__\n{out}\n\n__AQ_n_END_{i}__\n" for i, out in enumerate(mock_outputs))
        mock_judge_result = {
            "verdict": "Accepted",
            "status_id": 3,
            "time": 0.08,
            "memory": 2048,
            "stdout": mock_stdout_slices,
            "compile_output": None,
            "stderr": "hidden debug trace that should be masked",
        }

        with patch("app.services.judge0_service.execute", new_callable=AsyncMock, return_value=mock_judge_result), \
             patch("app.routes.submissions.prepare_dsa_source", return_value=("mock_code", True)), \
             patch("app.routes.submissions.parse_test_outputs", return_value=mock_outputs), \
             patch("app.services.submission_queue._record_submission_sync"), \
             patch("app.services.submission_queue._update_progress_sync") as mock_progress:

            await submission_queue._process_job(job)

            assert job.status == JobStatus.COMPLETED
            res = job.result
            assert res["verdict"] == "Accepted"
            assert res["total_count"] == total_expected
            assert res["passed_count"] == total_expected
            mock_progress.assert_called_once_with("prod_user", 1)

            # SECURITY: Verify hidden test masking
            assert res["stderr"] is None, "stderr must be masked on submit to prevent exfiltration"
            tc_results = res["test_cases"]
            assert len(tc_results) == total_expected

            n_samples = len(q_data["sampleTests"])
            for i, tc in enumerate(tc_results):
                if i < n_samples:
                    assert tc["is_hidden"] is False
                    assert tc["input"] is not None
                    assert tc["expected"] is not None
                else:
                    assert tc["is_hidden"] is True
                    assert tc.get("input") is None, "Hidden test input must never be exposed"
                    assert tc.get("expected") is None, "Hidden test expected must never be exposed"
                    assert tc.get("actual") is None, "Hidden test actual must never be exposed"

    asyncio.run(_run())


# ── 6. Incorrect Solution Rejection ───────────────────────────────────────────

def test_incorrect_solution_produces_wrong_answer_and_blocks_progress(monkeypatch):
    """An incorrect solution produces Wrong Answer and never updates user progress."""
    async def _run():
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        local_hidden_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "data", "hidden_test_cases.json")
        )
        monkeypatch.setattr(settings, "hidden_tests_path", local_hidden_path)
        reset_test_data_cache()

        job = SubmissionJob(
            job_id="test-job-wrong-answer",
            uid="prod_user",
            question_id=1,
            language_id=71,
            execution_type="submit",
            source_code="class Solution: def twoSum(self, nums, target): return [99, 99]",
        )

        mock_judge_result = {
            "verdict": "Wrong Answer",
            "status_id": 3,
            "time": 0.05,
            "memory": 1024,
            "stdout": "wrong outputs",
            "compile_output": None,
            "stderr": None,
        }

        with patch("app.services.judge0_service.execute", new_callable=AsyncMock, return_value=mock_judge_result), \
             patch("app.routes.submissions.prepare_dsa_source", return_value=("mock_code", True)), \
             patch("app.routes.submissions.parse_test_outputs", return_value=["99 99"] * 5), \
             patch("app.services.submission_queue._record_submission_sync"), \
             patch("app.services.submission_queue._update_progress_sync") as mock_progress:

            await submission_queue._process_job(job)

            assert job.status == JobStatus.COMPLETED
            assert job.result["verdict"] == "Wrong Answer"
            mock_progress.assert_not_called()

    asyncio.run(_run())


# ── 7. Public Sample Tests Endpoint Privacy ───────────────────────────────────

def test_public_sample_tests_endpoint_never_exposes_hidden_tests():
    """_get_question_test_data must return only public sample tests, with hiddenTests empty."""
    for qid in [1, 25, 50, 75, 100, 150, 174]:
        q = _get_question_test_data(qid)
        assert q is not None
        assert len(q["sampleTests"]) >= 1
        assert q["hiddenTests"] == [], f"Question {qid} exposed hidden tests through public accessor"


# ── 8. Hidden Suite Full 174 Question Coverage & Integrity ────────────────────

def test_authoritative_hidden_suite_covers_all_174_questions():
    """Verify that backend/data/hidden_test_cases.json covers all 174 questions with valid schema."""
    hidden_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "data", "hidden_test_cases.json")
    )
    assert os.path.isfile(hidden_path), "hidden_test_cases.json missing from data directory"

    with open(hidden_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert len(data) == 174, f"Expected 174 questions, got {len(data)}"
    total_tests = 0
    for qid_int in range(1, 175):
        qid = str(qid_int)
        assert qid in data, f"Question {qid} missing from hidden test suite"
        tests = data[qid]
        assert isinstance(tests, list), f"Q{qid} tests must be a list"
        assert len(tests) >= 3, f"Q{qid} has fewer than 3 hidden tests"
        total_tests += len(tests)
        for i, tc in enumerate(tests):
            assert "stdin" in tc, f"Q{qid} test {i} missing stdin"
            assert "expectedRaw" in tc, f"Q{qid} test {i} missing expectedRaw"
            assert tc["stdin"].endswith("\n"), f"Q{qid} test {i} stdin should end with newline"
    assert total_tests >= 174 * 3, f"Expected at least 522 hidden tests, got {total_tests}"


# ── 9. Zero Public/Hidden Overlap & Disjoint Guarantee ────────────────────────

def test_zero_public_sample_and_hidden_test_overlaps():
    """Verify strictly 0 overlaps between public sample test inputs and private hidden inputs."""
    sample_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "sample_test_cases.json"))
    hidden_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "hidden_test_cases.json"))

    with open(sample_path, "r", encoding="utf-8") as f:
        sample_data = json.load(f)
    with open(hidden_path, "r", encoding="utf-8") as f:
        hidden_data = json.load(f)

    overlaps = []
    internal_dups = []
    for qid in sample_data:
        s_stdins = {tc["stdin"].strip() for tc in sample_data[qid].get("sampleTests", [])}
        h_cases = hidden_data.get(qid, [])
        h_stdins = [tc["stdin"].strip() for tc in h_cases]

        # Check internal uniqueness
        if len(set(h_stdins)) != len(h_stdins):
            internal_dups.append(qid)

        # Check zero overlap with public sample tests
        for i, h_tc in enumerate(h_cases):
            if h_tc["stdin"].strip() in s_stdins:
                overlaps.append((qid, i, h_tc["stdin"].strip()))

    assert internal_dups == [], f"Questions with internal duplicate hidden tests: {internal_dups}"
    assert overlaps == [], f"Overlaps between public sample and hidden tests found: {overlaps}"


# ── 10. Comparator Robustness: Course Schedule II Rejecting Invalid Orders ────

def test_comparator_rejects_invalid_topological_sort_in_course_schedule():
    """Verify that any_of comparison accepts valid orders and strictly rejects invalid topological permutations."""
    from app.routes.submissions import _compare
    expected_orders = "0 2 1 3 | 0 1 2 3"

    # Valid topological orders
    assert _compare("0 2 1 3", expected_orders, "any_of") is True
    assert _compare("0 1 2 3", expected_orders, "any_of") is True

    # Invalid orders (prerequisite violations or reversed cycles)
    assert _compare("3 2 1 0", expected_orders, "any_of") is False
    assert _compare("1 0 3 2", expected_orders, "any_of") is False
    assert _compare("2 3 0 1", expected_orders, "any_of") is False


# ── 11. Startup Validation & Fail-Closed Diagnostics ─────────────────────────

def test_validate_hidden_tests_on_startup_success(monkeypatch):
    """Startup validation succeeds and reports correct problem & test counts."""
    local_hidden_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "data", "hidden_test_cases.json")
    )
    monkeypatch.setattr(settings, "allow_sample_only_grading", False)
    monkeypatch.setattr(settings, "hidden_tests_path", local_hidden_path)
    reset_test_data_cache()

    info = validate_hidden_tests_on_startup()
    assert info["status"] == "ok"
    assert info["problems_loaded"] == 174
    assert info["total_tests"] == 4318


def test_validate_hidden_tests_on_startup_missing_fails_closed(monkeypatch):
    """Startup validation detects missing hidden suite in production and returns error without crashing."""
    monkeypatch.setattr(settings, "allow_sample_only_grading", False)
    monkeypatch.setattr(settings, "hidden_tests_path", "/nonexistent/test/path.json")
    reset_test_data_cache()

    info = validate_hidden_tests_on_startup()
    assert info["status"] == "error"
    assert "Private hidden test suite is not configured or missing" in info["error"]


def test_validate_hidden_tests_on_startup_malformed_fails_closed(monkeypatch):
    """Startup validation detects malformed hidden test JSON in production and returns error without crashing."""
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        f.write("{ invalid json corrupted ...")
        temp_path = f.name

    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        info = validate_hidden_tests_on_startup()
        assert info["status"] == "error"
        assert "Malformed private hidden test file" in info["error"]
    finally:
        os.remove(temp_path)


def test_validate_hidden_tests_on_startup_sample_only_mode(monkeypatch):
    """Startup validation notes sample-only development mode without error."""
    monkeypatch.setattr(settings, "allow_sample_only_grading", True)
    monkeypatch.setattr(settings, "hidden_tests_path", "/nonexistent/test/path.json")
    reset_test_data_cache()

    info = validate_hidden_tests_on_startup()
    assert info["status"] == "sample_only"


# ── 12. Defensive Zero Active Tests Handling ──────────────────────────────────

def test_empty_active_tests_cannot_produce_accepted(monkeypatch):
    """If a question has 0 active tests (e.g. malformed metadata), it must never produce Accepted."""
    async def _run():
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        reset_test_data_cache()

        job = SubmissionJob(
            job_id="test-job-empty-tests",
            uid="user_edge",
            question_id=1,
            language_id=71,
            execution_type="submit",
            source_code="class Solution: pass",
        )

        mock_judge_result = {
            "verdict": "Accepted",
            "status_id": 3,
            "time": 0.01,
            "memory": 1024,
            "stdout": "",
            "compile_output": None,
            "stderr": None,
        }

        # Mock question data to have 0 tests
        mock_q_data = {
            "id": 1,
            "title": "Edge Case",
            "sampleTests": [],
            "hiddenTests": [],
            "compareMode": "ordered",
        }

        with patch("app.routes.submissions.get_question_submission_data", return_value=(mock_q_data, None, False)), \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock, return_value=mock_judge_result), \
             patch("app.routes.submissions.prepare_dsa_source", return_value=("mock_code", True)), \
             patch("app.routes.submissions.parse_test_outputs", return_value=[]), \
             patch("app.services.submission_queue._record_submission_sync"), \
             patch("app.services.submission_queue._update_progress_sync") as mock_progress:

            await submission_queue._process_job(job)

            assert job.status == JobStatus.COMPLETED
            assert job.result is not None
            # With 0 tests, verdict must NOT be Accepted
            assert job.result["verdict"] != "Accepted"
            mock_progress.assert_not_called()

    asyncio.run(_run())


# ── 13. Strict Structural Dataset Validation & Fail-Closed Behavior ───────────

def _load_real_hidden_data():
    local_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "data", "hidden_test_cases.json")
    )
    with open(local_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_validate_hidden_tests_on_startup_missing_problem_ids_rejected(monkeypatch):
    """Startup validation rejects dataset missing required problem IDs 1-174 and fails closed."""
    data = {"1": [{"stdin": "5\n", "expectedRaw": "5"}]}
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        json.dump(data, f)
        temp_path = f.name
    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        info = validate_hidden_tests_on_startup()
        assert info["status"] == "error"
        assert "missing required problem ID" in info["error"]

        # Verify production submission fails closed
        q_data, err, is_sample_only = get_question_submission_data(1)
        assert q_data is None
        assert "Invalid private hidden test suite structure" in err
    finally:
        os.remove(temp_path)


def test_validate_hidden_tests_on_startup_non_list_tests_rejected(monkeypatch):
    """Startup validation rejects dataset where a problem's hidden tests is not a list."""
    real_data = _load_real_hidden_data()
    real_data["1"] = {"not": "a list"}
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        json.dump(real_data, f)
        temp_path = f.name
    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        info = validate_hidden_tests_on_startup()
        assert info["status"] == "error"
        assert "Problem 1 hidden tests must be a list" in info["error"]
    finally:
        os.remove(temp_path)


def test_validate_hidden_tests_on_startup_missing_stdin_or_expected_raw_rejected(monkeypatch):
    """Startup validation rejects dataset if any test entry is missing string stdin or expectedRaw."""
    real_data = _load_real_hidden_data()
    del real_data["1"][0]["stdin"]
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        json.dump(real_data, f)
        temp_path = f.name
    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        info = validate_hidden_tests_on_startup()
        assert info["status"] == "error"
        assert "Problem 1 test case 0 is missing a string 'stdin'" in info["error"]
    finally:
        os.remove(temp_path)

    real_data2 = _load_real_hidden_data()
    del real_data2["1"][0]["expectedRaw"]
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        json.dump(real_data2, f)
        temp_path = f.name
    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        info = validate_hidden_tests_on_startup()
        assert info["status"] == "error"
        assert "Problem 1 test case 0 is missing a valid string 'expectedRaw'" in info["error"]
    finally:
        os.remove(temp_path)


def test_validate_hidden_tests_on_startup_test_count_mismatch_rejected(monkeypatch):
    """Startup validation rejects dataset if test counts do not match 25 per standard, 11 for Q161, 7 for Q169."""
    # Standard problem count mismatch (24 instead of 25)
    real_data = _load_real_hidden_data()
    real_data["1"] = real_data["1"][:-1]
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        json.dump(real_data, f)
        temp_path = f.name
    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        info = validate_hidden_tests_on_startup()
        assert info["status"] == "error"
        assert "Problem 1 has 24 hidden tests, expected 25" in info["error"]
    finally:
        os.remove(temp_path)

    # Q161 mismatch (10 instead of 11)
    real_data161 = _load_real_hidden_data()
    real_data161["161"] = real_data161["161"][:-1]
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        json.dump(real_data161, f)
        temp_path = f.name
    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        info = validate_hidden_tests_on_startup()
        assert info["status"] == "error"
        assert "Problem 161 has 10 hidden tests, expected 11" in info["error"]
    finally:
        os.remove(temp_path)

    # Q169 mismatch (6 instead of 7)
    real_data169 = _load_real_hidden_data()
    real_data169["169"] = real_data169["169"][:-1]
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        json.dump(real_data169, f)
        temp_path = f.name
    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        info = validate_hidden_tests_on_startup()
        assert info["status"] == "error"
        assert "Problem 169 has 6 hidden tests, expected 7" in info["error"]
    finally:
        os.remove(temp_path)

    # Zero hidden tests
    real_data_zero = _load_real_hidden_data()
    real_data_zero["1"] = []
    with tempfile.NamedTemporaryFile("w", delete=False, suffix=".json") as f:
        json.dump(real_data_zero, f)
        temp_path = f.name
    try:
        monkeypatch.setattr(settings, "allow_sample_only_grading", False)
        monkeypatch.setattr(settings, "hidden_tests_path", temp_path)
        reset_test_data_cache()

        info = validate_hidden_tests_on_startup()
        assert info["status"] == "error"
        assert "Problem 1 has zero hidden tests" in info["error"]
    finally:
        os.remove(temp_path)



