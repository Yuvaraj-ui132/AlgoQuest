"""
AlgoQuest FastAPI Backend — Main Application Entry Point

Architecture:
  Browser (Vanilla JS) → FastAPI → Firebase Firestore + Judge0 CE

Authentication:
  Firebase Auth (client-side) → ID Token → FastAPI verifies token → UID derived
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routes import submissions, progress, bookmarks, notes, editor, user, sync
from app.utils.errors import add_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI application lifespan — startup and shutdown logic.

    Startup:
      1. Initialize structured logging with redacting filter.
      2. Initialize Firebase Admin SDK.
      3. Validate hidden test cases dataset.
      4. Start async submission worker(s) via asyncio.Queue.

    Shutdown:
      1. Gracefully cancel all submission worker tasks.
    """
    from app.utils.logging import setup_logging
    from app.utils.security import initialize_firebase
    from app.services.submission_queue import submission_queue
    from app.routes.submissions import validate_hidden_tests_on_startup
    from app.config import settings

    setup_logging(log_level=settings.log_level, log_format=settings.effective_log_format)

    # Optional external error tracking (Sentry)
    import os
    sentry_dsn = os.environ.get("SENTRY_DSN")
    if sentry_dsn:
        try:
            import sentry_sdk
            sentry_sdk.init(
                dsn=sentry_dsn,
                environment=settings.app_env,
                traces_sample_rate=0.1,
                send_default_pii=False,
            )
        except ImportError:
            pass

    initialize_firebase()
    validate_hidden_tests_on_startup()
    if settings.database_backend == "supabase":
        try:
            from app.services.supabase_service import repair_historical_languages
            repair_historical_languages()
        except Exception:
            pass
    submission_queue.start_workers(count=settings.submission_workers)
    yield
    submission_queue.stop_workers()
    try:
        from app.services.judge0_service import close_http_client
        await close_http_client()
    except Exception:
        pass


app = FastAPI(
    title="AlgoQuest API",
    description=(
        "Backend for AlgoQuest — a DSA practice platform.\n\n"
        "## Authentication\n"
        "All `/api/*` routes require a Firebase ID token:\n"
        "```\n"
        "Authorization: Bearer <firebase_id_token>\n"
        "```\n"
        "Obtain the token on the client via `firebase.auth().currentUser.getIdToken()`.\n\n"
        "## Architecture\n"
        "- **Firebase Auth** handles login/signup (client-side)\n"
        "- **FastAPI** verifies ID tokens and proxies Firestore + Judge0 calls\n"
        "- **Firestore / Supabase** stores user data (progress, bookmarks, notes, editor code)\n"
        "- **Judge0 CE** executes submitted code in isolated containers"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────
from app.utils.logging import RequestLoggingMiddleware
from app.utils.security import SecurityHeadersMiddleware

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)

# ── Exception handlers ────────────────────────────────────────────────────────
add_exception_handlers(app)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(submissions.router, prefix="/api", tags=["Code Execution"])
app.include_router(progress.router,    prefix="/api", tags=["Progress"])
app.include_router(bookmarks.router,   prefix="/api", tags=["Bookmarks"])
app.include_router(notes.router,       prefix="/api", tags=["Notes"])
app.include_router(editor.router,      prefix="/api", tags=["Editor Code"])
app.include_router(user.router,        prefix="/api", tags=["User"])
app.include_router(sync.router,        prefix="/api", tags=["Sync"])


@app.get("/health", tags=["Health"], summary="Liveness probe")
async def health_check():
    """Returns OK when the backend is running. No authentication required."""
    return {
        "status": "ok",
        "service": "algoquest-api",
        "environment": settings.app_env,
    }


@app.get("/health/ready", tags=["Health"], summary="Readiness probe")
async def readiness_check():
    """
    Deep readiness probe checking database, hidden tests dataset, and submission queue.
    Returns 200 OK when operational, or 503 Service Unavailable when degraded.
    Never exposes credentials or private hidden test data.
    """
    from fastapi.responses import JSONResponse
    from fastapi import status
    from app.services import db_service
    from app.services.submission_queue import submission_queue
    from app.routes.submissions import get_hidden_tests_status

    db_ok = db_service.check_health()
    hidden_status = get_hidden_tests_status()
    queue_stats = submission_queue.get_queue_stats()

    hidden_ok = hidden_status.get("dataset_available", False) or hidden_status.get("sample_only_mode", False)
    workers_ok = queue_stats.get("active_workers", 0) > 0 or queue_stats.get("total_workers", 0) == 0

    is_ready = db_ok and hidden_ok and workers_ok
    status_code = status.HTTP_200_OK if is_ready else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "ready" if is_ready else "degraded",
            "service": "algoquest-api",
            "environment": settings.app_env,
            "database": {
                "backend": settings.database_backend,
                "status": "connected" if db_ok else "error",
            },
            "hidden_tests": {
                "status": "loaded" if hidden_status.get("dataset_available") else (
                    "sample_only" if hidden_status.get("sample_only_mode") else "missing"
                ),
            },
            "submission_queue": {
                "status": "healthy" if workers_ok else "degraded",
                "mode": queue_stats.get("mode", "memory"),
                "active_workers": queue_stats.get("active_workers", 0),
                "queue_size": queue_stats.get("queue_size", 0),
            },
        },
    )
