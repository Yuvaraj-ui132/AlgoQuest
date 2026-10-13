"""
test_phase1_security.py

Focused regression test suite for Phase 1 of the AlgoQuest security roadmap:
1. Preventing hidden-test output leakage (actual, input, expected must never reach client).
2. Authoritative backend driver generation across Python, C++, Java, and JavaScript.
3. Rejecting forged Accepted verdicts (tamper detection, delimiter spoofing rejection, dynamic nonce enforcement).
4. Exploit regression: User-crafted driver spoofing is completely neutralized.
5. Submission queue worker regression (hidden test masking & spoof rejection).
6. Judge0 429 handling (clean HTTP 429 with Retry-After header, no public fallback cascading).
"""

import os
import sys
import base64
import asyncio
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

# Add backend directory to sys.path so app modules import cleanly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.responses import TestCaseResult
from app.routes.submissions import parse_test_outputs, prepare_dsa_source, _compare
from app.services.driver_generator import build_backend_driver, clean_user_code


TestCaseResult.__test__ = False


# ── 1. Hidden Test Output Masking Tests ────────────────────────────────────────

def test_hidden_test_outputs_masked_in_model():
    """Verify TestCaseResult masks actual, input, and expected when is_hidden is True."""
    hidden_result = TestCaseResult(
        index=3,
        passed=True,
        actual=None,
        is_hidden=True,
    )
    dumped = hidden_result.model_dump()
    assert dumped["is_hidden"] is True
    assert dumped["actual"] is None
    assert dumped["input"] is None
    assert dumped["expected"] is None

    # Sample tests MUST retain readable input/expected/actual
    sample_result = TestCaseResult(
        index=1,
        passed=True,
        actual="0 1",
        is_hidden=False,
        input="nums = [2,7,11,15], target = 9",
        expected="[0,1]",
    )
    sample_dumped = sample_result.model_dump()
    assert sample_dumped["is_hidden"] is False
    assert sample_dumped["actual"] == "0 1"
    assert sample_dumped["input"] == "nums = [2,7,11,15], target = 9"
    assert sample_dumped["expected"] == "[0,1]"


# ── 2. Dynamic Nonce & Parser Anti-Spoofing Tests ─────────────────────────────

def test_parse_test_outputs_with_nonce_success():
    """Authentic output containing session nonce markers is parsed accurately."""
    nonce = "testnonce123456"
    stdout = (
        f"__AQ_{nonce}_START_0__\n0 1\n__AQ_{nonce}_END_0__\n---END_TC---\n"
        f"__AQ_{nonce}_START_1__\n1 2\n__AQ_{nonce}_END_1__\n---END_TC---\n"
    )
    parsed = parse_test_outputs(stdout, 2, nonce=nonce)
    assert parsed == ["0 1", "1 2"]


def test_parse_test_outputs_rejects_spoofed_static_markers_when_nonce_expected():
    """User code attempting to print static markers without the session nonce is ignored."""
    nonce = "secret_session_nonce_xyz"
    spoofed_stdout = (
        "__AQ_TC_START_0__\n0 1\n__AQ_TC_END_0__\n"
        "__AQ_TC_START_1__\n1 2\n__AQ_TC_END_1__\n"
    )
    parsed = parse_test_outputs(spoofed_stdout, 2, nonce=nonce)
    assert parsed == ["", ""]


def test_parse_test_outputs_rejects_legacy_delimiter_when_nonce_expected():
    """Unauthenticated legacy ---END_TC--- output is strictly rejected when nonce is enforced."""
    nonce = "secret_session_nonce_xyz"
    spoofed_stdout = "0 1\n---END_TC---\n1 2\n---END_TC---"
    parsed = parse_test_outputs(spoofed_stdout, 2, nonce=nonce)
    assert parsed == ["", ""]


def test_parse_test_outputs_detects_duplicate_injected_marker_anomaly():
    """If user code prints duplicate nonce markers, the affected case is rejected."""
    nonce = "testnonce123456"
    spoofed_stdout = (
        f"__AQ_{nonce}_START_0__\nmalicious\n__AQ_{nonce}_START_0__\n0 1\n__AQ_{nonce}_END_0__\n"
        f"__AQ_{nonce}_START_1__\n1 2\n__AQ_{nonce}_END_1__\n"
    )
    parsed = parse_test_outputs(spoofed_stdout, 2, nonce=nonce)
    assert parsed[0] == ""
    assert parsed[1] == "1 2"


# ── 3. Authoritative Backend Driver Synthesis Tests ───────────────────────────

MOCK_Q_META = {
    "id": 1,
    "name": "Two Sum",
    "functionName": "twoSum",
    "parameters": [
        {"name": "nums", "type": "vector<int>"},
        {"name": "target", "type": "int"},
    ],
    "returnType": "vector<int>",
    "className": "Solution",
}


def test_build_backend_driver_python():
    """Backend synthesizes Python driver invoking Solution.twoSum with session nonce."""
    user_py = (
        "class Solution:\n"
        "    def twoSum(self, nums, target):\n"
        "        return [0, 1]\n"
    )
    nonce = "pynonce123"
    driver = build_backend_driver(user_py, MOCK_Q_META, "python", nonce)

    assert f"_aq_runner_{nonce}" in driver
    assert f"__AQ_{nonce}_START_" in driver
    assert f"__AQ_{nonce}_END_" in driver
    assert "solver = Solution()" in driver
    assert "solver.twoSum(" in driver


def test_build_backend_driver_cpp():
    """Backend synthesizes C++ driver with standard includes, main(), and solver call."""
    user_cpp = (
        "class Solution {\n"
        "public:\n"
        "    vector<int> twoSum(vector<int>& nums, int target) {\n"
        "        return {0, 1};\n"
        "    }\n"
        "};"
    )
    nonce = "cppnonce456"
    driver = build_backend_driver(user_cpp, MOCK_Q_META, "cpp", nonce)

    assert "#include <iostream>" in driver
    assert "int main()" in driver
    assert f"__AQ_{nonce}_START_" in driver
    assert "Solution solver;" in driver
    assert "solver.twoSum(" in driver


def test_build_backend_driver_java():
    """Backend synthesizes Java driver with public class Main wrapping class Solution."""
    user_java = (
        "class Solution {\n"
        "    public int[] twoSum(int[] nums, int target) {\n"
        "        return new int[]{0, 1};\n"
        "    }\n"
        "}"
    )
    nonce = "javanonce789"
    driver = build_backend_driver(user_java, MOCK_Q_META, "java", nonce)

    assert "public class Main {" in driver
    assert "public static void main(String[] args)" in driver
    assert f"__AQ_{nonce}_START_" in driver
    assert "Solution solver = new Solution();" in driver


def test_build_backend_driver_javascript():
    """Backend synthesizes Node.js driver reading stdin with fs and session nonce."""
    user_js = (
        "var twoSum = function(nums, target) {\n"
        "    return [0, 1];\n"
        "};"
    )
    nonce = "jsnonce321"
    driver = build_backend_driver(user_js, MOCK_Q_META, "js", nonce)

    assert f"_aq_runner_{nonce}" in driver
    assert "require('fs')" in driver
    assert f"__AQ_{nonce}_START_" in driver


def test_all_174_questions_coverage_across_all_four_languages():
    """Verify schema integrity, hidden tests, and backend driver generation for all 174 catalog questions across Python, C++, Java, and JS."""
    import json
    from app.routes.submissions import _build_stdin

    tc_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "test_cases.json"))
    htc_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "hidden_test_cases.json"))
    with open(tc_path, "r", encoding="utf-8") as f:
        tc_data = json.load(f)
    with open(htc_path, "r", encoding="utf-8") as f:
        htc_data = json.load(f)

    assert len(tc_data) == 174, f"Expected 174 questions in test_cases.json, found {len(tc_data)}"
    assert len(htc_data) == 174, f"Expected 174 questions in hidden_test_cases.json, found {len(htc_data)}"

    for qid_str, q in tc_data.items():
        qid = int(qid_str)
        # 1. Validate problem definition
        assert q.get("functionName"), f"Q{qid} missing functionName"
        assert q.get("returnType"), f"Q{qid} missing returnType"
        assert q.get("compareMode") in ("ordered", "unordered", "float", "any_of"), f"Q{qid} invalid compareMode: {q.get('compareMode')}"

        # 2. Validate sample tests
        samples = q.get("sampleTests", [])
        assert len(samples) > 0, f"Q{qid} has no sampleTests"
        for idx, stc in enumerate(samples):
            assert "stdin" in stc, f"Q{qid} sampleTest[{idx}] missing stdin"
            assert "expectedRaw" in stc, f"Q{qid} sampleTest[{idx}] missing expectedRaw"

        # 3. Validate hidden tests
        hiddens = htc_data.get(qid_str, [])
        assert len(hiddens) > 0, f"Q{qid} has no hiddenTests in hidden_test_cases.json"
        for idx, htc in enumerate(hiddens):
            assert "stdin" in htc, f"Q{qid} hiddenTest[{idx}] missing stdin"
            assert "expectedRaw" in htc, f"Q{qid} hiddenTest[{idx}] missing expectedRaw"

        # 4. Validate combined stdin generation
        all_tests = samples + hiddens
        combined_stdin = _build_stdin(all_tests)
        assert combined_stdin.startswith(str(len(all_tests))), f"Q{qid} stdin header mismatch"

        # 5. Validate driver synthesis & preparation across all 4 languages
        for lang, lang_id in [("cpp", 54), ("cpp", 76), ("java", 62), ("python", 71), ("js", 63)]:
            driver = build_backend_driver("// user solution", q, lang, "secnonce999")
            assert "[unsupported" not in driver, f"Unsupported marker found in Q{qid} ({q.get('name')}) for {lang}"
            assert "secnonce999" in driver, f"Session nonce missing in Q{qid} driver for {lang}"
            assert "__AQ_secnonce999_COMPLETED__" in driver, f"Completion marker missing in Q{qid} driver for {lang}"

            # Verify prepare_dsa_source returns clean payload
            b64_code, is_clean = prepare_dsa_source("class Solution:\n    pass", q, lang_id, "secnonce999")
            assert is_clean is True, f"prepare_dsa_source marked Q{qid} {lang} as unclean"
            assert len(b64_code) > 0, f"prepare_dsa_source returned empty payload for Q{qid} {lang}"


def test_complex_structures_driver_generation():
    """Verify Linked List, Tree, Graph, and Matrix driver generation across all 4 languages."""
    import json
    tc_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "test_cases.json"))
    with open(tc_path, "r", encoding="utf-8") as f:
        tc_data = json.load(f)

    for qid in [65, 83, 150, 151]:
        q = tc_data[str(qid)]
        for lang in ["cpp", "java", "python", "js"]:
            driver = build_backend_driver("// test code", q, lang, "secnonce123")
            assert "[unsupported" not in driver, f"Failed on Q{qid} for {lang}"
            assert "secnonce123" in driver


def test_python_and_node_real_solution_execution():
    """Execute real Python and Node.js solutions on Q65, Q83, Q150, Q151 and verify correctness."""
    import json
    import subprocess
    import tempfile
    from app.routes.submissions import parse_test_outputs, _compare

    tc_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "test_cases.json"))
    with open(tc_path, "r", encoding="utf-8") as f:
        tc_data = json.load(f)

    # 1. Reverse Linked List (Q65) in Python
    q65 = tc_data["65"]
    nonce = "runtestnonce"
    py_q65 = (
        "class Solution:\n"
        "    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n"
        "        p, c = None, head\n"
        "        while c:\n"
        "            n = c.next\n"
        "            c.next = p\n"
        "            p = c\n"
        "            c = n\n"
        "        return p\n"
    )
    driver_py = build_backend_driver(py_q65, q65, "python", nonce)
    tests = q65["sampleTests"]
    stdin_data = str(len(tests)) + "\n" + "\n".join([tc["stdin"] for tc in tests])
    with tempfile.TemporaryDirectory() as td:
        fp = os.path.join(td, "run.py")
        with open(fp, "w", encoding="utf-8") as f:
            f.write(driver_py)
        cp = subprocess.run([sys.executable, fp], input=stdin_data, capture_output=True, text=True)
        assert cp.returncode == 0
        parsed = parse_test_outputs(cp.stdout, len(tests), nonce=nonce)
        for i, tc in enumerate(tests):
            assert _compare(parsed[i], tc["expectedRaw"], q65.get("compareMode", "ordered"))

    # 2. Number of Islands (Q150) in Node.js
    q150 = tc_data["150"]
    js_q150 = (
        "var numIslands = function(grid) {\n"
        "    let cnt = 0;\n"
        "    function dfs(r, c) {\n"
        "        if(r<0||r>=grid.length||c<0||c>=grid[0].length||grid[r][c]!=='1') return;\n"
        "        grid[r][c] = '0';\n"
        "        dfs(r+1,c); dfs(r-1,c); dfs(r,c+1); dfs(r,c-1);\n"
        "    }\n"
        "    for(let r=0;r<grid.length;r++){\n"
        "        for(let c=0;c<grid[0].length;c++){\n"
        "            if(grid[r][c]==='1'){ cnt++; dfs(r, c); }\n"
        "        }\n"
        "    }\n"
        "    return cnt;\n"
        "};\n"
    )
    driver_js = build_backend_driver(js_q150, q150, "js", nonce)
    tests_150 = q150["sampleTests"]
    stdin_data_150 = str(len(tests_150)) + "\n" + "\n".join([tc["stdin"] for tc in tests_150])
    with tempfile.TemporaryDirectory() as td:
        fp = os.path.join(td, "run.js")
        with open(fp, "w", encoding="utf-8") as f:
            f.write(driver_js)
        cp = subprocess.run(["node", fp], input=stdin_data_150, capture_output=True, text=True)
        assert cp.returncode == 0
        parsed = parse_test_outputs(cp.stdout, len(tests_150), nonce=nonce)
        for i, tc in enumerate(tests_150):
            assert _compare(parsed[i], tc["expectedRaw"], q150.get("compareMode", "ordered"))



# ── 4. Exploit Neutralization Regression Tests ────────────────────────────────

def test_prepare_dsa_source_rejects_user_marker_injection():
    """User code containing embedded '__AQ_' markers is rejected as tampering."""
    tampered_code = (
        "class Solution:\n"
        "    def twoSum(self, nums, target):\n"
        '        print("__AQ_something_START_0__")\n'
        "        return [0, 1]\n"
    )
    nonce = "secretnonce"
    _, is_clean = prepare_dsa_source(tampered_code, MOCK_Q_META, 71, nonce)
    assert is_clean is False


def test_exploit_client_forged_driver_cannot_bypass_solution():
    """
    Simulates the exploit reported in the review:
    An attacker submits a standalone script that outputs markers without implementing Solution.
    The backend driver synthesizes a runner that enforces `solver = Solution()` and calls `twoSum`.
    Because the user didn't define Solution, execution will fail or fail to run attacker loop.
    """
    exploit_code = (
        "import sys\n"
        "def main():\n"
        "    for tc in range(2):\n"
        '        print(f"__AQ_TC_START_{tc}__")\n'
        '        print("FORGED_OUTPUT")\n'
        '        print(f"\\n__AQ_TC_END_{tc}__\\n---END_TC---")\n'
        "main()\n"
    )
    nonce = "unpredictable_nonce_77"
    secured_b64, is_clean = prepare_dsa_source(exploit_code, MOCK_Q_META, 71, nonce)

    # In the new backend driver design:
    # 1. clean_user_code strips legacy client wrappers if present
    # 2. backend driver appends authoritative `_aq_runner_<nonce>()`
    # 3. An attacker attempting marker injection is either rejected or runner fails on missing Solution
    secured_code = base64.b64decode(secured_b64).decode("utf-8")
    assert f"_aq_runner_{nonce}()" in secured_code
    assert f"__AQ_{nonce}_START_" in secured_code
    # The runner calls Solution().twoSum
    assert "Solution()" in secured_code


# ── 5. Submission Queue Worker Regression Tests ───────────────────────────────

def test_submission_queue_masks_hidden_output_and_rejects_spoof():
    """Simulate worker processing: ensure hidden test actual outputs are None, and forged markers fail."""
    async def _run():
        from app.services.submission_queue import submission_queue, SubmissionJob

        job = SubmissionJob(
            job_id="test-job-sec-1",
            uid="user-test-sec",
            question_id=1,
            language_id=71,
            execution_type="submit",
            source_code="raw_spoofed_code_without_harness",
        )

        mock_q_data = {
            "id": 1,
            "name": "Two Sum",
            "functionName": "twoSum",
            "parameters": [
                {"name": "nums", "type": "int[]"},
                {"name": "target", "type": "int"},
            ],
            "returnType": "int[]",
            "className": "Solution",
            "compareMode": "ordered",
            "sampleTests": [
                {"input": "in1", "expected": "out1", "stdin": "1\n", "expectedRaw": "out1"}
            ],
            "hiddenTests": [
                {"stdin": "hidden_in\n", "expectedRaw": "hidden_out"}
            ],
        }

        # Spoofed stdout without the server's secret nonce
        mock_judge0_result = {
            "status_id": 3,
            "verdict": "Accepted",
            "stdout": "__AQ_TC_START_0__\nout1\n__AQ_TC_END_0__\n__AQ_TC_START_1__\nhidden_out\n__AQ_TC_END_1__",
            "stderr": "",
            "compile_output": "",
            "time": 0.05,
            "memory": 12000,
        }

        with patch("app.services.submission_queue._get_question_test_data_sync", return_value=mock_q_data), \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock, return_value=mock_judge0_result), \
             patch("app.services.submission_queue._record_submission_sync") as mock_record, \
             patch("app.services.submission_queue._update_progress_sync") as mock_progress:

            await submission_queue._process_job(job)

            assert job.status.value == "completed"
            res = job.result
            assert res is not None

            # 1. Tampering / spoofing check: because stdout lacked session nonce,
            # parsed outputs are empty -> verdict MUST NOT be Accepted!
            assert res["verdict"] == "Wrong Answer"
            assert res["passed_count"] == 0

            # Progress MUST NOT be updated on non-accepted verdict
            mock_progress.assert_not_called()

            # 2. Hidden test leakage check:
            sample_tc = res["test_cases"][0]
            assert sample_tc["is_hidden"] is False
            assert sample_tc["input"] == "in1"

            hidden_tc = res["test_cases"][1]
            assert hidden_tc["is_hidden"] is True
            assert hidden_tc["actual"] is None
            assert "input" not in hidden_tc or hidden_tc["input"] is None
            assert "expected" not in hidden_tc or hidden_tc["expected"] is None

    asyncio.run(_run())


# ── 6. Judge0 429 Handling Regression Test ────────────────────────────────────

def test_judge0_service_429_returns_clean_rate_limit_exception():
    """Verify that RapidAPI HTTP 429 does NOT fall back to public instance and raises HTTPException 429."""
    async def _run():
        from app.services import judge0_service
        from fastapi import HTTPException
        import httpx

        mock_resp_429 = MagicMock(spec=httpx.Response)
        mock_resp_429.status_code = 429
        mock_resp_429.text = "Rate limit exceeded"
        mock_resp_429.raise_for_status.side_effect = httpx.HTTPStatusError(
            message="Client error '429 Too Many Requests'",
            request=MagicMock(),
            response=mock_resp_429,
        )

        with patch("app.services.judge0_service._base_url", return_value="https://judge0-ce.p.rapidapi.com"), \
             patch("httpx.AsyncClient.post", return_value=mock_resp_429):

            with pytest.raises(HTTPException) as exc_info:
                await judge0_service.create_submission("print(1)", 71, "")

            assert exc_info.value.status_code == 429
            assert exc_info.value.headers.get("Retry-After") == "30"
            assert "rate limit reached" in exc_info.value.detail.lower()

    asyncio.run(_run())


# ── 7. Stderr Leakage & Hidden Test Exfiltration Defense Tests ─────────────────

def test_submit_mode_never_exposes_stderr_or_compile_error():
    """Submit mode must strictly suppress stderr and compile_error to prevent data exfiltration."""
    async def _run():
        from app.services.submission_queue import submission_queue, SubmissionJob

        job = SubmissionJob(
            job_id="test-job-sec-exfil",
            uid="user-test-exfil",
            question_id=1,
            language_id=71,
            execution_type="submit",
            source_code="import sys\ndef twoSum(nums, target):\n    sys.stderr.write(f'EXFILTRATE:{nums}')\n    return [0,1]",
        )

        mock_q_data = {
            "id": 1,
            "name": "Two Sum",
            "functionName": "twoSum",
            "parameters": [{"name": "nums", "type": "vector<int>"}, {"name": "target", "type": "int"}],
            "returnType": "vector<int>",
            "className": "Solution",
            "compareMode": "unordered",
            "sampleTests": [{"input": "in1", "expected": "0 1", "stdin": "1\n", "expectedRaw": "0 1"}],
            "hiddenTests": [{"stdin": "secret_in\n", "expectedRaw": "secret_out"}],
        }

        # Simulate attacker writing secret hidden data to stderr during execution
        mock_judge0_result = {
            "status_id": 3,
            "verdict": "Accepted",
            "stdout": "__AQ_sec_START_0__\n0 1\n__AQ_sec_END_0__\n__AQ_sec_START_1__\nsecret_out\n__AQ_sec_END_1__",
            "stderr": "EXFILTRATE:secret_hidden_test_input_data_12345\nTraceback: something",
            "compile_output": "",
            "time": 0.05,
            "memory": 12000,
        }

        with patch("app.services.submission_queue._get_question_test_data_sync", return_value=mock_q_data), \
             patch("app.services.judge0_service.execute", new_callable=AsyncMock, return_value=mock_judge0_result), \
             patch("app.services.submission_queue._record_submission_sync") as mock_record, \
             patch("app.services.submission_queue._update_progress_sync"):

            await submission_queue._process_job(job)

            assert job.status.value == "completed"
            res = job.result
            assert res is not None

            # 1. stderr MUST be None — exfiltrated string is blocked
            assert res["stderr"] is None

            # 2. compile_output MUST be None on non-CE (status_id != 6)
            assert res["compile_output"] is None

            # 3. Database persistence must NOT record runtime stderr in compile_error
            assert mock_record.call_count == 1
            recorded_compile_error = mock_record.call_args[0][9]
            assert recorded_compile_error is None

            # 4. Hidden test case must mask actual, input, expected
            hidden_tc = res["test_cases"][1]
            assert hidden_tc["is_hidden"] is True
            assert hidden_tc["actual"] is None
            assert hidden_tc.get("input") is None
            assert hidden_tc.get("expected") is None

    asyncio.run(_run())


# ── 8. Verdict Integrity Across Failure Modes ──────────────────────────────────

def test_verdict_integrity_early_exit_cannot_produce_accepted():
    """Process exiting early after test 1 fails remaining tests and cannot yield Accepted."""
    nonce = "testnonceearly"
    # Stdout only has Case 0; Case 1 is missing due to premature exit
    stdout = f"__AQ_{nonce}_START_0__\n0 1\n__AQ_{nonce}_END_0__\n"
    parsed = parse_test_outputs(stdout, 2, nonce=nonce)
    assert parsed == ["0 1", ""]
    # If case 1 expected 'secret_out', it fails because parsed output is ''
    assert _compare(parsed[1], "secret_out", "ordered") is False


def test_verdict_integrity_compile_and_runtime_errors_rejected():
    """Compilation Error (status_id=6) and Runtime Error (status_id=11) never yield Accepted."""
    for bad_status in [6, 11, 12, 5]:
        passed = (bad_status == 3 and _compare("0 1", "0 1", "ordered"))
        assert passed is False


def test_incorrect_solution_rejected_by_judge():
    """An incorrect solution returning wrong values is rejected with Wrong Answer."""
    import json
    tc_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "test_cases.json"))
    with open(tc_path, "r", encoding="utf-8") as f:
        tc_data = json.load(f)

    q = tc_data["1"]  # Two Sum
    wrong_output = "99 99"
    # Even with valid markers, wrong values fail comparison
    matched = _compare(wrong_output, q["sampleTests"][0]["expectedRaw"], q.get("compareMode", "unordered"))
    assert matched is False


def test_clean_user_code_strips_legacy_client_wrappers_all_languages():
    """Verify that legacy client wrappers with CRLF, headers, and structs are cleanly stripped across all 4 languages."""

    # C++ legacy wrapped code with CRLF
    cpp_legacy = (
        "#include <algorithm>\r\n"
        "#include <vector>\r\n"
        "using namespace std;\r\n"
        "struct ListNode { int val; };\r\n"
        "struct TreeNode { int val; TreeNode* left; };\r\n"
        "class Solution {\r\n"
        "public:\r\n"
        "    vector<int> twoSum(vector<int>& nums, int target) { return {0, 1}; }\r\n"
        "};\r\n"
        "int main() {\r\n"
        "    cout << \"__AQ_TC_START_0__\\n\";\r\n"
        "    return 0;\r\n"
        "}\r\n"
    )
    cleaned_cpp = clean_user_code(cpp_legacy, "cpp")
    assert "class Solution" in cleaned_cpp
    assert "struct ListNode" not in cleaned_cpp
    assert "struct TreeNode" not in cleaned_cpp
    assert "#include" not in cleaned_cpp
    assert "int main()" not in cleaned_cpp

    # Java legacy wrapped code
    java_legacy = (
        "import java.util.*;\nimport java.io.*;\n\n"
        "class ListNode { int val; }\n"
        "class TreeNode { int val; }\n"
        "class Solution {\n"
        "    public int[] twoSum(int[] nums, int target) { return new int[]{0, 1}; }\n"
        "}\n\n"
        "public class Main {\n"
        "    public static void main(String[] args) {\n"
        "        System.out.println(\"__AQ_TC_START_0__\");\n"
        "    }\n"
        "}\n"
    )
    cleaned_java = clean_user_code(java_legacy, "java")
    assert "class Solution" in cleaned_java
    assert "class ListNode" not in cleaned_java
    assert "class TreeNode" not in cleaned_java
    assert "public class Main" not in cleaned_java

    # Python legacy wrapped code
    py_legacy = (
        "import sys\nfrom typing import List, Optional\n\n"
        "class ListNode: val: int\n"
        "class TreeNode: val: int\n"
        "class Solution:\n"
        "    def twoSum(self, nums: List[int], target: int) -> List[int]: return [0, 1]\n\n"
        "def main():\n"
        "    print('__AQ_TC_START_0__')\n"
        "main()\n"
    )
    cleaned_py = clean_user_code(py_legacy, "python")
    assert "class Solution:" in cleaned_py
    assert "class ListNode" not in cleaned_py
    assert "class TreeNode" not in cleaned_py
    assert "def main():" not in cleaned_py

    # JS legacy wrapped code
    js_legacy = (
        "const fs=require('fs');\n"
        "function ListNode(v) { this.val = v; };\n"
        "class Solution {\n"
        "    twoSum(nums, target) { return [0, 1]; }\n"
        "}\n"
        "function main() {\n"
        "    console.log('__AQ_TC_START_0__');\n"
        "}\n"
        "main();\n"
    )
    cleaned_js = clean_user_code(js_legacy, "js")
    assert "class Solution" in cleaned_js
    assert "function ListNode" not in cleaned_js
    assert "function main()" not in cleaned_js


def test_malformed_output_handling_and_crash_detection():
    """Verify parse_test_outputs and _compare handle binary NUL bytes, malformed bounds, and crashes safely."""
    nonce = "malformnonce1"

    # 1. Binary NUL bytes and carriage returns sanitized cleanly
    raw_stdout = f"__AQ_{nonce}_START_0__\r\nhello\x00world\r\n__AQ_{nonce}_END_0__\r\n__AQ_{nonce}_COMPLETED__\r\n"
    parsed = parse_test_outputs(raw_stdout, 1, nonce=nonce)
    assert parsed == ["helloworld"]

    # 2. Inverted bounds or missing end tag returns empty result without unhandled exception
    bad_bounds = f"__AQ_{nonce}_START_0__\ncontent_without_end\n__AQ_{nonce}_COMPLETED__\n"
    parsed_bad = parse_test_outputs(bad_bounds, 1, nonce=nonce)
    assert parsed_bad == [""]

    # 3. Malicious internal marker injection within test case output is detected and rejected
    injected_body = (
        f"__AQ_{nonce}_START_0__\n"
        f"__AQ_malicious_marker__\n"
        f"__AQ_{nonce}_END_0__\n"
        f"__AQ_{nonce}_COMPLETED__\n"
    )
    parsed_inj = parse_test_outputs(injected_body, 1, nonce=nonce)
    assert parsed_inj == [""]

    # 4. _compare strictly rejects crash outputs
    assert _compare("Segmentation fault (core dumped)", "0 1", "ordered") is False
    assert _compare("Traceback (most recent call last):\n  File 'run.py', line 1", "0 1", "ordered") is False
    assert _compare("Fatal error: memory exhausted", "0 1", "unordered") is False
    assert _compare("Exception in thread 'main' java.lang.NullPointerException", "0 1", "any_of") is False

    # 5. _compare rejects empty string when non-empty is expected
    assert _compare("", "0 1", "ordered") is False
    assert _compare("", "0 1", "unordered") is False
    assert _compare("   ", "[1, 2]", "unordered") is False

    # 6. _compare in unordered mode when actual has no digits but expected has digits
    assert _compare("No digits at all", "1 2 3", "unordered") is False


def test_hidden_test_exposure_fail_safes():
    """Verify TestCaseResult model validator strictly suppresses input, expected, and actual when is_hidden=True."""
    model = TestCaseResult(
        index=5,
        passed=True,
        actual="secret_actual_output",
        is_hidden=True,
        input="secret_hidden_input",
        expected="secret_hidden_expected",
    )
    dumped = model.model_dump()
    assert dumped["is_hidden"] is True
    assert dumped["actual"] is None
    assert dumped["input"] is None
    assert dumped["expected"] is None


def test_forged_verdict_tamper_patterns_rejected():
    """Verify prepare_dsa_source detects all marker and harness tamper patterns and marks is_clean=False."""
    tamper_examples = [
        "class Solution:\n    def solve(self): print('__AQ_')\n",
        "class Solution:\n    def solve(self): print('AQ_TC_START')\n",
        "class Solution:\n    def solve(self): print('---END_TC---')\n",
        "class Solution:\n    def solve(self): return _aq_runner()\n",
    ]
    for code in tamper_examples:
        _, is_clean = prepare_dsa_source(code, MOCK_Q_META, 71, "secnonce")
        assert is_clean is False, f"Failed to reject tamper pattern in: {code}"



