import json
import re

with open('data/questions.json', 'r', encoding='utf-8') as f:
    qs = json.load(f)

print('Total questions:', len(qs))
placeholders = [q['id'] for q in qs if 'Solve the problem efficiently' in q.get('statement', '')]
print('Remaining placeholders:', len(placeholders))

tcs_qs = [q['id'] for q in qs if 'tcs' in q]
print('Remaining tcs keys in questions.json:', len(tcs_qs))

with open('data/tiers.json', 'r', encoding='utf-8') as f:
    t_text = f.read()

print('Occurrences of tcs in tiers.json:', len(re.findall(r'tcs', t_text, re.I)))

# Check all 174 have non-empty statements
empty_statements = [q['id'] for q in qs if not q.get('statement', '').strip()]
print('Empty statements:', len(empty_statements))
