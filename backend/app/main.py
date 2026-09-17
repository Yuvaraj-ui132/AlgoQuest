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
from app.routes import submissions, progress, bookmarks, notes, editor, user
from app.utils.errors import add_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI application lifespan — startup and shutdown logic.

    Startup:
      1. Initialize Firebase Admin SDK.
      2. Start async submission worker(s) via asyncio.Queue.

    Shutdown:
      1. Gracefully cancel all submission worker tasks.

    NOTE: The submission queue is in-memory. If the process restarts,
    queued/running jobs are lost. Completed Firestore records are permanent.
    This is an intentional design decision — no external queue infrastructure required.
    """
    from app.utils.security import initialize_firebase
    from app.services.submission_queue import submission_queue
    from app.config import settings

    initialize_firebase()
    submission_queue.start_workers(count=settings.submission_workers)
    yield
    submission_queue.stop_workers()


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
        "- **Firestore** stores user data (progress, bookmarks, notes, editor code)\n"
        "- **Judge0 CE** executes submitted code in isolated containers"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
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


@app.get("/health", tags=["Health"], summary="Health check")
async def health_check():
    """Returns OK when the backend is running. No authentication required."""
    return {"status": "ok", "service": "algoquest-api"}
