import json

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

# Inspect statement quality and structure
issues = []
for q in questions:
    qid = q['id']
    name = q['name']
    stmt = q.get('statement', '')
    constraints = q.get('constraints', '')
    sample_in = q.get('sampleInput', '')
    sample_out = q.get('sampleOutput', '')

    # Check length
    if len(stmt) < 50:
        issues.append((qid, name, f"Short statement ({len(stmt)} chars): {stmt}"))
    if not constraints or len(constraints) < 5:
        issues.append((qid, name, f"Short constraints: {constraints}"))
    if not sample_in:
        issues.append((qid, name, "Missing sampleInput"))
    if not sample_out:
        issues.append((qid, name, "Missing sampleOutput"))

print(f"Total issues found: {len(issues)}")
for iss in issues[:20]:
    print(iss)

# Print a few full questions to see their current statement structure
print("\n--- SAMPLE QUESTION 1 ---")
print(json.dumps(questions[0], indent=2))
print("\n--- SAMPLE QUESTION 50 ---")
print(json.dumps(questions[49], indent=2))
print("\n--- SAMPLE QUESTION 100 ---")
print(json.dumps(questions[99], indent=2))
print("\n--- SAMPLE QUESTION 174 ---")
print(json.dumps(questions[173], indent=2))
