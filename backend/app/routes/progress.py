"""
Progress routes — GET/PUT for solved and revision tracking.

GET  /api/progress           → all solved/rev1/rev2 lists
PUT  /api/progress/{qid}     → update one question's progress flags
GET  /api/user/all is in submissions.py (bulk load on login)
"""

from fastapi import APIRouter, Depends, status
from app.dependencies import get_current_user
from app.models.requests import ProgressUpdateRequest
from app.models.responses import ProgressResponse, SuccessResponse
from app.services import firestore_service

router = APIRouter()


@router.get(
    "/progress",
    response_model=ProgressResponse,
    summary="Get all progress for the authenticated user",
    description=(
        "Returns all question IDs the user has marked as solved, in revision 1, "
        "or in revision 2. The UID is derived from the Firebase ID token — "
        "users can only read their own progress."
    ),
)
async def get_progress(uid: str = Depends(get_current_user)) -> ProgressResponse:
    raw = await firestore_service.get_all_progress(uid)

    solved, rev1, rev2 = [], [], []
    for qid_str, data in raw.items():
        try:
            qid = int(qid_str)
        except ValueError:
            continue
        if data.get("solved"):  solved.append(qid)
        if data.get("rev1"):    rev1.append(qid)
        if data.get("rev2"):    rev2.append(qid)

    return ProgressResponse(solved=solved, rev1=rev1, rev2=rev2)


@router.put(
    "/progress/{question_id}",
    response_model=SuccessResponse,
    summary="Update progress flags for one question",
    description=(
        "Update solved, rev1, and/or rev2 flags for a single question. "
        "Only provided fields are written; omit a field to leave it unchanged."
    ),
)
async def update_progress(
    question_id: int,
    body: ProgressUpdateRequest,
    uid: str = Depends(get_current_user),
) -> SuccessResponse:
    await firestore_service.update_progress(
        uid=uid,
        question_id=question_id,
        solved=body.solved,
        rev1=body.rev1,
        rev2=body.rev2,
    )
    return SuccessResponse(message=f"Progress updated for question {question_id}.")
