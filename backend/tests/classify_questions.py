import json

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

print(f"Total questions: {len(questions)}")

# Check each question
non_placeholder_count = 0
placeholder_count = 0

for q in questions:
    s = q.get('statement', '')
    if "Solve the problem efficiently using an appropriate algorithm." in s or "See LeetCode" in s:
        placeholder_count += 1
    else:
        non_placeholder_count += 1

print(f"Valid statements: {non_placeholder_count}")
print(f"Placeholder statements: {placeholder_count}")
