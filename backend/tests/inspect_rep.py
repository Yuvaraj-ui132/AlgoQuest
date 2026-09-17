import json

with open('backend/data/test_cases.json', 'r', encoding='utf-8') as f:
    tc = json.load(f)

with open('data/questions.json', 'r', encoding='utf-8') as f:
    qs = json.load(f)

print("Representative questions sample tests:")
rep_ids = [1, 21, 23, 52, 100, 82, 131, 116]
for qid in rep_ids:
    q = next(item for item in qs if item['id'] == qid)
    t = tc[str(qid)]
    print(f"=== Q{qid}: {q['name']} ===")
    print(f"Statement: {q.get('statement')}")
    print(f"InputFormat: {q.get('inputFormat')}")
    print(f"OutputFormat: {q.get('outputFormat')}")
    samples = t.get('sampleTests', [])
    print(f"Backend sampleTests count: {len(samples)}")
    for i, s in enumerate(samples):
        print(f"  Example {i+1}: in: {s.get('input')} -> out: {s.get('expected')}")
