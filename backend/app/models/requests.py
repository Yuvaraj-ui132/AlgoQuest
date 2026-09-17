"""
Pydantic request models — all inputs validated by FastAPI before reaching route handlers.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal


class SubmissionRequest(BaseModel):
    """
    Request body for POST /api/submissions.

    The frontend generates the driver-wrapped source code and sends it here.
    The backend appends test case stdin and proxies to Judge0.
    """

    source_code: str = Field(
        ...,
        description="Base64-encoded source code (driver-wrapped for DSA mode, raw for general mode).",
        max_length=300_000,
    )
    language_id: int = Field(
        ...,
        description=(
            "Judge0 language ID. "
            "Supported: 76 (C++17), 50 (C), 62 (Java), 71 (Python 3), 63 (Node.js)."
        ),
        ge=1,
    )
    execution_type: Literal["run", "submit", "general"] = Field(
        ...,
        description=(
            "'run' = sample tests only (DSA mode). "
            "'submit' = sample + hidden tests (DSA mode). "
            "'general' = no question context, stdin provided directly."
        ),
    )
    question_id: Optional[int] = Field(
        None,
        description="Question ID from questions.json. Required for 'run' and 'submit' modes.",
    )
    stdin: Optional[str] = Field(
        None,
        description="Base64-encoded custom stdin. Used only when execution_type='general'.",
        max_length=50_000,
    )
    compiler_options: Optional[str] = Field(
        None,
        description="Compiler flags (e.g. '-std=c++17' for C++). Default: None.",
        max_length=100,
    )
    test_case_index: Optional[int] = Field(
        None,
        description="1-based index of a specific sample test case to run. If None, all sample tests run.",
        ge=1,
    )

    @field_validator("question_id")
    @classmethod
    def validate_question_id(cls, v, info):
        execution_type = info.data.get("execution_type")
        if execution_type in ("run", "submit") and v is None:
            raise ValueError("question_id is required for 'run' and 'submit' execution types.")
        return v

    @field_validator("language_id")
    @classmethod
    def validate_language_id(cls, v):
        supported = {50, 62, 63, 71, 76}  # C, Java, JS, Python, C++17
        if v not in supported:
            raise ValueError(
                f"Unsupported language_id {v}. Supported: {sorted(supported)}"
            )
        return v


class ProgressUpdateRequest(BaseModel):
    """Request body for PUT /api/progress/{question_id}."""

    solved: Optional[bool] = Field(None, description="Whether the question is marked solved.")
    rev1: Optional[bool] = Field(None, description="Whether the question is in Revision 1.")
    rev2: Optional[bool] = Field(None, description="Whether the question is in Revision 2.")


class NoteUpdateRequest(BaseModel):
    """Request body for PUT /api/notes/{question_id}."""

    content: str = Field(
        ...,
        description="Note content for this question.",
        max_length=50_000,
    )


class EditorCodeUpdateRequest(BaseModel):
    """Request body for PUT /api/editor/{question_id}."""

    language: str = Field(..., description="Language key: cpp, java, python, js.")
    code: str = Field(..., description="Editor code content.", max_length=300_000)

    @field_validator("language")
    @classmethod
    def validate_language(cls, v):
        allowed = {"cpp", "c", "java", "python", "js"}
        if v not in allowed:
            raise ValueError(f"language must be one of {sorted(allowed)}")
        return v


class GeneralCompilerUpdateRequest(BaseModel):
    """Request body for PUT /api/general-compiler/{language}."""

    code: str = Field(..., description="General editor code content.", max_length=300_000)


class UserInitRequest(BaseModel):
    """
    Request body for POST /api/user/init.

    Sent by the frontend immediately after Firebase signup to bootstrap the
    Firestore user document through the authenticated backend (Admin SDK bypasses
    Firestore security rules).  All fields are optional — the backend only writes
    what it receives so partial data does not overwrite existing fields (merge=True).
    """

    name: Optional[str] = Field(
        None,
        description="Display name chosen by the user during signup.",
        max_length=120,
    )
    email: Optional[str] = Field(
        None,
        description="User's email address (for profile display).",
        max_length=254,
    )
    photo_url: Optional[str] = Field(
        None,
        description="Profile photo URL (Google Sign-In or user-supplied).",
        max_length=2048,
    )

