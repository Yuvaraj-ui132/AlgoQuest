"""
Unified Database Access Gateway.
Routes database calls to either Cloud Firestore or Supabase PostgreSQL
based on the `DATABASE_BACKEND` configuration setting ('firestore' | 'supabase').

Defaults to 'firestore' so existing runtime behavior is 100% preserved.
"""

from typing import Dict, List, Optional, Any
from app.config import settings
from app.services import firestore_service
from app.services import supabase_service


def get_backend():
    """Return the active database service provider."""
    if settings.database_backend == "supabase":
        return supabase_service
    return firestore_service


# ── User Initialization ────────────────────────────────────────────────────────

def init_user_document(
    uid: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    photo_url: Optional[str] = None,
) -> bool:
    return get_backend().init_user_document(uid, name, email, photo_url)


# ── Progress ──────────────────────────────────────────────────────────────────

async def get_all_progress(uid: str) -> Dict[str, Dict]:
    return await get_backend().get_all_progress(uid)


async def update_progress(
    uid: str,
    question_id: int,
    solved: Optional[bool] = None,
    rev1: Optional[bool] = None,
    rev2: Optional[bool] = None,
) -> None:
    return await get_backend().update_progress(uid, question_id, solved, rev1, rev2)


def update_progress_sync(uid: str, question_id: int) -> None:
    backend = get_backend()
    if hasattr(backend, "update_progress_sync"):
        return backend.update_progress_sync(uid, question_id)
    # Firestore fallback
    import asyncio
    from app.services.submission_queue import _update_progress_sync
    return _update_progress_sync(uid, question_id)


# ── Bookmarks ─────────────────────────────────────────────────────────────────

async def get_all_bookmarks(uid: str) -> List[int]:
    return await get_backend().get_all_bookmarks(uid)


async def set_bookmark(uid: str, question_id: int, bookmarked: bool) -> None:
    return await get_backend().set_bookmark(uid, question_id, bookmarked)


# ── Notes ─────────────────────────────────────────────────────────────────────

async def get_all_notes(uid: str) -> Dict[str, str]:
    return await get_backend().get_all_notes(uid)


async def get_note(uid: str, question_id: int) -> str:
    return await get_backend().get_note(uid, question_id)


async def save_note(uid: str, question_id: int, content: str) -> None:
    return await get_backend().save_note(uid, question_id, content)


# ── Editor Code ───────────────────────────────────────────────────────────────

async def get_all_editor_code(uid: str) -> Dict[str, Dict]:
    return await get_backend().get_all_editor_code(uid)


async def get_editor_code(uid: str, question_id: int) -> Dict[str, Optional[str]]:
    return await get_backend().get_editor_code(uid, question_id)


async def save_editor_code(uid: str, question_id: int, language: str, code: str) -> None:
    return await get_backend().save_editor_code(uid, question_id, language, code)


# ── General Compiler Code ─────────────────────────────────────────────────────

async def get_all_general_compiler_code(uid: str) -> Dict[str, str]:
    return await get_backend().get_all_general_compiler_code(uid)


async def get_general_compiler_code(uid: str, language: str) -> Optional[str]:
    return await get_backend().get_general_compiler_code(uid, language)


async def save_general_compiler_code(uid: str, language: str, code: str) -> None:
    return await get_backend().save_general_compiler_code(uid, language, code)


# ── Bulk Load ─────────────────────────────────────────────────────────────────

async def get_all_user_data(uid: str) -> Dict[str, Any]:
    return await get_backend().get_all_user_data(uid)


# ── Submissions ───────────────────────────────────────────────────────────────

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
) -> None:
    return await get_backend().record_submission(
        uid, question_id, verdict, status_id, language_id,
        passed_count, total_count, runtime, memory, compile_error
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
) -> None:
    backend = get_backend()
    if hasattr(backend, "record_submission_sync"):
        return backend.record_submission_sync(
            uid, question_id, verdict, status_id, language_id,
            passed_count, total_count, runtime, memory, compile_error
        )
    from app.services.submission_queue import _record_submission_sync
    return _record_submission_sync(
        uid, question_id, verdict, status_id, language_id,
        passed_count, total_count, runtime, memory, compile_error
    )


async def get_submission_history(
    uid: str,
    limit: int = 20,
    after_doc_id: Optional[str] = None,
) -> Dict[str, Any]:
    return await get_backend().get_submission_history(uid, limit, after_doc_id)


async def get_user_analytics(uid: str) -> Dict[str, Any]:
    backend = get_backend()
    if hasattr(backend, "get_user_analytics"):
        return await backend.get_user_analytics(uid)
    return {"solved_count": 0, "total_submissions": 0, "acceptance_rate": 0.0}
