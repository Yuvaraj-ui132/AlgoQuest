"""
test_history_xss_regression.py

Automated pytest test ensuring history.js XSS sanitization regression tests
execute and pass cleanly via Node.js.
"""

import os
import subprocess

def test_history_js_xss_regression_passes():
    """Execute test_history_xss.js and assert returncode 0 with success output."""
    test_file = os.path.join(os.path.dirname(__file__), "test_history_xss.js")
    assert os.path.exists(test_file), f"Test file not found: {test_file}"

    # Run node test_history_xss.js
    res = subprocess.run(
        ["node", test_file],
        capture_output=True,
        text=True,
    )

    assert res.returncode == 0, f"History XSS test failed with code {res.returncode}:\n{res.stderr}\n{res.stdout}"
    assert "All History XSS & Sanitization Regression Tests Passed successfully!" in res.stdout
