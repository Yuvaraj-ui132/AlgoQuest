import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

EXTENSIONS = ('.html', '.js', '.css', '.json', '.md')
EXCLUDE_DIRS = ('.git', 'node_modules', '.firebase', '__pycache__', '.system_generated')

tcs_pattern = re.compile(r'\btcs\b', re.IGNORECASE)

files_with_tcs = {}

for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for file in files:
        if file.endswith(EXTENSIONS):
            fpath = os.path.join(root, file).replace('\\', '/')
            try:
                with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                    for lno, line in enumerate(f, 1):
                        if tcs_pattern.search(line):
                            if fpath not in files_with_tcs:
                                files_with_tcs[fpath] = []
                            files_with_tcs[fpath].append((lno, line.strip()))
            except Exception:
                pass

print(f"Total files containing 'tcs': {len(files_with_tcs)}")
for fpath, lines in files_with_tcs.items():
    print(f"\n=== {fpath} ({len(lines)} matches) ===")
    for lno, line in lines[:15]:
        print(f"  Line {lno}: {line[:100]}")
    if len(lines) > 15:
        print(f"  ... and {len(lines) - 15} more")
