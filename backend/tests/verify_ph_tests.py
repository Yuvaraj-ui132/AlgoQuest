import json

with open('backend/data/test_cases.json', 'r', encoding='utf-8') as f:
    tc_data = json.load(f)

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

phs = ['Solve the problem efficiently', 'See LeetCode', 'competitive programming platform']
ph_qids = [q['id'] for q in questions if any(p in q.get('statement', '') for p in phs)]

for qid in ph_qids:
    q = next(item for item in questions if item['id'] == qid)
    tc = tc_data.get(str(qid), {})
    st = tc.get('sampleTests', [])
    print(f"\n--- Q{qid}: {q['name']} ---")
    for s in st:
        print(f"  Input: {s.get('input')} | Expected: {s.get('expected')}")
