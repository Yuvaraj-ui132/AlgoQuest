import json

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

print(f"Total questions in questions.json: {len(questions)}")

missing_stmt = []
short_stmt = []
has_tcs = 0

for q in questions:
    qid = q.get('id')
    name = q.get('name')
    stmt = q.get('statement', '')
    if q.get('tcs') is not None:
        has_tcs += 1
    if not stmt or not stmt.strip():
        missing_stmt.append((qid, name))
    elif len(stmt.strip()) < 20:
        short_stmt.append((qid, name, stmt))

print(f"Questions with 'tcs' field: {has_tcs}")
print(f"Missing statement: {len(missing_stmt)}")
print(f"Very short statement: {len(short_stmt)}")
if missing_stmt:
    print("Sample missing:", missing_stmt[:10])
if short_stmt:
    print("Sample short:", short_stmt[:10])

# Inspect first 3 questions
for q in questions[:3]:
    print("---")
    print("ID:", q.get('id'), "Name:", q.get('name'))
    print("Statement:", q.get('statement')[:120] if q.get('statement') else None)
    print("Constraints:", q.get('constraints'))
    print("Sample Input:", q.get('sampleInput'))
    print("Sample Output:", q.get('sampleOutput'))
