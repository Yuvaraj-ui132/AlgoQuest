"""
Editor code routes — DSA workspace and general compiler persistence.

DSA editor (per question):
  GET /api/editor/{question_id}   → load saved code
  PUT /api/editor/{question_id}   → save code

General compiler (per language):
  GET /api/general-compiler/{language}  → load saved code
  PUT /api/general-compiler/{language}  → save code
"""

from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.models.requests import EditorCodeUpdateRequest, GeneralCompilerUpdateRequest
from app.models.responses import EditorCodeResponse, GeneralCompilerResponse, SuccessResponse
from app.services import firestore_service

router = APIRouter()

_VALID_LANGUAGES = {"cpp", "c", "java", "python", "js"}


# ── DSA editor ────────────────────────────────────────────────────────────────

@router.get(
    "/editor/{question_id}",
    response_model=EditorCodeResponse,
    summary="Load saved DSA editor code for a question",
)
async def get_editor_code(
    question_id: int,
    uid: str = Depends(get_current_user),
) -> EditorCodeResponse:
    data = await firestore_service.get_editor_code(uid, question_id)
    return EditorCodeResponse(
        question_id=question_id,
        language=data.get("language"),
        code=data.get("code"),
    )


@router.put(
    "/editor/{question_id}",
    response_model=SuccessResponse,
    summary="Save DSA editor code for a question",
)
async def save_editor_code(
    question_id: int,
    body: EditorCodeUpdateRequest,
    uid: str = Depends(get_current_user),
) -> SuccessResponse:
    await firestore_service.save_editor_code(uid, question_id, body.language, body.code)
    return SuccessResponse(message=f"Editor code saved for question {question_id}.")


# ── General compiler ──────────────────────────────────────────────────────────

@router.get(
    "/general-compiler/{language}",
    response_model=GeneralCompilerResponse,
    summary="Load general compiler code for a language",
    description="Returns saved code for the general code editor (not question-specific).",
)
async def get_general_compiler_code(
    language: str,
    uid: str = Depends(get_current_user),
) -> GeneralCompilerResponse:
    if language not in _VALID_LANGUAGES:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid language '{language}'. Must be one of: {sorted(_VALID_LANGUAGES)}",
        )
    code = await firestore_service.get_general_compiler_code(uid, language)
    return GeneralCompilerResponse(language=language, code=code)


@router.put(
    "/general-compiler/{language}",
    response_model=SuccessResponse,
    summary="Save general compiler code for a language",
)
async def save_general_compiler_code(
    language: str,
    body: GeneralCompilerUpdateRequest,
    uid: str = Depends(get_current_user),
) -> SuccessResponse:
    if language not in _VALID_LANGUAGES:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid language '{language}'. Must be one of: {sorted(_VALID_LANGUAGES)}",
        )
    await firestore_service.save_general_compiler_code(uid, language, body.code)
    return SuccessResponse(message=f"General compiler code saved for '{language}'.")
