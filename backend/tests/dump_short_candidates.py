import json

with open('data/questions.json', 'r', encoding='utf-8') as f:
    qs = json.load(f)

with open('backend/data/test_cases.json', 'r', encoding='utf-8') as f:
    tc = json.load(f)

print(f"Total questions: {len(qs)}")

short_list = []
detailed_list = []

for q in qs:
    stmt = q.get('statement', '').strip()
    words = len(stmt.split())
    # Consider statements with fewer than 50 words as candidates for expansion
    if words < 50:
        short_list.append((q['id'], q['name'], words, q['topic'], q['pattern'], stmt))
    else:
        detailed_list.append((q['id'], q['name'], words, q['topic'], q['pattern'], stmt))

print(f"Candidate questions to expand (< 50 words): {len(short_list)}")
print(f"Already detailed questions (>= 50 words): {len(detailed_list)}")

with open('backend/tests/short_questions_dump.json', 'w', encoding='utf-8') as f:
    json.dump([{
        "id": item[0],
        "name": item[1],
        "words": item[2],
        "topic": item[3],
        "pattern": item[4],
        "statement": item[5],
        "samples": tc.get(str(item[0]), {}).get('sampleTests', [])
    } for item in short_list], f, indent=2, ensure_ascii=False)

print("Saved short questions dump to backend/tests/short_questions_dump.json")
