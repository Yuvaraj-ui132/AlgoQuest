"""
Judge0 CE service — handles all communication with the Judge0 API.

This is the only place in the backend that knows the Judge0 API key.
The key is read from environment variables (via settings) and never
sent to the browser.

Judge0 status IDs reference:
  1  = In Queue
  2  = Processing
  3  = Accepted
  4  = Wrong Answer
  5  = Time Limit Exceeded
  6  = Compilation Error
  7  = Runtime Error (SIGSEGV)
  8  = Runtime Error (SIGABRT)
  9  = Runtime Error (NZEC)
  10 = Runtime Error (Other)
  11 = Internal Error
  12 = Exec Format Error
  13 = Memory Limit Exceeded
"""

import asyncio
import base64
import httpx
from typing import Dict, Any, Optional

from app.config import settings


# ── Status helpers ────────────────────────────────────────────────────────────

TERMINAL_STATUSES = frozenset(range(3, 20))  # anything ≥3 is terminal

VERDICT_LABELS: Dict[int, str] = {
    1:  "In Queue",
    2:  "Processing",
    3:  "Accepted",
    4:  "Wrong Answer",
    5:  "Time Limit Exceeded",
    6:  "Compilation Error",
    7:  "Runtime Error (SIGSEGV)",
    8:  "Runtime Error (SIGXFSZ)",
    9:  "Runtime Error (SIGFPE)",
    10: "Runtime Error (SIGABRT)",
    11: "Runtime Error (NZEC)",
    12: "Runtime Error (Other)",
    13: "Internal Error",
    14: "Exec Format Error",
}


def get_verdict_label(status_id: int, desc: Optional[str] = None) -> str:
    return desc or VERDICT_LABELS.get(status_id, f"Unknown Status ({status_id})")


def is_terminal(status_id: int) -> bool:
    return status_id not in (1, 2)


def _get_headers() -> Dict[str, str]:
    """Build request headers depending on whether RapidAPI is configured."""
    headers = {"content-type": "application/json"}
    if settings.judge0_use_rapidapi and settings.judge0_api_key:
        headers.update(
            {
                "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
                "x-rapidapi-key": settings.judge0_api_key,
            }
        )
    return headers


def _base_url() -> str:
    if settings.judge0_use_rapidapi and settings.judge0_api_key:
        return settings.judge0_rapidapi_base
    return settings.judge0_public_base


def _b64_encode(text: str) -> str:
    return base64.b64encode(text.encode("utf-8")).decode("ascii")


def _b64_decode(encoded: Optional[str]) -> str:
    if not encoded:
        return ""
    try:
        return base64.b64decode(encoded).decode("utf-8", errors="replace")
    except Exception:
        return encoded  # return as-is if decoding fails


# ── Submission creation ───────────────────────────────────────────────────────

async def create_submission(
    source_code: str,
    language_id: int,
    stdin: str,
    compiler_options: str = "",
) -> str:
    """
    Create a Judge0 submission.

    Args:
        source_code:      Plain-text (or already base64-encoded) source code.
        language_id:      Judge0 language ID.
        stdin:            Combined stdin string (already formatted as T\\n<tc1>...).
        compiler_options: Compiler flags (e.g. '-std=c++17').

    Returns:
        Judge0 submission token (str).
    """
    # If source_code looks like it is already base64, decode first then re-encode
    # to ensure consistent encoding. The frontend sends base64; we need the plain text.
    try:
        decoded = base64.b64decode(source_code).decode("utf-8")
        plain_code = decoded
    except Exception:
        # Not base64 — treat as plain text
        plain_code = source_code

    payload = {
        "source_code": _b64_encode(plain_code),
        "language_id": language_id,
        "stdin": _b64_encode(stdin),
        "redirect_stderr_to_stdout": False,
    }

    # Setting compiler options is only allowed for compiled languages (C, C++)
    if compiler_options and language_id in (50, 54, 76):
        payload["compiler_options"] = compiler_options

    url = f"{_base_url()}/submissions?base64_encoded=true&wait=false"
    headers = _get_headers()

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        data = response.json()

    token = data.get("token")
    if not token:
        raise RuntimeError(f"Judge0 did not return a token. Response: {data}")
    return token


# ── Polling ───────────────────────────────────────────────────────────────────

async def poll_submission(token: str) -> Dict[str, Any]:
    """
    Poll Judge0 until the submission reaches a terminal status.

    Polls every `settings.judge0_poll_interval_seconds` seconds,
    up to `settings.judge0_max_poll_attempts` attempts (~40 seconds total).

    Returns:
        The full Judge0 submission object at its terminal state.

    Raises:
        TimeoutError: If the submission does not complete within the polling window.
    """
    fields = "status,stdout,stderr,compile_output,time,memory,message"
    url = f"{_base_url()}/submissions/{token}?base64_encoded=true&fields={fields}"
    headers = _get_headers()
    # Remove content-type header for GET requests
    headers.pop("content-type", None)

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(settings.judge0_max_poll_attempts):
            await asyncio.sleep(settings.judge0_poll_interval_seconds)
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            status_id = data.get("status", {}).get("id", 0)
            if is_terminal(status_id):
                return data

    raise TimeoutError(
        f"Judge0 submission {token!r} did not complete after "
        f"{settings.judge0_max_poll_attempts} polling attempts "
        f"({settings.judge0_max_poll_attempts * settings.judge0_poll_interval_seconds:.0f}s)."
    )


# ── High-level execute ────────────────────────────────────────────────────────

async def execute(
    source_code: str,
    language_id: int,
    stdin: str,
    compiler_options: str = "",
) -> Dict[str, Any]:
    """
    Create a submission and poll until complete.

    Returns a dict with keys: status_id, stdout, stderr, compile_output, time, memory, verdict.
    All text fields are decoded from base64.
    """
    token = await create_submission(source_code, language_id, stdin, compiler_options)
    raw = await poll_submission(token)

    status_id: int = raw.get("status", {}).get("id", 0)
    return {
        "status_id":      status_id,
        "verdict":        get_verdict_label(status_id, raw.get("status", {}).get("description")),
        "stdout":         _b64_decode(raw.get("stdout")),
        "stderr":         _b64_decode(raw.get("stderr")),
        "compile_output": _b64_decode(raw.get("compile_output")),
        "time":           raw.get("time"),
        "memory":         raw.get("memory"),
        "message":        raw.get("message", ""),
    }
