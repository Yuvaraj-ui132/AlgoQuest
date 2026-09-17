import json

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

with open('backend/data/test_cases.json', 'r', encoding='utf-8') as f:
    test_cases = json.load(f)

# Load metadata registry by parsing js/question-metadata.js or we can read it directly
import re
with open('js/question-metadata.js', 'r', encoding='utf-8') as f:
    meta_text = f.read()

# Find placeholders
placeholder_phrases = [
    "Solve the problem efficiently",
    "See LeetCode",
    "competitive programming platform",
    "Output depends on the specific input",
    "Apply the pattern described"
]

placeholder_qids = []
for q in questions:
    stmt = q.get('statement', '')
    sin = q.get('sampleInput', '')
    sout = q.get('sampleOutput', '')
    if any(p in stmt or p in sin or p in sout for p in placeholder_phrases):
        placeholder_qids.append(q['id'])

print(f"Total placeholder questions: {len(placeholder_qids)}")

for qid in placeholder_qids:
    q = next(item for item in questions if item['id'] == qid)
    tc = test_cases.get(str(qid), {})
    sample_tests = tc.get('sampleTests', [])
    hidden_tests = tc.get('hiddenTests', [])
    
    print("=" * 60)
    print(f"ID: {qid} | Name: {q['name']} | Topic: {q.get('topic')} | Pattern: {q.get('pattern')} | Diff: {q.get('difficulty')}")
    print(f"LeetCode: {q.get('leetcode')}")
    print(f"Sample Tests ({len(sample_tests)}):")
    for s in sample_tests:
        print(f"  - input: {s.get('input')} | expected: {s.get('expected')} | stdin: {repr(s.get('stdin'))} | expectedRaw: {repr(s.get('expectedRaw'))}")
    print(f"Hidden Tests ({len(hidden_tests)}):")
    for h in hidden_tests[:2]:
        print(f"  - stdin: {repr(h.get('stdin'))} | expectedRaw: {repr(h.get('expectedRaw'))}")
