import json

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

phs = ['Solve the problem efficiently', 'See LeetCode', 'competitive programming platform']
ph_qs = [q for q in questions if any(p in q.get('statement', '') or p in q.get('sampleInput', '') for p in phs)]

print(f"Total placeholder questions: {len(ph_qs)}")
for q in ph_qs:
    print(f"ID {q['id']:3d}: {q['name']:<45} | Topic: {q.get('topic')}")
