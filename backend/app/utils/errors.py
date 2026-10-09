"""
Centralized error handling and exception registration.
"""

import logging
import os
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

logger = logging.getLogger(__name__)

# In development mode, include the raw exception message in the 500 response
# so the browser DevTools Network tab shows the real error, not just "An internal server error occurred."
_DEV_MODE = os.environ.get("APP_ENV", "development").lower() != "production"


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


def add_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""
    from fastapi import HTTPException

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        headers = dict(exc.headers) if exc.headers else {}
        headers.update(_cors_headers(request))
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
            headers=headers,
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
            headers=_cors_headers(request),
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        """Catch-all: always log the full traceback, return 500."""
        logger.error(
            "Unhandled exception on %s %s: %s",
            request.method,
            request.url.path,
            exc,
            exc_info=True,   # prints full traceback to Uvicorn console
        )
        detail = "An internal server error occurred."
        if _DEV_MODE:
            # Show the real error in DevTools Network tab during development
            detail = f"{type(exc).__name__}: {exc}"
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": detail},
            headers=_cors_headers(request),
        )



def not_found(resource: str, id_: int | str) -> None:
    """Raise a 404 HTTPException."""
    from fastapi import HTTPException
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"{resource} '{id_}' not found.",
    )
