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
import logging
import httpx
from typing import Dict, Any, Optional
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger(__name__)

# Track which endpoint base URL was used for each active submission token
_token_base_urls: Dict[str, str] = {}


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


def _clean_api_key() -> str:
    return (settings.judge0_api_key or "").strip("'\" \t\r\n")


def _get_headers(for_rapidapi: bool = True) -> Dict[str, str]:
    """Build request headers depending on whether RapidAPI is configured."""
    headers = {"content-type": "application/json"}
    api_key = _clean_api_key()
    if for_rapidapi and settings.judge0_use_rapidapi and api_key:
        headers.update(
            {
                "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
                "x-rapidapi-key": api_key,
            }
        )
    return headers


def _base_url() -> str:
    api_key = _clean_api_key()
    if settings.judge0_use_rapidapi and api_key:
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
    """
    try:
        decoded = base64.b64decode(source_code).decode("utf-8")
        plain_code = decoded
    except Exception:
        plain_code = source_code

    payload = {
        "source_code": _b64_encode(plain_code),
        "language_id": language_id,
        "stdin": _b64_encode(stdin),
        "redirect_stderr_to_stdout": False,
    }

    if compiler_options and language_id in (50, 54, 76):
        payload["compiler_options"] = compiler_options

    target_base = _base_url()
    url = f"{target_base}/submissions?base64_encoded=true&wait=false"
    headers = _get_headers(for_rapidapi=("rapidapi.com" in target_base))

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(url, json=payload, headers=headers)
            # If RapidAPI returns 401 or 403 (unauthorized, invalid key, or not subscribed),
            # gracefully fall back to the public Judge0 CE endpoint so code execution succeeds!
            if response.status_code in (401, 403) and "rapidapi.com" in url:
                logger.warning(
                    "[Judge0] RapidAPI returned HTTP %s (%s). Falling back to public endpoint %s.",
                    response.status_code,
                    response.text[:200],
                    settings.judge0_public_base,
                )
                target_base = settings.judge0_public_base
                url = f"{target_base}/submissions?base64_encoded=true&wait=false"
                headers = {"content-type": "application/json"}
                response = await client.post(url, json=payload, headers=headers)

            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as exc:
            logger.error("[Judge0] HTTP error: %s - %s", exc.response.status_code, exc.response.text[:200])
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Code execution provider error: HTTP {exc.response.status_code} - {exc.response.text[:200]}",
            )
        except httpx.RequestError as exc:
            logger.error("[Judge0] Connection error: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Code execution provider unreachable: {exc}",
            )

    token = data.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Judge0 did not return a submission token. Response: {data}",
        )

    _token_base_urls[token] = target_base
    return token


# ── Polling ───────────────────────────────────────────────────────────────────

async def poll_submission(token: str) -> Dict[str, Any]:
    """
    Poll Judge0 until the submission reaches a terminal status.
    """
    target_base = _token_base_urls.get(token, _base_url())
    is_rapidapi = "rapidapi.com" in target_base
    fields = "status,stdout,stderr,compile_output,time,memory,message"
    url = f"{target_base}/submissions/{token}?base64_encoded=true&fields={fields}"
    headers = _get_headers(for_rapidapi=is_rapidapi)
    headers.pop("content-type", None)

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(settings.judge0_max_poll_attempts):
            await asyncio.sleep(settings.judge0_poll_interval_seconds)
            try:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                data = response.json()
            except httpx.HTTPStatusError as exc:
                logger.error("[Judge0] Poll error on %s: %s", url, exc)
                _token_base_urls.pop(token, None)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Judge0 polling failed: HTTP {exc.response.status_code}",
                )
            except httpx.RequestError as exc:
                logger.error("[Judge0] Poll network error on %s: %s", url, exc)
                _token_base_urls.pop(token, None)
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Judge0 polling unreachable: {exc}",
                )

            status_id = data.get("status", {}).get("id", 0)
            if is_terminal(status_id):
                _token_base_urls.pop(token, None)
                return data

    _token_base_urls.pop(token, None)
    raise HTTPException(
        status_code=status.HTTP_504_GATEWAY_TIMEOUT,
        detail=(
            f"Judge0 submission {token!r} did not complete after "
            f"{settings.judge0_max_poll_attempts} polling attempts "
            f"({settings.judge0_max_poll_attempts * settings.judge0_poll_interval_seconds:.0f}s)."
        ),
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
