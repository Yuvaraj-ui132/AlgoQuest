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
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Union

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
    TypeDecorator,
    func,
    case,
    select,
    text,
    desc,
    or_,
    and_,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import declarative_base, sessionmaker, Session
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


class GUID(TypeDecorator):
    """
    Platform-independent GUID / UUID type.
    Uses PostgreSQL's native UUID(as_uuid=True) on PostgreSQL,
    and falls back to String(36) on SQLite.
    Properly adapts Python uuid.UUID and string representations.
    """
    impl = PG_UUID(as_uuid=True)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        else:
            return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if dialect.name == "postgresql":
            if isinstance(value, uuid.UUID):
                return value
            return uuid.UUID(str(value))
        else:
            return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, uuid.UUID):
            return value
        if isinstance(value, str):
            try:
                return uuid.UUID(value)
            except ValueError:
                # Safely return raw non-UUID string (e.g. legacy identifiers) without raising
                return value
        if isinstance(value, bytes):
            if len(value) == 16:
                try:
                    return uuid.UUID(bytes=value)
                except ValueError:
                    return value
            try:
                return uuid.UUID(value.decode("utf-8", errors="replace"))
            except ValueError:
                return value
        return value


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
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


class QueueJob(Base):
    """
    Persistent durable queue job row.

    Lifecycle:  pending → running → completed | failed
    Workers atomically claim pending rows using SELECT … FOR UPDATE SKIP LOCKED.
    A heartbeat UPDATE keeps the lease alive while the job is running.
    Expired leases are recovered by any worker on the next claim sweep.

    Security:
      - source_code is cleared (set to '') on completion or permanent failure.
      - result_json contains only the safe SubmissionResponse — no hidden test data.
      - error_message NEVER contains hidden test inputs or expected outputs.
    """
    __tablename__ = "queue_jobs"

    id               = Column(GUID(), primary_key=True, default=uuid.uuid4)
    uid              = Column(String(128), nullable=False)    # verified Firebase UID
    question_id      = Column(Integer, nullable=False)
    language_id      = Column(Integer, nullable=False)
    source_code      = Column(Text, nullable=False, default="")  # transient; cleared after execution
    compiler_options = Column(Text, nullable=False, default="")
    request_id       = Column(String(64), nullable=True)
    status           = Column(String(16), nullable=False, default="pending")
    retries          = Column(Integer, nullable=False, default=0)
    max_retries      = Column(Integer, nullable=False, default=3)
    worker_id        = Column(String(64), nullable=True)
    locked_at        = Column(DateTime(timezone=True), nullable=True)
    lease_seconds    = Column(Integer, nullable=False, default=120)
    result_json      = Column(Text, nullable=True)
    error_message    = Column(Text, nullable=True)
    enqueued_at      = Column(DateTime(timezone=True), nullable=False,
                              default=lambda: datetime.now(timezone.utc))
    started_at       = Column(DateTime(timezone=True), nullable=True)
    completed_at     = Column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        Index("idx_queue_jobs_uid", "uid", "enqueued_at"),
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
            if url.startswith("postgres://"):
                url = "postgresql://" + url[len("postgres://"):]
            # PostgreSQL / Supabase with QueuePool
            _engine = create_engine(
                url,
                poolclass=QueuePool,
                pool_size=10,
                max_overflow=5,
                pool_timeout=30,
                pool_pre_ping=True,
            )
        _SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=_engine)

    return _engine


def get_db_session() -> Session:
    if _SessionFactory is None:
        get_engine()
    return _SessionFactory()


def init_db(engine=None):
    """Create all schema tables (useful for dev / test environments)."""
    eng = engine or get_engine()
    Base.metadata.create_all(bind=eng)


def check_health() -> bool:
    """Safe connectivity check for PostgreSQL / SQLite."""
    try:
        eng = get_engine()
        with eng.connect() as conn:
            conn.execute(select(1))
        return True
    except Exception as exc:
        logger.warning("Supabase database health check failed: %s", exc)
        return False


# ── User Initialization ────────────────────────────────────────────────────────

def init_user_document(
    uid: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    photo_url: Optional[str] = None,
    session: Optional[Session] = None,
) -> bool:
    """
    Idempotent user bootstrap.
    Creates user record if not exists, or updates last_login and provided fields.
    Returns True if created (new user), False if existing.
    If session is provided, operations execute within that session (caller manages commit/close).
    Otherwise, an independent session is created, committed, and closed.
    """
    if session is not None:
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
            session.flush()
            return True
        else:
            user.last_login = now
            if name:
                user.name = name
            if email:
                user.email = email
            if photo_url:
                user.photo_url = photo_url
            session.flush()
            return False

    sess = get_db_session()
    try:
        user = sess.query(User).filter(User.id == uid).first()
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
            sess.add(user)
            sess.commit()
            return True
        else:
            user.last_login = now
            if name:
                user.name = name
            if email:
                user.email = email
            if photo_url:
                user.photo_url = photo_url
            sess.commit()
            return False
    except Exception:
        sess.rollback()
        raise
    finally:
        sess.close()


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
            init_user_document(uid, session=session)

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
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def update_progress_sync(uid: str, question_id: int) -> None:
    """Synchronous version called by submission worker upon Accepted verdict."""
    session = get_db_session()
    try:
        if not session.query(User).filter(User.id == uid).first():
            init_user_document(uid, session=session)

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
    except Exception as exc:
        session.rollback()
        from app.utils.errors import sanitize_db_error
        err_info = sanitize_db_error(exc)
        logger.error(
            "[SUPABASE_UPDATE_PROGRESS_FAILED] uid=%.8s... question_id=%s exc_class=%s pgcode=%s error=%s",
            uid,
            question_id,
            err_info["exception_class"],
            err_info["pgcode"] or "NONE",
            err_info["sanitized_message"],
        )
        raise
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
                init_user_document(uid, session=session)

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
    except Exception:
        session.rollback()
        raise
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
            init_user_document(uid, session=session)

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
    except Exception:
        session.rollback()
        raise
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
            init_user_document(uid, session=session)

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
    except Exception:
        session.rollback()
        raise
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
            init_user_document(uid, session=session)

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
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


# ── Bulk Load ─────────────────────────────────────────────────────────────────

def _get_all_user_data_sync(uid: str) -> Dict[str, Any]:
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


async def get_all_user_data(uid: str) -> Dict[str, Any]:
    """
    Fetch all user data in a single consolidated database query roundtrip.
    Dispatched via asyncio.to_thread() to avoid blocking the event loop.
    Returns:
        {
            "progress": {"solved": [...], "rev1": [...], "rev2": [...]},
            "bookmarks": [...],
            "notes": {qId: content},
            "editor": {qId: {language, code}},
            "general_compiler": {lang: code}
        }
    """
    return await asyncio.to_thread(_get_all_user_data_sync, uid)


# ── Submissions ───────────────────────────────────────────────────────────────

_LANGUAGE_NAMES: Dict[int, str] = {
    50: "c",
    54: "cpp",
    62: "java",
    63: "javascript",
    71: "python",
    76: "cpp",
}


def repair_historical_languages(session: Optional[Session] = None) -> int:
    """
    Safely repairs historical submission records where language is 'unknown' or NULL,
    mapping it from authoritative language_id (e.g. 54 -> cpp).
    Does NOT guess for records with missing or unrecognized language_id.
    Returns the total number of records corrected.
    """
    should_close = False
    if session is None:
        try:
            session = get_db_session()
            should_close = True
        except Exception as exc:
            logger.warning("[REPAIR_LANGUAGES] Could not obtain DB session: %s", exc)
            return 0
    try:
        total_repaired = 0
        for lang_id, lang_name in _LANGUAGE_NAMES.items():
            updated = (
                session.query(Submission)
                .filter(
                    (Submission.language == "unknown") | (Submission.language.is_(None)),
                    Submission.language_id == lang_id,
                )
                .update({Submission.language: lang_name}, synchronize_session=False)
            )
            total_repaired += updated
        if total_repaired > 0:
            session.commit()
            logger.info("[REPAIR_LANGUAGES] Safely repaired %d submission records with authoritative languages.", total_repaired)
        return total_repaired
    except Exception as exc:
        session.rollback()
        logger.warning("[REPAIR_LANGUAGES] Failed to repair historical languages: %s", exc)
        return 0
    finally:
        if should_close:
            session.close()


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
    submission_id: Optional[Union[str, uuid.UUID]] = None,
) -> None:
    """Write submission record synchronously (called from worker thread)."""
    session = get_db_session()
    try:
        if not session.query(User).filter(User.id == uid).first():
            init_user_document(uid, session=session)

        # Idempotent deduplication if submission_id is provided
        if submission_id:
            try:
                sub_uuid = uuid.UUID(str(submission_id))
            except (ValueError, TypeError):
                sub_uuid = uuid.uuid4()
            existing = session.query(Submission).filter(Submission.id == sub_uuid).first()
            if existing:
                logger.info("[SUBMISSION_IDEMPOTENT] Submission %s already recorded; skipping duplicate.", sub_uuid)
                return
        else:
            sub_uuid = uuid.uuid4()

        sub = Submission(
            id=sub_uuid,
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
    except Exception as exc:
        session.rollback()
        from app.utils.errors import sanitize_db_error
        err_info = sanitize_db_error(exc)
        logger.error(
            "[SUPABASE_RECORD_SUBMISSION_FAILED] uid=%.8s... question_id=%s exc_class=%s pgcode=%s error=%s",
            uid,
            question_id,
            err_info["exception_class"],
            err_info["pgcode"] or "NONE",
            err_info["sanitized_message"],
        )
        raise
    finally:
        session.close()


def _get_submission_history_sync(
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
            cursor_uuid = None
            try:
                cursor_uuid = uuid.UUID(str(after_doc_id))
                is_uuid = True
            except ValueError:
                is_uuid = False

            cursor_filter = (
                or_(Submission.id == (cursor_uuid if is_uuid else after_doc_id), Submission.legacy_firestore_id == after_doc_id)
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

            resolved_lang = r.language
            if (not resolved_lang or resolved_lang == "unknown") and r.language_id in _LANGUAGE_NAMES:
                resolved_lang = _LANGUAGE_NAMES[r.language_id]

            items.append({
                "id": item_id,
                "questionId": r.question_id,
                "executionType": r.execution_type,
                "verdict": r.verdict,
                "statusId": r.status_id,
                "language": resolved_lang or "unknown",
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


async def get_submission_history(
    uid: str,
    limit: int = 20,
    after_doc_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Keyset paginated submission history ordered newest-first.
    Compatible with both UUID cursor and legacy Firestore document ID cursor.
    Dispatched via asyncio.to_thread() to avoid blocking the event loop.
    """
    return await asyncio.to_thread(_get_submission_history_sync, uid, limit, after_doc_id)


def _get_user_analytics_sync(uid: str) -> Dict[str, Any]:
    session = get_db_session()
    try:
        p_res = session.query(
            func.coalesce(func.sum(case((UserProgress.solved.is_(True), 1), else_=0)), 0),
            func.coalesce(func.sum(case((UserProgress.rev1.is_(True), 1), else_=0)), 0),
            func.coalesce(func.sum(case((UserProgress.rev2.is_(True), 1), else_=0)), 0),
        ).filter(UserProgress.user_id == uid).first()
        solved_count, rev1_count, rev2_count = p_res if p_res else (0, 0, 0)

        s_res = session.query(
            func.count(Submission.id),
            func.coalesce(func.sum(case((Submission.verdict == "Accepted", 1), else_=0)), 0),
        ).filter(Submission.user_id == uid).first()
        total_subs, accepted_subs = s_res if s_res else (0, 0)
        acc_rate = round((accepted_subs / total_subs * 100), 2) if total_subs > 0 else 0.0

        return {
            "solved_count": int(solved_count),
            "rev1_count": int(rev1_count),
            "rev2_count": int(rev2_count),
            "total_submissions": int(total_subs),
            "accepted_submissions": int(accepted_subs),
            "acceptance_rate": acc_rate,
        }
    finally:
        session.close()


async def get_user_analytics(uid: str) -> Dict[str, Any]:
    """
    Computes summary analytics for a user using database-level SQL aggregations:
    - Solved count and revision counts from UserProgress
    - Total submissions, accepted count, and acceptance rate from Submission
    Dispatched via asyncio.to_thread() to avoid blocking the event loop.
    """
    return await asyncio.to_thread(_get_user_analytics_sync, uid)


# ── Batch Sync (Reliable Cloud-Synced State) ───────────────────────────────────

def _batch_sync_sync(
    uid: str,
    progress_items: Optional[List[Dict[str, Any]]] = None,
    bookmark_items: Optional[List[Dict[str, Any]]] = None,
    note_items: Optional[List[Dict[str, Any]]] = None,
) -> None:
    session = get_db_session()
    now = datetime.now(timezone.utc)
    try:
        if not session.query(User).filter(User.id == uid).first():
            init_user_document(uid, session=session)

        # 1. Progress updates
        if progress_items:
            for item in progress_items:
                qid = item.get("question_id")
                if not qid:
                    continue
                record = (
                    session.query(UserProgress)
                    .filter(UserProgress.user_id == uid, UserProgress.question_id == qid)
                    .first()
                )
                if not record:
                    record = UserProgress(
                        user_id=uid,
                        question_id=qid,
                        solved=bool(item.get("solved", False)) if item.get("solved") is not None else False,
                        rev1=bool(item.get("rev1", False)) if item.get("rev1") is not None else False,
                        rev2=bool(item.get("rev2", False)) if item.get("rev2") is not None else False,
                        last_solved_at=now if item.get("solved") else None,
                        updated_at=now,
                    )
                    session.add(record)
                else:
                    if item.get("solved") is not None:
                        record.solved = bool(item["solved"])
                        if item["solved"] and not record.last_solved_at:
                            record.last_solved_at = now
                    if item.get("rev1") is not None:
                        record.rev1 = bool(item["rev1"])
                    if item.get("rev2") is not None:
                        record.rev2 = bool(item["rev2"])
                    record.updated_at = now

        # 2. Bookmark updates
        if bookmark_items:
            for item in bookmark_items:
                qid = item.get("question_id")
                if not qid:
                    continue
                bookmarked = item.get("bookmarked", False)
                if bookmarked:
                    existing = (
                        session.query(UserBookmark)
                        .filter(UserBookmark.user_id == uid, UserBookmark.question_id == qid)
                        .first()
                    )
                    if not existing:
                        session.add(UserBookmark(user_id=uid, question_id=qid, created_at=now))
                else:
                    session.query(UserBookmark).filter(
                        UserBookmark.user_id == uid, UserBookmark.question_id == qid
                    ).delete()

        # 3. Note updates
        if note_items:
            for item in note_items:
                qid = item.get("question_id")
                if not qid:
                    continue
                content = item.get("content", "")
                existing_note = (
                    session.query(UserNote)
                    .filter(UserNote.user_id == uid, UserNote.question_id == qid)
                    .first()
                )
                if not existing_note:
                    session.add(UserNote(user_id=uid, question_id=qid, content=content, updated_at=now))
                else:
                    existing_note.content = content
                    existing_note.updated_at = now

        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


async def batch_sync(
    uid: str,
    progress_items: Optional[List[Dict[str, Any]]] = None,
    bookmark_items: Optional[List[Dict[str, Any]]] = None,
    note_items: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Atomically synchronizes batches of progress, bookmark, and note updates.
    Returns the full updated user data dictionary for instant client state reconciliation.
    Dispatched via asyncio.to_thread() to avoid blocking the event loop.
    """
    await asyncio.to_thread(_batch_sync_sync, uid, progress_items, bookmark_items, note_items)
    return await get_all_user_data(uid)


# ── Durable Queue CRUD Helpers ────────────────────────────────────────────────
#
# All functions are SYNCHRONOUS and designed to be called via asyncio.to_thread()
# from the async SubmissionQueue worker.
#
# Security invariants maintained throughout:
#   - source_code is cleared to '' on every terminal state (completed/failed).
#   - result_json never contains hidden test inputs or expected outputs.
#   - error_message never contains hidden test data.

import json as _json


def enqueue_job_sync(
    *,
    uid: str,
    question_id: int,
    language_id: int,
    source_code: str,
    compiler_options: str = "",
    request_id: Optional[str] = None,
    max_retries: int = 3,
    lease_seconds: int = 120,
) -> str:
    """
    Insert a new pending job row and return its UUID string.
    Raises on database error — the caller should propagate as HTTP 500.
    """
    session = get_db_session()
    try:
        job = QueueJob(
            id=uuid.uuid4(),
            uid=uid,
            question_id=question_id,
            language_id=language_id,
            source_code=source_code,
            compiler_options=compiler_options,
            request_id=request_id,
            status="pending",
            retries=0,
            max_retries=max_retries,
            lease_seconds=lease_seconds,
            enqueued_at=datetime.now(timezone.utc),
        )
        session.add(job)
        session.commit()
        return str(job.id)
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def claim_next_job_sync(worker_id: str) -> Optional[Dict[str, Any]]:
    """
    Atomically claim the oldest pending job (FIFO) using FOR UPDATE SKIP LOCKED.
    Returns a dict with job fields, or None if no pending job is available.

    This is the core of the durable queue: multiple workers can call this
    simultaneously without double-claiming the same job.
    """
    session = get_db_session()
    try:
        now = datetime.now(timezone.utc)

        # PostgreSQL: FOR UPDATE SKIP LOCKED
        # SQLite fallback for tests uses a simple UPDATE (no SKIP LOCKED support)
        dialect = session.get_bind().dialect.name

        if dialect == "postgresql":
            # SELECT the oldest pending row exclusively and skip any locked by peers
            row = (
                session.query(QueueJob)
                .filter(QueueJob.status == "pending")
                .order_by(QueueJob.enqueued_at.asc())
                .with_for_update(skip_locked=True)
                .first()
            )
        else:
            # SQLite: simple first-come claim (acceptable for tests only)
            row = (
                session.query(QueueJob)
                .filter(QueueJob.status == "pending")
                .order_by(QueueJob.enqueued_at.asc())
                .first()
            )

        if row is None:
            return None

        row.status = "running"
        row.worker_id = worker_id
        row.locked_at = now
        row.started_at = now
        row.retries = (row.retries or 0) + 1
        session.commit()
        return _job_to_dict(row)
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def heartbeat_job_sync(job_id: str, worker_id: str) -> bool:
    """
    Refresh the locked_at timestamp so the lease does not expire while running.
    Returns True if the job was found and updated, False otherwise.
    """
    session = get_db_session()
    try:
        row = (
            session.query(QueueJob)
            .filter(
                QueueJob.id == uuid.UUID(job_id),
                QueueJob.worker_id == worker_id,
                QueueJob.status == "running",
            )
            .first()
        )
        if row is None:
            return False
        row.locked_at = datetime.now(timezone.utc)
        session.commit()
        return True
    except Exception:
        session.rollback()
        return False
    finally:
        session.close()


def complete_job_sync(job_id: str, worker_id: str, result: Dict[str, Any]) -> bool:
    """
    Mark a job as completed. Serialises the safe result dict to JSON.
    Clears source_code to '' (transient data no longer needed).
    Returns True on success, False if job not found or not owned by worker.
    """
    session = get_db_session()
    try:
        row = (
            session.query(QueueJob)
            .filter(
                QueueJob.id == uuid.UUID(job_id),
                QueueJob.worker_id == worker_id,
                QueueJob.status == "running",
            )
            .first()
        )
        if row is None:
            return False
        row.status = "completed"
        row.result_json = _json.dumps(result)
        row.error_message = None
        row.source_code = ""   # clear transient sensitive data
        row.completed_at = datetime.now(timezone.utc)
        session.commit()
        return True
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def fail_job_sync(job_id: str, worker_id: str, error: str, *, permanent: bool = False) -> Dict[str, Any]:
    """
    Record a job failure.
    - If retries < max_retries and not permanent: reset to 'pending' for retry.
    - Otherwise: set to 'failed' permanently and clear source_code.
    Returns dict: {"retried": bool, "status": str, "retries": int}
    """
    session = get_db_session()
    try:
        row = (
            session.query(QueueJob)
            .filter(
                QueueJob.id == uuid.UUID(job_id),
                QueueJob.worker_id == worker_id,
                QueueJob.status == "running",
            )
            .first()
        )
        if row is None:
            return {"retried": False, "status": "not_found", "retries": 0}

        retries_count = row.retries or 0
        max_retries_count = row.max_retries or 3

        if not permanent and retries_count < max_retries_count:
            # Retry: reset to pending so another worker can pick it up
            row.status = "pending"
            row.worker_id = None
            row.locked_at = None
            row.error_message = error
            session.commit()
            return {"retried": True, "status": "pending", "retries": retries_count}
        else:
            # Permanently failed
            row.status = "failed"
            row.error_message = error
            row.source_code = ""  # clear transient data
            row.completed_at = datetime.now(timezone.utc)
            session.commit()
            return {"retried": False, "status": "failed", "retries": retries_count}
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def recover_orphan_jobs_sync() -> int:
    """
    Reset running jobs whose lease has expired back to 'pending' so they can
    be retried by any available worker.
    Returns the count of jobs recovered.
    Should be called periodically (e.g. every 60 seconds) by each worker.
    """
    session = get_db_session()
    try:
        now = datetime.now(timezone.utc)
        rows = (
            session.query(QueueJob)
            .filter(QueueJob.status == "running")
            .all()
        )
        recovered = 0
        for row in rows:
            is_orphan = False
            if row.locked_at is None:
                is_orphan = True
            else:
                locked_ts = row.locked_at
                if locked_ts.tzinfo is None:
                    locked_ts = locked_ts.replace(tzinfo=timezone.utc)
                elapsed = (now - locked_ts).total_seconds()
                if elapsed > (row.lease_seconds or 120):
                    is_orphan = True

            if is_orphan:
                if (row.retries or 0) < (row.max_retries or 3):
                    row.status = "pending"
                    row.worker_id = None
                    row.locked_at = None
                else:
                    row.status = "failed"
                    row.error_message = "Job exceeded max retries after lease expiry."
                    row.source_code = ""
                    row.completed_at = now
                recovered += 1
        if recovered:
            session.commit()
        return recovered
    except Exception:
        session.rollback()
        logger.warning("[QUEUE_RECOVER] Failed to recover orphan jobs: %s", exc_info=True)
        return 0
    finally:
        session.close()


def count_pending_jobs_sync() -> int:
    """
    Return count of active (pending + running) queue jobs.
    Used for bounded backpressure check and queue metrics.
    """
    session = get_db_session()
    try:
        return session.query(QueueJob).filter(QueueJob.status.in_(["pending", "running"])).count()
    finally:
        session.close()


def get_queue_job_sync(job_id: str, uid: str) -> Optional[Dict[str, Any]]:
    """
    Fetch a single queue job by ID, verifying UID ownership.
    Returns the job dict, or None if not found.
    Raises PermissionError if the job exists but belongs to a different UID.
    """
    session = get_db_session()
    try:
        try:
            job_uuid = uuid.UUID(job_id)
        except (ValueError, AttributeError):
            return None

        row = session.query(QueueJob).filter(QueueJob.id == job_uuid).first()
        if row is None:
            return None
        if row.uid != uid:
            raise PermissionError(f"Job {job_id!r} not accessible to this user")
        return _job_to_dict(row)
    finally:
        session.close()


def delete_old_jobs_sync(older_than_seconds: int = 1800) -> int:
    """
    Delete completed/failed jobs older than `older_than_seconds` seconds.
    Returns the number of deleted rows.
    """
    session = get_db_session()
    try:
        cutoff = datetime.now(timezone.utc)
        from datetime import timedelta
        cutoff = cutoff - timedelta(seconds=older_than_seconds)
        deleted = (
            session.query(QueueJob)
            .filter(
                QueueJob.status.in_(["completed", "failed"]),
                QueueJob.enqueued_at < cutoff,
            )
            .delete(synchronize_session=False)
        )
        if deleted:
            session.commit()
        return deleted
    except Exception:
        session.rollback()
        return 0
    finally:
        session.close()


def _job_to_dict(row: "QueueJob") -> Dict[str, Any]:
    """Convert a QueueJob ORM row to a plain dict for in-memory cache use."""
    result = None
    if row.result_json:
        try:
            result = _json.loads(row.result_json)
        except Exception:
            result = None
    return {
        "job_id":           str(row.id),
        "uid":              row.uid,
        "question_id":      row.question_id,
        "language_id":      row.language_id,
        "source_code":      row.source_code,
        "compiler_options": row.compiler_options,
        "request_id":       row.request_id,
        "status":           row.status,
        "retries":          row.retries,
        "max_retries":      row.max_retries,
        "worker_id":        row.worker_id,
        "result":           result,
        "error":            row.error_message,
        "enqueued_at":      row.enqueued_at,
    }

