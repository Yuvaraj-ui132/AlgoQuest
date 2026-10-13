"""
AlgoQuest Logging & Observability Infrastructure (Phase Eight).

Provides:
1. ContextVars (request_id_ctx, job_id_ctx) for cross-correlating logs across async tasks.
2. RedactingFilter: scrubs passwords, bearer tokens, JWTs, DB URLs, and API keys.
3. StructuredJsonFormatter: single-line JSON logs for Render / log aggregators.
4. StructuredTextFormatter: human-readable logs for development and test execution.
5. RequestLoggingMiddleware: attaches X-Request-ID, tracks latency, and outputs structured request logs.
"""

import contextvars
import json
import logging
import re
import sys
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# ── Context Variables for Distributed Tracing ────────────────────────────────
request_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("request_id", default="")
job_id_ctx: contextvars.ContextVar[str] = contextvars.ContextVar("job_id", default="")

logger = logging.getLogger("algoquest.request")


# ── Sensitive Data Sanitization ──────────────────────────────────────────────
_SECRET_KV_RE = re.compile(r"(?i)(password|pwd|secret|api_key|token)\s*=\s*[^\s,;&'\"]+")
_BEARER_RE = re.compile(r"Bearer\s+[A-Za-z0-9_\-\.]+")
_JWT_RE = re.compile(r"eyJ[A-Za-z0-9_\-\.]+\.[A-Za-z0-9_\-\.]+\.[A-Za-z0-9_\-\.]+")
_DB_URL_RE = re.compile(r"://([^:@\s]+):([^@\s]+)@")


def sanitize_log_text(text: str) -> str:
    """
    Scrub sensitive credentials, bearer tokens, JWTs, and database URLs
    from log text to prevent credential leakage.
    """
    if not isinstance(text, str):
        return str(text)
    sanitized = _DB_URL_RE.sub(r"://\1:[REDACTED]@", text)
    sanitized = _BEARER_RE.sub("Bearer [REDACTED]", sanitized)
    sanitized = _JWT_RE.sub("[REDACTED_JWT]", sanitized)
    sanitized = _SECRET_KV_RE.sub(r"\1=[REDACTED]", sanitized)
    return sanitized


class RedactingFilter(logging.Filter):
    """
    Logging filter that:
    1. Injects active request_id and job_id from ContextVars into LogRecord.
    2. Scrubs sensitive patterns from record.msg and record.args.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        # Inject correlation identifiers
        req_id = getattr(record, "request_id", None) or request_id_ctx.get()
        job_id = getattr(record, "job_id", None) or job_id_ctx.get()
        record.request_id = req_id or ""
        record.job_id = job_id or ""

        # Scrub message
        if isinstance(record.msg, str):
            record.msg = sanitize_log_text(record.msg)

        # Scrub args
        if record.args:
            if isinstance(record.args, tuple):
                record.args = tuple(
                    sanitize_log_text(arg) if isinstance(arg, str) else arg
                    for arg in record.args
                )
            elif isinstance(record.args, dict):
                record.args = {
                    k: (sanitize_log_text(v) if isinstance(v, str) else v)
                    for k, v in record.args.items()
                }

        return True


# ── Formatters ────────────────────────────────────────────────────────────────

EXTRA_LOG_FIELDS = (
    "event",
    "method",
    "path",
    "status_code",
    "duration_ms",
    "job_id",
    "request_id",
    "uid",
    "question_id",
    "language_id",
    "verdict",
    "passed_count",
    "total_count",
    "judge0_duration_ms",
    "queue_wait_ms",
    "total_duration_ms",
    "error",
)


class StructuredJsonFormatter(logging.Formatter):
    """
    Emits log records as single-line JSON objects, ideal for production log aggregators (Render, Datadog, etc.).
    """

    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Include correlation IDs if populated
        if getattr(record, "request_id", None):
            payload["request_id"] = record.request_id
        if getattr(record, "job_id", None):
            payload["job_id"] = record.job_id

        # Attach extra structured metadata
        for field in EXTRA_LOG_FIELDS:
            val = getattr(record, field, None)
            if val is not None and field not in payload:
                payload[field] = val

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


class StructuredTextFormatter(logging.Formatter):
    """
    Emits human-readable structured logs with contextual correlation tags.
    """

    def format(self, record: logging.LogRecord) -> str:
        asctime = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
        req_id = getattr(record, "request_id", "")
        job_id = getattr(record, "job_id", "")

        tags = []
        if req_id:
            tags.append(f"req={req_id}")
        if job_id:
            tags.append(f"job={job_id}")
        tag_str = f"[{'|'.join(tags)}] " if tags else ""

        msg = record.getMessage()

        # Append key extra fields if present
        extra_parts = []
        for field in ("event", "duration_ms", "verdict", "error"):
            val = getattr(record, field, None)
            if val is not None and field not in msg:
                extra_parts.append(f"{field}={val}")
        extra_str = f" ({', '.join(extra_parts)})" if extra_parts else ""

        base = f"{asctime} [{record.levelname:<5}] {tag_str}{record.name}: {msg}{extra_str}"
        if record.exc_info:
            base += "\n" + self.formatException(record.exc_info)
        return base


# ── Global Setup ──────────────────────────────────────────────────────────────

def setup_logging(log_level: str = "INFO", log_format: str = "text") -> None:
    """
    Configure global logging with structured formatting and data redacting.
    Idempotent: will not create duplicate handlers if called multiple times.
    """
    root_logger = logging.getLogger()
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    root_logger.setLevel(numeric_level)

    # Check if AlgoQuest handler is already registered
    existing_handler = next(
        (h for h in root_logger.handlers if getattr(h, "_algoquest_handler", False)),
        None,
    )

    if existing_handler:
        # Update level and formatter on existing handler
        existing_handler.setLevel(numeric_level)
        if log_format.lower() == "json":
            existing_handler.setFormatter(StructuredJsonFormatter())
        else:
            existing_handler.setFormatter(StructuredTextFormatter())
        return

    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    handler._algoquest_handler = True  # type: ignore[attr-defined]
    handler.setLevel(numeric_level)
    handler.addFilter(RedactingFilter())

    if log_format.lower() == "json":
        handler.setFormatter(StructuredJsonFormatter())
    else:
        handler.setFormatter(StructuredTextFormatter())

    root_logger.addHandler(handler)


# ── HTTP Request Logging & Tracing Middleware ─────────────────────────────────

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    FastAPI / Starlette middleware that:
    1. Extracts or creates a clean X-Request-ID.
    2. Injects the request ID into contextvars and response headers.
    3. Measures request latency and logs structured request completion.
    4. Suppresses high-frequency health probes from INFO logs to avoid noise.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        raw_id = request.headers.get("X-Request-ID", "").strip()
        # Sanitize incoming client header to safe alphanumeric + hyphens/underscores
        clean_id = re.sub(r"[^a-zA-Z0-9_\-]", "", raw_id)[:64]
        if not clean_id:
            clean_id = f"req_{uuid.uuid4().hex[:12]}"

        request.state.request_id = clean_id
        req_token = request_id_ctx.set(clean_id)

        start_time = time.monotonic()
        try:
            response = await call_next(request)
            duration_ms = round((time.monotonic() - start_time) * 1000, 2)

            # Do not spam INFO logs with health check probes
            if request.url.path not in ("/health", "/health/ready"):
                logger.info(
                    "%s %s %d %.2fms [req=%s]",
                    request.method,
                    request.url.path,
                    response.status_code,
                    duration_ms,
                    clean_id,
                    extra={
                        "event": "API_REQUEST_COMPLETED",
                        "method": request.method,
                        "path": request.url.path,
                        "status_code": response.status_code,
                        "duration_ms": duration_ms,
                        "request_id": clean_id,
                    },
                )

            response.headers["X-Request-ID"] = clean_id
            return response

        except Exception as exc:
            duration_ms = round((time.monotonic() - start_time) * 1000, 2)
            logger.error(
                "Unhandled error on %s %s %.2fms [req=%s]: %s",
                request.method,
                request.url.path,
                duration_ms,
                clean_id,
                exc,
                extra={
                    "event": "API_REQUEST_FAILED",
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": duration_ms,
                    "request_id": clean_id,
                    "error": str(exc),
                },
                exc_info=True,
            )
            raise
        finally:
            request_id_ctx.reset(req_token)
