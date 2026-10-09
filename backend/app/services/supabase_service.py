"""
Supabase / PostgreSQL service — database read/write operations.

Implements the exact repository interface as `firestore_service.py`, allowing seamless
switching between Cloud Firestore and Supabase PostgreSQL via `DATABASE_BACKEND`.

Key Features:
- Foreign Key cascades and User Isolation.
- Keyset-based pagination with legacy Firestore cursor support.
- Idempotent upserts for progress, drafts, bookmarks, and notes.
- Exact JSON response compatibility with existing frontend ApiClient.
"""

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    BigInteger,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
    func,
    select,
    desc,
    or_,
)
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session
from sqlalchemy.pool import StaticPool, QueuePool

from app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()


# ── SQLAlchemy Models ────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String(128), primary_key=True)  # Firebase Auth UID
    email = Column(String(255), nullable=True)
    name = Column(String(150), nullable=True)
    photo_url = Column(String(2048), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    last_login = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    migrated = Column(Boolean, default=True, nullable=False)


class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    user_id = Column(String(128), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, nullable=False)
    solved = Column(Boolean, default=False, nullable=False)
    rev1 = Column(Boolean, default=False, nullable=False)
    rev2 = Column(Boolean, default=False, nullable=False)
    last_solved_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_user_progress_user_question"),
        Index("idx_user_progress_user", "user_id"),
    )


class UserBookmark(Base):
    __tablename__ = "user_bookmarks"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    user_id = Column(String(128), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_user_bookmarks_user_question"),
        Index("idx_user_bookmarks_user", "user_id"),
    )


class UserNote(Base):
    __tablename__ = "user_notes"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    user_id = Column(String(128), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, nullable=False)
    content = Column(Text, default="", nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_user_notes_user_question"),
        Index("idx_user_notes_user", "user_id"),
    )


class UserEditorDraft(Base):
    __tablename__ = "user_editor_drafts"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    user_id = Column(String(128), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, nullable=False)
    language = Column(String(32), nullable=False)
    code = Column(Text, default="", nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "question_id", name="uq_user_editor_drafts_user_question"),
        Index("idx_user_editor_drafts_user", "user_id"),
    )


class UserCompilerDraft(Base):
    __tablename__ = "user_compiler_drafts"

    id = Column(BigInteger().with_variant(Integer, "sqlite"), primary_key=True, autoincrement=True)
    user_id = Column(String(128), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    language = Column(String(32), nullable=False)
    code = Column(Text, default="", nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        UniqueConstraint("user_id", "language", name="uq_user_compiler_drafts_user_lang"),
        Index("idx_user_compiler_drafts_user", "user_id"),
    )


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(128), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, nullable=False)
    execution_type = Column(String(32), default="submit", nullable=False)
    verdict = Column(String(64), nullable=False)
    status_id = Column(Integer, nullable=False)
    language = Column(String(32), nullable=False)
    language_id = Column(Integer, nullable=False)
    passed_count = Column(Integer, default=0, nullable=False)
    total_count = Column(Integer, default=0, nullable=False)
    runtime = Column(String(32), default="--", nullable=False)
    memory = Column(String(32), default="--", nullable=False)
    compile_error = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    legacy_firestore_id = Column(String(64), nullable=True)

    __table_args__ = (
        Index("idx_submissions_user_submitted", "user_id", "submitted_at", "id"),
    )


# ── Database Connection & Session Management ───────────────────────────────────

_engine = None
_SessionFactory = None


def get_engine(db_url: Optional[str] = None):
    global _engine, _SessionFactory
    url = db_url or settings.supabase_db_url or "sqlite:///:memory:"

    if _engine is None or db_url is not None:
        if url.startswith("sqlite"):
            # SQLite for tests / development fallback
            _engine = create_engine(
                url,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
            )
        else:
            # PostgreSQL / Supabase with QueuePool
            _engine = create_engine(
                url,
                poolclass=QueuePool,
                pool_size=10,
                max_overflow=5,
                pool_timeout=30,
                pool_pre_ping=True,
            )
        _SessionFactory = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=_engine))

    return _engine


def get_db_session():
    if _SessionFactory is None:
        get_engine()
    return _SessionFactory()


def init_db(engine=None):
    """Create all schema tables (useful for dev / test environments)."""
    eng = engine or get_engine()
    Base.metadata.create_all(bind=eng)


# ── User Initialization ────────────────────────────────────────────────────────

def init_user_document(
    uid: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    photo_url: Optional[str] = None,
) -> bool:
    """
    Idempotent user bootstrap.
    Creates user record if not exists, or updates last_login and provided fields.
    Returns True if created (new user), False if existing.
    """
    session = get_db_session()
    try:
        user = session.query(User).filter(User.id == uid).first()
        now = datetime.now(timezone.utc)
        if not user:
            user = User(
                id=uid,
                name=name,
                email=email,
                photo_url=photo_url,
                created_at=now,
                last_login=now,
                migrated=True,
            )
            session.add(user)
            session.commit()
            return True
        else:
            user.last_login = now
            if name:
                user.name = name
            if email:
                user.email = email
            if photo_url:
                user.photo_url = photo_url
            session.commit()
            return False
    finally:
        session.close()


# ── Progress ──────────────────────────────────────────────────────────────────

async def get_all_progress(uid: str) -> Dict[str, Dict]:
    """Return all progress records as {qId: {solved, rev1, rev2}}."""
    session = get_db_session()
    try:
        records = session.query(UserProgress).filter(UserProgress.user_id == uid).all()
        return {
            str(r.question_id): {
                "solved": r.solved,
                "rev1": r.rev1,
                "rev2": r.rev2,
                "lastSolved": r.last_solved_at,
                "lastModified": r.updated_at,
            }
            for r in records
        }
    finally:
        session.close()


async def update_progress(
    uid: str,
    question_id: int,
    solved: Optional[bool] = None,
    rev1: Optional[bool] = None,
    rev2: Optional[bool] = None,
) -> None:
    """Update solved, rev1, or rev2 for a question idempotently."""
    session = get_db_session()
    try:
        # Ensure user exists (FK constraint)
        if not session.query(User).filter(User.id == uid).first():
            init_user_document(uid)

        now = datetime.now(timezone.utc)
        record = (
            session.query(UserProgress)
            .filter(UserProgress.user_id == uid, UserProgress.question_id == question_id)
            .first()
        )

        if not record:
            record = UserProgress(
                user_id=uid,
                question_id=question_id,
                solved=bool(solved) if solved is not None else False,
                rev1=bool(rev1) if rev1 is not None else False,
                rev2=bool(rev2) if rev2 is not None else False,
                last_solved_at=now if solved else None,
                updated_at=now,
            )
            session.add(record)
        else:
            if solved is not None:
                record.solved = solved
                if solved:
                    record.last_solved_at = now
            if rev1 is not None:
                record.rev1 = rev1
            if rev2 is not None:
                record.rev2 = rev2
            record.updated_at = now

        session.commit()
    finally:
        session.close()


def update_progress_sync(uid: str, question_id: int) -> None:
    """Synchronous version called by submission worker upon Accepted verdict."""
    session = get_db_session()
    try:
        if not session.query(User).filter(User.id == uid).first():
            init_user_document(uid)

        now = datetime.now(timezone.utc)
        record = (
            session.query(UserProgress)
            .filter(UserProgress.user_id == uid, UserProgress.question_id == question_id)
            .first()
        )

        if not record:
            record = UserProgress(
                user_id=uid,
                question_id=question_id,
                solved=True,
                last_solved_at=now,
                updated_at=now,
            )
            session.add(record)
        else:
            record.solved = True
            record.last_solved_at = now
            record.updated_at = now

        session.commit()
    finally:
        session.close()


# ── Bookmarks ─────────────────────────────────────────────────────────────────

async def get_all_bookmarks(uid: str) -> List[int]:
    """Return list of bookmarked question IDs."""
    session = get_db_session()
    try:
        records = session.query(UserBookmark.question_id).filter(UserBookmark.user_id == uid).all()
        return [r[0] for r in records]
    finally:
        session.close()


async def set_bookmark(uid: str, question_id: int, bookmarked: bool) -> None:
    """Add or remove a bookmark."""
    session = get_db_session()
    try:
        if bookmarked:
            if not session.query(User).filter(User.id == uid).first():
                init_user_document(uid)

            existing = (
                session.query(UserBookmark)
                .filter(UserBookmark.user_id == uid, UserBookmark.question_id == question_id)
                .first()
            )
            if not existing:
                session.add(UserBookmark(user_id=uid, question_id=question_id))
                session.commit()
        else:
            session.query(UserBookmark).filter(
                UserBookmark.user_id == uid, UserBookmark.question_id == question_id
            ).delete()
            session.commit()
    finally:
        session.close()


# ── Notes ─────────────────────────────────────────────────────────────────────

async def get_all_notes(uid: str) -> Dict[str, str]:
    """Return all notes as {qId: content}."""
    session = get_db_session()
    try:
        records = session.query(UserNote).filter(UserNote.user_id == uid).all()
        return {str(r.question_id): r.content for r in records}
    finally:
        session.close()


async def get_note(uid: str, question_id: int) -> str:
    """Return note content for one question (empty string if not found)."""
    session = get_db_session()
    try:
        record = (
            session.query(UserNote)
            .filter(UserNote.user_id == uid, UserNote.question_id == question_id)
            .first()
        )
        return record.content if record else ""
    finally:
        session.close()


async def save_note(uid: str, question_id: int, content: str) -> None:
    """Save or overwrite a note."""
    session = get_db_session()
    try:
        if not session.query(User).filter(User.id == uid).first():
            init_user_document(uid)

        record = (
            session.query(UserNote)
            .filter(UserNote.user_id == uid, UserNote.question_id == question_id)
            .first()
        )
        now = datetime.now(timezone.utc)
        if not record:
            session.add(UserNote(user_id=uid, question_id=question_id, content=content, updated_at=now))
        else:
            record.content = content
            record.updated_at = now
        session.commit()
    finally:
        session.close()


# ── Editor Code ───────────────────────────────────────────────────────────────

async def get_all_editor_code(uid: str) -> Dict[str, Dict]:
    """Return all DSA editor code drafts as {qId: {language, code}}."""
    session = get_db_session()
    try:
        records = session.query(UserEditorDraft).filter(UserEditorDraft.user_id == uid).all()
        return {
            str(r.question_id): {"language": r.language, "code": r.code}
            for r in records
        }
    finally:
        session.close()


async def get_editor_code(uid: str, question_id: int) -> Dict[str, Optional[str]]:
    """Return saved editor code for one question."""
    session = get_db_session()
    try:
        record = (
            session.query(UserEditorDraft)
            .filter(UserEditorDraft.user_id == uid, UserEditorDraft.question_id == question_id)
            .first()
        )
        if record:
            return {"language": record.language, "code": record.code}
        return {"language": None, "code": None}
    finally:
        session.close()


async def save_editor_code(uid: str, question_id: int, language: str, code: str) -> None:
    """Save DSA editor code draft for a question."""
    session = get_db_session()
    try:
        if not session.query(User).filter(User.id == uid).first():
            init_user_document(uid)

        record = (
            session.query(UserEditorDraft)
            .filter(UserEditorDraft.user_id == uid, UserEditorDraft.question_id == question_id)
            .first()
        )
        now = datetime.now(timezone.utc)
        if not record:
            session.add(UserEditorDraft(user_id=uid, question_id=question_id, language=language, code=code, updated_at=now))
        else:
            record.language = language
            record.code = code
            record.updated_at = now
        session.commit()
    finally:
        session.close()


# ── General Compiler Code ─────────────────────────────────────────────────────

async def get_all_general_compiler_code(uid: str) -> Dict[str, str]:
    """Return all general compiler drafts as {lang: code}."""
    session = get_db_session()
    try:
        records = session.query(UserCompilerDraft).filter(UserCompilerDraft.user_id == uid).all()
        return {r.language: r.code for r in records}
    finally:
        session.close()


async def get_general_compiler_code(uid: str, language: str) -> Optional[str]:
    """Return general compiler code for a specific language."""
    session = get_db_session()
    try:
        record = (
            session.query(UserCompilerDraft)
            .filter(UserCompilerDraft.user_id == uid, UserCompilerDraft.language == language)
            .first()
        )
        return record.code if record else None
    finally:
        session.close()


async def save_general_compiler_code(uid: str, language: str, code: str) -> None:
    """Save general compiler draft for a language."""
    session = get_db_session()
    try:
        if not session.query(User).filter(User.id == uid).first():
            init_user_document(uid)

        record = (
            session.query(UserCompilerDraft)
            .filter(UserCompilerDraft.user_id == uid, UserCompilerDraft.language == language)
            .first()
        )
        now = datetime.now(timezone.utc)
        if not record:
            session.add(UserCompilerDraft(user_id=uid, language=language, code=code, updated_at=now))
        else:
            record.code = code
            record.updated_at = now
        session.commit()
    finally:
        session.close()


# ── Bulk Load ─────────────────────────────────────────────────────────────────

async def get_all_user_data(uid: str) -> Dict[str, Any]:
    """
    Fetch all user data in a single consolidated database query roundtrip.
    Returns:
        {
            "progress": {"solved": [...], "rev1": [...], "rev2": [...]},
            "bookmarks": [...],
            "notes": {qId: content},
            "editor": {qId: {language, code}},
            "general_compiler": {lang: code}
        }
    """
    session = get_db_session()
    try:
        progress_records = session.query(UserProgress).filter(UserProgress.user_id == uid).all()
        bookmark_records = session.query(UserBookmark.question_id).filter(UserBookmark.user_id == uid).all()
        note_records = session.query(UserNote).filter(UserNote.user_id == uid).all()
        editor_records = session.query(UserEditorDraft).filter(UserEditorDraft.user_id == uid).all()
        compiler_records = session.query(UserCompilerDraft).filter(UserCompilerDraft.user_id == uid).all()

        solved_ids = [r.question_id for r in progress_records if r.solved]
        rev1_ids = [r.question_id for r in progress_records if r.rev1]
        rev2_ids = [r.question_id for r in progress_records if r.rev2]
        bookmark_ids = [r[0] for r in bookmark_records]

        notes_map = {str(r.question_id): r.content for r in note_records}
        editor_map = {str(r.question_id): {"language": r.language, "code": r.code} for r in editor_records}
        compiler_map = {r.language: r.code for r in compiler_records}

        return {
            "progress": {
                "solved": solved_ids,
                "rev1": rev1_ids,
                "rev2": rev2_ids,
            },
            "bookmarks": bookmark_ids,
            "notes": notes_map,
            "editor": editor_map,
            "general_compiler": compiler_map,
        }
    finally:
        session.close()


# ── Submissions ───────────────────────────────────────────────────────────────

_LANGUAGE_NAMES: Dict[int, str] = {
    50: "c",
    62: "java",
    63: "javascript",
    71: "python",
    76: "cpp",
}


async def record_submission(
    uid: str,
    question_id: int,
    verdict: str,
    status_id: int,
    language_id: int,
    passed_count: int,
    total_count: int,
    runtime: str,
    memory: str,
    compile_error: Optional[str] = None,
    legacy_firestore_id: Optional[str] = None,
) -> None:
    """Record a submission asynchronously."""
    record_submission_sync(
        uid=uid,
        question_id=question_id,
        verdict=verdict,
        status_id=status_id,
        language_id=language_id,
        passed_count=passed_count,
        total_count=total_count,
        runtime=runtime,
        memory=memory,
        compile_error=compile_error,
        legacy_firestore_id=legacy_firestore_id,
    )


def record_submission_sync(
    uid: str,
    question_id: int,
    verdict: str,
    status_id: int,
    language_id: int,
    passed_count: int,
    total_count: int,
    runtime: str,
    memory: str,
    compile_error: Optional[str] = None,
    legacy_firestore_id: Optional[str] = None,
) -> None:
    """Write submission record synchronously (called from worker thread)."""
    session = get_db_session()
    try:
        if not session.query(User).filter(User.id == uid).first():
            init_user_document(uid)

        sub = Submission(
            id=str(uuid.uuid4()),
            user_id=uid,
            question_id=question_id,
            execution_type="submit",
            verdict=verdict,
            status_id=status_id,
            language=_LANGUAGE_NAMES.get(language_id, "unknown"),
            language_id=language_id,
            passed_count=passed_count,
            total_count=total_count,
            runtime=runtime,
            memory=memory,
            compile_error=compile_error or None,
            submitted_at=datetime.now(timezone.utc),
            legacy_firestore_id=legacy_firestore_id,
        )
        session.add(sub)
        session.commit()
    finally:
        session.close()


async def get_submission_history(
    uid: str,
    limit: int = 20,
    after_doc_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Keyset paginated submission history ordered newest-first.
    Compatible with both UUID cursor and legacy Firestore document ID cursor.
    """
    limit = min(max(1, limit), 50)
    session = get_db_session()
    try:
        query = session.query(Submission).filter(Submission.user_id == uid)

        if after_doc_id:
            # PostgreSQL UUID column throws DataError if compared against non-UUID string.
            # Safely check whether after_doc_id is a valid UUID or a legacy Firestore document ID.
            is_uuid = False
            try:
                uuid.UUID(str(after_doc_id))
                is_uuid = True
            except ValueError:
                is_uuid = False

            cursor_filter = (
                or_(Submission.id == after_doc_id, Submission.legacy_firestore_id == after_doc_id)
                if is_uuid
                else (Submission.legacy_firestore_id == after_doc_id)
            )

            cursor_sub = (
                session.query(Submission)
                .filter(Submission.user_id == uid, cursor_filter)
                .first()
            )
            if cursor_sub:
                query = query.filter(
                    or_(
                        Submission.submitted_at < cursor_sub.submitted_at,
                        (
                            (Submission.submitted_at == cursor_sub.submitted_at)
                            & (Submission.id < cursor_sub.id)
                        ),
                    )
                )

        fetch_limit = limit + 1
        records = (
            query.order_by(desc(Submission.submitted_at), desc(Submission.id))
            .limit(fetch_limit)
            .all()
        )

        has_more = len(records) > limit
        page = records[:limit]

        items = []
        for r in page:
            sub_at_iso = (
                r.submitted_at.isoformat()
                if hasattr(r.submitted_at, "isoformat")
                else str(r.submitted_at)
            )
            # Use legacy ID if present for perfect backward compatibility, else UUID string
            item_id = str(r.legacy_firestore_id or r.id)

            items.append({
                "id": item_id,
                "questionId": r.question_id,
                "executionType": r.execution_type,
                "verdict": r.verdict,
                "statusId": r.status_id,
                "language": r.language,
                "languageId": r.language_id,
                "passedCount": r.passed_count,
                "totalCount": r.total_count,
                "runtime": r.runtime,
                "memory": r.memory,
                "submittedAt": sub_at_iso,
                "compileError": r.compile_error,
            })

        next_cursor = str(page[-1].legacy_firestore_id or page[-1].id) if has_more and page else None

        return {
            "items": items,
            "hasMore": has_more,
            "nextCursor": next_cursor,
        }
    finally:
        session.close()


async def get_user_analytics(uid: str) -> Dict[str, Any]:
    """
    Computes summary analytics for a user:
    - Solved count and revision counts from UserProgress
    - Total submissions, accepted count, and acceptance rate from Submission
    """
    session = get_db_session()
    try:
        progress_rows = session.query(UserProgress).filter(UserProgress.user_id == uid).all()
        solved_count = sum(1 for p in progress_rows if p.solved)
        rev1_count = sum(1 for p in progress_rows if p.rev1)
        rev2_count = sum(1 for p in progress_rows if p.rev2)

        submissions = session.query(Submission).filter(Submission.user_id == uid).all()
        total_subs = len(submissions)
        accepted_subs = sum(1 for s in submissions if s.verdict == "Accepted")
        acc_rate = round((accepted_subs / total_subs * 100), 2) if total_subs > 0 else 0.0

        return {
            "solved_count": solved_count,
            "rev1_count": rev1_count,
            "rev2_count": rev2_count,
            "total_submissions": total_subs,
            "accepted_submissions": accepted_subs,
            "acceptance_rate": acc_rate,
        }
    finally:
        session.close()
