import json

with open('data/questions.json', 'r', encoding='utf-8') as f:
    qs = json.load(f)

print(f"Total questions: {len(qs)}")

short_questions = []
for q in qs:
    stmt = q.get('statement', '').strip()
    words = len(stmt.split())
    # A statement with fewer than 35 words is typically a single terse sentence
    if words < 35 or len(stmt) < 220:
        short_questions.append((q['id'], q['name'], words, len(stmt), stmt))

print(f"Short/terse statements count (< 35 words or < 220 chars): {len(short_questions)}")
print("\nFirst 15 short statements:")
for qid, name, w, l, s in short_questions[:15]:
    print(f"Q{qid}: {name} ({w} words, {l} chars)")
    print(f"   Statement: {s}\n")
