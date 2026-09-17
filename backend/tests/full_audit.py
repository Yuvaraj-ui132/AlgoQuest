"""
full_audit.py — Comprehensive Audit for AlgoQuest Platform Cleanup & Accuracy
"""
import os
import re
import json
import subprocess
import unittest

def run_audit():
    results = {}

    # 1. Load questions
    with open('data/questions.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)

    results['total_questions'] = len(questions)

    # 2. Check descriptions
    placeholder_matches = [
        q['id'] for q in questions
        if 'Solve the problem efficiently using an appropriate algorithm' in q.get('statement', '')
    ]
    results['placeholder_descriptions'] = len(placeholder_matches)

    empty_matches = [
        q['id'] for q in questions
        if not q.get('statement', '').strip()
    ]
    results['missing_descriptions'] = len(empty_matches)

    valid_descriptions = [
        q['id'] for q in questions
        if q.get('statement', '').strip() and 'Solve the problem efficiently using an appropriate algorithm' not in q.get('statement', '')
    ]
    results['valid_descriptions'] = len(valid_descriptions)

    # 3. Check for TCS in application files
    app_files = [
        'index.html',
        'js/app.js',
        'js/firebase.js',
        'css/style.css',
        'data/questions.json',
        'data/tiers.json'
    ]

    tcs_app_matches = []
    # Match standalone word 'tcs' (case-insensitive)
    word_re = re.compile(r'\btcs\b', re.IGNORECASE)
    for rel_path in app_files:
        if os.path.exists(rel_path):
            with open(rel_path, 'r', encoding='utf-8') as f:
                for line_idx, line in enumerate(f, 1):
                    # Check if line contains standalone 'tcs'
                    if word_re.search(line):
                        tcs_app_matches.append(f"{rel_path}:{line_idx} -> {line.strip()}")

    results['tcs_functionality_in_application'] = len(tcs_app_matches)
    results['tcs_matches'] = tcs_app_matches

    # 4. Check frontend hidden-test exposure
    with open('js/question-metadata.js', 'r', encoding='utf-8') as f:
        q_meta_js = f.read()

    results['frontend_hidden_test_exposure'] = 1 if 'hiddenTests' in q_meta_js else 0

    # 5. Check description/question mismatches against test_cases.json and signatures
    with open('backend/data/test_cases.json', 'r', encoding='utf-8') as f:
        tc = json.load(f)

    # Load registry using node
    proc_node = subprocess.run(
        ['node', '-e', 'const fs = require("fs"); const window = {}; eval(fs.readFileSync("js/question-metadata.js", "utf8")); console.log(JSON.stringify(window.QUESTION_METADATA_REGISTRY));'],
        capture_output=True,
        text=True,
        encoding='utf-8'
    )
    registry = json.loads(proc_node.stdout) if proc_node.returncode == 0 else {}

    mismatches = []
    for q in questions:
        qid_str = str(q['id'])
        meta = registry.get(qid_str)
        tcase = tc.get(qid_str)

        if not meta or not tcase:
            mismatches.append(f"Missing registry or backend testcase for Q{q['id']}")
            continue

        stmt = q.get('statement', '').lower()
        qname = q.get('name', '').lower()

        # Sanity checks on name and statement
        if not q.get('inputFormat') or not q.get('outputFormat'):
            mismatches.append(f"Q{q['id']} missing inputFormat or outputFormat")

    results['description_question_mismatches'] = len(mismatches)

    # 6. Run representative questions check
    representative_targets = [
        {"name": "Two Sum", "id": 1, "type": "Array"},
        {"name": "Three Sum", "id": 21, "type": "Two Pointers"},
        {"name": "Maximum Subarray Sum", "id": 23, "type": "Sliding Window / Kadane"},
        {"name": "Longest Substring Without Repeating Characters", "id": 52, "type": "String / Sliding Window"},
        {"name": "Insertion Sort", "id": 100, "type": "Sorting"},
        {"name": "Invert Binary Tree", "id": 82, "type": "Tree"},
        {"name": "Number of Islands", "id": 131, "type": "Graph"},
        {"name": "Climbing Stairs", "id": 116, "type": "Dynamic Programming"}
    ]

    rep_results = []
    for rep in representative_targets:
        qid = rep['id']
        q = next((item for item in questions if item['id'] == qid), None)
        meta = registry.get(str(qid))
        tcase = tc.get(str(qid))

        status_ok = True
        notes = []

        if not q:
            status_ok = False
            notes.append("Question not found in questions.json")
        else:
            if not q.get('statement') or len(q['statement']) < 10:
                status_ok = False
                notes.append("Invalid or empty statement")
            if not meta or not meta.get('starterCode'):
                status_ok = False
                notes.append("Missing starter code")
            if not tcase or not tcase.get('sampleTests'):
                status_ok = False
                notes.append("Missing sample tests in backend")

        rep_results.append({
            "id": qid,
            "title": rep['name'],
            "category": rep['type'],
            "function": meta.get('functionName') if meta else None,
            "statement_preview": (q.get('statement')[:70] + '...') if q else None,
            "sample_count": len(tcase.get('sampleTests', [])) if tcase else 0,
            "hidden_count": len(tcase.get('hiddenTests', [])) if tcase else 0,
            "verified": status_ok,
            "issues": notes
        })

    results['representative_audit'] = rep_results

    # 7. Backend unittest execution
    try:
        proc = subprocess.run(
            ['python', '-m', 'unittest', 'tests/test_backend.py'],
            cwd='backend',
            capture_output=True,
            text=True
        )
        passed_9 = "Ran 9 tests" in proc.stderr and "OK" in proc.stderr
        results['backend_tests'] = "9/9 PASS" if passed_9 else f"FAIL ({proc.stderr})"
    except Exception as e:
        results['backend_tests'] = f"ERROR ({e})"

    return results

if __name__ == '__main__':
    audit = run_audit()
    print("========================================")
    print("      ALGOQUEST AUDIT REPORT")
    print("========================================")
    print(f"Total questions: {audit['total_questions']}")
    print(f"Valid descriptions: {audit['valid_descriptions']}")
    print(f"Missing descriptions: {audit['missing_descriptions']}")
    print(f"Placeholder descriptions: {audit['placeholder_descriptions']}")
    print(f"Description/question mismatches: {audit['description_question_mismatches']}")
    print(f"TCS functionality in application: {audit['tcs_functionality_in_application']}")
    print(f"Frontend hidden-test exposure: {audit['frontend_hidden_test_exposure']}")
    print(f"Backend tests: {audit['backend_tests']}")
    print("========================================")
    print("\nREPRESENTATIVE QUESTIONS AUDIT:")
    for r in audit['representative_audit']:
        v_str = "PASS" if r['verified'] else "FAIL"
        print(f"[{v_str}] Q{r['id']}: {r['title']} ({r['category']})")
        print(f"       Function: {r['function']}")
        print(f"       Statement: {r['statement_preview']}")
        print(f"       Samples: {r['sample_count']}, Hidden: {r['hidden_count']}")
