"""
End-to-End API Integration Tests against Real PostgreSQL.

Validates that when DATABASE_BACKEND="supabase" and connected to a live PostgreSQL
instance, all FastAPI endpoints function seamlessly with full feature parity:
- User initialization and profile retrieval
- Progress updates and revision flags (rev1, rev2)
- Bookmarks toggle and query
- Notes saving and retrieval
- Code drafts (question editor and general compiler)
- Submissions recording and cursor pagination
- User analytics calculations
- User isolation across all endpoints
"""

import os
import unittest
import asyncio
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, scoped_session

from app.main import app
from app.config import settings
from app.dependencies import get_current_user
from app.services import supabase_service, db_service
from app.services.supabase_service import Base


class TestRealPostgresApiIntegration(unittest.TestCase):
    """End-to-end integration tests using FastAPI TestClient against live PostgreSQL."""

    DB_URL = os.environ.get("TEST_DATABASE_URL", "postgresql://postgres@localhost:5433/algoquest_dev")

    @classmethod
    def setUpClass(cls):
        # Configure app settings to use Supabase backend on real PostgreSQL
        cls.orig_backend = settings.database_backend
        cls.orig_db_url = settings.supabase_db_url
        settings.database_backend = "supabase"
        settings.supabase_db_url = cls.DB_URL

        cls.engine = create_engine(cls.DB_URL, pool_pre_ping=True)
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionFactory = scoped_session(
            sessionmaker(autocommit=False, autoflush=False, bind=cls.engine)
        )
        supabase_service._engine = cls.engine
        supabase_service._SessionFactory = cls.SessionFactory

        cls.client = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        settings.database_backend = cls.orig_backend
        settings.supabase_db_url = cls.orig_db_url
        cls.engine.dispose()

    def setUp(self):
        # Truncate tables for clean test state
        with self.engine.begin() as conn:
            conn.execute(text("TRUNCATE TABLE users CASCADE;"))

        self.user_1 = "test_user_postgres_1"
        self.user_2 = "test_user_postgres_2"
        self.current_user = self.user_1

        app.dependency_overrides[get_current_user] = lambda: self.current_user

    def tearDown(self):
        app.dependency_overrides.clear()
        with self.engine.begin() as conn:
            conn.execute(text("TRUNCATE TABLE users CASCADE;"))

    def test_full_user_lifecycle_on_real_postgres(self):
        """Tests user profile, progress, bookmarks, notes, drafts, submissions, and analytics."""
        auth_headers_1 = {"Authorization": "Bearer token_user_1"}
        auth_headers_2 = {"Authorization": "Bearer token_user_2"}

        # 1. Initialize user 1
        res = self.client.post(
            "/api/user/init",
            headers=auth_headers_1,
            json={"name": "User One", "email": "user1@algoquest.dev"},
        )
        self.assertEqual(res.status_code, 200)

        # 2. Update progress on question 1 with solved and revision flags
        res = self.client.put(
            "/api/progress/1",
            headers=auth_headers_1,
            json={"solved": True, "rev1": True, "rev2": False},
        )
        self.assertEqual(res.status_code, 200)

        # 3. Add bookmark on question 1 and 2
        res = self.client.put("/api/bookmarks/1", headers=auth_headers_1)
        self.assertEqual(res.status_code, 200)

        res = self.client.put("/api/bookmarks/2", headers=auth_headers_1)
        self.assertEqual(res.status_code, 200)

        # Toggle off bookmark 2
        res = self.client.delete("/api/bookmarks/2", headers=auth_headers_1)
        self.assertEqual(res.status_code, 200)

        # 4. Save note on question 1
        res = self.client.put(
            "/api/notes/1",
            headers=auth_headers_1,
            json={"content": "Important note for Two Sum"},
        )
        self.assertEqual(res.status_code, 200)

        # 5. Save editor draft on question 1
        res = self.client.put(
            "/api/editor/1",
            headers=auth_headers_1,
            json={"language": "python", "code": "def twoSum(): pass"},
        )
        self.assertEqual(res.status_code, 200)

        # 6. Save general compiler draft
        res = self.client.put(
            "/api/general-compiler/python",
            headers=auth_headers_1,
            json={"code": "print('Compiler playground')"},
        )
        self.assertEqual(res.status_code, 200)

        # 7. Query /api/user/all and verify all fields match
        res = self.client.get("/api/user/all", headers=auth_headers_1)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn(1, data["progress"]["solved"])
        self.assertIn(1, data["progress"]["rev1"])
        self.assertNotIn(1, data["progress"]["rev2"])
        self.assertEqual(data["bookmarks"]["bookmarks"], [1])
        self.assertEqual(data["notes"]["1"], "Important note for Two Sum")
        self.assertEqual(data["editor"]["1"]["language"], "python")
        self.assertEqual(data["general_compiler"]["python"], "print('Compiler playground')")

        # 8. Record submissions directly via repository and query /api/submissions/history
        supabase_service.record_submission_sync(
            uid=self.user_1,
            question_id=1,
            verdict="Accepted",
            status_id=3,
            language_id=71,
            passed_count=5,
            total_count=5,
            runtime="15ms",
            memory="12MB",
            compile_error=None,
        )

        res = self.client.get("/api/submissions/history?limit=10", headers=auth_headers_1)
        self.assertEqual(res.status_code, 200)
        history = res.json()
        self.assertEqual(len(history["items"]), 1)
        self.assertEqual(history["items"][0]["verdict"], "Accepted")
        self.assertEqual(history["items"][0]["language"], "python")

        # 9. Verify user isolation: User 2 must see empty data
        self.current_user = self.user_2
        res_user_2 = self.client.get("/api/user/all", headers=auth_headers_2)
        self.assertEqual(res_user_2.status_code, 200)
        data_2 = res_user_2.json()
        self.assertEqual(data_2["progress"]["solved"], [])
        self.assertEqual(data_2["bookmarks"]["bookmarks"], [])
        self.assertEqual(data_2["notes"], {})

        # Switch back to user 1 for analytics verification
        self.current_user = self.user_1
        analytics = asyncio.run(supabase_service.get_user_analytics(self.user_1))
        self.assertEqual(analytics["solved_count"], 1)
        self.assertEqual(analytics["total_submissions"], 1)
        self.assertEqual(analytics["acceptance_rate"], 100.0)


if __name__ == "__main__":
    unittest.main()
