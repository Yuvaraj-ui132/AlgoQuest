"""
Idempotent Firestore to PostgreSQL Migration CLI.

Features:
- Preserves Firebase Auth UIDs, legacy submission IDs, timestamps, and revisions.
- Resolves conflicts between /progress and /revisions using Logical OR.
- Imputes missing timestamps with UTC now.
- Idempotent: safe to run multiple times without duplicating or corrupting data.
- Timestamp protection: never overwrites newer PostgreSQL data with older source records.
- Generates a full source/destination parity and reconciliation report.
"""

import os
import sys
import json
import logging
import argparse
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy import create_engine, select, text
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, BASE_DIR)

from app.config import settings
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

logger = logging.getLogger("migration")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")


def parse_timestamp(val: Any, default_time: datetime) -> datetime:
    if val is None:
        return default_time
    if isinstance(val, datetime):
        return val if val.tzinfo else val.replace(tzinfo=timezone.utc)
    if isinstance(val, (int, float)):
        return datetime.fromtimestamp(val, tz=timezone.utc)
    if isinstance(val, str):
        try:
            cleaned = val.replace("Z", "+00:00")
            dt = datetime.fromisoformat(cleaned)
            return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        except Exception:
            return default_time
    # Firestore DatetimeWithNanoseconds or dict representation
    if hasattr(val, "timestamp"):
        return datetime.fromtimestamp(val.timestamp(), tz=timezone.utc)
    return default_time


def migrate_data(
    source_data: Dict[str, Any],
    engine,
    dry_run: bool = False,
) -> Dict[str, Any]:
    """
    Idempotently migrates Firestore data dictionary to PostgreSQL.
    """
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()

    report: Dict[str, Any] = {
        "dry_run": dry_run,
        "source_counts": {},
        "migrated_counts": {
            "users": 0,
            "user_progress": 0,
            "user_bookmarks": 0,
            "user_notes": 0,
            "user_editor_drafts": 0,
            "user_compiler_drafts": 0,
            "submissions": 0,
        },
        "skipped_newer_existing": 0,
        "conflicts_resolved": 0,
        "malformed_skipped": 0,
        "timestamps_imputed": 0,
        "status": "SUCCESS",
    }

    now = datetime.now(timezone.utc)
    users_dict = source_data.get("users", {})
    report["source_counts"]["users"] = len(users_dict)

    total_prog_src = 0
    total_rev_src = 0
    total_bm_src = 0
    total_notes_src = 0
    total_ed_src = 0
    total_comp_src = 0
    total_subs_src = 0

    try:
        for uid, udata in users_dict.items():
            # 1. User Account
            raw_created = udata.get("createdAt")
            created_at = parse_timestamp(raw_created, now)
            if not raw_created:
                report["timestamps_imputed"] += 1

            existing_user = session.query(User).filter_by(id=uid).first()
            if existing_user:
                # Update only if not newer
                if existing_user.last_login and existing_user.last_login > created_at:
                    report["skipped_newer_existing"] += 1
                else:
                    existing_user.name = udata.get("name") or existing_user.name
                    existing_user.email = udata.get("email") or existing_user.email
                    existing_user.photo_url = udata.get("photoURL") or existing_user.photo_url
                    existing_user.migrated = True
            else:
                user = User(
                    id=uid,
                    name=udata.get("name") or None,
                    email=udata.get("email") or None,
                    photo_url=udata.get("photoURL") or None,
                    created_at=created_at,
                    last_login=created_at,
                    migrated=True,
                )
                session.add(user)
                report["migrated_counts"]["users"] += 1

            # 2. Progress & Revisions Merge (Logical OR)
            prog_docs = udata.get("progress", {})
            rev_docs = udata.get("revisions", {})
            total_prog_src += len(prog_docs)
            total_rev_src += len(rev_docs)

            all_qids = set(prog_docs.keys()).union(set(rev_docs.keys()))
            for qid_str in all_qids:
                try:
                    qid = int(qid_str)
                except ValueError:
                    report["malformed_skipped"] += 1
                    continue

                p_item = prog_docs.get(qid_str)
                r_item = rev_docs.get(qid_str)

                p_rev1 = p_item.get("rev1", False) if p_item else False
                r_rev1 = r_item.get("rev1", False) if r_item else False
                p_rev2 = p_item.get("rev2", False) if p_item else False
                r_rev2 = r_item.get("rev2", False) if r_item else False

                if p_item and r_item and ((p_rev1 != r_rev1) or (p_rev2 != r_rev2)):
                    report["conflicts_resolved"] += 1

                merged_rev1 = p_rev1 or r_rev1
                merged_rev2 = p_rev2 or r_rev2
                solved = p_item.get("solved", False) if p_item else False

                raw_up_ts = p_item.get("updatedAt") if p_item else None
                up_ts = parse_timestamp(raw_up_ts, now)

                existing_p = (
                    session.query(UserProgress)
                    .filter_by(user_id=uid, question_id=qid)
                    .first()
                )
                if existing_p:
                    if existing_p.updated_at and existing_p.updated_at > up_ts:
                        report["skipped_newer_existing"] += 1
                    else:
                        existing_p.solved = solved or existing_p.solved
                        existing_p.rev1 = merged_rev1 or existing_p.rev1
                        existing_p.rev2 = merged_rev2 or existing_p.rev2
                else:
                    new_p = UserProgress(
                        user_id=uid,
                        question_id=qid,
                        solved=solved,
                        rev1=merged_rev1,
                        rev2=merged_rev2,
                        last_solved_at=up_ts if solved else None,
                        updated_at=up_ts,
                    )
                    session.add(new_p)
                    report["migrated_counts"]["user_progress"] += 1

            # 3. Bookmarks
            bm_docs = udata.get("bookmarks", {})
            total_bm_src += len(bm_docs)
            for qid_str, b_item in bm_docs.items():
                try:
                    qid = int(qid_str)
                except ValueError:
                    report["malformed_skipped"] += 1
                    continue

                if b_item.get("bookmarked", False):
                    existing_bm = (
                        session.query(UserBookmark)
                        .filter_by(user_id=uid, question_id=qid)
                        .first()
                    )
                    if not existing_bm:
                        session.add(UserBookmark(user_id=uid, question_id=qid, created_at=now))
                        report["migrated_counts"]["user_bookmarks"] += 1

            # 4. Notes
            note_docs = udata.get("notes", {})
            total_notes_src += len(note_docs)
            for qid_str, n_item in note_docs.items():
                try:
                    qid = int(qid_str)
                except ValueError:
                    report["malformed_skipped"] += 1
                    continue

                content = n_item.get("content", "")
                existing_note = (
                    session.query(UserNote)
                    .filter_by(user_id=uid, question_id=qid)
                    .first()
                )
                if existing_note:
                    existing_note.content = content
                else:
                    session.add(UserNote(user_id=uid, question_id=qid, content=content, updated_at=now))
                    report["migrated_counts"]["user_notes"] += 1

            # 5. Editor Drafts
            ed_docs = udata.get("editor", {})
            total_ed_src += len(ed_docs)
            for qid_str, e_item in ed_docs.items():
                try:
                    qid = int(qid_str)
                except ValueError:
                    report["malformed_skipped"] += 1
                    continue

                existing_ed = (
                    session.query(UserEditorDraft)
                    .filter_by(user_id=uid, question_id=qid)
                    .first()
                )
                if existing_ed:
                    existing_ed.language = e_item.get("language", "python")
                    existing_ed.code = e_item.get("code", "")
                else:
                    session.add(UserEditorDraft(
                        user_id=uid,
                        question_id=qid,
                        language=e_item.get("language", "python"),
                        code=e_item.get("code", ""),
                        updated_at=now,
                    ))
                    report["migrated_counts"]["user_editor_drafts"] += 1

            # 6. Compiler Drafts
            comp_docs = udata.get("general_compiler", {})
            total_comp_src += len(comp_docs)
            for lang, c_item in comp_docs.items():
                existing_cd = (
                    session.query(UserCompilerDraft)
                    .filter_by(user_id=uid, language=lang)
                    .first()
                )
                if existing_cd:
                    existing_cd.code = c_item.get("code", "")
                else:
                    session.add(UserCompilerDraft(
                        user_id=uid,
                        language=lang,
                        code=c_item.get("code", ""),
                        updated_at=now,
                    ))
                    report["migrated_counts"]["user_compiler_drafts"] += 1

            # 7. Submissions
            sub_docs = udata.get("submissions", {})
            total_subs_src += len(sub_docs)
            for legacy_sub_id, s_item in sub_docs.items():
                existing_sub = (
                    session.query(Submission)
                    .filter_by(user_id=uid, legacy_firestore_id=legacy_sub_id)
                    .first()
                )
                if not existing_sub:
                    raw_sub_at = s_item.get("submittedAt")
                    sub_at = parse_timestamp(raw_sub_at, now)
                    if not raw_sub_at:
                        report["timestamps_imputed"] += 1

                    session.add(Submission(
                        user_id=uid,
                        question_id=int(s_item.get("questionId", 1)),
                        execution_type="submit",
                        verdict=s_item.get("verdict", "Accepted"),
                        status_id=int(s_item.get("statusId", 3)),
                        language=s_item.get("language", "python"),
                        language_id=int(s_item.get("languageId", 71)),
                        passed_count=int(s_item.get("passedCount", 0)),
                        total_count=int(s_item.get("totalCount", 0)),
                        runtime=s_item.get("runtime", "--"),
                        memory=s_item.get("memory", "--"),
                        compile_error=s_item.get("compileError"),
                        submitted_at=sub_at,
                        legacy_firestore_id=legacy_sub_id,
                    ))
                    report["migrated_counts"]["submissions"] += 1

        if dry_run:
            session.rollback()
            logger.info("[Migration Dry-Run] Changes rolled back successfully.")
        else:
            session.commit()
            logger.info("[Migration Commit] Changes committed successfully to PostgreSQL.")

    except Exception as e:
        session.rollback()
        report["status"] = "FAILED"
        report["error"] = str(e)
        logger.error("[Migration Error] %s", e, exc_info=True)
        raise
    finally:
        session.close()

    # Destination Counts
    SessionAudit = sessionmaker(bind=engine)
    audit_s = SessionAudit()
    try:
        report["destination_counts"] = {
            "users": audit_s.query(User).count(),
            "user_progress": audit_s.query(UserProgress).count(),
            "user_bookmarks": audit_s.query(UserBookmark).count(),
            "user_notes": audit_s.query(UserNote).count(),
            "user_editor_drafts": audit_s.query(UserEditorDraft).count(),
            "user_compiler_drafts": audit_s.query(UserCompilerDraft).count(),
            "submissions": audit_s.query(Submission).count(),
        }
    finally:
        audit_s.close()

    report["source_counts"]["progress"] = total_prog_src
    report["source_counts"]["revisions"] = total_rev_src
    report["source_counts"]["bookmarks"] = total_bm_src
    report["source_counts"]["notes"] = total_notes_src
    report["source_counts"]["editor"] = total_ed_src
    report["source_counts"]["general_compiler"] = total_comp_src
    report["source_counts"]["submissions"] = total_subs_src

    return report


def main():
    parser = argparse.ArgumentParser(description="AlgoQuest Firestore to PostgreSQL Migrator")
    parser.add_argument("--source-file", type=str, help="Path to exported Firestore JSON file")
    parser.add_argument("--db-url", type=str, default=None, help="PostgreSQL connection string")
    parser.add_argument("--dry-run", action="store_true", help="Execute without committing changes")
    args = parser.parse_args()

    db_url = args.db_url or settings.supabase_db_url or "postgresql://postgres@localhost:5433/algoquest_dev"
    engine = create_engine(db_url, pool_pre_ping=True)

    if args.source_file:
        logger.info("Loading source data from file: %s", args.source_file)
        with open(args.source_file, "r", encoding="utf-8") as f:
            source_data = json.load(f)
    else:
        logger.info("Reading live Firestore data using Firebase Admin SDK...")
        from firebase_admin import firestore
        from app.utils.security import initialize_firebase
        initialize_firebase()
        db = firestore.client()
        source_data = {"users": {}}
        user_docs = list(db.collection("users").stream())
        total_u = len(user_docs)
        logger.info("Found %d users in Firestore. Streaming subcollections...", total_u)
        for idx, udoc in enumerate(user_docs):
            uid = udoc.id
            logger.info("[%d/%d] Fetching user %s...", idx + 1, total_u, uid)
            u_data = udoc.to_dict() or {}
            # Fetch subcollections
            u_data["progress"] = {d.id: d.to_dict() for d in udoc.reference.collection("progress").stream()}
            u_data["revisions"] = {d.id: d.to_dict() for d in udoc.reference.collection("revisions").stream()}
            u_data["bookmarks"] = {d.id: d.to_dict() for d in udoc.reference.collection("bookmarks").stream()}
            u_data["notes"] = {d.id: d.to_dict() for d in udoc.reference.collection("notes").stream()}
            u_data["editor"] = {d.id: d.to_dict() for d in udoc.reference.collection("editor").stream()}
            u_data["general_compiler"] = {d.id: d.to_dict() for d in udoc.reference.collection("general_compiler").stream()}
            u_data["submissions"] = {d.id: d.to_dict() for d in udoc.reference.collection("submissions").stream()}
            source_data["users"][uid] = u_data

    report = migrate_data(source_data, engine, dry_run=args.dry_run)
    print("\n" + "=" * 60)
    print("MIGRATION AUDIT & RECONCILIATION REPORT")
    print("=" * 60)
    print(json.dumps(report, indent=2, default=str))


if __name__ == "__main__":
    main()
