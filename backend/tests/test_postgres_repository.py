"""
Test suite for Supabase / PostgreSQL repository layer.

Verifies:
1. User isolation: User A cannot read or modify User B's data.
2. CRUD operations: user bootstrap, progress, bookmarks, notes, editor drafts, compiler drafts.
3. Keyset pagination: deterministic newest-first ordering, cursor pagination, legacy ID compatibility.
4. Idempotent upserts: duplicate writes update rows rather than creating duplicates.
5. API response contract parity: output formats align with UserAllDataResponse and SubmissionHistoryResponse.
"""

import os
import unittest
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from app.services import supabase_service
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
from app.models.responses import UserAllDataResponse, SubmissionHistoryResponse


class TestPostgresRepository(unittest.IsolatedAsyncioTestCase):
    """Test suite running against a real dedicated PostgreSQL instance."""

    DB_URL = os.environ.get("TEST_DATABASE_URL", "postgresql://postgres@localhost:5433/algoquest_dev")

    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(cls.DB_URL, pool_pre_ping=True)
        Base.metadata.create_all(bind=cls.engine)
        cls.SessionFactory = sessionmaker(
            autocommit=False, autoflush=False, bind=cls.engine
        )
        # Inject engine and SessionFactory into supabase_service
        supabase_service._engine = cls.engine
        supabase_service._SessionFactory = cls.SessionFactory

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()

    def setUp(self):
        # Clean database prior to each test using real PostgreSQL CASCADE truncate
        with self.engine.begin() as conn:
            conn.execute(text("TRUNCATE TABLE users CASCADE;"))
        self.user_a = "user_alpha_123"
        self.user_b = "user_beta_456"

    def tearDown(self):
        with self.engine.begin() as conn:
            conn.execute(text("TRUNCATE TABLE users CASCADE;"))

    # ── User Isolation Tests ──────────────────────────────────────────────────

    async def test_user_data_isolation(self):
        """User A and User B must have strictly isolated data across all tables."""
        # Setup User A
        supabase_service.init_user_document(self.user_a, name="Alice", email="alice@algoquest.dev")
        await supabase_service.update_progress(self.user_a, question_id=1, solved=True)
        await supabase_service.set_bookmark(self.user_a, question_id=1, bookmarked=True)
        await supabase_service.save_note(self.user_a, question_id=1, content="Alice Note 1")
        await supabase_service.save_editor_code(self.user_a, question_id=1, language="python", code="x = 1")
        await supabase_service.save_general_compiler_code(self.user_a, language="python", code="print('A')")

        # Setup User B
        supabase_service.init_user_document(self.user_b, name="Bob", email="bob@algoquest.dev")
        await supabase_service.update_progress(self.user_b, question_id=2, solved=True)
        await supabase_service.set_bookmark(self.user_b, question_id=2, bookmarked=True)
        await supabase_service.save_note(self.user_b, question_id=2, content="Bob Note 2")
        await supabase_service.save_editor_code(self.user_b, question_id=2, language="cpp", code="int y = 2;")
        await supabase_service.save_general_compiler_code(self.user_b, language="cpp", code="cout << 2;")

        # Query User A
        data_a = await supabase_service.get_all_user_data(self.user_a)
        self.assertEqual(data_a["progress"]["solved"], [1])
        self.assertEqual(data_a["bookmarks"], [1])
        self.assertEqual(data_a["notes"], {"1": "Alice Note 1"})
        self.assertEqual(data_a["editor"]["1"]["language"], "python")
        self.assertEqual(data_a["general_compiler"]["python"], "print('A')")
        self.assertNotIn("cpp", data_a["general_compiler"])

        # Query User B
        data_b = await supabase_service.get_all_user_data(self.user_b)
        self.assertEqual(data_b["progress"]["solved"], [2])
        self.assertEqual(data_b["bookmarks"], [2])
        self.assertEqual(data_b["notes"], {"2": "Bob Note 2"})
        self.assertEqual(data_b["editor"]["2"]["language"], "cpp")
        self.assertEqual(data_b["general_compiler"]["cpp"], "cout << 2;")
        self.assertNotIn("python", data_b["general_compiler"])

    # ── User Bootstrap & Upsert Tests ─────────────────────────────────────────

    def test_init_user_document_idempotency(self):
        """First init creates user; subsequent inits update metadata without duplicates."""
        created = supabase_service.init_user_document(
            self.user_a, name="Alice Original", email="alice@algoquest.dev"
        )
        self.assertTrue(created)

        # Second init (reconciliation on login)
        created_again = supabase_service.init_user_document(
            self.user_a, name="Alice Updated"
        )
        self.assertFalse(created_again)

        session = self.SessionFactory()
        try:
            users = session.query(User).filter(User.id == self.user_a).all()
            self.assertEqual(len(users), 1)
            self.assertEqual(users[0].name, "Alice Updated")
            self.assertEqual(users[0].email, "alice@algoquest.dev")
        finally:
            session.close()

    # ── Progress CRUD & Upsert Tests ──────────────────────────────────────────

    async def test_progress_crud_and_upsert(self):
        """Updating progress multiple times updates single row and sets last_solved_at."""
        # Initial: rev1 set
        await supabase_service.update_progress(self.user_a, question_id=1, rev1=True)
        prog = await supabase_service.get_all_progress(self.user_a)
        self.assertIn("1", prog)
        self.assertFalse(prog["1"]["solved"])
        self.assertTrue(prog["1"]["rev1"])
        self.assertFalse(prog["1"]["rev2"])

        # Update: solved = True
        await supabase_service.update_progress(self.user_a, question_id=1, solved=True, rev2=True)
        prog = await supabase_service.get_all_progress(self.user_a)
        self.assertTrue(prog["1"]["solved"])
        self.assertTrue(prog["1"]["rev1"])
        self.assertTrue(prog["1"]["rev2"])
        self.assertIsNotNone(prog["1"]["lastSolved"])

        # Sync worker update
        supabase_service.update_progress_sync(self.user_a, question_id=2)
        prog = await supabase_service.get_all_progress(self.user_a)
        self.assertTrue(prog["2"]["solved"])

    async def test_legacy_progress_and_revisions_conflict_resolution(self):
        """Conflict resolution: merging legacy /progress and /revisions data uses logical OR."""
        # Simulate legacy data where progress had rev2=True but rev1=False,
        # and legacy revisions had rev1=True but rev2=False.
        progress_data = {"solved": True, "rev1": False, "rev2": True}
        revisions_data = {"rev1": True, "rev2": False}

        # Conflict resolution logic:
        merged_rev1 = progress_data.get("rev1", False) or revisions_data.get("rev1", False)
        merged_rev2 = progress_data.get("rev2", False) or revisions_data.get("rev2", False)
        merged_solved = progress_data.get("solved", False)

        await supabase_service.update_progress(
            self.user_a,
            question_id=99,
            solved=merged_solved,
            rev1=merged_rev1,
            rev2=merged_rev2,
        )

        prog = await supabase_service.get_all_progress(self.user_a)
        self.assertTrue(prog["99"]["solved"])
        self.assertTrue(prog["99"]["rev1"])  # Preserved from revisions!
        self.assertTrue(prog["99"]["rev2"])  # Preserved from progress!

    # ── Bookmarks CRUD Tests ──────────────────────────────────────────────────

    async def test_bookmarks_crud(self):
        """Adding and removing bookmarks works idempotently."""
        await supabase_service.set_bookmark(self.user_a, question_id=10, bookmarked=True)
        await supabase_service.set_bookmark(self.user_a, question_id=20, bookmarked=True)
        # Duplicate add
        await supabase_service.set_bookmark(self.user_a, question_id=10, bookmarked=True)

        bms = await supabase_service.get_all_bookmarks(self.user_a)
        self.assertEqual(sorted(bms), [10, 20])

        # Remove
        await supabase_service.set_bookmark(self.user_a, question_id=10, bookmarked=False)
        bms_after = await supabase_service.get_all_bookmarks(self.user_a)
        self.assertEqual(bms_after, [20])

    # ── Notes & Editor Drafts Tests ───────────────────────────────────────────

    async def test_notes_and_editor_drafts(self):
        """Notes and editor code save and overwrite cleanly."""
        # Note
        await supabase_service.save_note(self.user_a, question_id=5, content="Initial thoughts")
        note = await supabase_service.get_note(self.user_a, question_id=5)
        self.assertEqual(note, "Initial thoughts")

        await supabase_service.save_note(self.user_a, question_id=5, content="Refined O(N) approach")
        note_updated = await supabase_service.get_note(self.user_a, question_id=5)
        self.assertEqual(note_updated, "Refined O(N) approach")

        # Editor Draft
        await supabase_service.save_editor_code(self.user_a, question_id=5, language="python", code="class Sol: pass")
        draft = await supabase_service.get_editor_code(self.user_a, question_id=5)
        self.assertEqual(draft["language"], "python")
        self.assertEqual(draft["code"], "class Sol: pass")

    # ── Submissions & Pagination Tests ────────────────────────────────────────

    async def test_submissions_keyset_pagination(self):
        """25 submissions paginated in chunks of 10 must return newest-first without overlap."""
        base_time = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
        session = self.SessionFactory()
        try:
            supabase_service.init_user_document(self.user_a)
            # Insert 25 submissions with strictly incrementing timestamps
            for i in range(25):
                sub = Submission(
                    id=f"00000000-0000-0000-0000-{i:012d}",
                    user_id=self.user_a,
                    question_id=1,
                    execution_type="submit",
                    verdict="Accepted" if i % 2 == 0 else "Wrong Answer",
                    status_id=3 if i % 2 == 0 else 4,
                    language="python",
                    language_id=71,
                    passed_count=5,
                    total_count=5,
                    runtime="0.05s",
                    memory="5MB",
                    submitted_at=base_time + timedelta(minutes=i),
                    legacy_firestore_id=f"legacy_fs_{i:02d}",
                )
                session.add(sub)
            session.commit()
        finally:
            session.close()

        # Page 1: 10 items
        page1 = await supabase_service.get_submission_history(self.user_a, limit=10)
        self.assertEqual(len(page1["items"]), 10)
        self.assertTrue(page1["hasMore"])
        # Newest first: first item should be submission 24
        self.assertEqual(page1["items"][0]["id"], "legacy_fs_24")
        self.assertEqual(page1["items"][-1]["id"], "legacy_fs_15")
        cursor1 = page1["nextCursor"]
        self.assertEqual(cursor1, "legacy_fs_15")

        # Page 2: next 10 items
        page2 = await supabase_service.get_submission_history(self.user_a, limit=10, after_doc_id=cursor1)
        self.assertEqual(len(page2["items"]), 10)
        self.assertTrue(page2["hasMore"])
        self.assertEqual(page2["items"][0]["id"], "legacy_fs_14")
        self.assertEqual(page2["items"][-1]["id"], "legacy_fs_05")
        cursor2 = page2["nextCursor"]
        self.assertEqual(cursor2, "legacy_fs_05")

        # Page 3: last 5 items
        page3 = await supabase_service.get_submission_history(self.user_a, limit=10, after_doc_id=cursor2)
        self.assertEqual(len(page3["items"]), 5)
        self.assertFalse(page3["hasMore"])
        self.assertIsNone(page3["nextCursor"])
        self.assertEqual(page3["items"][0]["id"], "legacy_fs_04")
        self.assertEqual(page3["items"][-1]["id"], "legacy_fs_00")

    # ── API Contract Compatibility Tests ──────────────────────────────────────

    async def test_api_contract_compatibility(self):
        """get_all_user_data and get_submission_history must strictly parse into existing Pydantic models."""
        supabase_service.init_user_document(self.user_a)
        await supabase_service.update_progress(self.user_a, question_id=1, solved=True, rev1=True)
        await supabase_service.set_bookmark(self.user_a, question_id=1, bookmarked=True)
        await supabase_service.save_note(self.user_a, question_id=1, content="Test note")
        await supabase_service.save_editor_code(self.user_a, question_id=1, language="python", code="return 1")
        await supabase_service.save_general_compiler_code(self.user_a, language="python", code="print(1)")

        # 1. Validate UserAllDataResponse (matching GET /api/user/all constructor)
        raw_user_data = await supabase_service.get_all_user_data(self.user_a)
        validated_all_data = UserAllDataResponse(
            progress=raw_user_data["progress"],
            bookmarks={"bookmarks": raw_user_data["bookmarks"]},
            notes=raw_user_data["notes"],
            editor=raw_user_data["editor"],
            general_compiler=raw_user_data["general_compiler"],
        )
        self.assertEqual(validated_all_data.progress.solved, [1])
        self.assertEqual(validated_all_data.bookmarks.bookmarks, [1])
        self.assertEqual(validated_all_data.notes["1"], "Test note")

        # 2. Validate SubmissionHistoryResponse
        await supabase_service.record_submission(
            uid=self.user_a,
            question_id=1,
            verdict="Accepted",
            status_id=3,
            language_id=71,
            passed_count=5,
            total_count=5,
            runtime="0.02s",
            memory="4MB",
            compile_error=None,
        )
        raw_history = await supabase_service.get_submission_history(self.user_a, limit=10)
        validated_history = SubmissionHistoryResponse.model_validate(raw_history)
        self.assertEqual(len(validated_history.items), 1)
        self.assertEqual(validated_history.items[0].verdict, "Accepted")
        self.assertEqual(validated_history.items[0].language, "python")

    # ── Session Lifecycle & Submission Persistence Regression Tests ───────────

    def test_submission_persistence_existing_user(self):
        """A user who already exists must have their submission recorded and committed."""
        supabase_service.init_user_document(self.user_a)
        supabase_service.record_submission_sync(
            uid=self.user_a,
            question_id=1,
            verdict="Accepted",
            status_id=3,
            language_id=71,
            passed_count=5,
            total_count=5,
            runtime="0.015s",
            memory="3.2 MB",
            compile_error=None,
        )
        session = supabase_service.get_db_session()
        try:
            subs = session.query(Submission).filter_by(user_id=self.user_a).all()
            self.assertEqual(len(subs), 1)
            self.assertEqual(subs[0].verdict, "Accepted")
            self.assertEqual(subs[0].question_id, 1)
        finally:
            session.close()

    def test_submission_persistence_uninitialized_user(self):
        """A user who does not exist must be initialized and have their submission recorded without error."""
        uninit_uid = "uninit_user_999"
        # Confirm user does NOT exist
        session = supabase_service.get_db_session()
        try:
            self.assertIsNone(session.query(User).filter_by(id=uninit_uid).first())
        finally:
            session.close()

        # Record submission for uninitialized user
        supabase_service.record_submission_sync(
            uid=uninit_uid,
            question_id=2,
            verdict="Wrong Answer",
            status_id=4,
            language_id=76,
            passed_count=2,
            total_count=5,
            runtime="0.008s",
            memory="2.1 MB",
            compile_error=None,
        )

        # Verify user was automatically created and submission was persisted
        session = supabase_service.get_db_session()
        try:
            user = session.query(User).filter_by(id=uninit_uid).first()
            self.assertIsNotNone(user)
            subs = session.query(Submission).filter_by(user_id=uninit_uid).all()
            self.assertEqual(len(subs), 1)
            self.assertEqual(subs[0].verdict, "Wrong Answer")
            self.assertEqual(subs[0].question_id, 2)
        finally:
            session.close()

    def test_submission_persistence_failure_rollback(self):
        """Database failure during persistence must cleanly rollback without leaving dangling state."""
        invalid_uid = "user_fail_test"
        # Mock / pass a invalid question_id violating check constraint (question_id > 0)
        with self.assertRaises(Exception):
            supabase_service.record_submission_sync(
                uid=invalid_uid,
                question_id=-99,  # Violates CHECK (question_id > 0)
                verdict="Accepted",
                status_id=3,
                language_id=71,
                passed_count=0,
                total_count=0,
                runtime="--",
                memory="--",
            )

        # Confirm nothing was committed
        session = supabase_service.get_db_session()
        try:
            subs = session.query(Submission).filter_by(user_id=invalid_uid).all()
            self.assertEqual(len(subs), 0)
        finally:
            session.close()

    async def test_independent_sessions_during_concurrent_operations(self):
        """Concurrent coroutines must operate on independent sessions without cross-talk or closed-session errors."""
        async def operation_a():
            supabase_service.init_user_document("concurrent_user_a")
            for i in range(1, 4):
                await supabase_service.update_progress("concurrent_user_a", question_id=i, solved=True)
                await asyncio.sleep(0.01)
            return await supabase_service.get_all_progress("concurrent_user_a")

        async def operation_b():
            supabase_service.init_user_document("concurrent_user_b")
            for i in range(1, 4):
                await supabase_service.set_bookmark("concurrent_user_b", question_id=i, bookmarked=True)
                await asyncio.sleep(0.01)
            return await supabase_service.get_all_bookmarks("concurrent_user_b")

        async def operation_c():
            # Uninitialized user concurrent submission
            await asyncio.sleep(0.02)
            supabase_service.record_submission_sync(
                uid="concurrent_user_c",
                question_id=5,
                verdict="Accepted",
                status_id=3,
                language_id=71,
                passed_count=3,
                total_count=3,
                runtime="0.01s",
                memory="2MB",
            )
            return await supabase_service.get_submission_history("concurrent_user_c")

        res_a, res_b, res_c = await asyncio.gather(operation_a(), operation_b(), operation_c())
        self.assertEqual(len(res_a), 3)
        self.assertEqual(len(res_b), 3)
        self.assertEqual(len(res_c["items"]), 1)


if __name__ == "__main__":
    unittest.main()
