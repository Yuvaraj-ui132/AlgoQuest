"""
Firestore service — all database read/write operations.

Uses Firebase Admin SDK (server-side, bypasses Firestore security rules).
The UID passed to every function comes from a verified Firebase ID token —
never from user-supplied input.

Firestore path structure:
  users/{uid}/progress/{qId}
  users/{uid}/revisions/{qId}   (redundant with progress, kept for compatibility)
  users/{uid}/bookmarks/{qId}
  users/{uid}/notes/{qId}
  users/{uid}/editor/{qId}
  users/{uid}/general_compiler/{lang}
  users/{uid}/submissions/{auto_id}   (submission history — one doc per Submit)
"""

import logging
from typing import Dict, List, Optional, Any
from firebase_admin import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

logger = logging.getLogger(__name__)


def _db():
    """Lazily get the Firestore client."""
    return firestore.client()


def _user_ref(uid: str):
    return _db().collection("users").document(uid)


# ── User initialization ───────────────────────────────────────────────────────

def init_user_document(
    uid: str,
    name: Optional[str] = None,
    email: Optional[str] = None,
    photo_url: Optional[str] = None,
) -> bool:
    """
    Idempotent user document bootstrap.

    Creates the /users/{uid} document if it does not already exist, or merges
    the provided fields into it if it does (set with merge=True).

    Called from POST /api/user/init after Firebase signup.
    The Admin SDK bypasses Firestore security rules, so this is always allowed.

    Returns:
        True  — document was freshly created (new user)
        False — document already existed (reconcile / duplicate call)
    """
    ref = _user_ref(uid)
    existing = ref.get()

    fields: Dict[str, Any] = {
        "uid": uid,
        "lastLogin": SERVER_TIMESTAMP,
        "migrated": True,
    }
    if name:
        fields["name"] = name
    if email:
        fields["email"] = email
    if photo_url:
        fields["photoURL"] = photo_url

    if not existing.exists:
        # Brand-new user — also stamp createdAt
        fields["createdAt"] = SERVER_TIMESTAMP
        ref.set(fields)   # creates document
        return True
    else:
        # Document already exists — merge only what we received
        # (never overwrite createdAt or user-set fields)
        ref.set(fields, merge=True)
        return False


# ── Progress ──────────────────────────────────────────────────────────────────

async def get_all_progress(uid: str) -> Dict[str, Dict]:
    """Return all progress docs as {qId: {solved, rev1, rev2}}."""
    docs = _user_ref(uid).collection("progress").stream()
    return {doc.id: doc.to_dict() for doc in docs}


async def update_progress(
    uid: str,
    question_id: int,
    solved: Optional[bool] = None,
    rev1: Optional[bool] = None,
    rev2: Optional[bool] = None,
) -> None:
    """
    Update solved/rev1/rev2 for a question.
    Only fields that are not None are updated.
    """
    qid_str = str(question_id)
    updates: Dict[str, Any] = {"lastModified": SERVER_TIMESTAMP}
    if solved is not None:
        updates["solved"] = solved
        if solved:
            updates["lastSolved"] = SERVER_TIMESTAMP
    if rev1 is not None:
        updates["rev1"] = rev1
    if rev2 is not None:
        updates["rev2"] = rev2

    if len(updates) <= 1:
        return  # nothing to write

    _user_ref(uid).collection("progress").document(qid_str).set(
        updates, merge=True
    )

    # Mirror rev1/rev2 in the revisions subcollection (legacy compat)
    rev_updates: Dict[str, Any] = {}
    if rev1 is not None:
        rev_updates["rev1"] = rev1
    if rev2 is not None:
        rev_updates["rev2"] = rev2
    if rev_updates:
        _user_ref(uid).collection("revisions").document(qid_str).set(
            rev_updates, merge=True
        )


# ── Bookmarks ─────────────────────────────────────────────────────────────────

async def get_all_bookmarks(uid: str) -> List[int]:
    """Return list of bookmarked question IDs."""
    docs = _user_ref(uid).collection("bookmarks").stream()
    result = []
    for doc in docs:
        data = doc.to_dict()
        if data and data.get("bookmarked", False):
            try:
                result.append(int(doc.id))
            except ValueError:
                pass
    return result


async def set_bookmark(uid: str, question_id: int, bookmarked: bool) -> None:
    """Add or remove a bookmark."""
    ref = _user_ref(uid).collection("bookmarks").document(str(question_id))
    if bookmarked:
        ref.set({"bookmarked": True, "bookmarkedAt": SERVER_TIMESTAMP})
    else:
        ref.delete()


# ── Notes ─────────────────────────────────────────────────────────────────────

async def get_all_notes(uid: str) -> Dict[str, str]:
    """Return all notes as {qId: content}."""
    docs = _user_ref(uid).collection("notes").stream()
    return {
        doc.id: (doc.to_dict() or {}).get("content", "")
        for doc in docs
    }


async def get_note(uid: str, question_id: int) -> str:
    """Return note content for one question (empty string if not found)."""
    doc = _user_ref(uid).collection("notes").document(str(question_id)).get()
    if doc.exists:
        return (doc.to_dict() or {}).get("content", "")
    return ""


async def save_note(uid: str, question_id: int, content: str) -> None:
    """Save or overwrite a note."""
    _user_ref(uid).collection("notes").document(str(question_id)).set(
        {"content": content, "updatedAt": SERVER_TIMESTAMP}
    )


# ── Editor code ───────────────────────────────────────────────────────────────

async def get_all_editor_code(uid: str) -> Dict[str, Dict]:
    """Return all DSA editor code as {qId: {language, code}}."""
    docs = _user_ref(uid).collection("editor").stream()
    result = {}
    for doc in docs:
        data = doc.to_dict() or {}
        result[doc.id] = {
            "language": data.get("language"),
            "code": data.get("code"),
        }
    return result


async def get_editor_code(uid: str, question_id: int) -> Dict[str, Optional[str]]:
    """Return saved editor code for one question."""
    doc = _user_ref(uid).collection("editor").document(str(question_id)).get()
    if doc.exists:
        data = doc.to_dict() or {}
        return {"language": data.get("language"), "code": data.get("code")}
    return {"language": None, "code": None}


async def save_editor_code(uid: str, question_id: int, language: str, code: str) -> None:
    """Save DSA editor code for a question."""
    _user_ref(uid).collection("editor").document(str(question_id)).set(
        {
            "questionId": str(question_id),
            "language": language,
            "code": code,
            "updatedAt": SERVER_TIMESTAMP,
        }
    )


# ── General compiler code ─────────────────────────────────────────────────────

async def get_all_general_compiler_code(uid: str) -> Dict[str, str]:
    """Return all general compiler code as {lang: code}."""
    docs = _user_ref(uid).collection("general_compiler").stream()
    return {
        doc.id: (doc.to_dict() or {}).get("code", "")
        for doc in docs
    }


async def get_general_compiler_code(uid: str, language: str) -> Optional[str]:
    """Return general compiler code for a specific language."""
    doc = _user_ref(uid).collection("general_compiler").document(language).get()
    if doc.exists:
        return (doc.to_dict() or {}).get("code")
    return None


async def save_general_compiler_code(uid: str, language: str, code: str) -> None:
    """Save general compiler code for a language."""
    _user_ref(uid).collection("general_compiler").document(language).set(
        {
            "language": language,
            "code": code,
            "updatedAt": SERVER_TIMESTAMP,
        }
    )


# ── Bulk load ─────────────────────────────────────────────────────────────────

async def get_all_user_data(uid: str) -> Dict[str, Any]:
    """
    Fetch all user data in parallel subcollection reads.
    Returns a dict with keys: progress_raw, bookmarks_raw, notes, editor, general_compiler.
    Called once on login to replace 6 separate frontend Firestore calls.
    """
    db = _db()
    user_ref = db.collection("users").document(uid)

    # Firestore Admin SDK does not yet support async; run reads sequentially.
    # For a high-traffic app, use batch_get() or parallel thread execution.
    progress_docs  = list(user_ref.collection("progress").stream())
    bookmark_docs  = list(user_ref.collection("bookmarks").stream())
    note_docs      = list(user_ref.collection("notes").stream())
    editor_docs    = list(user_ref.collection("editor").stream())
    compiler_docs  = list(user_ref.collection("general_compiler").stream())

    # Progress → solved[], rev1[], rev2[]
    solved_ids, rev1_ids, rev2_ids = [], [], []
    for doc in progress_docs:
        data = doc.to_dict() or {}
        try:
            qid = int(doc.id)
        except ValueError:
            continue
        if data.get("solved"):  solved_ids.append(qid)
        if data.get("rev1"):    rev1_ids.append(qid)
        if data.get("rev2"):    rev2_ids.append(qid)

    # Bookmarks
    bookmark_ids = []
    for doc in bookmark_docs:
        data = doc.to_dict() or {}
        if data.get("bookmarked"):
            try:
                bookmark_ids.append(int(doc.id))
            except ValueError:
                pass

    # Notes
    notes_map = {
        doc.id: (doc.to_dict() or {}).get("content", "")
        for doc in note_docs
    }

    # Editor code
    editor_map = {}
    for doc in editor_docs:
        data = doc.to_dict() or {}
        editor_map[doc.id] = {
            "language": data.get("language"),
            "code": data.get("code"),
        }

    # General compiler code
    compiler_map = {
        doc.id: (doc.to_dict() or {}).get("code", "")
        for doc in compiler_docs
    }

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


# ── Submission history ────────────────────────────────────────────────────────

# Maps Judge0 language_id → human-readable language name for history records.
_LANGUAGE_NAMES: Dict[int, str] = {
    50:  "c",
    62:  "java",
    63:  "javascript",
    71:  "python",
    76:  "cpp",
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
) -> None:
    """
    Persist one submission history document at users/{uid}/submissions/{auto_id}.

    Called after every execution_type='submit' request completes.
    Source code is intentionally NOT stored here.

    Args:
        uid:           Verified Firebase UID (never client-supplied).
        question_id:   AlgoQuest question ID.
        verdict:       Human-readable verdict string (e.g. 'Accepted').
        status_id:     Judge0 status ID.
        language_id:   Judge0 language ID; mapped to a name internally.
        passed_count:  Number of test cases passed.
        total_count:   Total test cases executed.
        runtime:       Formatted runtime string (e.g. '0.032s').
        memory:        Formatted memory string (e.g. '5.2 MB').
        compile_error: Compiler/runtime error output when applicable, else None.
    """
    doc: Dict[str, Any] = {
        "questionId":    question_id,
        "executionType": "submit",
        "verdict":       verdict,
        "statusId":      status_id,
        "language":      _LANGUAGE_NAMES.get(language_id, "unknown"),
        "languageId":    language_id,
        "passedCount":   passed_count,
        "totalCount":    total_count,
        "runtime":       runtime,
        "memory":        memory,
        "submittedAt":   SERVER_TIMESTAMP,
        "compileError":  compile_error or None,
    }
    # add() generates a unique document ID automatically
    _user_ref(uid).collection("submissions").add(doc)


async def get_submission_history(
    uid: str,
    limit: int = 20,
    after_doc_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Return a page of submission history for the given user, sorted newest-first.

    Firestore does not support ORDER BY on SERVER_TIMESTAMP fields without a
    composite index in some SDKs, so we query without ordering and sort in Python.
    For a high-traffic deployment, create a Firestore composite index on
    (submittedAt DESC) and switch to a native ordered query.

    Args:
        uid:          Verified Firebase UID.
        limit:        Page size (capped at 50).
        after_doc_id: Document ID of the last item on the previous page (cursor).

    Returns:
        {
            "items":      list of submission dicts (each includes "id"),
            "hasMore":    bool,
            "nextCursor": str | None,
        }
    """
    limit = min(max(1, limit), 50)  # enforce 1–50 inclusive

    ref = _user_ref(uid).collection("submissions")

    # Fetch one extra to determine hasMore without a separate count query
    fetch_limit = limit + 1

    if after_doc_id:
        try:
            cursor_snap = _user_ref(uid).collection("submissions").document(after_doc_id).get()
            if cursor_snap.exists:
                docs = list(ref.order_by("submittedAt", direction="DESCENDING")
                              .start_after(cursor_snap)
                              .limit(fetch_limit)
                              .stream())
            else:
                # Invalid cursor — fall back to first page
                docs = list(ref.limit(fetch_limit).stream())
        except Exception:
            logger.warning("get_submission_history: cursor lookup failed, returning first page")
            docs = list(ref.limit(fetch_limit).stream())
    else:
        try:
            docs = list(ref.order_by("submittedAt", direction="DESCENDING")
                          .limit(fetch_limit)
                          .stream())
        except Exception:
            # Index may not exist yet — fall back to unordered and sort in Python
            logger.warning(
                "get_submission_history: ordered query failed (index may be missing), "
                "falling back to Python-side sort"
            )
            all_docs = list(ref.stream())
            # Sort by submittedAt descending (SERVER_TIMESTAMP is a DatetimeWithNanoseconds)
            all_docs.sort(
                key=lambda d: (d.to_dict() or {}).get("submittedAt") or 0,
                reverse=True,
            )
            docs = all_docs[:fetch_limit]

    has_more = len(docs) > limit
    page = docs[:limit]

    items = []
    for doc in page:
        data = doc.to_dict() or {}
        # Serialize Firestore Timestamp → ISO 8601 string for JSON
        submitted_at = data.get("submittedAt")
        if submitted_at and hasattr(submitted_at, "isoformat"):
            submitted_at = submitted_at.isoformat()
        else:
            submitted_at = None

        items.append({
            "id":            doc.id,
            "questionId":    data.get("questionId"),
            "executionType": data.get("executionType", "submit"),
            "verdict":       data.get("verdict"),
            "statusId":      data.get("statusId"),
            "language":      data.get("language"),
            "languageId":    data.get("languageId"),
            "passedCount":   data.get("passedCount"),
            "totalCount":    data.get("totalCount"),
            "runtime":       data.get("runtime"),
            "memory":        data.get("memory"),
            "submittedAt":   submitted_at,
            "compileError":  data.get("compileError"),
        })

    next_cursor = page[-1].id if has_more and page else None

    return {
        "items":      items,
        "hasMore":    has_more,
        "nextCursor": next_cursor,
    }
