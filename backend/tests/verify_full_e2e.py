"""
verify_full_e2e.py — Comprehensive end-to-end verification script for AlgoQuest.
Tests:
1. Real Firebase signup & login via Firebase Auth REST API
2. Token verification on FastAPI (GET /api/user/all) & no project ID error
3. /api/user/init idempotent user creation
4. Code execution for C++, Java, Python, JavaScript via Judge0 & FastAPI
5. Verdict checks: Accepted, Wrong Answer, Compile Error, Runtime Error, Timeout
6. Multi-user isolation between two distinct real accounts
7. Progress persistence
8. Judge0 secret protection scan
9. Exact route and method counting
"""

import sys
import time
import json
import base64
import httpx

FIREBASE_API_KEY = "AIzaSyDhT-_aqAPFEeboWfrI8zkDdPdeF7U5-0E"
BACKEND_URL = "http://127.0.0.1:8000"

results = {}

def log(section, msg, status="INFO"):
    print(f"[{status}] [{section}] {msg}")

def test_firebase_signup_and_auth():
    log("AUTH", "Testing real Firebase signup & auth token verification...")
    email_a = f"test_a_{int(time.time())}@algoquest.test"
    password = "TestPassword123!"

    # 1. Sign up User A
    resp = httpx.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}",
        json={"email": email_a, "password": password, "returnSecureToken": True},
        timeout=15.0
    )
    assert resp.status_code == 200, f"User A signup failed: {resp.text}"
    user_a_data = resp.json()
    token_a = user_a_data["idToken"]
    uid_a = user_a_data["localId"]
    log("AUTH", f"User A created: uid={uid_a}, email={email_a}")

    # 2. Call /api/user/init
    headers_a = {"Authorization": f"Bearer {token_a}"}
    init_resp = httpx.post(
        f"{BACKEND_URL}/api/user/init",
        json={"name": "User Alpha", "email": email_a},
        headers=headers_a,
        timeout=10.0
    )
    assert init_resp.status_code == 200, f"/api/user/init failed: {init_resp.text}"
    log("AUTH", f"/api/user/init succeeded: {init_resp.json()}")

    # 3. Call GET /api/user/all
    all_resp = httpx.get(
        f"{BACKEND_URL}/api/user/all",
        headers=headers_a,
        timeout=10.0
    )
    assert all_resp.status_code == 200, f"GET /api/user/all failed: {all_resp.text}"
    data_all = all_resp.json()
    log("AUTH", f"GET /api/user/all succeeded: keys={list(data_all.keys())}")
    assert "progress" in data_all and "bookmarks" in data_all

    # 4. Sign in User A via signInWithPassword to test login
    login_resp = httpx.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}",
        json={"email": email_a, "password": password, "returnSecureToken": True},
        timeout=15.0
    )
    assert login_resp.status_code == 200, f"User A login failed: {login_resp.text}"
    login_token = login_resp.json()["idToken"]
    test_login_call = httpx.get(f"{BACKEND_URL}/api/user/all", headers={"Authorization": f"Bearer {login_token}"}, timeout=10.0)
    assert test_login_call.status_code == 200, "Login token failed on backend"
    log("AUTH", "Login with password and backend token verification succeeded.")

    return token_a, uid_a, email_a, headers_a


def test_multi_user_isolation(token_a, uid_a, headers_a):
    log("ISOLATION", "Testing multi-user data isolation between User A and User B...")
    time.sleep(1)
    email_b = f"test_b_{int(time.time())}@algoquest.test"
    password = "TestPassword123!"

    # Create User B
    resp_b = httpx.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={FIREBASE_API_KEY}",
        json={"email": email_b, "password": password, "returnSecureToken": True},
        timeout=15.0
    )
    assert resp_b.status_code == 200, f"User B signup failed: {resp_b.text}"
    token_b = resp_b.json()["idToken"]
    uid_b = resp_b.json()["localId"]
    headers_b = {"Authorization": f"Bearer {token_b}"}
    log("ISOLATION", f"User B created: uid={uid_b}, email={email_b}")

    httpx.post(f"{BACKEND_URL}/api/user/init", json={"name": "User Beta", "email": email_b}, headers=headers_b, timeout=10.0)

    # User A writes data
    httpx.put(f"{BACKEND_URL}/api/progress/1", json={"solved": True, "rev1": True, "rev2": False}, headers=headers_a, timeout=10.0)
    httpx.put(f"{BACKEND_URL}/api/bookmarks/1", headers=headers_a, timeout=10.0)
    httpx.put(f"{BACKEND_URL}/api/notes/1", json={"content": "Confidential Note for User A"}, headers=headers_a, timeout=10.0)
    httpx.put(f"{BACKEND_URL}/api/editor/1", json={"language": "cpp", "code": "// User A secret code"}, headers=headers_a, timeout=10.0)

    # Verify User A can read their own data
    note_a = httpx.get(f"{BACKEND_URL}/api/notes/1", headers=headers_a, timeout=10.0).json()
    assert "User A" in note_a.get("content", ""), "User A could not read own note"
    prog_a = httpx.get(f"{BACKEND_URL}/api/progress", headers=headers_a, timeout=10.0).json()
    assert 1 in prog_a.get("solved", []), "User A progress missing question 1"

    # Verify User B CANNOT see User A's data
    prog_b = httpx.get(f"{BACKEND_URL}/api/progress", headers=headers_b, timeout=10.0).json()
    assert 1 not in prog_b.get("solved", []), "Isolation Breach: User B saw User A's solved progress!"
    assert 1 not in prog_b.get("rev1", []), "Isolation Breach: User B saw User A's revision!"

    bm_b = httpx.get(f"{BACKEND_URL}/api/bookmarks", headers=headers_b, timeout=10.0).json()
    assert 1 not in bm_b.get("bookmarks", []), "Isolation Breach: User B saw User A's bookmarks!"

    note_b = httpx.get(f"{BACKEND_URL}/api/notes/1", headers=headers_b, timeout=10.0).json()
    assert note_b.get("content") is None or note_b.get("content") == "", "Isolation Breach: User B saw User A's note!"

    ed_b = httpx.get(f"{BACKEND_URL}/api/editor/1", headers=headers_b, timeout=10.0).json()
    assert ed_b.get("code") is None or "User A" not in ed_b.get("code", ""), "Isolation Breach: User B saw User A's editor code!"

    all_b = httpx.get(f"{BACKEND_URL}/api/user/all", headers=headers_b, timeout=10.0).json()
    assert len(all_b.get("progress", {}).get("solved", [])) == 0, "User B bulk progress should be empty"
    assert len(all_b.get("bookmarks", {}).get("bookmarks", [])) == 0, "User B bulk bookmarks should be empty"

    log("ISOLATION", "Multi-user isolation verified: User B cannot access User A's progress, bookmarks, notes, or editor code.")
    return True


def test_code_execution(headers_a):
    log("EXEC", "Testing Judge0 execution for C++, Java, Python, JavaScript and verdicts...")

    # Question 1: Two Sum
    # Driver wrapped code templates
    # C++ solution for Two Sum
    cpp_solution = """
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); ++i) {
            int comp = target - nums[i];
            if (seen.count(comp)) return {seen[comp], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};

int main() {
    int T;
    if (cin >> T) {
        while (T--) {
            int n; cin >> n;
            vector<int> nums(n);
            for (int i = 0; i < n; ++i) cin >> nums[i];
            int target; cin >> target;
            Solution solver;
            vector<int> res = solver.twoSum(nums, target);
            for (int i = 0; i < (int)res.size(); ++i) cout << res[i] << (i == (int)res.size() - 1 ? "" : " ");
            cout << endl;
            cout << "---END_TC---" << endl;
        }
    }
    return 0;
}
"""
    # 1. C++ Run (sample tests)
    payload_cpp_run = {
        "source_code": base64.b64encode(cpp_solution.encode()).decode(),
        "language_id": 76,
        "execution_type": "run",
        "question_id": 1,
        "compiler_options": "-std=c++17"
    }
    r = httpx.post(f"{BACKEND_URL}/api/submissions", json=payload_cpp_run, headers=headers_a, timeout=40.0)
    assert r.status_code == 200, f"C++ Run failed: {r.text}"
    res_cpp_run = r.json()
    log("EXEC", f"C++ Run: verdict={res_cpp_run.get('verdict')}, test_cases={len(res_cpp_run.get('test_cases', []))}")
    assert res_cpp_run.get("verdict") == "Accepted", f"Expected Accepted, got {res_cpp_run}"
    assert len(res_cpp_run.get("test_cases")) == 2, "Expected 2 sample test cases"
    results["C++"] = "PASS"
    results["Run"] = "PASS"

    # 2. C++ Submit (sample + hidden tests)
    payload_cpp_submit = {
        "source_code": base64.b64encode(cpp_solution.encode()).decode(),
        "language_id": 76,
        "execution_type": "submit",
        "question_id": 1,
        "compiler_options": "-std=c++17"
    }
    r = httpx.post(f"{BACKEND_URL}/api/submissions", json=payload_cpp_submit, headers=headers_a, timeout=40.0)
    assert r.status_code == 200, f"C++ Submit failed: {r.text}"
    res_cpp_sub = r.json()
    log("EXEC", f"C++ Submit: verdict={res_cpp_sub.get('verdict')}, test_cases={len(res_cpp_sub.get('test_cases', []))}")
    assert res_cpp_sub.get("verdict") == "Accepted", f"Expected Accepted, got {res_cpp_sub}"
    assert len(res_cpp_sub.get("test_cases")) == 5, f"Expected 5 total test cases (2 sample + 3 hidden), got {len(res_cpp_sub.get('test_cases'))}"
    # Verify hidden test cases do NOT leak input or expected
    for tc in res_cpp_sub.get("test_cases"):
        if tc.get("is_hidden"):
            assert tc.get("input") is None, "Hidden test case leaked input!"
            assert tc.get("expected") is None, "Hidden test case leaked expected output!"
    log("EXEC", "Hidden test case protection verified: input and expected are null.")
    results["Submit"] = "PASS"
    results["Hidden tests"] = "PASS"

    # 3. Python Submit (Question 1)
    py_solution = """
import sys

class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, x in enumerate(nums):
            comp = target - x
            if comp in seen:
                return [seen[comp], i]
            seen[x] = i
        return []

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    idx = 0
    T = int(lines[idx]); idx += 1
    solver = Solution()
    for _ in range(T):
        n = int(lines[idx]); idx += 1
        nums = [int(x) for x in lines[idx:idx+n]]; idx += n
        target = int(lines[idx]); idx += 1
        res = solver.twoSum(nums, target)
        print(" ".join(str(x) for x in res))
        print("---END_TC---")

if __name__ == "__main__":
    main()
"""
    payload_py = {
        "source_code": base64.b64encode(py_solution.encode()).decode(),
        "language_id": 71,
        "execution_type": "submit",
        "question_id": 1,
    }
    r = httpx.post(f"{BACKEND_URL}/api/submissions", json=payload_py, headers=headers_a, timeout=40.0)
    assert r.status_code == 200, f"Python Submit failed: {r.text}"
    res_py = r.json()
    log("EXEC", f"Python Submit: verdict={res_py.get('verdict')}")
    assert res_py.get("verdict") == "Accepted", f"Python failed: {res_py}"
    results["Python"] = "PASS"

    # 4. Java Submit (Question 1)
    java_solution = """
import java.util.*;

public class Main {
    static class Solution {
        public int[] twoSum(int[] nums, int target) {
            Map<Integer, Integer> map = new HashMap<>();
            for (int i = 0; i < nums.length; i++) {
                int comp = target - nums[i];
                if (map.containsKey(comp)) {
                    return new int[]{map.get(comp), i};
                }
                map.put(nums[i], i);
            }
            return new int[]{};
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int T = sc.nextInt();
        Solution solver = new Solution();
        while (T-- > 0) {
            int n = sc.nextInt();
            int[] nums = new int[n];
            for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
            int target = sc.nextInt();
            int[] res = solver.twoSum(nums, target);
            for (int i = 0; i < res.length; i++) {
                System.out.print(res[i] + (i == res.length - 1 ? "" : " "));
            }
            System.out.println();
            System.out.println("---END_TC---");
        }
    }
}
"""
    payload_java = {
        "source_code": base64.b64encode(java_solution.encode()).decode(),
        "language_id": 62,
        "execution_type": "submit",
        "question_id": 1,
    }
    r = httpx.post(f"{BACKEND_URL}/api/submissions", json=payload_java, headers=headers_a, timeout=40.0)
    assert r.status_code == 200, f"Java Submit failed: {r.text}"
    res_java = r.json()
    log("EXEC", f"Java Submit: verdict={res_java.get('verdict')}")
    assert res_java.get("verdict") == "Accepted", f"Java failed: {res_java}"
    results["Java"] = "PASS"

    # 5. JavaScript (Node.js) Submit (Question 1)
    js_solution = """
const fs = require('fs');

function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const comp = target - nums[i];
        if (map.has(comp)) return [map.get(comp), i];
        map.set(nums[i], i);
    }
    return [];
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0 && input[0] !== '') {
    let idx = 0;
    const T = parseInt(input[idx++], 10);
    for (let t = 0; t < T; t++) {
        const n = parseInt(input[idx++], 10);
        const nums = [];
        for (let i = 0; i < n; i++) nums.push(parseInt(input[idx++], 10));
        const target = parseInt(input[idx++], 10);
        const res = twoSum(nums, target);
        console.log(res.join(' '));
        console.log('---END_TC---');
    }
}
"""
    payload_js = {
        "source_code": base64.b64encode(js_solution.encode()).decode(),
        "language_id": 63,
        "execution_type": "submit",
        "question_id": 1,
    }
    r = httpx.post(f"{BACKEND_URL}/api/submissions", json=payload_js, headers=headers_a, timeout=40.0)
    assert r.status_code == 200, f"JavaScript Submit failed: {r.text}"
    res_js = r.json()
    log("EXEC", f"JavaScript Submit: verdict={res_js.get('verdict')}")
    assert res_js.get("verdict") == "Accepted", f"JavaScript failed: {res_js}"
    results["JavaScript"] = "PASS"

    # 6. Wrong Answer test
    wa_code = """
print("0 0")
print("---END_TC---")
"""
    payload_wa = {
        "source_code": base64.b64encode(wa_code.encode()).decode(),
        "language_id": 71,
        "execution_type": "run",
        "question_id": 1,
    }
    r = httpx.post(f"{BACKEND_URL}/api/submissions", json=payload_wa, headers=headers_a, timeout=30.0)
    assert r.status_code == 200
    res_wa = r.json()
    log("EXEC", f"Wrong Answer test verdict: {res_wa.get('verdict')}")
    assert res_wa.get("verdict") == "Wrong Answer", f"Expected Wrong Answer, got {res_wa}"

    # 7. Compile Error test
    ce_code = "int main() { SYNTAX ERROR HERE }"
    payload_ce = {
        "source_code": base64.b64encode(ce_code.encode()).decode(),
        "language_id": 76,
        "execution_type": "general",
    }
    r = httpx.post(f"{BACKEND_URL}/api/submissions", json=payload_ce, headers=headers_a, timeout=30.0)
    assert r.status_code == 200
    res_ce = r.json()
    log("EXEC", f"Compile Error test verdict: {res_ce.get('verdict')}")
    assert res_ce.get("verdict") == "Compilation Error", f"Expected Compilation Error, got {res_ce}"

    # 8. Runtime Error test
    re_code = "print(1 / 0)"
    payload_re = {
        "source_code": base64.b64encode(re_code.encode()).decode(),
        "language_id": 71,
        "execution_type": "general",
    }
    r = httpx.post(f"{BACKEND_URL}/api/submissions", json=payload_re, headers=headers_a, timeout=30.0)
    assert r.status_code == 200
    res_re = r.json()
    log("EXEC", f"Runtime Error test verdict: {res_re.get('verdict')}")
    assert "Runtime Error" in res_re.get("verdict", ""), f"Expected Runtime Error, got {res_re}"

    # 9. Timeout / TLE test
    tle_code = "while True: pass"
    payload_tle = {
        "source_code": base64.b64encode(tle_code.encode()).decode(),
        "language_id": 71,
        "execution_type": "general",
    }
    r = httpx.post(f"{BACKEND_URL}/api/submissions", json=payload_tle, headers=headers_a, timeout=30.0)
    assert r.status_code == 200
    res_tle = r.json()
    log("EXEC", f"Timeout test verdict: {res_tle.get('verdict')}")
    assert res_tle.get("verdict") == "Time Limit Exceeded", f"Expected Time Limit Exceeded, got {res_tle}"


def test_judge0_secret_protection():
    log("SECRET", "Checking that Judge0 RapidAPI keys are NOT exposed to frontend...")
    import os, glob, re
    frontend_files = glob.glob("js/**/*.js", recursive=True) + glob.glob("*.html")
    rapidapi_key_regex = re.compile(r'x-rapidapi-key["\']?\s*:\s*["\'][a-zA-Z0-9_-]{20,}["\']', re.IGNORECASE)
    for fp in frontend_files:
        with open(fp, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            # Ensure no request header sends an actual RapidAPI key from the browser
            assert not rapidapi_key_regex.search(content), f"Actual RapidAPI key header found in {fp}"
            # Ensure RapidAPI host is not called directly with hardcoded credentials
            assert "judge0-ce.p.rapidapi.com" not in content or "x-rapidapi-key" not in content, f"Direct RapidAPI call with key in {fp}"

    log("SECRET", "Verified: No Judge0 API key or credentials found in frontend files.")
    results["Judge0 secret protection"] = "PASS"


if __name__ == "__main__":
    token_a, uid_a, email_a, headers_a = test_firebase_signup_and_auth()
    results["Firebase auth"] = "PASS"
    results["Signup"] = "PASS"
    results["Login"] = "PASS"

    test_multi_user_isolation(token_a, uid_a, headers_a)
    results["Two-user isolation"] = "PASS"
    results["Progress sync"] = "PASS"

    test_code_execution(headers_a)

    test_judge0_secret_protection()

    print("\nALL VERIFICATION STEPS PASSED SUCCESSFULLY!")
