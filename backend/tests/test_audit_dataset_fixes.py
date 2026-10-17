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
- 100% self-contained with no external private script dependencies.
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

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
SAMPLE_FILE = os.path.join(DATA_DIR, "sample_test_cases.json")
HIDDEN_FILE = os.path.join(DATA_DIR, "hidden_test_cases.json")

# Self-contained canonical reference solvers for tested problems
CANONICAL_SOLVERS = {
    # 37: Leaders in an Array
    37: """
class Solution:
    def findLeaders(self, nums: list[int]) -> list[int]:
        res = []
        max_r = -float('inf')
        for x in reversed(nums):
            if x >= max_r:
                res.append(x)
                max_r = x
        return res[::-1]
""",
    # 48: Valid Palindrome
    48: """
class Solution:
    def isPalindrome(self, s: str) -> bool:
        filtered = [ch.lower() for ch in s if ch.isalnum()]
        return filtered == filtered[::-1]
""",
    # 50: Reverse Words in a String
    50: """
class Solution:
    def reverseWords(self, s: str) -> str:
        words = s.strip().split()
        return " ".join(reversed(words))
""",
    # 95: Binary Tree Right Side View
    95: """
class Solution:
    def rightSideView(self, root) -> list[int]:
        if not root: return []
        res = []
        q = [root]
        while q:
            sz = len(q)
            for i in range(sz):
                node = q.pop(0)
                if i == sz - 1:
                    res.append(node.val)
                if node.left: q.append(node.left)
                if node.right: q.append(node.right)
        return res
""",
    # 1: Two Sum
    1: """
class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, x in enumerate(nums):
            if target - x in seen:
                return [seen[target - x], i]
            seen[x] = i
        return []
""",
    # 14: Move Zeroes
    14: """
class Solution:
    def moveZeroes(self, nums: list[int]) -> None:
        pos = 0
        for i in range(len(nums)):
            if nums[i] != 0:
                nums[pos], nums[i] = nums[i], nums[pos]
                pos += 1
""",
    # 42: Valid Anagram
    42: """
class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        return sorted(s) == sorted(t)
""",
    # 56: Longest Common Prefix
    56: """
class Solution:
    def longestCommonPrefix(self, strs: list[str]) -> str:
        if not strs: return ""
        prefix = strs[0]
        for s in strs[1:]:
            while not s.startswith(prefix):
                prefix = prefix[:-1]
                if not prefix: return ""
        return prefix
""",
    # 59: Longest Palindromic Substring
    59: """
class Solution:
    def longestPalindrome(self, s: str) -> str:
        res = ""
        for i in range(len(s)):
            for l, r in ((i, i), (i, i + 1)):
                while l >= 0 and r < len(s) and s[l] == s[r]:
                    if (r - l + 1) > len(res):
                        res = s[l:r + 1]
                    l -= 1; r += 1
        return res
""",
    # 61: Linked List Cycle
    61: """
class Solution:
    def hasCycle(self, head: object) -> bool:
        slow = fast = head
        while fast and fast.next:
            slow = slow.next
            fast = fast.next.next
            if slow == fast: return True
        return False
""",
    # 65: Reverse Linked List
    65: """
class Solution:
    def reverseList(self, head: object) -> object:
        prev = None
        cur = head
        while cur:
            nxt = cur.next
            cur.next = prev
            prev = cur
            cur = nxt
        return prev
""",
    # 72: Valid Parentheses
    72: """
class Solution:
    def isValid(self, s: str) -> bool:
        stk = []; m = {')':'(', '}':'{', ']':'['}
        for c in s:
            if c in m.values(): stk.append(c)
            elif c in m:
                if not stk or stk[-1] != m[c]: return False
                stk.pop()
        return not stk
""",
    # 82: Maximum Depth of Binary Tree
    82: """
class Solution:
    def maxDepth(self, root) -> int:
        return 1 + max(self.maxDepth(root.left), self.maxDepth(root.right)) if root else 0
""",
    # 83: Invert Binary Tree
    83: """
class Solution:
    def invertTree(self, root):
        if not root: return None
        root.left, root.right = self.invertTree(root.right), self.invertTree(root.left)
        return root
""",
    # 88: LCA of Binary Tree
    88: """
class Solution:
    def lowestCommonAncestor(self, root: object, p: object, q: object) -> object:
        if not root or root.val == p.val or root.val == q.val:
            return root
        left = self.lowestCommonAncestor(root.left, p, q)
        right = self.lowestCommonAncestor(root.right, p, q)
        if left and right: return root
        return left or right
""",
    # 127: Climbing Stairs
    127: """
class Solution:
    def climbStairs(self, n: int) -> int:
        a, b = 1, 1
        for _ in range(n): a, b = b, a + b
        return a
""",
    # 128: House Robber
    128: """
class Solution:
    def rob(self, nums: list[int]) -> int:
        r1, r2 = 0, 0
        for n in nums:
            r1, r2 = r2, max(r1 + n, r2)
        return r2
""",
    # 144: BFS Shortest Path
    144: """
class Solution:
    def shortestPath(self, n: int, edges: list[list[int]], src: int, dst: int) -> int:
        from collections import defaultdict, deque
        adj = defaultdict(list)
        for u, v in edges:
            adj[u].append(v); adj[v].append(u)
        q = deque([(src, 0)]); visited = {src}
        while q:
            cur, d = q.popleft()
            if cur == dst: return d
            for nxt in adj[cur]:
                if nxt not in visited:
                    visited.add(nxt)
                    q.append((nxt, d + 1))
        return -1
""",
    # 151: Clone Graph
    151: """
class Solution:
    def cloneGraph(self, node):
        if not node: return None
        clones = {node.val: Node(node.val)}
        q = [node]
        while q:
            cur = q.pop(0)
            for nb in cur.neighbors:
                if nb.val not in clones:
                    clones[nb.val] = Node(nb.val)
                    q.append(nb)
                clones[cur.val].neighbors.append(clones[nb.val])
        return clones[node.val]
""",
    # 152: Course Schedule
    152: """
class Solution:
    def canFinish(self, numCourses: int, prerequisites: list[list[int]]) -> bool:
        from collections import defaultdict, deque
        in_deg = [0] * numCourses; adj = defaultdict(list)
        for u, v in prerequisites:
            adj[v].append(u); in_deg[u] += 1
        q = deque([i for i in range(numCourses) if in_deg[i] == 0])
        cnt = 0
        while q:
            c = q.popleft(); cnt += 1
            for nxt in adj[c]:
                in_deg[nxt] -= 1
                if in_deg[nxt] == 0: q.append(nxt)
        return cnt == numCourses
""",
    # 157: Course Schedule II
    157: """
class Solution:
    def findOrder(self, numCourses: int, prerequisites: list[list[int]]) -> list[int]:
        from collections import defaultdict, deque
        in_deg = [0] * numCourses; adj = defaultdict(list)
        for u, v in prerequisites:
            adj[v].append(u); in_deg[u] += 1
        q = deque([i for i in range(numCourses) if in_deg[i] == 0])
        order = []
        while q:
            c = q.popleft(); order.append(c)
            for nxt in adj[c]:
                in_deg[nxt] -= 1
                if in_deg[nxt] == 0: q.append(nxt)
        return order if len(order) == numCourses else []
""",
    # 164: Tower of Hanoi
    164: """
class Solution:
    def toh(self, n: int) -> int:
        return (1 << n) - 1
""",
    # 165: Subsets
    165: """
class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        res = [[]]
        for n in nums:
            res += [curr + [n] for curr in res]
        return res
"""
}


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
    solver = CANONICAL_SOLVERS[qid]

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
    solver = CANONICAL_SOLVERS[qid]
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
    solver = CANONICAL_SOLVERS[48]

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
    solver = CANONICAL_SOLVERS[50]

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
    solver = CANONICAL_SOLVERS[95]

    outputs = _run_solver(qmeta, hidden_tcs, solver)
    assert len(outputs) == 25
    assert outputs[2] == "1 2"
    assert outputs[3] == "1"
    assert outputs[4] == "1 2"
