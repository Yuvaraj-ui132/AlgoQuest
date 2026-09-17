"""
Submission route — POST /api/submissions, GET /api/submissions/{job_id},
GET /api/submissions/history, GET /api/user/all.

POST /api/submissions:
  execution_type='run' or 'general':
    → Synchronous: execute Judge0, return result immediately.
  execution_type='submit':
    → Async: validate + rate-limit + create job + return HTTP 202 {job_id}.
    → Background worker executes Judge0, writes Firestore, marks COMPLETED.

GET /api/submissions/history:
  → Paginated permanent submission history from Firestore.
  → IMPORTANT: registered BEFORE GET /api/submissions/{job_id} in router order
    to prevent FastAPI from treating 'history' as a job_id path parameter.

GET /api/submissions/{job_id}:
  → Poll job status: queued | running | completed | failed.
  → Auth required. User can only poll their own jobs.
  → Registered AFTER /api/submissions/history (see route order below).

GET /api/submissions/history:
  → Paginated permanent submission history from Firestore.

GET /api/user/all:
  → Returns all user data in one request (replaces 6 Firestore .get() calls).

Security:
  - UID always derived from verified Firebase ID token — never from request body.
  - Hidden test inputs and expected outputs never returned to frontend.
  - Rate limit (10 req / 60 s) applied BEFORE queue insertion.
"""

import re
import json
import os
import time
import threading
import logging
from collections import defaultdict
from typing import List, Optional, Dict, Any, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query, status

from fastapi.responses import JSONResponse

from app.dependencies import get_current_user
from app.models.requests import SubmissionRequest
from app.models.responses import (
    SubmissionResponse,
    SubmissionHistoryItem,
    SubmissionHistoryResponse,
    JobAcceptedResponse,
    JobStatusResponse,
    TestCaseResult,
    UserAllDataResponse,
)
from app.services import judge0_service, firestore_service
from app.services.submission_queue import submission_queue

logger = logging.getLogger(__name__)

router = APIRouter()

# ── In-memory rate limiter ────────────────────────────────────────────────────
# Stores { uid: [epoch_float, ...] } — only the last RATE_WINDOW_SECONDS worth
# of timestamps are kept.  Thread-safe via a single lock (all requests share
# the same process in uvicorn's default single-worker mode).

RATE_LIMIT_MAX = 10          # max submissions per window
RATE_WINDOW_SECONDS = 60     # rolling window in seconds

_rate_lock = threading.Lock()
_rate_store: Dict[str, List[float]] = defaultdict(list)


def _check_rate_limit(uid: str) -> None:
    """
    Raise HTTP 429 if the authenticated user has exceeded RATE_LIMIT_MAX
    submissions within the last RATE_WINDOW_SECONDS seconds.
    Updates the timestamp list in-place on every call.
    """
    now = time.monotonic()
    cutoff = now - RATE_WINDOW_SECONDS

    with _rate_lock:
        timestamps = _rate_store[uid]
        # Evict stale timestamps outside the rolling window
        _rate_store[uid] = [t for t in timestamps if t > cutoff]

        if len(_rate_store[uid]) >= RATE_LIMIT_MAX:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    f"Rate limit exceeded: max {RATE_LIMIT_MAX} submissions "
                    f"per {RATE_WINDOW_SECONDS} seconds. Please wait before submitting again."
                ),
                headers={"Retry-After": str(RATE_WINDOW_SECONDS)},
            )

        # Record this submission
        _rate_store[uid].append(now)


# ── Load test case data (server-side only) ────────────────────────────────────

_TEST_DATA_PATH = os.path.join(
    os.path.dirname(__file__),   # routes/
    "..",                        # app/
    "..",                        # backend/
    "data",
    "test_cases.json",
)

_test_data_cache: Optional[Dict[str, Any]] = None


def _load_test_data() -> Dict[str, Any]:
    global _test_data_cache
    if _test_data_cache is None:
        path = os.path.abspath(_TEST_DATA_PATH)
        if not os.path.isfile(path):
            raise RuntimeError(
                f"test_cases.json not found at {path}. "
                "Run: node backend/scripts/extract_test_data.js"
            )
        with open(path, "r", encoding="utf-8") as f:
            _test_data_cache = json.load(f)
    return _test_data_cache


def _get_question_test_data(question_id: int) -> Optional[Dict]:
    data = _load_test_data()
    return data.get(str(question_id))


# ── Output comparison (mirrors compiler.js normalizeAndCompare) ───────────────

def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def _compare(actual: str, expected_raw: str, compare_mode: str) -> bool:
    if actual is None or expected_raw is None:
        return False

    norm_actual = _normalize(actual)
    norm_expected = _normalize(expected_raw)

    if compare_mode == "unordered":
        a_ints = sorted(int(x) for x in re.findall(r"-?\d+", norm_actual))
        e_ints = sorted(int(x) for x in re.findall(r"-?\d+", norm_expected))
        return a_ints == e_ints

    elif compare_mode == "any_of":
        valid = [s.strip() for s in norm_expected.split("|")]
        return norm_actual in valid

    elif compare_mode == "float":
        try:
            return abs(float(norm_actual) - float(norm_expected)) < 1e-4
        except ValueError:
            return False

    else:  # "ordered" (default)
        return norm_actual == norm_expected


# ── Combined stdin construction ───────────────────────────────────────────────

def _build_stdin(test_cases: List[Dict]) -> str:
    """
    Build the combined stdin string sent to Judge0.
    Format matches the driver code's expected input:
      T
      <tc1_stdin>
      <tc2_stdin>
      ...
    """
    T = len(test_cases)
    parts = [str(T)]
    for tc in test_cases:
        tc_stdin = tc.get("stdin", "")
        if not tc_stdin.endswith("\n"):
            tc_stdin += "\n"
        parts.append(tc_stdin)
    return "\n".join(parts)


# ── Runtime / memory formatting ───────────────────────────────────────────────

def _fmt_time(t) -> str:
    if t is None:
        return "--"
    try:
        return f"{float(t):.3f}s"
    except (TypeError, ValueError):
        return str(t)


def _fmt_memory(m) -> str:
    if m is None:
        return "--"
    try:
        kb = float(m)
        return f"{kb / 1024:.1f} MB"
    except (TypeError, ValueError):
        return str(m)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post(
    "/submissions",
    summary="Submit or run code",
    description=(
        "**execution_type='run' or 'general'** → synchronous: returns result immediately.\n\n"
        "**execution_type='submit'** → async: returns HTTP 202 `{job_id, status:'queued'}`. "
        "Poll `GET /api/submissions/{job_id}` to retrieve the result.\n\n"
        "**Execution types:**\n"
        "- `run` — sample test cases only (DSA mode) — synchronous\n"
        "- `submit` — sample + hidden tests (DSA mode) — async, HTTP 202\n"
        "- `general` — no question context; stdin provided directly — synchronous\n\n"
        "**Hidden test case protection:** the backend holds test case data in "
        "`backend/data/test_cases.json`. Hidden test `stdin` and `expectedRaw` "
        "are NEVER included in any response."
    ),
)
async def create_submission(
    body: SubmissionRequest,
    uid: str = Depends(get_current_user),
):
    """
    Execution workflow:

    For execution_type='run' or 'general' (SYNCHRONOUS):
      1. Authenticate via Firebase ID token.
      2. Enforce per-user rate limit.
      3. Execute Judge0 synchronously.
      4. Return result immediately.

    For execution_type='submit' (ASYNCHRONOUS):
      1. Authenticate via Firebase ID token.
      2. Enforce per-user rate limit — HTTP 429 BEFORE queue insertion.
      3. Create async job in submission_queue.
      4. Return HTTP 202 {job_id, status:'queued'} IMMEDIATELY.
      → The worker (started in lifespan) picks up the job from the queue,
        runs Judge0, writes Firestore history, updates progress, and marks COMPLETED.
      → Frontend polls GET /api/submissions/{job_id} to retrieve the result.
    """
    # ── Rate limiting ──────────────────────────────────────────────────────────
    # Must happen BEFORE queue insertion. A 429 must NOT create a job.
    _check_rate_limit(uid)   # raises HTTP 429 if limit exceeded

    compiler_options = body.compiler_options or ""

    # ── ASYNC SUBMIT — HTTP 202 early return ──────────────────────────────────
    # IMPORTANT: execution_type='submit' in DSA mode returns BEFORE Judge0.
    # The worker picks up the job asynchronously and writes Firestore when done.
    # This is NOT fake async — the HTTP response is sent BEFORE Judge0 runs.
    if body.execution_type == "submit" and body.question_id is not None:
        job = submission_queue.create_job(
            uid=uid,
            question_id=body.question_id,
            language_id=body.language_id,
            source_code=body.source_code,
            compiler_options=compiler_options,
        )
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={"job_id": job.job_id, "status": "queued"},
        )

    # ── General mode (no question context) ────────────────────────────────────
    if body.execution_type == "general" or body.question_id is None:
        # Decode the base64 stdin provided by the frontend
        import base64
        raw_stdin = ""
        if body.stdin:
            try:
                raw_stdin = base64.b64decode(body.stdin).decode("utf-8", errors="replace")
            except Exception:
                raw_stdin = body.stdin  # treat as plain text if decode fails

        result = await judge0_service.execute(
            source_code=body.source_code,
            language_id=body.language_id,
            stdin=raw_stdin,
            compiler_options=compiler_options,
        )
        return SubmissionResponse(
            verdict=result["verdict"],
            status_id=result["status_id"],
            runtime=_fmt_time(result["time"]),
            memory=_fmt_memory(result["memory"]),
            stdout=result["stdout"] or None,
            compile_output=result["compile_output"] or None,
            stderr=result["stderr"] or None,
        )

    # ── DSA mode (run / submit) ───────────────────────────────────────────────
    q_data = _get_question_test_data(body.question_id)
    if q_data is None:
        # Fall back to general mode if question not in registry
        result = await judge0_service.execute(
            source_code=body.source_code,
            language_id=body.language_id,
            stdin="",
            compiler_options=compiler_options,
        )
        return SubmissionResponse(
            verdict=result["verdict"],
            status_id=result["status_id"],
            runtime=_fmt_time(result["time"]),
            memory=_fmt_memory(result["memory"]),
            stdout=result["stdout"] or None,
            compile_output=result["compile_output"] or None,
            stderr=result["stderr"] or None,
        )

    sample_tests: List[Dict] = q_data.get("sampleTests", [])
    hidden_tests: List[Dict] = q_data.get("hiddenTests", [])
    compare_mode: str = q_data.get("compareMode", "ordered")

    # RUN = all visible sample test cases
    # SUBMIT = full test suite (sample + hidden)
    if body.execution_type == "run":
        active_tests = sample_tests
        n_sample = len(sample_tests)
    else:  # submit
        active_tests = sample_tests + hidden_tests
        n_sample = len(sample_tests)

    # Build combined stdin
    combined_stdin = _build_stdin(active_tests)

    # Execute on Judge0
    result = await judge0_service.execute(
        source_code=body.source_code,
        language_id=body.language_id,
        stdin=combined_stdin,
        compiler_options=compiler_options,
    )

    status_id: int = result["status_id"]
    stdout: str = result["stdout"] or ""

    # ── Parse per-test-case outputs ───────────────────────────────────────────
    output_lines: List[str] = []
    if stdout:
        parts = stdout.split("---END_TC---")
        output_lines = [p.strip() for p in parts if p.strip()]

    passed_count = 0
    tc_results: List[TestCaseResult] = []

    for i, tc in enumerate(active_tests):
        actual_raw = output_lines[i] if i < len(output_lines) else ""
        is_hidden = i >= n_sample

        # Compare only when Judge0 itself succeeded
        passed = (
            status_id == 3
            and _compare(actual_raw, tc.get("expectedRaw", ""), compare_mode)
        )
        if passed:
            passed_count += 1

        item = TestCaseResult(
            index=i + 1,
            passed=passed,
            actual=actual_raw,
            is_hidden=is_hidden,
        )

        if not is_hidden:
            # Sample tests: include human-readable display fields
            item.input = tc.get("input", "")
            item.expected = tc.get("expected", "")
        # Hidden tests: input and expected remain None — never sent to browser

        tc_results.append(item)

    # ── Determine final verdict ───────────────────────────────────────────────
    all_passed = passed_count == len(active_tests) and status_id == 3

    if all_passed:
        final_verdict = "Accepted"
    elif status_id == 3:
        final_verdict = "Wrong Answer"
    else:
        final_verdict = result["verdict"]

    # ── For 'run': return result directly (RUN is always synchronous) ─────────
    # No Firestore history write, no progress update, no queue.
    return SubmissionResponse(
        verdict=final_verdict,
        status_id=status_id,
        runtime=_fmt_time(result["time"]),
        memory=_fmt_memory(result["memory"]),
        passed_count=passed_count,
        total_count=len(active_tests),
        compile_output=result["compile_output"] or None,
        stderr=result["stderr"] or None,
        test_cases=tc_results,
    )




@router.get(
    "/user/all",
    response_model=UserAllDataResponse,
    summary="Bulk load all user data",
    description=(
        "Returns all user data in a single request. "
        "Called once after login to populate the frontend cache, "
        "replacing 6 separate Firestore reads from the old architecture."
    ),
)
async def get_all_user_data(
    uid: str = Depends(get_current_user),
) -> UserAllDataResponse:
    """Load progress, bookmarks, notes, editor code, and general compiler code."""
    data = await firestore_service.get_all_user_data(uid)
    return UserAllDataResponse(
        progress=data["progress"],
        bookmarks={"bookmarks": data["bookmarks"]},
        notes=data["notes"],
        editor=data["editor"],
        general_compiler=data["general_compiler"],
    )


@router.get(
    "/questions/{question_id}/sample-tests",
    summary="Get sample test cases for a question",
    description="Returns public sample test cases for a question from backend/data/test_cases.json. Hidden tests are never exposed."
)
async def get_question_sample_tests(question_id: int):
    q_data = _get_question_test_data(question_id)
    if not q_data:
        raise HTTPException(status_code=404, detail=f"Question {question_id} not found")
    sample_tests = q_data.get("sampleTests", [])
    return {
        "question_id": question_id,
        "sample_tests": [
            {
                "index": i + 1,
                "input": tc.get("input", ""),
                "expected": tc.get("expected", ""),
            }
            for i, tc in enumerate(sample_tests)
        ]
    }


@router.get(
    "/submissions/history",
    response_model=SubmissionHistoryResponse,
    summary="Get submission history",
    description=(
        "Returns the authenticated user's Submit history, paginated newest-first.\n\n"
        "**Pagination:** pass `after=<nextCursor>` from a previous response to get the next page.\n\n"
        "**Limits:** default=20, maximum=50. Run executions are never stored here."
    ),
)
async def get_submission_history(
    uid: str = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=50, description="Number of records to return (1-50)."),
    after: Optional[str] = Query(None, description="Cursor: document ID of the last item on the previous page."),
) -> SubmissionHistoryResponse:
    """
    Return paginated submission history for the verified user.

    UID is always derived from the verified Firebase token —
    the caller cannot request another user's history.
    """
    result = await firestore_service.get_submission_history(
        uid=uid,
        limit=limit,
        after_doc_id=after,
    )
    return SubmissionHistoryResponse(
        items=[SubmissionHistoryItem(**item) for item in result["items"]],
        hasMore=result["hasMore"],
        nextCursor=result["nextCursor"],
    )


# ── Async job status endpoint ─────────────────────────────────────────────────────────
# ROUTE ORDER: This MUST be registered AFTER /submissions/history.
# FastAPI matches routes in registration order. If this were registered first,
# a request to /api/submissions/history would match {job_id}='history' instead.
# By registering AFTER history, the literal path /submissions/history is matched
# first, and only truly UUID-shaped paths fall through to this route.

@router.get(
    "/submissions/{job_id}",
    response_model=JobStatusResponse,
    summary="Poll async submission job status",
    description=(
        "Returns the current status of an async submission job.\n\n"
        "**Authentication required.** Users can only poll their own jobs.\n\n"
        "**Status values:**\n"
        "- `queued` — job is waiting in the queue\n"
        "- `running` — worker is executing Judge0\n"
        "- `completed` — execution finished; `result` field contains the verdict\n"
        "- `failed` — execution failed; `error` field contains the reason\n\n"
        "**Security:** UID is derived from the verified Firebase ID token. "
        "A user cannot poll another user's job — 403 is returned."
    ),
)
async def get_job_status(
    job_id: str,
    uid: str = Depends(get_current_user),
) -> JobStatusResponse:
    """
    Retrieve current status of an async submission job.

    Security checks:
      1. Verify Firebase ID token (via get_current_user dependency).
      2. Resolve UID from token — never from request body or query params.
      3. Verify job.uid == authenticated UID (PermissionError → 403).

    Hidden test inputs and expected outputs are NEVER returned — only
    'passed', 'actual', and 'is_hidden' fields are included for hidden tests.
    """
    try:
        job = submission_queue.get_job(job_id, uid)
    except PermissionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this job.",
        )

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job {job_id!r} not found. It may have expired or never existed.",
        )

    # Build response
    if job.status.value == "completed" and job.result:
        # Convert the raw result dict to SubmissionResponse (validates safely)
        result_model = SubmissionResponse(
            verdict=job.result.get("verdict", "Unknown"),
            status_id=job.result.get("status_id", 0),
            runtime=job.result.get("runtime", "--"),
            memory=job.result.get("memory", "--"),
            passed_count=job.result.get("passed_count"),
            total_count=job.result.get("total_count"),
            compile_output=job.result.get("compile_output"),
            stderr=job.result.get("stderr"),
            test_cases=[
                TestCaseResult(
                    index=tc["index"],
                    passed=tc["passed"],
                    actual=tc.get("actual", ""),
                    is_hidden=tc["is_hidden"],
                    input=tc.get("input"),       # None for hidden tests
                    expected=tc.get("expected"), # None for hidden tests
                )
                for tc in (job.result.get("test_cases") or [])
            ] or None,
        )
        return JobStatusResponse(
            job_id=job.job_id,
            status=job.status.value,
            result=result_model,
        )

    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status.value,
        error=job.error,
    )
