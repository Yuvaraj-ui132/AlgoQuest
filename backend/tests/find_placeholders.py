import json

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

placeholders = []
placeholder_phrases = [
    "Solve the problem efficiently",
    "See LeetCode",
    "competitive programming platform",
    "Output depends on the specific input",
    "Apply the pattern described"
]

for q in questions:
    stmt = q.get('statement', '')
    sin = q.get('sampleInput', '')
    sout = q.get('sampleOutput', '')
    is_placeholder = any(p in stmt or p in sin or p in sout for p in placeholder_phrases)
    if is_placeholder:
        placeholders.append((q['id'], q['name'], stmt[:60], sin[:50]))

print(f"Total placeholder questions found: {len(placeholders)} out of {len(questions)}")
for p in placeholders:
    print(f"Q{p[0]}: {p[1]} | Stmt: {p[2]} | In: {p[3]}")
