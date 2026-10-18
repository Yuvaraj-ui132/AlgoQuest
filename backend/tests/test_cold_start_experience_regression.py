"""
test_cold_start_experience_regression.py

Automated pytest test ensuring cold-start waiting experience regression tests
execute and pass cleanly via Node.js:
- Professional messaging
- Loading spinner lifecycle
- Health check polling termination
- Deduplication across React re-renders / multi-mounts
- Safe retries and Retry action
- Non-idempotent mutation protection
"""

import os
import subprocess

def test_cold_start_experience_passes():
    """Execute test_cold_start_experience.js and assert returncode 0 with success output."""
    test_file = os.path.join(os.path.dirname(__file__), "test_cold_start_experience.js")
    assert os.path.exists(test_file), f"Test file not found: {test_file}"

    res = subprocess.run(
        ["node", test_file],
        capture_output=True,
        text=True,
    )

    assert res.returncode == 0, f"Cold-start test failed with code {res.returncode}:\n{res.stderr}\n{res.stdout}"
    assert "All Cold-Start Waiting Experience Tests Passed successfully!" in res.stdout


def test_toast_lifecycle_passes():
    """Execute test_toast_lifecycle.js and assert returncode 0 with success output."""
    test_file = os.path.join(os.path.dirname(__file__), "test_toast_lifecycle.js")
    assert os.path.exists(test_file), f"Test file not found: {test_file}"

    res = subprocess.run(
        ["node", test_file],
        capture_output=True,
        text=True,
    )

    assert res.returncode == 0, f"Toast lifecycle test failed with code {res.returncode}:\n{res.stderr}\n{res.stdout}"
    assert "All Toast Lifecycle Tests Passed successfully!" in res.stdout

