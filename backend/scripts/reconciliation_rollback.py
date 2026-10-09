"""
Reconciliation Rollback Workflow.

Calculates and synchronizes reverse deltas from PostgreSQL back into Cloud Firestore
to guarantee Zero Data Loss in the event of an emergency rollback post-cutover.

Accounts for:
- Insertions and updates on all application tables created/modified during the cutover window.
- Physical deletions (e.g. bookmarks deleted while on PostgreSQL).
- Missing, null, or stale timestamps (with imputation and inclusion safety).
- Newly created submissions generated during PostgreSQL operation.
"""

from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Set, Tuple
from sqlalchemy.orm import Session

from app.services.supabase_service import (
    User,
    UserProgress,
    UserBookmark,
    UserNote,
    UserEditorDraft,
    UserCompilerDraft,
    Submission,
)


def reconcile_reverse_delta(
    session: Session,
    cutover_time: datetime,
    pre_cutover_snapshot: Optional[Dict[str, Any]] = None,
    firestore_target: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Extracts all changes made in PostgreSQL since cutover_time, detects deletions against
    pre_cutover_snapshot, and produces/applies idempotent Firestore sync operations.

    Args:
        session: Active SQLAlchemy session connected to the PostgreSQL database.
        cutover_time: The UTC timestamp when traffic cut over to PostgreSQL.
        pre_cutover_snapshot: Optional snapshot of Firestore state prior to cutover,
                              used to detect physical deletions (e.g. bookmarks removed).
        firestore_target: Optional in-memory dictionary representing Firestore (for dry-run/testing).
                          If provided, operations will be directly applied.

    Returns:
        Audit report detailing synchronized entities, deletions, timestamp imputations, and operations.
    """
    now = datetime.now(timezone.utc)
    if cutover_time.tzinfo is None:
        cutover_time = cutover_time.replace(tzinfo=timezone.utc)

    report: Dict[str, Any] = {
        "cutover_time": cutover_time.isoformat(),
        "reconciliation_time": now.isoformat(),
        "synced_counts": {
            "users": 0,
            "user_progress": 0,
            "user_bookmarks_added": 0,
            "user_bookmarks_deleted": 0,
            "user_notes": 0,
            "user_editor_drafts": 0,
            "user_compiler_drafts": 0,
            "submissions": 0,
        },
        "stale_or_missing_timestamps_handled": 0,
        "operations": [],
        "status": "SUCCESS",
    }

    # ── 1. Users Reconcile ───────────────────────────────────────────────────────
    # Find all users updated or created since cutover, or with null timestamps
    all_users = session.query(User).all()
    for u in all_users:
        is_post_cutover = False
        u_ts = u.last_login or u.created_at
        if u_ts is None:
            report["stale_or_missing_timestamps_handled"] += 1
            is_post_cutover = True
            u_ts = now
        else:
            if u_ts.tzinfo is None:
                u_ts = u_ts.replace(tzinfo=timezone.utc)
            if u_ts >= cutover_time:
                is_post_cutover = True

        if is_post_cutover:
            op = {
                "type": "SET",
                "collection": "users",
                "doc_id": u.id,
                "data": {
                    "name": u.name,
                    "email": u.email,
                    "photoURL": u.photo_url,
                    "lastLogin": u_ts.isoformat(),
                    "createdAt": (u.created_at or now).isoformat() if hasattr(u.created_at, "isoformat") else str(u.created_at),
                },
            }
            report["operations"].append(op)
            report["synced_counts"]["users"] += 1
            if firestore_target is not None:
                firestore_target.setdefault("users", {}).setdefault(u.id, {}).update(op["data"])

    # ── 2. User Progress Reconcile ──────────────────────────────────────────────
    all_progress = session.query(UserProgress).all()
    for p in all_progress:
        is_post_cutover = False
        p_ts = p.updated_at
        if p_ts is None:
            report["stale_or_missing_timestamps_handled"] += 1
            is_post_cutover = True
            p_ts = now
        else:
            if p_ts.tzinfo is None:
                p_ts = p_ts.replace(tzinfo=timezone.utc)
            if p_ts >= cutover_time:
                is_post_cutover = True

        if is_post_cutover:
            data = {
                "solved": p.solved,
                "rev1": p.rev1,
                "rev2": p.rev2,
                "lastSolvedAt": p.last_solved_at.isoformat() if p.last_solved_at else None,
                "updatedAt": p_ts.isoformat(),
            }
            op = {
                "type": "SET",
                "path": f"users/{p.user_id}/progress/{p.question_id}",
                "user_id": p.user_id,
                "subcollection": "progress",
                "doc_id": str(p.question_id),
                "data": data,
            }
            report["operations"].append(op)
            report["synced_counts"]["user_progress"] += 1
            if firestore_target is not None:
                u_dict = firestore_target.setdefault("users", {}).setdefault(p.user_id, {})
                u_dict.setdefault("progress", {})[str(p.question_id)] = data

    # ── 3. User Bookmarks Reconcile (Inserts & Deletions) ────────────────────────
    current_bookmarks: Set[Tuple[str, int]] = set()
    all_bookmarks = session.query(UserBookmark).all()
    for b in all_bookmarks:
        current_bookmarks.add((b.user_id, b.question_id))
        b_ts = b.created_at
        is_post_cutover = False
        if b_ts is None:
            report["stale_or_missing_timestamps_handled"] += 1
            is_post_cutover = True
            b_ts = now
        else:
            if b_ts.tzinfo is None:
                b_ts = b_ts.replace(tzinfo=timezone.utc)
            if b_ts >= cutover_time:
                is_post_cutover = True

        if is_post_cutover:
            data = {"bookmarked": True, "createdAt": b_ts.isoformat()}
            op = {
                "type": "SET",
                "path": f"users/{b.user_id}/bookmarks/{b.question_id}",
                "user_id": b.user_id,
                "subcollection": "bookmarks",
                "doc_id": str(b.question_id),
                "data": data,
            }
            report["operations"].append(op)
            report["synced_counts"]["user_bookmarks_added"] += 1
            if firestore_target is not None:
                u_dict = firestore_target.setdefault("users", {}).setdefault(b.user_id, {})
                u_dict.setdefault("bookmarks", {})[str(b.question_id)] = data

    # Detect physical deletions against pre-cutover snapshot
    if pre_cutover_snapshot and "users" in pre_cutover_snapshot:
        for uid, udata in pre_cutover_snapshot["users"].items():
            bm_map = udata.get("bookmarks", {})
            for qid_str, bm_data in bm_map.items():
                if bm_data.get("bookmarked", False):
                    try:
                        qid = int(qid_str)
                    except ValueError:
                        continue
                    # If it was bookmarked before cutover, but is NOT in current PostgreSQL bookmarks, it was deleted!
                    if (uid, qid) not in current_bookmarks:
                        op = {
                            "type": "DELETE",
                            "path": f"users/{uid}/bookmarks/{qid}",
                            "user_id": uid,
                            "subcollection": "bookmarks",
                            "doc_id": str(qid),
                        }
                        report["operations"].append(op)
                        report["synced_counts"]["user_bookmarks_deleted"] += 1
                        if firestore_target is not None:
                            u_dict = firestore_target.setdefault("users", {}).setdefault(uid, {})
                            if "bookmarks" in u_dict and str(qid) in u_dict["bookmarks"]:
                                del u_dict["bookmarks"][str(qid)]

    # ── 4. User Notes Reconcile ─────────────────────────────────────────────────
    all_notes = session.query(UserNote).all()
    for n in all_notes:
        is_post_cutover = False
        n_ts = n.updated_at
        if n_ts is None:
            report["stale_or_missing_timestamps_handled"] += 1
            is_post_cutover = True
            n_ts = now
        else:
            if n_ts.tzinfo is None:
                n_ts = n_ts.replace(tzinfo=timezone.utc)
            if n_ts >= cutover_time:
                is_post_cutover = True

        if is_post_cutover:
            data = {"content": n.content, "updatedAt": n_ts.isoformat()}
            op = {
                "type": "SET",
                "path": f"users/{n.user_id}/notes/{n.question_id}",
                "user_id": n.user_id,
                "subcollection": "notes",
                "doc_id": str(n.question_id),
                "data": data,
            }
            report["operations"].append(op)
            report["synced_counts"]["user_notes"] += 1
            if firestore_target is not None:
                u_dict = firestore_target.setdefault("users", {}).setdefault(n.user_id, {})
                u_dict.setdefault("notes", {})[str(n.question_id)] = data

    # ── 5. User Editor Drafts Reconcile ─────────────────────────────────────────
    all_editor_drafts = session.query(UserEditorDraft).all()
    for ed in all_editor_drafts:
        is_post_cutover = False
        ed_ts = ed.updated_at
        if ed_ts is None:
            report["stale_or_missing_timestamps_handled"] += 1
            is_post_cutover = True
            ed_ts = now
        else:
            if ed_ts.tzinfo is None:
                ed_ts = ed_ts.replace(tzinfo=timezone.utc)
            if ed_ts >= cutover_time:
                is_post_cutover = True

        if is_post_cutover:
            data = {"language": ed.language, "code": ed.code, "updatedAt": ed_ts.isoformat()}
            op = {
                "type": "SET",
                "path": f"users/{ed.user_id}/editor/{ed.question_id}",
                "user_id": ed.user_id,
                "subcollection": "editor",
                "doc_id": str(ed.question_id),
                "data": data,
            }
            report["operations"].append(op)
            report["synced_counts"]["user_editor_drafts"] += 1
            if firestore_target is not None:
                u_dict = firestore_target.setdefault("users", {}).setdefault(ed.user_id, {})
                u_dict.setdefault("editor", {})[str(ed.question_id)] = data

    # ── 6. User Compiler Drafts Reconcile ───────────────────────────────────────
    all_comp_drafts = session.query(UserCompilerDraft).all()
    for cd in all_comp_drafts:
        is_post_cutover = False
        cd_ts = cd.updated_at
        if cd_ts is None:
            report["stale_or_missing_timestamps_handled"] += 1
            is_post_cutover = True
            cd_ts = now
        else:
            if cd_ts.tzinfo is None:
                cd_ts = cd_ts.replace(tzinfo=timezone.utc)
            if cd_ts >= cutover_time:
                is_post_cutover = True

        if is_post_cutover:
            data = {"code": cd.code, "updatedAt": cd_ts.isoformat()}
            op = {
                "type": "SET",
                "path": f"users/{cd.user_id}/general_compiler/{cd.language}",
                "user_id": cd.user_id,
                "subcollection": "general_compiler",
                "doc_id": cd.language,
                "data": data,
            }
            report["operations"].append(op)
            report["synced_counts"]["user_compiler_drafts"] += 1
            if firestore_target is not None:
                u_dict = firestore_target.setdefault("users", {}).setdefault(cd.user_id, {})
                u_dict.setdefault("general_compiler", {})[cd.language] = data

    # ── 7. Submissions Reconcile ────────────────────────────────────────────────
    all_submissions = session.query(Submission).all()
    for sub in all_submissions:
        is_post_cutover = False
        s_ts = sub.submitted_at
        if s_ts is None:
            report["stale_or_missing_timestamps_handled"] += 1
            is_post_cutover = True
            s_ts = now
        else:
            if s_ts.tzinfo is None:
                s_ts = s_ts.replace(tzinfo=timezone.utc)
            if s_ts >= cutover_time:
                is_post_cutover = True

        if is_post_cutover:
            # Use legacy ID if available; otherwise use PostgreSQL submission string/UUID
            sub_id = sub.legacy_firestore_id or str(sub.id)
            data = {
                "questionId": sub.question_id,
                "executionType": sub.execution_type,
                "verdict": sub.verdict,
                "statusId": sub.status_id,
                "language": sub.language,
                "languageId": sub.language_id,
                "passedCount": sub.passed_count,
                "totalCount": sub.total_count,
                "runtime": sub.runtime,
                "memory": sub.memory,
                "compileError": sub.compile_error,
                "submittedAt": s_ts.isoformat(),
            }
            op = {
                "type": "SET",
                "path": f"users/{sub.user_id}/submissions/{sub_id}",
                "user_id": sub.user_id,
                "subcollection": "submissions",
                "doc_id": sub_id,
                "data": data,
            }
            report["operations"].append(op)
            report["synced_counts"]["submissions"] += 1
            if firestore_target is not None:
                u_dict = firestore_target.setdefault("users", {}).setdefault(sub.user_id, {})
                u_dict.setdefault("submissions", {})[sub_id] = data

    return report
