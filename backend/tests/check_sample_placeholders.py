import json
import re

# Read question-metadata.js
with open('js/question-metadata.js', 'r', encoding='utf-8') as f:
    js_content = f.read()

# Read questions.json
with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Extract test metadata from backend/data/test_cases.json
with open('backend/data/test_cases.json', 'r', encoding='utf-8') as f:
    backend_tests = json.load(f)

sample_ids = [4, 5, 21, 23, 52, 105, 106]

for qid in sample_ids:
    q = next(item for item in questions if item['id'] == qid)
    b = backend_tests.get(str(qid), {})
    print(f"\n==================== Q{qid}: {q['name']} ====================")
    print("Topic:", q.get('topic'), "| Pattern:", q.get('pattern'), "| Diff:", q.get('difficulty'))
    print("Current Statement in questions.json:", q.get('statement'))
    print("Current Sample In:", q.get('sampleInput'))
    print("Current Sample Out:", q.get('sampleOutput'))
    print("Sample Tests in test_cases.json:")
    for st in b.get('sampleTests', []):
        print(f"  Input: {st.get('input')} -> Expected: {st.get('expected')}")
