"""
Sync routes — POST /api/sync/batch for atomic, resilient synchronization of
progress, bookmarks, and notes.
"""

from fastapi import APIRouter, Depends, status, HTTPException
from app.dependencies import get_current_user
from app.models.requests import BatchSyncRequest
from app.models.responses import UserAllDataResponse, BookmarksResponse
from app.services import db_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/sync/batch",
    response_model=UserAllDataResponse,
    status_code=status.HTTP_200_OK,
    summary="Batch synchronize client progress, bookmarks, and notes",
    description=(
        "Atomic reconciliation endpoint for reliable offline and bulk state sync. "
        "Applies any provided progress updates, bookmark toggles, and note revisions, "
        "then returns the full reconciled user dataset in a single response."
    ),
)
async def batch_sync(
    body: BatchSyncRequest,
    uid: str = Depends(get_current_user),
) -> UserAllDataResponse:
    try:
        progress_items = [p.model_dump() for p in body.progress] if body.progress else None
        bookmark_items = [b.model_dump() for b in body.bookmarks] if body.bookmarks else None
        note_items = [n.model_dump() for n in body.notes] if body.notes else None

        data = await db_service.batch_sync(
            uid=uid,
            progress_items=progress_items,
            bookmark_items=bookmark_items,
            note_items=note_items,
        )

        return UserAllDataResponse(
            progress=data["progress"],
            bookmarks=BookmarksResponse(bookmarks=data["bookmarks"]),
            notes=data["notes"],
            editor=data["editor"],
            general_compiler=data["general_compiler"],
        )
    except Exception as exc:
        logger.error("[batch_sync] FAILED for uid=%s: %s", uid, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to synchronize user state.",
        )
