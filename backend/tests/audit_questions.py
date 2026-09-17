import json
import re

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

print(f"Total questions in questions.json: {len(questions)}")

# Check fields in questions.json
fields_present = {
    'statement': 0,
    'inputFormat': 0,
    'outputFormat': 0,
    'constraints': 0,
    'sampleInput': 0,
    'sampleOutput': 0,
    'topic': 0,
    'pattern': 0,
    'difficulty': 0
}

sample_empty_stmt = []
short_statements = []

for q in questions:
    for k in fields_present:
        if q.get(k):
            fields_present[k] += 1
    stmt = q.get('statement', '')
    if not stmt or len(stmt.strip()) < 30:
        short_statements.append((q['id'], q['name'], stmt))

print("Fields present across 174 questions:")
for k, v in fields_present.items():
    print(f"  {k}: {v}/{len(questions)}")

print(f"\nShort statements (< 30 chars): {len(short_statements)}")
for s in short_statements[:10]:
    print(" ", s)
