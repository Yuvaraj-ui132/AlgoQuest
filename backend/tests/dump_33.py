import json

with open('data/questions.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

with open('backend/data/test_cases.json', 'r', encoding='utf-8') as f:
    test_cases = json.load(f)

# Read metadata registry
with open('js/question-metadata.js', 'r', encoding='utf-8') as f:
    meta_code = f.read()

# Parse JSON-like metadata objects from question-metadata.js
phs = ['Solve the problem efficiently', 'See LeetCode', 'competitive programming platform']
ph_qids = [q['id'] for q in questions if any(p in q.get('statement', '') for p in phs)]

# Extract metadata for each from meta_code
import re
dump = []
for qid in ph_qids:
    q = next(item for item in questions if item['id'] == qid)
    tc = test_cases.get(str(qid), {})
    
    # regex extract from question-metadata.js
    pattern = rf'"{qid}":\s*\{{(.*?)\n\s*\}},?\n\s*"(?:{qid+1}|\d+)"'
    m = re.search(rf'\b{qid}:\s*\{{(.*?)\n\s*\}},?\n', meta_code, re.DOTALL)
    block = m.group(1) if m else ""
    
    fn_m = re.search(r'functionName:\s*"([^"]+)"', block)
    ret_m = re.search(r'returnType:\s*"([^"]+)"', block)
    cmp_m = re.search(r'compareMode:\s*"([^"]+)"', block)
    
    dump.append({
        "id": qid,
        "name": q["name"],
        "topic": q.get("topic"),
        "pattern": q.get("pattern"),
        "functionName": fn_m.group(1) if fn_m else None,
        "returnType": ret_m.group(1) if ret_m else None,
        "compareMode": cmp_m.group(1) if cmp_m else "ordered",
        "sampleTests": tc.get("sampleTests", []),
        "hiddenTestsCount": len(tc.get("hiddenTests", [])),
    })

print(json.dumps(dump, indent=2))
