"""
Phase 3 Tests — Supabase Migration Completion.

Tests:
1. Supabase Service CRUD & Entity Persistence:
   - User initialization (idempotent bootstrap, lastLogin update)
   - Progress tracking (solved, rev1, rev2, update_progress_sync)
   - Bookmarks (add, idempotent re-add, remove)
   - Notes (create, get, overwrite, default empty string)
   - Editor code drafts (DSA per-question)
   - General compiler drafts (per-language)
   - Consolidated user data bulk payload (get_all_user_data)
   - Submissions recording with language ID 54 and 76 mapping to "cpp"
   - Keyset pagination with UUID cursors and legacy Firestore ID cursors
   - User analytics calculation
2. Unified Database Gateway (db_service):
   - Switch between 'supabase' and 'firestore' backend
3. Migration Script (migrate_firestore_to_postgres.py):
   - Dry run rollback safety
   - Parity import with Logical OR conflict resolution for revisions
   - Deduplication and timestamp protection
4. Reconciliation Rollback Script (reconciliation_rollback.py):
   - Reverse delta extraction from SQL to Firestore
   - Physical deletion detection (e.g. deleted bookmarks)
"""

import os
import sys
import uuid
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services import supabase_service, db_service, firestore_service
from app.services.supabase_service import (
    Base,
    User,
    UserProgress,
    UserBookmark,
    Submission,
)
from app.config import settings
from scripts.migrate_firestore_to_postgres import migrate_data
from scripts.reconciliation_rollback import reconcile_reverse_delta
from scripts.migration_validation import run_migration_validation


@pytest.fixture(autouse=True)
def setup_sqlite_supabase():
    """Configure supabase_service to use a fresh in-memory SQLite database for every test."""
    engine = supabase_service.get_engine("sqlite:///:memory:")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


# ── 1. User Initialization ────────────────────────────────────────────────────

def test_user_initialization_idempotent():
    uid = "test_user_p3_001"

    # First creation
    created = supabase_service.init_user_document(
        uid=uid,
        name="Alice Tester",
        email="alice@example.com",
        photo_url="https://example.com/alice.png",
    )
    assert created is True

    session = supabase_service.get_db_session()
    user = session.query(User).filter_by(id=uid).first()
    assert user is not None
    assert user.name == "Alice Tester"
    assert user.email == "alice@example.com"
    assert user.migrated is True
    session.close()

    # Reconcile existing user
    reconciled = supabase_service.init_user_document(
        uid=uid,
        name="Alice Updated",
        email="alice@example.com",
    )
    assert reconciled is False

    session = supabase_service.get_db_session()
    user = session.query(User).filter_by(id=uid).first()
    assert user.name == "Alice Updated"
    session.close()


# ── 2. Progress & Revisions ───────────────────────────────────────────────────

@pytest.mark.anyio
async def test_progress_crud_and_sync():
    uid = "test_user_p3_002"

    # Async update
    await supabase_service.update_progress(uid=uid, question_id=1, solved=True, rev1=True)

    data = await supabase_service.get_all_progress(uid)
    assert "1" in data
    assert data["1"]["solved"] is True
    assert data["1"]["rev1"] is True
    assert data["1"]["rev2"] is False

    # Update revision 2
    await supabase_service.update_progress(uid=uid, question_id=1, rev2=True)
    data = await supabase_service.get_all_progress(uid)
    assert data["1"]["rev2"] is True

    # Synchronous update (called by submission queue worker on Accepted)
    supabase_service.update_progress_sync(uid=uid, question_id=42)
    data = await supabase_service.get_all_progress(uid)
    assert "42" in data
    assert data["42"]["solved"] is True


# ── 3. Bookmarks ──────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_bookmarks_crud():
    uid = "test_user_p3_003"

    # Add bookmarks
    await supabase_service.set_bookmark(uid=uid, question_id=10, bookmarked=True)
    await supabase_service.set_bookmark(uid=uid, question_id=20, bookmarked=True)
    # Duplicate add should be idempotent
    await supabase_service.set_bookmark(uid=uid, question_id=10, bookmarked=True)

    bookmarks = await supabase_service.get_all_bookmarks(uid)
    assert set(bookmarks) == {10, 20}

    # Remove bookmark
    await supabase_service.set_bookmark(uid=uid, question_id=10, bookmarked=False)
    bookmarks = await supabase_service.get_all_bookmarks(uid)
    assert bookmarks == [20]


# ── 4. Notes ──────────────────────────────────────────────────────────────────

@pytest.mark.anyio
async def test_notes_crud():
    uid = "test_user_p3_004"

    # Get non-existent note returns empty string
    empty_note = await supabase_service.get_note(uid=uid, question_id=99)
    assert empty_note == ""

    # Save note
    await supabase_service.save_note(uid=uid, question_id=99, content="Two-pointer approach works in O(N)")
    note = await supabase_service.get_note(uid=uid, question_id=99)
    assert note == "Two-pointer approach works in O(N)"

    # Overwrite note
    await supabase_service.save_note(uid=uid, question_id=99, content="Updated: remember edge case N=0")
    note = await supabase_service.get_note(uid=uid, question_id=99)
    assert note == "Updated: remember edge case N=0"

    all_notes = await supabase_service.get_all_notes(uid)
    assert all_notes == {"99": "Updated: remember edge case N=0"}


# ── 5. Editor & Compiler Drafts ───────────────────────────────────────────────

@pytest.mark.anyio
async def test_editor_and_compiler_drafts():
    uid = "test_user_p3_005"

    # DSA Editor draft
    await supabase_service.save_editor_code(
        uid=uid, question_id=1, language="python", code="def twoSum(nums, target): return []"
    )
    draft = await supabase_service.get_editor_code(uid=uid, question_id=1)
    assert draft["language"] == "python"
    assert "twoSum" in draft["code"]

    # General compiler draft
    await supabase_service.save_general_compiler_code(
        uid=uid, language="cpp", code='#include <iostream>\nint main() { return 0; }'
    )
    code = await supabase_service.get_general_compiler_code(uid=uid, language="cpp")
    assert "#include <iostream>" in code

    all_compiler = await supabase_service.get_all_general_compiler_code(uid)
    assert "cpp" in all_compiler


# ── 6. Consolidated Bulk User Data ───────────────────────────────────────────

@pytest.mark.anyio
async def test_get_all_user_data_payload_structure():
    uid = "test_user_p3_006"

    # Seed data
    supabase_service.init_user_document(uid=uid, name="Bob", email="bob@test.com")
    await supabase_service.update_progress(uid=uid, question_id=5, solved=True, rev1=True)
    await supabase_service.set_bookmark(uid=uid, question_id=5, bookmarked=True)
    await supabase_service.save_note(uid=uid, question_id=5, content="Review this!")
    await supabase_service.save_editor_code(uid=uid, question_id=5, language="python", code="pass")
    await supabase_service.save_general_compiler_code(uid=uid, language="python", code="print(1)")

    data = await supabase_service.get_all_user_data(uid)

    assert data["progress"]["solved"] == [5]
    assert data["progress"]["rev1"] == [5]
    assert data["progress"]["rev2"] == []
    assert data["bookmarks"] == [5]
    assert data["notes"]["5"] == "Review this!"
    assert data["editor"]["5"]["code"] == "pass"
    assert data["general_compiler"]["python"] == "print(1)"


# ── 7. Submission Recording & Language 54 ("cpp") Mapping ─────────────────────

def test_submission_recording_language_mapping():
    uid = "test_user_p3_007"

    # Test language 54 (C++ GCC 9.2) maps to "cpp"
    supabase_service.record_submission_sync(
        uid=uid,
        question_id=1,
        verdict="Accepted",
        status_id=3,
        language_id=54,
        passed_count=5,
        total_count=5,
        runtime="12 ms",
        memory="14 MB",
    )

    # Test language 76 (C++17 GCC 14) maps to "cpp"
    supabase_service.record_submission_sync(
        uid=uid,
        question_id=2,
        verdict="Wrong Answer",
        status_id=4,
        language_id=76,
        passed_count=2,
        total_count=5,
        runtime="10 ms",
        memory="14 MB",
    )

    session = supabase_service.get_db_session()
    sub54 = session.query(Submission).filter_by(user_id=uid, question_id=1).first()
    assert sub54 is not None
    assert sub54.language == "cpp"
    assert sub54.language_id == 54

    sub76 = session.query(Submission).filter_by(user_id=uid, question_id=2).first()
    assert sub76 is not None
    assert sub76.language == "cpp"
    assert sub76.language_id == 76
    session.close()


# ── 8. Submission History Keyset Pagination ───────────────────────────────────

@pytest.mark.anyio
async def test_submission_history_pagination_and_legacy_cursor():
    uid = "test_user_p3_008"
    now = datetime.now(timezone.utc)

    # Insert 5 submissions with deterministic timestamps and legacy Firestore IDs
    session = supabase_service.get_db_session()
    supabase_service.init_user_document(uid=uid, session=session)
    for i in range(1, 6):
        sub = Submission(
            id=uuid.uuid4(),
            user_id=uid,
            question_id=i,
            execution_type="submit",
            verdict="Accepted",
            status_id=3,
            language="cpp",
            language_id=76,
            passed_count=10,
            total_count=10,
            runtime="5 ms",
            memory="10 MB",
            submitted_at=now + timedelta(seconds=i),
            legacy_firestore_id=f"legacy_fs_doc_{i}",
        )
        session.add(sub)
    session.commit()
    session.close()

    # Page 1: limit 2
    p1 = await supabase_service.get_submission_history(uid=uid, limit=2)
    assert len(p1["items"]) == 2
    assert p1["hasMore"] is True
    assert p1["nextCursor"] == "legacy_fs_doc_4"
    assert p1["items"][0]["questionId"] == 5
    assert p1["items"][1]["questionId"] == 4

    # Page 2: using legacy Firestore ID cursor
    p2 = await supabase_service.get_submission_history(uid=uid, limit=2, after_doc_id="legacy_fs_doc_4")
    assert len(p2["items"]) == 2
    assert p2["hasMore"] is True
    assert p2["nextCursor"] == "legacy_fs_doc_2"
    assert p2["items"][0]["questionId"] == 3
    assert p2["items"][1]["questionId"] == 2

    # Page 3: final item
    p3 = await supabase_service.get_submission_history(uid=uid, limit=2, after_doc_id="legacy_fs_doc_2")
    assert len(p3["items"]) == 1
    assert p3["hasMore"] is False
    assert p3["nextCursor"] is None
    assert p3["items"][0]["questionId"] == 1


# ── 9. Gateway Backend Selection (db_service) ─────────────────────────────────

def test_db_service_backend_selection():
    with patch.object(settings, "database_backend", "supabase"):
        assert db_service.get_backend() == supabase_service

    with patch.object(settings, "database_backend", "firestore"):
        assert db_service.get_backend() == firestore_service


# ── 10. Migration Script Dry-Run and Logic ────────────────────────────────────

def test_migration_dry_run_and_logical_or_conflict_resolution(setup_sqlite_supabase):
    engine = setup_sqlite_supabase

    source_data = {
        "users": {
            "migrate_user_01": {
                "name": "Charlie",
                "email": "charlie@example.com",
                "createdAt": "2026-01-01T10:00:00Z",
                "progress": {
                    "101": {"solved": True, "rev1": True, "rev2": False, "updatedAt": "2026-01-02T10:00:00Z"}
                },
                "revisions": {
                    "101": {"rev1": False, "rev2": True}  # Conflict: rev1 is False here, rev2 is True
                },
                "bookmarks": {
                    "101": {"bookmarked": True}
                },
                "notes": {
                    "101": {"content": "Important binary search note"}
                },
                "editor": {
                    "101": {"language": "python", "code": "def search(): pass"}
                },
                "general_compiler": {
                    "python": {"code": "print('hello')"}
                },
                "submissions": {
                    "sub_legacy_999": {
                        "questionId": 101,
                        "verdict": "Accepted",
                        "statusId": 3,
                        "language": "cpp",
                        "languageId": 54,
                        "passedCount": 5,
                        "totalCount": 5,
                    }
                }
            }
        }
    }

    # 1. Test Dry Run (must roll back, database remains empty)
    dry_report = migrate_data(source_data, engine, dry_run=True)
    assert dry_report["dry_run"] is True
    assert dry_report["status"] == "SUCCESS"
    assert dry_report["conflicts_resolved"] == 1

    session = supabase_service.get_db_session()
    assert session.query(User).count() == 0
    assert session.query(UserProgress).count() == 0
    session.close()

    # 2. Test Real Migration
    real_report = migrate_data(source_data, engine, dry_run=False)
    assert real_report["dry_run"] is False
    assert real_report["status"] == "SUCCESS"
    assert real_report["migrated_counts"]["users"] == 1
    assert real_report["migrated_counts"]["user_progress"] == 1
    assert real_report["migrated_counts"]["user_bookmarks"] == 1
    assert real_report["migrated_counts"]["user_notes"] == 1
    assert real_report["migrated_counts"]["user_editor_drafts"] == 1
    assert real_report["migrated_counts"]["user_compiler_drafts"] == 1
    assert real_report["migrated_counts"]["submissions"] == 1

    session = supabase_service.get_db_session()
    prog = session.query(UserProgress).filter_by(user_id="migrate_user_01", question_id=101).first()
    assert prog.solved is True
    # Logical OR: rev1 (True or False) = True, rev2 (False or True) = True
    assert prog.rev1 is True
    assert prog.rev2 is True
    session.close()


# ── 11. Reconciliation Rollback Reverse Delta ─────────────────────────────────

def test_reconciliation_rollback_delta_extraction(setup_sqlite_supabase):
    engine = setup_sqlite_supabase
    cutover_time = datetime.now(timezone.utc) - timedelta(minutes=10)

    # Create user and data post-cutover
    session = supabase_service.get_db_session()
    now = datetime.now(timezone.utc)
    u = User(id="user_rollback_1", name="Rollback User", email="rb@test.com", created_at=now, last_login=now, migrated=True)
    session.add(u)
    bm = UserBookmark(user_id="user_rollback_1", question_id=77, created_at=now)
    session.add(bm)
    session.commit()

    # Pre-cutover snapshot had bookmark 88 for this user, which was deleted during cutover window
    pre_cutover_snapshot = {
        "users": {
            "user_rollback_1": {
                "bookmarks": {
                    "88": {"bookmarked": True}
                }
            }
        }
    }

    report = reconcile_reverse_delta(
        session=session,
        cutover_time=cutover_time,
        pre_cutover_snapshot=pre_cutover_snapshot,
    )

    assert report["status"] == "SUCCESS"
    assert report["synced_counts"]["users"] == 1
    assert report["synced_counts"]["user_bookmarks_added"] == 1
    assert report["synced_counts"]["user_bookmarks_deleted"] == 1

    ops = report["operations"]
    delete_ops = [op for op in ops if op["type"] == "DELETE"]
    assert len(delete_ops) == 1
    assert delete_ops[0]["path"] == "users/user_rollback_1/bookmarks/88"
    assert delete_ops[0]["doc_id"] == "88"
    session.close()


# ── 12. Migration Validation Audit Tool ───────────────────────────────────────

def test_migration_validation_audit(setup_sqlite_supabase):
    session = supabase_service.get_db_session()
    raw_data = {
        "users": {
            "val_user_01": {
                "name": "Val User",
                "email": "val@example.com",
                "progress": {
                    "201": {"solved": True, "rev1": True, "rev2": False}
                },
                "revisions": {
                    "201": {"rev1": True, "rev2": True}  # Discrepancy on rev2
                },
                "bookmarks": {
                    "201": {"bookmarked": True}
                },
                "notes": {
                    "201": {"content": "Sample Note"}
                },
                "editor": {
                    "201": {"language": "cpp", "code": "int main() {}"}
                },
                "general_compiler": {
                    "cpp": {"code": "int main() {}"}
                },
                "submissions": {
                    "legacy_sub_val_01": {
                        "questionId": 201,
                        "verdict": "Accepted",
                        "statusId": 3,
                        "language": "cpp",
                        "languageId": 76,
                        "passedCount": 5,
                        "totalCount": 5,
                    }
                }
            }
        }
    }

    report = run_migration_validation(raw_data, session)
    assert report["status"] == "SUCCESS"
    assert report["imported_counts"]["users"] == 1
    assert report["imported_counts"]["user_progress"] == 1
    assert len(report["conflict_resolutions"]) == 1
    assert report["conflict_resolutions"][0]["resolution"] == "LOGICAL_OR"
    session.close()


# ── 13. User Analytics Aggregation ───────────────────────────────────────────

@pytest.mark.anyio
async def test_user_analytics_aggregation():
    uid = "test_user_p3_analytics"

    # Add 2 accepted, 1 wrong answer submissions and sync progress
    supabase_service.record_submission_sync(
        uid=uid, question_id=10, verdict="Accepted", status_id=3, language_id=71,
        passed_count=5, total_count=5, runtime="1 ms", memory="1 MB"
    )
    supabase_service.update_progress_sync(uid=uid, question_id=10)

    supabase_service.record_submission_sync(
        uid=uid, question_id=11, verdict="Accepted", status_id=3, language_id=71,
        passed_count=5, total_count=5, runtime="1 ms", memory="1 MB"
    )
    supabase_service.update_progress_sync(uid=uid, question_id=11)

    supabase_service.record_submission_sync(
        uid=uid, question_id=10, verdict="Wrong Answer", status_id=4, language_id=71,
        passed_count=2, total_count=5, runtime="1 ms", memory="1 MB"
    )

    analytics = await supabase_service.get_user_analytics(uid)
    assert analytics["total_submissions"] == 3
    assert analytics["accepted_submissions"] == 2
    assert analytics["solved_count"] == 2  # distinct solved questions in UserProgress
    assert analytics["acceptance_rate"] == round((2 / 3) * 100, 2)


# ── 14. Keyset Pagination With Pure UUID Cursor ───────────────────────────────

@pytest.mark.anyio
async def test_submission_history_pure_uuid_cursor():
    uid = "test_user_p3_uuid_cursor"
    now = datetime.now(timezone.utc)

    session = supabase_service.get_db_session()
    supabase_service.init_user_document(uid=uid, session=session)
    uuids = []
    for i in range(1, 4):
        sub_id = uuid.uuid4()
        uuids.append(sub_id)
        sub = Submission(
            id=sub_id,
            user_id=uid,
            question_id=i,
            execution_type="submit",
            verdict="Accepted",
            status_id=3,
            language="python",
            language_id=71,
            passed_count=5,
            total_count=5,
            runtime="5 ms",
            memory="10 MB",
            submitted_at=now + timedelta(seconds=i),
            legacy_firestore_id=None,  # Pure Supabase submission (no legacy doc ID)
        )
        session.add(sub)
    session.commit()
    session.close()

    # Query page 1 (limit 1)
    p1 = await supabase_service.get_submission_history(uid=uid, limit=1)
    assert len(p1["items"]) == 1
    assert p1["hasMore"] is True
    first_cursor = p1["nextCursor"]
    assert first_cursor == str(uuids[2])  # newest submission (question 3)

    # Query page 2 with pure UUID cursor
    p2 = await supabase_service.get_submission_history(uid=uid, limit=1, after_doc_id=first_cursor)
    assert len(p2["items"]) == 1
    assert p2["items"][0]["questionId"] == 2
    second_cursor = p2["nextCursor"]
    assert second_cursor == str(uuids[1])

