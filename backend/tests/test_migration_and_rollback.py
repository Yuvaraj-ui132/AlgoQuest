"""
Tests for Migration Dry-Run Validation and Rollback Reconciliation workflows.

Verifies:
1. Migration dry-run ingestion of sanitized Firestore documents.
2. Conflict resolution between legacy /progress and /revisions subcollections (Logical OR).
3. Timestamp imputation and error handling for malformed documents.
4. Reverse delta reconciliation rollback accounting for post-cutover inserts, updates,
   bookmark deletions, and new submissions to guarantee zero data loss.
"""

from datetime import datetime, timezone, timedelta
import pytest
from sqlalchemy import create_engine
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
from scripts.migration_validation import run_migration_validation
from scripts.reconciliation_rollback import reconcile_reverse_delta


@pytest.fixture
def db_session():
    """Provides a fresh isolated in-memory SQLite database session for each test."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine)
    session = TestingSession()
    yield session
    session.close()
    Base.metadata.drop_all(engine)


def test_migration_validation_conflict_resolution_and_imputation(db_session):
    """
    Verifies dry-run migration validation:
    - Ingests sanitized Firestore data.
    - Resolves conflicts between /progress and /revisions using Logical OR.
    - Imputes missing timestamps.
    - Handles malformed question IDs.
    """
    sanitized_firestore = {
        "users": {
            "user_conflict_1": {
                "name": "Alice Wonder",
                "email": "alice@example.com",
                "photoURL": "https://example.com/avatar.png",
                "createdAt": None,  # Missing timestamp to test imputation
                "progress": {
                    "1": {"solved": True, "rev1": True, "rev2": False},
                    "bad_id": {"solved": False},  # Malformed question ID
                },
                "revisions": {
                    "1": {"rev1": False, "rev2": True},  # Conflict: progress has rev1, revisions has rev2
                    "2": {"rev1": True, "rev2": False},
                },
                "bookmarks": {
                    "1": {"bookmarked": True},
                    "2": {"bookmarked": False},  # Should not be inserted
                },
                "notes": {
                    "1": {"content": "Binary search note"},
                },
                "editor": {
                    "1": {"language": "python", "code": "def solve(): pass"},
                },
                "general_compiler": {
                    "javascript": {"code": "console.log('test');"},
                },
                "submissions": {
                    "sub_legacy_101": {
                        "questionId": 1,
                        "verdict": "Accepted",
                        "statusId": 3,
                        "language": "python",
                        "languageId": 71,
                        "passedCount": 5,
                        "totalCount": 5,
                        "runtime": "12ms",
                        "memory": "14MB",
                        "submittedAt": "2026-03-01T10:00:00Z",
                    }
                },
            }
        }
    }

    report = run_migration_validation(sanitized_firestore, db_session)

    assert report["status"] == "SUCCESS"
    assert report["source_counts"]["users"] == 1
    assert report["imported_counts"]["users"] == 1
    assert report["timestamps_imputed"] >= 1  # Alice's createdAt was imputed
    assert report["malformed_skipped"] == 1  # 'bad_id' skipped

    # Verify conflict resolution on question 1
    assert len(report["conflict_resolutions"]) == 1
    conflict = report["conflict_resolutions"][0]
    assert conflict["user_id"] == "user_conflict_1"
    assert conflict["question_id"] == 1
    assert conflict["resolution"] == "LOGICAL_OR"

    # Verify merged record in database
    prog_1 = (
        db_session.query(UserProgress)
        .filter_by(user_id="user_conflict_1", question_id=1)
        .first()
    )
    assert prog_1 is not None
    assert prog_1.solved is True
    assert prog_1.rev1 is True  # From progress
    assert prog_1.rev2 is True  # From revisions (Logical OR merge!)

    # Verify question 2 created from revisions
    prog_2 = (
        db_session.query(UserProgress)
        .filter_by(user_id="user_conflict_1", question_id=2)
        .first()
    )
    assert prog_2 is not None
    assert prog_2.rev1 is True
    assert prog_2.rev2 is False

    # Verify bookmark (only active bookmarks imported)
    assert db_session.query(UserBookmark).count() == 1
    bm = db_session.query(UserBookmark).first()
    assert bm.question_id == 1

    # Verify submissions imported with legacy ID preserved
    sub = db_session.query(Submission).first()
    assert sub is not None
    assert sub.legacy_firestore_id == "sub_legacy_101"
    assert sub.verdict == "Accepted"


def test_reconciliation_rollback_demonstrates_zero_data_loss(db_session):
    """
    Demonstrates zero-data-loss rollback reconciliation:
    1. Simulates cutover at T0.
    2. Modifies records in PostgreSQL during cutover window (T0 + 1 hour).
    3. Deletes a pre-cutover bookmark in PostgreSQL.
    4. Submits a new code solution in PostgreSQL.
    5. Runs reverse delta reconciliation back to simulated Firestore target.
    6. Confirms all post-cutover changes, deletions, and submissions are reconciled.
    """
    t0 = datetime(2026, 3, 10, 12, 0, 0, tzinfo=timezone.utc)
    t_pre = t0 - timedelta(days=1)
    t_post = t0 + timedelta(hours=2)

    # Pre-cutover snapshot of Firestore state
    pre_cutover_snapshot = {
        "users": {
            "user_bob": {
                "name": "Bob Old",
                "email": "bob@example.com",
                "bookmarks": {
                    "10": {"bookmarked": True},  # Will remain
                    "20": {"bookmarked": True},  # Bob will delete this in PostgreSQL!
                },
                "progress": {
                    "10": {"solved": True, "rev1": False, "rev2": False, "updatedAt": t_pre.isoformat()},
                },
            }
        }
    }

    # Simulate database state in PostgreSQL post-cutover
    # 1. User updated profile post-cutover
    bob = User(
        id="user_bob",
        name="Bob New Name",
        email="bob@example.com",
        photo_url="https://example.com/bob_new.png",
        created_at=t_pre,
        last_login=t_post,
    )
    db_session.add(bob)

    # 2. Progress updated post-cutover (solved question 20)
    p10 = UserProgress(
        user_id="user_bob",
        question_id=10,
        solved=True,
        rev1=False,
        rev2=False,
        updated_at=t_pre,  # Pre-cutover: should NOT trigger progress sync
    )
    p20 = UserProgress(
        user_id="user_bob",
        question_id=20,
        solved=True,
        rev1=True,
        rev2=False,
        last_solved_at=t_post,
        updated_at=t_post,  # Post-cutover: MUST sync!
    )
    db_session.add_all([p10, p20])

    # 3. Bookmarks: Bob kept bookmark 10, DELETED bookmark 20, ADDED bookmark 30
    b10 = UserBookmark(user_id="user_bob", question_id=10, created_at=t_pre)
    b30 = UserBookmark(user_id="user_bob", question_id=30, created_at=t_post)
    db_session.add_all([b10, b30])  # Note: question 20 is absent from PostgreSQL!

    # 4. Note added post-cutover
    n = UserNote(user_id="user_bob", question_id=20, content="Post cutover dynamic note", updated_at=t_post)
    db_session.add(n)

    # 5. Editor draft updated post-cutover
    ed = UserEditorDraft(user_id="user_bob", question_id=20, language="cpp", code="int main(){}", updated_at=t_post)
    db_session.add(ed)

    # 6. Submission executed on PostgreSQL post-cutover
    sub_post = Submission(
        id="postgres-uuid-9999",
        user_id="user_bob",
        question_id=20,
        execution_type="submit",
        verdict="Accepted",
        status_id=3,
        language="cpp",
        language_id=54,
        passed_count=10,
        total_count=10,
        runtime="5ms",
        memory="4MB",
        compile_error=None,
        submitted_at=t_post,
        legacy_firestore_id=None,
    )
    db_session.add(sub_post)

    db_session.commit()

    # Firestore target starting at pre-cutover state
    import copy
    firestore_target = copy.deepcopy(pre_cutover_snapshot)

    # Run reverse delta reconciliation
    report = reconcile_reverse_delta(
        session=db_session,
        cutover_time=t0,
        pre_cutover_snapshot=pre_cutover_snapshot,
        firestore_target=firestore_target,
    )

    assert report["status"] == "SUCCESS"
    assert report["synced_counts"]["users"] == 1
    assert report["synced_counts"]["user_progress"] == 1  # Only question 20 (post-cutover)
    assert report["synced_counts"]["user_bookmarks_added"] == 1  # Question 30 added
    assert report["synced_counts"]["user_bookmarks_deleted"] == 1  # Question 20 deleted!
    assert report["synced_counts"]["user_notes"] == 1
    assert report["synced_counts"]["user_editor_drafts"] == 1
    assert report["synced_counts"]["submissions"] == 1  # New submission reconciled!

    # Verify Firestore target reconciliation
    bob_fs = firestore_target["users"]["user_bob"]
    assert bob_fs["name"] == "Bob New Name"
    assert bob_fs["photoURL"] == "https://example.com/bob_new.png"

    # Progress: question 20 is now in Firestore
    assert "20" in bob_fs["progress"]
    assert bob_fs["progress"]["20"]["solved"] is True
    assert bob_fs["progress"]["20"]["rev1"] is True

    # Bookmarks: question 20 was DELETED from Firestore, question 30 was ADDED, question 10 untouched
    assert "20" not in bob_fs["bookmarks"]
    assert "30" in bob_fs["bookmarks"]
    assert bob_fs["bookmarks"]["30"]["bookmarked"] is True
    assert "10" in bob_fs["bookmarks"]

    # Submission: postgres-uuid-9999 was written to Firestore submissions subcollection
    assert "submissions" in bob_fs
    assert "postgres-uuid-9999" in bob_fs["submissions"]
    assert bob_fs["submissions"]["postgres-uuid-9999"]["verdict"] == "Accepted"
    assert bob_fs["submissions"]["postgres-uuid-9999"]["questionId"] == 20
