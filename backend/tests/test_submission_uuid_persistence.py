"""
test_submission_uuid_persistence.py - Regression tests for Submission UUID persistence and API compatibility.

Verifies:
1. PostgreSQL dialect compilation renders %(id)s::UUID and binds Python uuid.UUID objects.
2. DDL compilation for PostgreSQL dialect creates id as UUID, matching V1__initial_schema.sql.
3. GUID TypeDecorator correctly binds uuid.UUID and str across both PostgreSQL and SQLite dialects.
4. Submission history serialization and pagination output string IDs matching SubmissionHistoryResponse.
5. Legacy Firestore document IDs remain preserved without breaking keyset cursor pagination.
"""

import uuid
import time
import unittest
import asyncio
from datetime import datetime, timezone

from sqlalchemy import create_engine, select, insert
from sqlalchemy.dialects import postgresql, sqlite
from sqlalchemy.schema import CreateTable
from sqlalchemy.orm import sessionmaker

from app.services.supabase_service import Base, Submission, User, GUID
from app.services import supabase_service
from app.models.responses import SubmissionHistoryResponse, SubmissionHistoryItem


class TestSubmissionUUIDPersistence(unittest.IsolatedAsyncioTestCase):
    """Regression test suite for UUID persistence and type safety."""

    def test_postgresql_ddl_and_insert_statement_compilation(self):
        """PostgreSQL DDL must use UUID and INSERT must compile with ::UUID cast and uuid.UUID param."""
        # 1. DDL check
        ddl = str(CreateTable(Submission.__table__).compile(dialect=postgresql.dialect()))
        self.assertIn("id UUID NOT NULL", ddl)
        self.assertNotIn("\tid VARCHAR", ddl)

        # 2. INSERT statement compilation
        sub_uuid = uuid.uuid4()
        stmt = insert(Submission).values(
            id=sub_uuid,
            user_id="test_uid_123",
            question_id=7,
            execution_type="submit",
            verdict="Accepted",
            status_id=3,
            language="python",
            language_id=71,
            passed_count=5,
            total_count=5,
            runtime="0.015s",
            memory="3.2 MB",
        )
        compiled = stmt.compile(dialect=postgresql.dialect())
        compiled_sql = str(compiled)

        # Assert PostgreSQL receives %(id)s::UUID rather than an untyped/varchar parameter
        self.assertIn("%(id)s::UUID", compiled_sql)

        # Assert the parameter bound is a Python uuid.UUID instance
        bound_id = compiled.params["id"]
        self.assertIsInstance(bound_id, uuid.UUID)
        self.assertEqual(bound_id, sub_uuid)

    def test_guid_type_decorator_dialect_handling(self):
        """GUID TypeDecorator must adapt uuid.UUID and string representations properly for both dialects."""
        guid_type = GUID()
        pg_dialect = postgresql.dialect()
        sqlite_dialect = sqlite.dialect()

        sample_uuid = uuid.uuid4()
        sample_str = str(sample_uuid)

        # PostgreSQL: bind params should always be Python uuid.UUID
        self.assertEqual(guid_type.process_bind_param(sample_uuid, pg_dialect), sample_uuid)
        self.assertEqual(guid_type.process_bind_param(sample_str, pg_dialect), sample_uuid)
        self.assertIsNone(guid_type.process_bind_param(None, pg_dialect))

        # SQLite: bind params must be str so sqlite3 driver does not raise InterfaceError
        self.assertEqual(guid_type.process_bind_param(sample_uuid, sqlite_dialect), sample_str)
        self.assertEqual(guid_type.process_bind_param(sample_str, sqlite_dialect), sample_str)
        self.assertIsNone(guid_type.process_bind_param(None, sqlite_dialect))

        # Result value decoding:
        # 1. Native uuid.UUID returned as-is
        self.assertEqual(guid_type.process_result_value(sample_uuid, pg_dialect), sample_uuid)
        # 2. None returns None
        self.assertIsNone(guid_type.process_result_value(None, pg_dialect))
        # 3. Valid UUID string parsed to uuid.UUID
        self.assertEqual(guid_type.process_result_value(sample_str, pg_dialect), sample_uuid)
        # 4. Non-UUID legacy string safely preserved without exception
        self.assertEqual(guid_type.process_result_value("legacy_firestore_middle_doc", pg_dialect), "legacy_firestore_middle_doc")
        # 5. 16-byte raw UUID bytes parsed to uuid.UUID
        self.assertEqual(guid_type.process_result_value(sample_uuid.bytes, pg_dialect), sample_uuid)
        # 6. Encoded string bytes parsed to uuid.UUID
        self.assertEqual(guid_type.process_result_value(sample_str.encode("utf-8"), pg_dialect), sample_uuid)

    async def test_submission_lifecycle_and_api_contract_parity(self):
        """Submissions recorded via supabase_service must serialize string IDs compatible with API."""
        # Setup clean in-memory SQLite engine
        test_engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(test_engine)
        TestSession = sessionmaker(bind=test_engine)

        orig_engine = supabase_service._engine
        orig_session_factory = supabase_service._SessionFactory
        supabase_service._engine = test_engine
        supabase_service._SessionFactory = TestSession

        try:
            uid = "test_user_uuid_parity"
            supabase_service.init_user_document(uid)

            # Record a standard UUID submission
            supabase_service.record_submission_sync(
                uid=uid,
                question_id=7,
                verdict="Accepted",
                status_id=3,
                language_id=71,
                passed_count=5,
                total_count=5,
                runtime="0.015s",
                memory="3.2 MB",
                compile_error=None,
            )
            time.sleep(0.02)

            # Record a legacy-migrated submission with legacy_firestore_id
            supabase_service.record_submission_sync(
                uid=uid,
                question_id=7,
                verdict="Wrong Answer",
                status_id=4,
                language_id=71,
                passed_count=3,
                total_count=5,
                runtime="0.020s",
                memory="3.5 MB",
                compile_error=None,
                legacy_firestore_id="legacy_firestore_doc_101",
            )

            # Query history via service
            history = await supabase_service.get_submission_history(uid=uid, limit=10)

            # Validate against Pydantic SubmissionHistoryResponse model
            validated = SubmissionHistoryResponse.model_validate(history)
            self.assertEqual(len(validated.items), 2)

            # Newest submission should be the legacy one (recorded second)
            item_legacy = validated.items[0]
            self.assertEqual(item_legacy.id, "legacy_firestore_doc_101")
            self.assertIsInstance(item_legacy.id, str)

            # First submission should have a valid 36-char string UUID
            item_uuid = validated.items[1]
            self.assertIsInstance(item_uuid.id, str)
            # Verify string parses into a valid UUID
            parsed_uuid = uuid.UUID(item_uuid.id)
            self.assertEqual(str(parsed_uuid), item_uuid.id)
            self.assertEqual(item_uuid.verdict, "Accepted")
            self.assertEqual(item_uuid.passedCount, 5)

        finally:
            supabase_service._engine = orig_engine
            supabase_service._SessionFactory = orig_session_factory
            test_engine.dispose()

    async def test_empty_history_returns_clean_response(self):
        """Querying submission history for user with no records must return items: [], hasMore: False, nextCursor: None."""
        test_engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(test_engine)
        TestSession = sessionmaker(bind=test_engine)

        orig_engine = supabase_service._engine
        orig_session_factory = supabase_service._SessionFactory
        supabase_service._engine = test_engine
        supabase_service._SessionFactory = TestSession

        try:
            uid = "test_user_empty_hist"
            supabase_service.init_user_document(uid)

            res = await supabase_service.get_submission_history(uid=uid, limit=20)
            self.assertEqual(res["items"], [])
            self.assertFalse(res["hasMore"])
            self.assertIsNone(res["nextCursor"])

            validated = SubmissionHistoryResponse.model_validate(res)
            self.assertEqual(len(validated.items), 0)
            self.assertFalse(validated.hasMore)
            self.assertIsNone(validated.nextCursor)
        finally:
            supabase_service._engine = orig_engine
            supabase_service._SessionFactory = orig_session_factory
            test_engine.dispose()

    async def test_history_pagination_with_uuid_and_legacy_cursors(self):
        """Pagination must work across multiple pages using both UUID string cursors and legacy Firestore ID cursors."""
        test_engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(test_engine)
        TestSession = sessionmaker(bind=test_engine)

        orig_engine = supabase_service._engine
        orig_session_factory = supabase_service._SessionFactory
        supabase_service._engine = test_engine
        supabase_service._SessionFactory = TestSession

        try:
            uid = "test_user_multi_cursor_pag"
            supabase_service.init_user_document(uid)

            # Insert 3 submissions in chronological order
            # Sub 1 (oldest): UUID submission
            supabase_service.record_submission_sync(
                uid=uid, question_id=1, verdict="Accepted", status_id=3,
                language_id=71, passed_count=5, total_count=5, runtime="0.01s", memory="1MB"
            )
            time.sleep(0.02)
            # Sub 2 (middle): Legacy migrated submission
            supabase_service.record_submission_sync(
                uid=uid, question_id=2, verdict="Wrong Answer", status_id=4,
                language_id=71, passed_count=3, total_count=5, runtime="0.02s", memory="2MB",
                legacy_firestore_id="legacy_firestore_middle_doc"
            )
            time.sleep(0.02)
            # Sub 3 (newest): UUID submission
            supabase_service.record_submission_sync(
                uid=uid, question_id=3, verdict="Accepted", status_id=3,
                language_id=71, passed_count=5, total_count=5, runtime="0.03s", memory="3MB"
            )

            # 1. Fetch Page 1 with limit=1: newest submission (Sub 3, UUID)
            p1 = await supabase_service.get_submission_history(uid=uid, limit=1)
            self.assertEqual(len(p1["items"]), 1)
            self.assertTrue(p1["hasMore"])
            uuid_cursor_p1 = p1["nextCursor"]
            self.assertIsNotNone(uuid_cursor_p1)
            # Validate cursor parses as UUID
            self.assertIsInstance(uuid.UUID(uuid_cursor_p1), uuid.UUID)

            # 2. Fetch Page 2 using UUID string cursor: should return Sub 2 (legacy)
            p2 = await supabase_service.get_submission_history(uid=uid, limit=1, after_doc_id=uuid_cursor_p1)
            self.assertEqual(len(p2["items"]), 1)
            self.assertTrue(p2["hasMore"])
            self.assertEqual(p2["items"][0]["id"], "legacy_firestore_middle_doc")
            legacy_cursor_p2 = p2["nextCursor"]
            self.assertEqual(legacy_cursor_p2, "legacy_firestore_middle_doc")

            # 3. Fetch Page 3 using legacy string cursor: should return Sub 1 (oldest UUID)
            p3 = await supabase_service.get_submission_history(uid=uid, limit=1, after_doc_id=legacy_cursor_p2)
            self.assertEqual(len(p3["items"]), 1)
            self.assertFalse(p3["hasMore"])
            self.assertIsNone(p3["nextCursor"])

            # 4. Fetch beyond last page using oldest UUID cursor: should return empty list
            p4 = await supabase_service.get_submission_history(uid=uid, limit=1, after_doc_id=p3["items"][0]["id"])
            self.assertEqual(len(p4["items"]), 0)
            self.assertFalse(p4["hasMore"])
            self.assertIsNone(p4["nextCursor"])

        finally:
            supabase_service._engine = orig_engine
            supabase_service._SessionFactory = orig_session_factory
            test_engine.dispose()



if __name__ == "__main__":
    unittest.main()
