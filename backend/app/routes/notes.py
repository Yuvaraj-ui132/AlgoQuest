"""
Notes routes.

GET /api/notes/{question_id}  → get note content
PUT /api/notes/{question_id}  → save note content
"""

from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.requests import NoteUpdateRequest
from app.models.responses import NoteResponse, SuccessResponse
from app.services import firestore_service

router = APIRouter()


@router.get(
    "/notes/{question_id}",
    response_model=NoteResponse,
    summary="Get note for a question",
    description="Returns the saved note for this question. Returns empty string if no note exists.",
)
async def get_note(
    question_id: int,
    uid: str = Depends(get_current_user),
) -> NoteResponse:
    content = await firestore_service.get_note(uid, question_id)
    return NoteResponse(question_id=question_id, content=content)


@router.put(
    "/notes/{question_id}",
    response_model=SuccessResponse,
    summary="Save note for a question",
    description="Creates or overwrites the note for this question.",
)
async def save_note(
    question_id: int,
    body: NoteUpdateRequest,
    uid: str = Depends(get_current_user),
) -> SuccessResponse:
    await firestore_service.save_note(uid, question_id, body.content)
    return SuccessResponse(message=f"Note saved for question {question_id}.")
