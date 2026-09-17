import json

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

check_ids = [142, 143, 160, 170, 171]
for qid in check_ids:
    q = next(item for item in questions if item['id'] == qid)
    print("=" * 60)
    print(f"ID {q['id']}: {q['name']}")
    print("Statement:", q.get('statement'))
    print("Sample In:", q.get('sampleInput'))
    print("Sample Out:", q.get('sampleOutput'))
