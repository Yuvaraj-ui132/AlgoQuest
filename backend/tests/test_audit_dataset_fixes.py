"""
test_audit_dataset_fixes.py

Comprehensive regression test suite verifying the dataset audit fixes for:
- Q37 (Leaders in an Array): Stdin token stream alignment & leaders verification
- Q48 (Valid Palindrome): Stdin token stream alignment & palindrome verdict logic
- Q50 (Reverse Words in a String): string:line underscore whitespace parsing
- Q95 (Binary Tree Right Side View): TreeNode* BFS serialization count alignment

Also verifies representative problems across Strings, Trees, Graphs, Arrays,
Linked Lists, Dynamic Programming, and Recursion, ensuring:
- Valid solutions pass 100% of test cases
- Intentionally buggy solutions fail
- Compare modes ('ordered', 'unordered', 'any_of', 'float') behave correctly
"""

import json
import os
import sys
import secrets
import pytest

from app.services.driver_generator import build_backend_driver
from app.routes.submissions import (
    parse_test_outputs,
    _compare,
    _build_stdin,
    _sanitize_hidden_dataset,
)
from scripts.private_solvers.part1 import PART1_SOLVERS
from scripts.private_solvers.part2 import PART2_SOLVERS
from scripts.private_solvers.part3 import PART3_SOLVERS
from scripts.private_solvers.part4 import PART4_SOLVERS

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
SAMPLE_FILE = os.path.join(DATA_DIR, "sample_test_cases.json")
HIDDEN_FILE = os.path.join(DATA_DIR, "hidden_test_cases.json")

ALL_SOLVERS = {}
ALL_SOLVERS.update(PART1_SOLVERS)
ALL_SOLVERS.update(PART2_SOLVERS)
ALL_SOLVERS.update(PART3_SOLVERS)
ALL_SOLVERS.update(PART4_SOLVERS)


@pytest.fixture(scope="module")
def dataset():
    with open(SAMPLE_FILE, "r", encoding="utf-8") as f:
        samples = json.load(f)
    with open(HIDDEN_FILE, "r", encoding="utf-8") as f:
        hidden = json.load(f)
    _sanitize_hidden_dataset(hidden)
    return {"samples": samples, "hidden": hidden}


def _is_ci_mock(dataset):
    h = dataset["hidden"].get("1", [])
    return bool(h and h[0].get("stdin", "").startswith("ci_in_"))


def _run_solver(qmeta, tcs, solver_code):
    nonce = secrets.token_hex(8)
    driver = build_backend_driver(solver_code, qmeta, "python", nonce)
    stdin_str = _build_stdin(tcs)

    # Execute locally in python
    import subprocess
    proc = subprocess.run(
        [sys.executable, "-c", driver],
        input=stdin_str,
        capture_output=True,
        text=True,
        timeout=10,
    )
    assert proc.returncode == 0, f"Driver execution crashed: {proc.stderr}"
    outputs = parse_test_outputs(proc.stdout, len(tcs), nonce)
    return outputs


@pytest.mark.parametrize("qid", [37, 48, 50, 95])
def test_audited_fixed_problems_pass(dataset, qid):
    """Verify that all 4 audited and fixed problems pass all sample and hidden test cases."""
    if _is_ci_mock(dataset):
        pytest.skip("Running in CI mock fixture mode without real secret dataset")
    qid_str = str(qid)
    qmeta = dataset["samples"][qid_str]
    solver = ALL_SOLVERS[qid_str]

    # 1. Test sample cases
    sample_tcs = qmeta.get("sampleTests", [])
    if sample_tcs:
        sample_outs = _run_solver(qmeta, sample_tcs, solver)
        for idx, (tc, act) in enumerate(zip(sample_tcs, sample_outs)):
            assert _compare(
                act,
                tc["expectedRaw"],
                qmeta.get("compareMode", "ordered"),
                qmeta.get("returnType"),
            ), f"Q{qid} Sample TC {idx} failed: expected {tc['expectedRaw']!r}, got {act!r}"

    # 2. Test hidden cases
    hidden_tcs = dataset["hidden"][qid_str]
    hidden_outs = _run_solver(qmeta, hidden_tcs, solver)
    for idx, (tc, act) in enumerate(zip(hidden_tcs, hidden_outs)):
        assert _compare(
            act,
            tc["expectedRaw"],
            qmeta.get("compareMode", "ordered"),
            qmeta.get("returnType"),
        ), f"Q{qid} Hidden TC {idx} failed: expected {tc['expectedRaw']!r}, got {act!r}"


@pytest.mark.parametrize("qid,buggy_code", [
    (37, "class Solution:\n    def findLeaders(self, nums: list[int]) -> list[int]:\n        return sorted(nums)\n"),
    (48, "class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        return False\n"),
    (50, "class Solution:\n    def reverseWords(self, s: str) -> str:\n        return s[::-1]\n"),
    (95, "class Solution:\n    def rightSideView(self, root) -> list[int]:\n        return []\n"),
])
def test_audited_fixed_problems_reject_wrong_solutions(dataset, qid, buggy_code):
    """Ensure that intentionally incorrect solutions for the fixed problems fail test cases."""
    if _is_ci_mock(dataset):
        pytest.skip("Running in CI mock fixture mode without real secret dataset")
    qid_str = str(qid)
    qmeta = dataset["samples"][qid_str]
    hidden_tcs = dataset["hidden"][qid_str]

    outputs = _run_solver(qmeta, hidden_tcs, buggy_code)
    mismatches = 0
    for tc, act in zip(hidden_tcs, outputs):
        if not _compare(
            act,
            tc["expectedRaw"],
            qmeta.get("compareMode", "ordered"),
            qmeta.get("returnType"),
        ):
            mismatches += 1

    assert mismatches > 0, f"Buggy solution for Q{qid} unexpectedly passed all test cases!"


@pytest.mark.parametrize("qid", [
    1,   # Arrays: Two Sum (unordered)
    14,  # Arrays: Move Zeroes (void)
    42,  # Strings: Valid Anagram
    56,  # Strings: Longest Common Prefix (handles empty prefix)
    59,  # Strings: Longest Palindromic Substring (any_of)
    61,  # Linked Lists: Reverse Linked List
    65,  # Linked Lists: Merge Two Sorted Lists
    72,  # Stacks & Queues: Valid Parentheses
    82,  # Trees: Maximum Depth of Binary Tree
    83,  # Trees: Invert Binary Tree
    88,  # Trees: Lowest Common Ancestor of a BST
    127, # DP: Climbing Stairs
    128, # DP: House Robber
    144, # Graphs: BFS Shortest Path
    151, # Graphs: Clone Graph (int:cloneGraph)
    152, # Graphs: Course Schedule (cycle detection)
    157, # Graphs: Course Schedule II (topological sort, any_of)
    164, # Recursion: Tower of Hanoi
    165, # Backtracking: Subsets
])
def test_representative_dsa_categories(dataset, qid):
    """Verify representative problems across all major DSA categories pass 100% of hidden tests."""
    if _is_ci_mock(dataset):
        pytest.skip("Running in CI mock fixture mode without real secret dataset")
    qid_str = str(qid)
    qmeta = dataset["samples"][qid_str]
    solver = ALL_SOLVERS[qid_str]
    hidden_tcs = dataset["hidden"][qid_str]

    outputs = _run_solver(qmeta, hidden_tcs, solver)
    for idx, (tc, act) in enumerate(zip(hidden_tcs, outputs)):
        assert _compare(
            act,
            tc["expectedRaw"],
            qmeta.get("compareMode", "ordered"),
            qmeta.get("returnType"),
        ), f"Representative Q{qid} TC {idx} failed: expected {tc['expectedRaw']!r}, got {act!r}"


def test_q48_token_stream_synchronization(dataset):
    """Verify Q48 (Valid Palindrome) maintains exact token synchronization across all test cases."""
    if _is_ci_mock(dataset):
        pytest.skip("Running in CI mock fixture mode without real secret dataset")
    qmeta = dataset["samples"]["48"]
    hidden_tcs = dataset["hidden"]["48"]
    solver = ALL_SOLVERS["48"]

    outputs = _run_solver(qmeta, hidden_tcs, solver)
    assert len(outputs) == 25
    # Verify specific test cases that previously desynchronized
    assert outputs[0] == "0", "notapalindrome is not a palindrome"
    assert outputs[1] == "1", "a. is a palindrome"
    assert outputs[2] == "1", "No lemon, no melon is a palindrome"


def test_q50_string_line_underscore_parsing(dataset):
    """Verify Q50 (Reverse Words in a String) processes space-containing strings via string:line correctly."""
    if _is_ci_mock(dataset):
        pytest.skip("Running in CI mock fixture mode without real secret dataset")
    qmeta = dataset["samples"]["50"]
    hidden_tcs = dataset["hidden"]["50"]
    solver = ALL_SOLVERS["50"]

    outputs = _run_solver(qmeta, hidden_tcs, solver)
    assert len(outputs) == 25
    assert outputs[1] == "world hello"
    assert outputs[2] == "time and space"
    assert outputs[3] == "example good a"


def test_q95_treenode_token_count_alignment(dataset):
    """Verify Q95 (Binary Tree Right Side View) has exact node count matching serialized array size."""
    if _is_ci_mock(dataset):
        pytest.skip("Running in CI mock fixture mode without real secret dataset")
    qmeta = dataset["samples"]["95"]
    hidden_tcs = dataset["hidden"]["95"]
    solver = ALL_SOLVERS["95"]

    outputs = _run_solver(qmeta, hidden_tcs, solver)
    assert len(outputs) == 25
    assert outputs[2] == "1 2"
    assert outputs[3] == "1"
    assert outputs[4] == "1 2"
