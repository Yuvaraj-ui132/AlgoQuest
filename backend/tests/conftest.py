"""
Pytest configuration for AlgoQuest backend test suite.
Ensures APP_ENV defaults to 'test' during automated test runs.
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
os.environ.setdefault("APP_ENV", "test")

from app.config import settings
settings.app_env = "test"
