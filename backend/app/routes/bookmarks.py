"""
Bookmark routes.

GET    /api/bookmarks           → list of bookmarked question IDs
PUT    /api/bookmarks/{qid}     → add bookmark
DELETE /api/bookmarks/{qid}     → remove bookmark
"""

from fastapi import APIRouter, Depends, status
from app.dependencies import get_current_user
from app.models.responses import BookmarksResponse, SuccessResponse
from app.services import firestore_service

router = APIRouter()


@router.get(
    "/bookmarks",
    response_model=BookmarksResponse,
    summary="Get all bookmarks for the authenticated user",
)
async def get_bookmarks(uid: str = Depends(get_current_user)) -> BookmarksResponse:
    ids = await firestore_service.get_all_bookmarks(uid)
    return BookmarksResponse(bookmarks=ids)


@router.put(
    "/bookmarks/{question_id}",
    response_model=SuccessResponse,
    summary="Bookmark a question",
)
async def add_bookmark(
    question_id: int,
    uid: str = Depends(get_current_user),
) -> SuccessResponse:
    await firestore_service.set_bookmark(uid, question_id, bookmarked=True)
    return SuccessResponse(message=f"Question {question_id} bookmarked.")


@router.delete(
    "/bookmarks/{question_id}",
    response_model=SuccessResponse,
    summary="Remove a bookmark",
)
async def remove_bookmark(
    question_id: int,
    uid: str = Depends(get_current_user),
) -> SuccessResponse:
    await firestore_service.set_bookmark(uid, question_id, bookmarked=False)
    return SuccessResponse(message=f"Bookmark removed for question {question_id}.")
