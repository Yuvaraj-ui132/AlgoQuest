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
import base64
import secrets
import threading
import logging
from collections import defaultdict
from typing import List, Optional, Dict, Any, Tuple

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

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
from app.services import judge0_service, db_service
from app.services.submission_queue import submission_queue
from app.config import settings

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
    Periodically purges inactive UIDs to prevent unbounded memory growth.
    """
    now = time.monotonic()
    cutoff = now - RATE_WINDOW_SECONDS

    with _rate_lock:
        # Periodic pruning when store grows beyond threshold
        if len(_rate_store) > 500:
            stale_uids = [u for u, ts in _rate_store.items() if not ts or ts[-1] <= cutoff]
            for u in stale_uids:
                del _rate_store[u]

        timestamps = _rate_store[uid]
        # Evict stale timestamps outside the rolling window
        valid_timestamps = [t for t in timestamps if t > cutoff]
        _rate_store[uid] = valid_timestamps

        if len(valid_timestamps) >= RATE_LIMIT_MAX:
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

_DATA_DIR = os.path.join(
    os.path.dirname(__file__),   # routes/
    "..",                        # app/
    "..",                        # backend/
    "data",
)
_SAMPLE_TEST_DATA_PATH = os.path.join(_DATA_DIR, "sample_test_cases.json")
_LEGACY_TEST_DATA_PATH = os.path.join(_DATA_DIR, "test_cases.json")

_sample_data_cache: Optional[Dict[str, Any]] = None
_hidden_data_cache: Optional[Dict[str, Any]] = None
_hidden_data_error: Optional[str] = None
_sample_only_active: bool = False


def reset_test_data_cache() -> None:
    """Reset cached test data for test isolation."""
    global _sample_data_cache, _hidden_data_cache, _hidden_data_error, _sample_only_active
    _sample_data_cache = None
    _hidden_data_cache = None
    _hidden_data_error = None
    _sample_only_active = False


def _locate_hidden_tests_file() -> Optional[str]:
    """
    Locates the private hidden test cases file in priority order:
      1. settings.hidden_tests_path (explicit env var HIDDEN_TESTS_PATH)
      2. /etc/secrets/hidden_test_cases.json (Render Secret File standard path)
      3. backend/data/hidden_test_cases.json (untracked local development file)
    """
    if settings.hidden_tests_path:
        return os.path.abspath(settings.hidden_tests_path)

    render_secret_path = "/etc/secrets/hidden_test_cases.json"
    if os.path.isfile(render_secret_path):
        return render_secret_path

    local_path = os.path.join(_DATA_DIR, "hidden_test_cases.json")
    if os.path.isfile(local_path):
        return os.path.abspath(local_path)

    return None


def _load_sample_data() -> Dict[str, Any]:
    global _sample_data_cache
    if _sample_data_cache is None:
        path = os.path.abspath(_SAMPLE_TEST_DATA_PATH)
        if not os.path.isfile(path):
            path = os.path.abspath(_LEGACY_TEST_DATA_PATH)
        if not os.path.isfile(path):
            raise RuntimeError(
                f"Sample test data not found at {_SAMPLE_TEST_DATA_PATH} or {_LEGACY_TEST_DATA_PATH}."
            )
        with open(path, "r", encoding="utf-8") as f:
            _sample_data_cache = json.load(f)
    return _sample_data_cache


def _load_hidden_data() -> None:
    global _hidden_data_cache, _hidden_data_error, _sample_only_active
    if _hidden_data_cache is not None or _hidden_data_error is not None or _sample_only_active:
        return

    path = _locate_hidden_tests_file()
    if path is None or not os.path.isfile(path):
        if settings.allow_sample_only_grading:
            logger.warning("[GRADING] Running in explicit local sample-only development mode.")
            _sample_only_active = True
            _hidden_data_cache = {}
        else:
            _hidden_data_error = "Private hidden test suite is not configured or missing."
            logger.error("[GRADING] Fail-closed: %s", _hidden_data_error)
        return

    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            _hidden_data_error = f"Malformed private hidden test file at {path}: expected JSON object."
            logger.error("[GRADING] Fail-closed: %s", _hidden_data_error)
            return
        _hidden_data_cache = data
    except Exception as exc:
        _hidden_data_error = f"Malformed private hidden test file at {path}: {exc}"
        logger.error("[GRADING] Fail-closed: %s", _hidden_data_error)


def _validate_hidden_dataset_structure(data: Any) -> Optional[str]:
    """
    Validates structural integrity of the private hidden test dataset.
    Returns None if valid, or a descriptive error string if invalid.
    Does NOT leak test inputs, expected outputs, or sensitive data.
    """
    if not isinstance(data, dict):
        return "Hidden test dataset must be a JSON object mapping problem IDs to test lists."

    # 1. Validate exact presence of all required problem IDs 1-174
    for qid_int in range(1, 175):
        qid_str = str(qid_int)
        if qid_str not in data:
            return f"Hidden test dataset is missing required problem ID {qid_str} (expected 1-174)."

    if len(data) != 174:
        return f"Hidden test dataset contains {len(data)} problems, expected exactly 174 (1-174)."

    # 2. Validate per-problem test counts and test case schemas
    total_tests = 0
    for qid_int in range(1, 175):
        qid_str = str(qid_int)
        tests = data[qid_str]
        if not isinstance(tests, list):
            return f"Problem {qid_str} hidden tests must be a list, got {type(tests).__name__}."

        if qid_int == 161:
            expected_count = 11
        elif qid_int == 169:
            expected_count = 7
        else:
            expected_count = 25

        if len(tests) == 0:
            return f"Problem {qid_str} has zero hidden tests."

        if len(tests) != expected_count:
            return (
                f"Problem {qid_str} has {len(tests)} hidden tests, "
                f"expected {expected_count}."
            )

        for idx, tc in enumerate(tests):
            if not isinstance(tc, dict):
                return f"Problem {qid_str} test case {idx} must be a JSON object."
            if "stdin" not in tc or not isinstance(tc["stdin"], str):
                return f"Problem {qid_str} test case {idx} is missing a string 'stdin'."
            if "expectedRaw" not in tc or not isinstance(tc["expectedRaw"], str):
                return f"Problem {qid_str} test case {idx} is missing a valid string 'expectedRaw'."

        total_tests += len(tests)

    if total_tests != 4318:
        return f"Total hidden test count is {total_tests}, expected exactly 4318."

    return None


def validate_hidden_tests_on_startup() -> Dict[str, Any]:
    """
    Validates private hidden test dataset presence and structure during startup.
    Logs clear, safe diagnostics without leaking test contents or secrets.
    Does not crash the application process, preserving health checks and fail-closed security.
    """
    global _hidden_data_error, _hidden_data_cache
    _load_hidden_data()
    if _sample_only_active:
        logger.warning(
            "[GRADING] STARTUP NOTICE: Server running with allow_sample_only_grading=True. "
            "Submissions will not produce production Accepted verdicts."
        )
        return {"status": "sample_only", "problems_loaded": 0, "total_tests": 0}

    if _hidden_data_error:
        logger.error(
            "[GRADING] STARTUP WARNING: %s (production submissions will fail closed)",
            _hidden_data_error,
        )
        return {"status": "error", "error": _hidden_data_error}

    if _hidden_data_cache is not None:
        struct_err = _validate_hidden_dataset_structure(_hidden_data_cache)
        if struct_err:
            _hidden_data_error = f"Invalid private hidden test suite structure: {struct_err}"
            _hidden_data_cache = None
            logger.error(
                "[GRADING] STARTUP WARNING: %s (production submissions will fail closed)",
                _hidden_data_error,
            )
            return {"status": "error", "error": _hidden_data_error}

        total_tests = sum(len(tests) for tests in _hidden_data_cache.values() if isinstance(tests, list))
        logger.info(
            "[GRADING] STARTUP OK: Private hidden test suite loaded (%d problems, %d hidden tests).",
            len(_hidden_data_cache),
            total_tests,
        )
        return {
            "status": "ok",
            "problems_loaded": len(_hidden_data_cache),
            "total_tests": total_tests,
            "path": _locate_hidden_tests_file(),
        }

    return {"status": "unavailable"}


def _get_question_test_data(question_id: int) -> Optional[Dict[str, Any]]:
    """
    Returns public problem metadata and sample test cases only.
    Safe for public endpoints (GET /api/questions/{id}/sample-tests) and Run executions.
    Guarantees hidden tests are never accessed or returned.
    """
    data = _load_sample_data()
    q = data.get(str(question_id))
    if q is None:
        return None
    # Ensure hiddenTests is empty on public data
    q_copy = dict(q)
    q_copy["hiddenTests"] = []
    return q_copy


def get_question_submission_data(
    question_id: int,
) -> Tuple[Optional[Dict[str, Any]], Optional[str], bool]:
    """
    Returns (q_data, error_message, is_sample_only).
    Used exclusively by submission grading.

    Enforces fail-closed semantics in production:
      - If private test suite is missing or malformed -> error_message returned.
      - If question has no hidden tests -> error_message returned.
      - If settings.allow_sample_only_grading is True -> is_sample_only=True returned,
        which forbids producing an official Accepted verdict.
    """
    base_data = _load_sample_data()
    q = base_data.get(str(question_id))
    if q is None:
        return None, f"Question {question_id} not found in catalogue", False

    _load_hidden_data()

    if _sample_only_active:
        q_copy = dict(q)
        q_copy["hiddenTests"] = []
        return q_copy, None, True

    if _hidden_data_error:
        return None, f"Grading configuration error: {_hidden_data_error}", False

    if _hidden_data_cache is None:
        return None, "Grading configuration error: private hidden test suite unavailable.", False

    q_hidden = _hidden_data_cache.get(str(question_id), [])
    if not q_hidden:
        return None, f"Grading configuration error: private hidden tests missing for question {question_id}", False

    q_copy = dict(q)
    q_copy["hiddenTests"] = q_hidden
    return q_copy, None, False


# ── Output comparison (mirrors compiler.js normalizeAndCompare) ───────────────

_CRASH_PATTERNS = [
    "traceback (most recent call last)",
    "segmentation fault",
    "core dumped",
    "fatal error:",
    "exception in thread",
    "uncaught exception",
    "sigsegv",
    "sigabrt",
    "sigfpe",
]


def _is_crash_output(text: str) -> bool:
    if not text:
        return False
    lower = text.lower()
    return any(p in lower for p in _CRASH_PATTERNS)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def _compare(actual: str, expected_raw: str, compare_mode: str) -> bool:
    if actual is None or expected_raw is None:
        return False

    if _is_crash_output(actual):
        return False

    norm_actual = _normalize(actual)
    norm_expected = _normalize(expected_raw)

    if not norm_actual and norm_expected:
        return False
    if not norm_expected and norm_actual:
        return False
    if not norm_actual and not norm_expected:
        return True

    if compare_mode == "unordered":
        a_ints = [int(x) for x in re.findall(r"-?\d+", norm_actual)]
        e_ints = [int(x) for x in re.findall(r"-?\d+", norm_expected)]
        if e_ints:
            if not a_ints:
                return False
            return sorted(a_ints) == sorted(e_ints)
        else:
            return norm_actual == norm_expected

    elif compare_mode == "any_of":
        valid = [s.strip() for s in norm_expected.split("|")]
        return norm_actual in valid

    elif compare_mode == "float":
        try:
            return abs(float(norm_actual) - float(norm_expected)) < 1e-4
        except (ValueError, TypeError):
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


from app.services.driver_generator import build_backend_driver, clean_user_code


def _decode_source(raw: str) -> str:
    try:
        return base64.b64decode(raw.encode("utf-8")).decode("utf-8")
    except Exception:
        return raw


def _lang_from_id(language_id: int) -> str:
    if language_id in (76, 50, 54):
        return "cpp"
    if language_id == 62:
        return "java"
    if language_id == 71:
        return "python"
    if language_id == 63:
        return "js"
    return "python"


def prepare_dsa_source(
    source_code: str,
    q_data: Dict[str, Any],
    language_id: int,
    nonce: str,
) -> Tuple[str, bool]:
    """
    Synthesizes the authoritative backend-controlled driver around user code
    using server-side question signature metadata and the session nonce.
    Detects if user code contains marker tampering or harness manipulation.
    """
    raw_user_code = _decode_source(source_code)
    lang = _lang_from_id(language_id)
    cleaned = clean_user_code(raw_user_code, lang)

    # Check for marker tampering or harness spoofing in user's algorithm code
    tamper_patterns = [
        "__AQ_",
        "__AQ",
        "AQ_",
        "---END_TC---",
        "_aq_runner",
    ]
    if any(pat in cleaned for pat in tamper_patterns):
        logger.warning("prepare_dsa_source: user code attempted marker or harness tampering")
        return source_code, False

    secured_code = build_backend_driver(
        user_code=cleaned,
        q_meta=q_data,
        lang=lang,
        nonce=nonce,
    )
    encoded = base64.b64encode(secured_code.encode("utf-8")).decode("utf-8")
    return encoded, True


# ── Structured execution output parsing ───────────────────────────────────────

def parse_test_outputs(
    stdout: str,
    expected_count: int,
    nonce: Optional[str] = None,
) -> List[str]:
    """
    Structured test case output parser.
    Extracts output for each test case using indexed boundary markers.
    When `nonce` is provided, enforces session-specific dynamic markers
    `__AQ_{nonce}_START_{i}__` ... `__AQ_{nonce}_END_{i}__`, preventing marker
    spoofing from user code and disallowing unauthenticated fallback delimiters.
    """
    if not stdout:
        return ["" for _ in range(expected_count)] if expected_count > 0 else []

    # Clean malformed/binary streams
    clean_stdout = stdout.replace("\r\n", "\n").replace("\r", "\n").replace("\x00", "")

    # Dynamic nonce protocol (authenticated)
    if nonce:
        start_prefix = f"__AQ_{nonce}_START_"
        end_prefix = f"__AQ_{nonce}_END_"
        completed_tag = f"__AQ_{nonce}_COMPLETED__"

        if start_prefix not in clean_stdout or end_prefix not in clean_stdout:
            logger.warning("parse_test_outputs: Session nonce markers missing from stdout.")
            return ["" for _ in range(expected_count)] if expected_count > 0 else []

        # If completed tag is present in stdout, verify it appears exactly once
        if completed_tag in clean_stdout and clean_stdout.count(completed_tag) != 1:
            logger.warning("parse_test_outputs: Completed marker anomaly (multiple injections).")
            return ["" for _ in range(expected_count)] if expected_count > 0 else []

        results: List[str] = []
        cursor = 0
        for i in range(expected_count):
            start_tag = f"{start_prefix}{i}__"
            end_tag = f"{end_prefix}{i}__"
            next_start_tag = f"{start_prefix}{i+1}__" if i + 1 < expected_count else None

            # Anomaly check: each tag should appear exactly once in authentic output
            if clean_stdout.count(start_tag) != 1 or clean_stdout.count(end_tag) != 1:
                logger.warning("parse_test_outputs: marker anomaly for test case %d (spoofing attempt)", i)
                results.append("")
                continue

            s_idx = clean_stdout.find(start_tag, cursor)
            if s_idx == -1:
                results.append("")
                continue

            content_start = s_idx + len(start_tag)
            upper_bound = len(clean_stdout)
            if next_start_tag:
                next_s_idx = clean_stdout.find(next_start_tag, content_start)
                if next_s_idx != -1:
                    upper_bound = next_s_idx

            e_idx = clean_stdout.find(end_tag, content_start)
            if e_idx == -1 or e_idx > upper_bound:
                logger.warning("parse_test_outputs: end marker missing or out of bounds for test case %d", i)
                results.append("")
                cursor = content_start
                continue

            raw_content = clean_stdout[content_start:e_idx]
            # Anti-spoofing: test case content must never contain internal marker fragments
            if "__AQ_" in raw_content:
                logger.warning("parse_test_outputs: internal marker fragment detected inside test case %d", i)
                results.append("")
            else:
                cleaned = re.sub(r"\n?---END_TC---\s*$", "", raw_content)
                results.append(cleaned.strip())
            cursor = e_idx + len(end_tag)

        while len(results) < expected_count:
            results.append("")
        return results[:expected_count]

    # Legacy protocol fallback (only when nonce is not provided)
    if "__AQ_TC_START_" in clean_stdout and "__AQ_TC_END_" in clean_stdout:
        results = []
        cursor = 0
        for i in range(expected_count):
            start_tag = f"__AQ_TC_START_{i}__"
            end_tag = f"__AQ_TC_END_{i}__"
            next_start_tag = f"__AQ_TC_START_{i+1}__" if i + 1 < expected_count else None

            s_idx = clean_stdout.find(start_tag, cursor)
            if s_idx == -1:
                results.append("")
                continue

            content_start = s_idx + len(start_tag)
            upper_bound = len(clean_stdout)
            if next_start_tag:
                next_s_idx = clean_stdout.find(next_start_tag, content_start)
                if next_s_idx != -1:
                    upper_bound = next_s_idx

            e_idx = clean_stdout.find(end_tag, content_start)
            if e_idx == -1 or e_idx > upper_bound:
                results.append("")
                cursor = content_start
                continue

            raw_content = clean_stdout[content_start:e_idx]
            cleaned = re.sub(r"\n?---END_TC---\s*$", "", raw_content)
            results.append(cleaned.strip())
            cursor = e_idx + len(end_tag)

        while len(results) < expected_count:
            results.append("")
        return results[:expected_count]

    # Legacy delimiter transition fallback (deprecated, strictly unauthenticated)
    logger.warning("parse_test_outputs: Stream missing structured markers; using legacy delimiter fallback.")
    parts = clean_stdout.split("---END_TC---")
    if parts and not parts[-1].strip():
        parts = parts[:-1]
    cleaned_parts = [p.strip() for p in parts]
    while len(cleaned_parts) < expected_count:
        cleaned_parts.append("")
    return cleaned_parts[:expected_count]


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
    is_sample_only = False
    if body.execution_type == "run":
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
        active_tests = sample_tests
        n_sample = len(sample_tests)
        compare_mode: str = q_data.get("compareMode", "ordered")
    else:  # submit
        q_data, load_err, is_sample_only = get_question_submission_data(body.question_id)
        if load_err or q_data is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=load_err or f"Question {body.question_id} not found in catalogue",
            )
        sample_tests = q_data.get("sampleTests", [])
        hidden_tests: List[Dict] = q_data.get("hiddenTests", [])
        active_tests = sample_tests + hidden_tests
        n_sample = len(sample_tests)
        compare_mode = q_data.get("compareMode", "ordered")

    # Build combined stdin
    combined_stdin = _build_stdin(active_tests)

    # Dynamic backend nonce injection & marker anti-spoofing
    nonce = secrets.token_hex(16)
    secured_code, is_clean = prepare_dsa_source(
        source_code=body.source_code,
        q_data=q_data,
        language_id=body.language_id,
        nonce=nonce,
    )

    # Execute on Judge0
    result = await judge0_service.execute(
        source_code=secured_code,
        language_id=body.language_id,
        stdin=combined_stdin,
        compiler_options=compiler_options,
    )

    status_id: int = result["status_id"]
    stdout: str = result["stdout"] or ""

    # ── Parse per-test-case outputs (authenticated with session nonce) ────────
    if not is_clean:
        output_lines = ["" for _ in range(len(active_tests))]
    else:
        output_lines = parse_test_outputs(stdout, len(active_tests), nonce=nonce)

    passed_count = 0
    tc_results: List[TestCaseResult] = []

    for i, tc in enumerate(active_tests):
        actual_raw = output_lines[i] if i < len(output_lines) else ""
        is_hidden = i >= n_sample

        # Compare only when Judge0 succeeded and code has not tampered with harness
        passed = (
            is_clean
            and status_id == 3
            and _compare(actual_raw, tc.get("expectedRaw", ""), compare_mode)
        )
        if passed:
            passed_count += 1

        item = TestCaseResult(
            index=i + 1,
            passed=passed,
            actual=None if is_hidden else actual_raw,
            is_hidden=is_hidden,
        )

        if not is_hidden:
            # Sample tests: include human-readable display fields
            item.input = tc.get("input", "")
            item.expected = tc.get("expected", "")
        # Hidden tests: input, expected, and actual remain None — never sent to browser

        tc_results.append(item)

    # ── Determine final verdict ───────────────────────────────────────────────
    all_passed = (len(active_tests) > 0) and (passed_count == len(active_tests)) and (status_id == 3)

    if is_sample_only:
        final_verdict = "Sample Accepted (Dev Only)" if all_passed else ("Wrong Answer" if status_id == 3 else result["verdict"])
    else:
        final_verdict = "Accepted" if all_passed else ("Wrong Answer" if status_id == 3 else result["verdict"])

    # ── For 'run': return result directly (RUN is always synchronous) ─────────
    # No Firestore history write, no progress update, no queue.
    return SubmissionResponse(
        verdict=final_verdict,
        status_id=status_id,
        runtime=_fmt_time(result["time"]),
        memory=_fmt_memory(result["memory"]),
        passed_count=passed_count,
        total_count=len(active_tests),
        compile_output=(result["compile_output"] or None) if (status_id == 6 or body.execution_type == "run") else None,
        stderr=(result["stderr"] or None) if body.execution_type == "run" else None,
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
    data = await db_service.get_all_user_data(uid)
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
async def get_question_sample_tests(
    question_id: int = Path(..., ge=1, le=10000, description="Question ID between 1 and 10000"),
):
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
    after: Optional[str] = Query(None, max_length=128, description="Cursor: document ID of the last item on the previous page."),
) -> SubmissionHistoryResponse:
    """
    Return paginated submission history for the verified user.

    UID is always derived from the verified Firebase token —
    the caller cannot request another user's history.
    """
    result = await db_service.get_submission_history(
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
    job_id: str = Path(..., min_length=1, max_length=128, description="Job identifier"),
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
                    actual=None if tc.get("is_hidden") else tc.get("actual"),
                    is_hidden=tc["is_hidden"],
                    input=None if tc.get("is_hidden") else tc.get("input"),
                    expected=None if tc.get("is_hidden") else tc.get("expected"),
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
