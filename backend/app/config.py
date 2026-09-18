"""
Application configuration — all values loaded from environment variables.
Never hardcode secrets; use a .env file locally and env vars in production.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Judge0 ────────────────────────────────────────────────────────────────
    judge0_api_key: str = ""
    """RapidAPI key for Judge0 CE. Required when judge0_use_rapidapi=true."""

    judge0_use_rapidapi: bool = True
    """If True, use judge0-ce.p.rapidapi.com; if False, use ce.judge0.com (public)."""

    judge0_rapidapi_base: str = "https://judge0-ce.p.rapidapi.com"
    judge0_public_base: str = "https://ce.judge0.com"

    # ── Firebase ──────────────────────────────────────────────────────────────
    firebase_project_id: str = ""
    """Your Firebase project ID (e.g. algoquest-9aab0)."""

    firebase_service_account_json: str = ""
    """
    Full Firebase service-account JSON as a single string.
    Set this env var in Railway (or any cloud host) instead of uploading a file.
    Takes priority over GOOGLE_APPLICATION_CREDENTIALS when present.
    NEVER commit this value to source control.

    Example (Railway dashboard → Variables):
        FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}
    """

    google_application_credentials: str = ""
    """
    Absolute path to the Firebase service account JSON file.
    Used for local development. Ignored when firebase_service_account_json is set.
    """

    # ── Server ────────────────────────────────────────────────────────────────
    backend_port: int = 8000
    backend_host: str = "0.0.0.0"

    allowed_origins_str: str = (
        "http://localhost:5500,"
        "http://localhost:5501,"
        "http://localhost:8080,"
        "http://127.0.0.1:5500,"
        "http://127.0.0.1:5501,"
        "http://127.0.0.1:8080,"
        "https://algoquest-9aab0.web.app,"
        "https://algoquest-9aab0.firebaseapp.com"
    )
    """
    Comma-separated list of allowed CORS origins.
    Override via ALLOWED_ORIGINS_STR env var.
    Example: ALLOWED_ORIGINS_STR=http://localhost:5500,https://algoquest-9aab0.web.app
    """

    @property
    def allowed_origins(self) -> list:
        return [o.strip() for o in self.allowed_origins_str.split(",") if o.strip()]


    # ── Execution ─────────────────────────────────────────────────────────────
    judge0_max_poll_attempts: int = 20
    """Maximum number of polling attempts for a Judge0 submission."""

    judge0_poll_interval_seconds: float = 2.0
    """Seconds to wait between polling attempts."""

    # ── Async submission queue ─────────────────────────────────────────────────
    submission_workers: int = 1
    """
    Number of asyncio background workers processing the submit queue.
    Start with 1 for safety; increase for higher concurrency.
    Do NOT set to an unbounded value — each worker holds a Judge0 connection.
    Override via SUBMISSION_WORKERS env var.
    """


settings = Settings()
