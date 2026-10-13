"""
Centralized error handling and exception registration.
"""

import logging
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

logger = logging.getLogger(__name__)

def _is_dev_mode() -> bool:
    try:
        from app.config import settings
        return settings.is_development
    except Exception:
        return False


def _cors_headers(request: Request) -> dict:
    from app.config import settings
    origin = request.headers.get("origin")
    if origin and (origin in settings.allowed_origins or "*" in settings.allowed_origins):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Vary": "Origin",
        }
    return {}


def _response_headers(request: Request, base_headers: dict = None) -> dict:
    headers = dict(base_headers) if base_headers else {}
    headers.update(_cors_headers(request))
    req_id = getattr(request.state, "request_id", None)
    if not req_id:
        try:
            from app.utils.logging import request_id_ctx
            req_id = request_id_ctx.get()
        except Exception:
            pass
    if req_id:
        headers["X-Request-ID"] = req_id
    return headers


def add_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""
    from fastapi import HTTPException

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=_response_headers(request, exc.headers),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        """Return a clean 422 with human-readable messages."""
        errors = []
        for e in exc.errors():
            field = " → ".join(str(x) for x in e["loc"])
            errors.append(f"{field}: {e['msg']}")
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"detail": "; ".join(errors)},
            headers=_response_headers(request),
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        """Catch-all: log traceback, return 500 without leaking credentials or database internals."""
        err_str = str(exc)
        is_sensitive = hasattr(exc, "orig") or any(k in err_str.lower() for k in ("password", "token", "key", "secret"))
        sanitized_diag = sanitize_db_error(exc) if is_sensitive else None

        req_id = getattr(request.state, "request_id", None)
        if not req_id:
            try:
                from app.utils.logging import request_id_ctx
                req_id = request_id_ctx.get()
            except Exception:
                pass

        logger.error(
            "Unhandled exception on %s %s [req=%s]: %s",
            request.method,
            request.url.path,
            req_id or "-",
            sanitized_diag["sanitized_message"] if sanitized_diag else exc,
            extra={
                "event": "API_UNHANDLED_EXCEPTION",
                "request_id": req_id or "",
                "method": request.method,
                "path": request.url.path,
                "error": sanitized_diag["sanitized_message"] if sanitized_diag else str(exc),
            },
            exc_info=True,
        )

        detail = "An internal server error occurred."
        if _is_dev_mode():
            if sanitized_diag:
                detail = f"{sanitized_diag['exception_class']}: {sanitized_diag['sanitized_message']}"
            else:
                detail = f"{type(exc).__name__}: {exc}"

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": detail},
            headers=_response_headers(request),
        )



def not_found(resource: str, id_: int | str) -> None:
    """Raise a 404 HTTPException."""
    from fastapi import HTTPException
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} '{id_}' not found.",
    )


def sanitize_db_error(exc: Exception) -> dict:
    """
    Sanitize database exceptions to extract actionable diagnostic details
    (exception class, driver class, SQLSTATE pgcode, and sanitized message)
    without leaking credentials, tokens, query parameters, or source code.

    Returns:
        {
            "exception_class": str,     # e.g. "ProgrammingError:DatatypeMismatch"
            "driver_class": str | None, # e.g. "DatatypeMismatch"
            "pgcode": str | None,       # PostgreSQL SQLSTATE code, e.g. "42804"
            "sanitized_message": str,   # Cleaned error description without credentials or parameters
        }
    """
    import re

    exc_class = exc.__class__.__name__
    driver_class = None
    pgcode = None

    orig = getattr(exc, "orig", None)
    if orig is not None:
        driver_class = orig.__class__.__name__
        pgcode = getattr(orig, "pgcode", None)
        # orig contains the raw DB driver message without SQLAlchemy query parameters
        raw_msg = str(orig)
    else:
        raw_msg = str(exc)

    # Strip SQLAlchemy parameter and statement dumps if present in the message
    raw_msg = re.sub(r"\[SQL:.*?\]", "", raw_msg, flags=re.DOTALL)
    raw_msg = re.sub(r"\[parameters:.*?\]", "", raw_msg, flags=re.DOTALL)
    raw_msg = re.sub(r"\(Background on this error at:.*?\)", "", raw_msg, flags=re.DOTALL)

    # Sanitize credentials, passwords, and tokens
    # 1. Database URLs with user:password@host
    raw_msg = re.sub(r"://([^:@\s]+):([^@\s]+)@", r"://\1:[REDACTED]@", raw_msg)
    # 2. Key-value secrets (password=..., token=..., secret=...)
    raw_msg = re.sub(r"(?i)(password|pwd|secret|api_key|token)\s*=\s*[^\s,;&'\"]+", r"\1=[REDACTED]", raw_msg)
    # 3. Bearer authentication tokens
    raw_msg = re.sub(r"Bearer\s+[A-Za-z0-9_\-\.]+", "Bearer [REDACTED]", raw_msg)

    # Flatten extra whitespace and newlines to a single clean line
    sanitized_msg = " ".join(raw_msg.split()).strip()
    if not sanitized_msg:
        sanitized_msg = f"{exc_class} (no message details)"

    full_class = f"{exc_class}:{driver_class}" if driver_class else exc_class

    return {
        "exception_class": full_class,
        "driver_class": driver_class,
        "pgcode": pgcode,
        "sanitized_message": sanitized_msg,
    }
