"""
Tests for Idempotent Firestore-to-PostgreSQL Migration on Real PostgreSQL.

Verifies:
1. Dry-run mode audits data without committing changes.
2. Ingestion of sanitized source documents into PostgreSQL.
3. Re-running migration is completely idempotent (no duplicates, no count changes).
4. Timestamp protection: newer PostgreSQL writes are never overwritten by stale Firestore data.
"""

import os
import unittest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.services.supabase_service import (
    Base,
    User,
    UserProgress,
    UserBookmark,
    UserNote,
    UserEditorDraft,
    UserCompilerDraft,
    Submission,
)
from scripts.migrate_firestore_to_postgres import migrate_data


class TestIdempotentMigration(unittest.TestCase):
    """Verifies migration idempotency and timestamp safety on live PostgreSQL."""

    DB_URL = os.environ.get("TEST_DATABASE_URL", "postgresql://postgres@localhost:5433/algoquest_dev")

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(cls.DB_URL, pool_pre_ping=True)
        Base.metadata.create_all(bind=cls.engine)

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()

    def setUp(self):
        with self.engine.begin() as conn:
            conn.execute(text("TRUNCATE TABLE users CASCADE;"))

        self.t0 = datetime(2026, 3, 1, 10, 0, 0, tzinfo=timezone.utc)
        self.sanitized_data = {
            "users": {
                "user_migrated_1": {
                    "name": "Jane Developer",
                    "email": "jane@algoquest.dev",
                    "photoURL": "https://example.com/jane.png",
                    "createdAt": self.t0.isoformat(),
                    "progress": {
                        "1": {"solved": True, "rev1": True, "rev2": False, "updatedAt": self.t0.isoformat()},
                        "10": {"solved": False, "rev1": False, "rev2": True},
                    },
                    "revisions": {
                        "1": {"rev1": False, "rev2": True},  # Conflict: progress has rev1, revisions has rev2
                    },
                    "bookmarks": {
                        "1": {"bookmarked": True},
                        "5": {"bookmarked": False},  # Inactive: should NOT be inserted
                    },
                    "notes": {
                        "1": {"content": "Jane's optimal O(N) hashmap note"},
                    },
                    "editor": {
                        "1": {"language": "python", "code": "def solve(): return True"},
                    },
                    "general_compiler": {
                        "python": {"code": "print('Hello World')"},
                    },
                    "submissions": {
                        "sub_firestore_001": {
                            "questionId": 1,
                            "verdict": "Accepted",
                            "statusId": 3,
                            "language": "python",
                            "languageId": 71,
                            "passedCount": 10,
                            "totalCount": 10,
                            "runtime": "8ms",
                            "memory": "6MB",
                            "submittedAt": self.t0.isoformat(),
                        }
                    },
                }
            }
        }

    def tearDown(self):
        with self.engine.begin() as conn:
            conn.execute(text("TRUNCATE TABLE users CASCADE;"))

    def test_dry_run_does_not_commit(self):
        """Dry-run must report metrics without persisting rows to PostgreSQL."""
        report = migrate_data(self.sanitized_data, self.engine, dry_run=True)
        self.assertEqual(report["status"], "SUCCESS")
        self.assertTrue(report["dry_run"])
        self.assertEqual(report["migrated_counts"]["users"], 1)

        SessionLocal = sessionmaker(bind=self.engine)
        session = SessionLocal()
        try:
            self.assertEqual(session.query(User).count(), 0)
            self.assertEqual(session.query(UserProgress).count(), 0)
        finally:
            session.close()

    def test_idempotent_reexecution_and_timestamp_protection(self):
        """
        1. Run migration and verify row counts.
        2. Re-run migration and verify NO duplicates are created.
        3. Update a record in PostgreSQL with a newer timestamp.
        4. Re-run migration and verify the newer record was preserved and not overwritten.
        """
        # Step 1: Initial migration
        r1 = migrate_data(self.sanitized_data, self.engine, dry_run=False)
        self.assertEqual(r1["status"], "SUCCESS")
        self.assertEqual(r1["destination_counts"]["users"], 1)
        self.assertEqual(r1["destination_counts"]["user_progress"], 2)
        self.assertEqual(r1["destination_counts"]["user_bookmarks"], 1)
        self.assertEqual(r1["destination_counts"]["user_notes"], 1)
        self.assertEqual(r1["destination_counts"]["user_editor_drafts"], 1)
        self.assertEqual(r1["destination_counts"]["user_compiler_drafts"], 1)
        self.assertEqual(r1["destination_counts"]["submissions"], 1)

        # Step 2: Re-run migration immediately
        r2 = migrate_data(self.sanitized_data, self.engine, dry_run=False)
        self.assertEqual(r2["status"], "SUCCESS")
        # Counts must be completely unchanged
        self.assertEqual(r2["destination_counts"]["users"], 1)
        self.assertEqual(r2["destination_counts"]["user_progress"], 2)
        self.assertEqual(r2["destination_counts"]["user_bookmarks"], 1)
        self.assertEqual(r2["destination_counts"]["user_notes"], 1)
        self.assertEqual(r2["destination_counts"]["user_editor_drafts"], 1)
        self.assertEqual(r2["destination_counts"]["user_compiler_drafts"], 1)
        self.assertEqual(r2["destination_counts"]["submissions"], 1)

        # Step 3: Simulate newer write in PostgreSQL post-cutover
        SessionLocal = sessionmaker(bind=self.engine)
        session = SessionLocal()
        try:
            newer_time = self.t0 + timedelta(days=5)
            prog_row = session.query(UserProgress).filter_by(user_id="user_migrated_1", question_id=1).first()
            prog_row.rev2 = True  # User checked rev2 in PostgreSQL post-cutover
            prog_row.updated_at = newer_time
            session.commit()
        finally:
            session.close()

        # Step 4: Re-run migration with older Firestore data (which had rev2=False)
        r3 = migrate_data(self.sanitized_data, self.engine, dry_run=False)
        self.assertEqual(r3["status"], "SUCCESS")
        self.assertGreaterEqual(r3["skipped_newer_existing"], 1)

        # Verify PostgreSQL retained newer post-cutover value
        session = SessionLocal()
        try:
            prog_row = session.query(UserProgress).filter_by(user_id="user_migrated_1", question_id=1).first()
            self.assertTrue(prog_row.rev2, "Newer PostgreSQL progress data must not be overwritten by older Firestore state")
        finally:
            session.close()


if __name__ == "__main__":
    unittest.main()
