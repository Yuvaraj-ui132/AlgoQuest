"""
Pydantic response models — defines the exact shape returned to the frontend.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict


# ── Submissions ───────────────────────────────────────────────────────────────

class TestCaseResult(BaseModel):
    """Per-test-case result included in SubmissionResponse."""

    index: int = Field(..., description="1-indexed test case number.")
    passed: bool = Field(..., description="True if actual output matches expected.")
    actual: str = Field("", description="Raw actual output from the program.")
    is_hidden: bool = Field(..., description="True for hidden test cases.")

    # Only present when is_hidden=False (sample tests)
    input: Optional[str] = Field(None, description="Human-readable input description.")
    expected: Optional[str] = Field(
        None,
        description=(
            "Expected output (human-readable). "
            "Null for hidden tests — the expected answer is never revealed."
        ),
    )


class SubmissionResponse(BaseModel):
    """
    Response from POST /api/submissions.

    For DSA mode (run/submit): includes per-test-case breakdown.
    For general mode: includes raw stdout only.
    """

    verdict: str = Field(..., description="Verdict: Accepted, Wrong Answer, Compilation Error, etc.")
    status_id: int = Field(..., description="Judge0 status ID (3=Accepted, 5=TLE, 6=CE, ...).")
    runtime: str = Field("--", description="Execution time returned by Judge0.")
    memory: str = Field("--", description="Peak memory usage returned by Judge0.")

    # DSA mode fields
    passed_count: Optional[int] = Field(None, description="Number of test cases passed.")
    total_count: Optional[int] = Field(None, description="Total test cases run.")
    test_cases: Optional[List[TestCaseResult]] = Field(
        None,
        description=(
            "Per-test-case results. "
            "Hidden test cases omit 'input' and 'expected' — only 'passed' and 'actual' are returned."
        ),
    )

    # General / error fields
    stdout: Optional[str] = Field(None, description="Raw stdout (general mode only).")
    compile_output: Optional[str] = Field(None, description="Compiler error output (if any).")
    stderr: Optional[str] = Field(None, description="Runtime error output (if any).")


# ── Async Submit — Job responses ──────────────────────────────────────────────

class JobAcceptedResponse(BaseModel):
    """
    HTTP 202 response returned immediately when execution_type='submit'.

    The HTTP request returns BEFORE Judge0 execution finishes.
    The client should poll GET /api/submissions/{job_id} to retrieve the result.
    """
    job_id: str = Field(..., description="Unique job ID. Use to poll GET /api/submissions/{job_id}.")
    status: str = Field("queued", description="Initial job status: always 'queued'.")


class JobStatusResponse(BaseModel):
    """
    Response from GET /api/submissions/{job_id}.

    Status progression:
      queued -> running -> completed | failed
    """
    job_id: str  = Field(..., description="Unique job ID.")
    status: str  = Field(..., description="Current job status: queued | running | completed | failed.")

    # Present only when status == "completed"
    result: Optional[SubmissionResponse] = Field(
        None,
        description=(
            "Execution result. Present only when status='completed'. "
            "Hidden test inputs and expected outputs are NEVER included."
        ),
    )

    # Present only when status == "failed"
    error: Optional[str] = Field(
        None,
        description="Error message. Present only when status='failed'.",
    )


# ── Progress ──────────────────────────────────────────────────────────────────

class QuestionProgressItem(BaseModel):
    question_id: int
    solved: bool = False
    rev1: bool = False
    rev2: bool = False


class ProgressResponse(BaseModel):
    """GET /api/progress — all progress data for the authenticated user."""

    solved: List[int] = Field([], description="List of question IDs marked solved.")
    rev1: List[int] = Field([], description="List of question IDs in Revision 1.")
    rev2: List[int] = Field([], description="List of question IDs in Revision 2.")


# ── Bookmarks ─────────────────────────────────────────────────────────────────

class BookmarksResponse(BaseModel):
    """GET /api/bookmarks — list of bookmarked question IDs."""

    bookmarks: List[int] = Field([], description="Question IDs that are bookmarked.")


# ── Notes ─────────────────────────────────────────────────────────────────────

class NoteResponse(BaseModel):
    """GET /api/notes/{question_id}."""

    question_id: int
    content: str = Field("", description="Note content. Empty string if no note saved.")


# ── Editor ────────────────────────────────────────────────────────────────────

class EditorCodeResponse(BaseModel):
    """GET /api/editor/{question_id}."""

    question_id: int
    language: Optional[str] = None
    code: Optional[str] = None


class GeneralCompilerResponse(BaseModel):
    """GET /api/general-compiler/{language}."""

    language: str
    code: Optional[str] = None


# ── Bulk load ─────────────────────────────────────────────────────────────────

class UserAllDataResponse(BaseModel):
    """
    GET /api/user/all — returns all user data in a single request.
    Used on login to replace 6 separate Firestore calls from the old architecture.
    """

    progress: ProgressResponse
    bookmarks: BookmarksResponse
    notes: Dict[str, str] = Field({}, description="Map of question_id (str) → note content.")
    editor: Dict[str, Dict[str, str]] = Field(
        {},
        description="Map of question_id (str) → {language, code}.",
    )
    general_compiler: Dict[str, str] = Field(
        {},
        description="Map of language → general editor code.",
    )


# ── Generic ───────────────────────────────────────────────────────────────────

class SuccessResponse(BaseModel):
    ok: bool = True
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    detail: str


# ── Submission history ────────────────────────────────────────────────────────

class SubmissionHistoryItem(BaseModel):
    """
    One entry in a user's submission history.
    Returned by GET /api/submissions/history.
    Source code is never stored or returned.
    """

    id: str = Field(..., description="Auto-generated Firestore document ID.")
    questionId: Optional[int] = Field(None, description="AlgoQuest question ID.")
    executionType: str = Field("submit", description="Always 'submit' for history records.")
    verdict: Optional[str] = Field(None, description="Verdict string (Accepted, Wrong Answer, etc.).")
    statusId: Optional[int] = Field(None, description="Judge0 status ID.")
    language: Optional[str] = Field(None, description="Language name (cpp, python, java, …).")
    languageId: Optional[int] = Field(None, description="Judge0 language ID.")
    passedCount: Optional[int] = Field(None, description="Number of test cases passed.")
    totalCount: Optional[int] = Field(None, description="Total test cases executed.")
    runtime: Optional[str] = Field(None, description="Formatted runtime (e.g. '0.032s').")
    memory: Optional[str] = Field(None, description="Formatted memory (e.g. '5.2 MB').")
    submittedAt: Optional[str] = Field(None, description="ISO 8601 timestamp of submission.")
    compileError: Optional[str] = Field(None, description="Compiler/runtime error output, if any.")


class SubmissionHistoryResponse(BaseModel):
    """
    Paginated response for GET /api/submissions/history.
    Uses cursor-based pagination — pass nextCursor as the 'after' query param
    to retrieve the next page.
    """

    items: List[SubmissionHistoryItem] = Field([], description="Submission history records, newest first.")
    hasMore: bool = Field(False, description="True if additional pages exist.")
    nextCursor: Optional[str] = Field(
        None,
        description="Document ID to pass as 'after' for the next page. Null when no more pages.",
    )
