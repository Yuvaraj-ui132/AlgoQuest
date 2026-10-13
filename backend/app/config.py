"""
Application configuration — all values loaded from environment variables.
Never hardcode secrets; use a .env file locally and env vars in production.
"""

from pydantic import Field, AliasChoices
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

    # ── Database Backend (Phase Three Migration) ──────────────────────────────
    database_backend: str = "firestore"
    """
    Active database repository provider:
      - 'firestore' (default): Google Cloud Firestore via Firebase Admin SDK
      - 'supabase': Supabase PostgreSQL via SQLAlchemy/psycopg2
    Defaults to 'firestore' to guarantee zero breaking changes.
    """

    supabase_db_url: str = ""
    """
    PostgreSQL connection string for Supabase or development PostgreSQL instance.
    Format: postgresql://[user]:[password]@[host]:[port]/[db]
    Example: postgresql://algoquest_app:secret@db.project.supabase.co:6543/postgres
    """

    # ── Server & Environment ──────────────────────────────────────────────────
    app_env: str = Field(
        default="production",
        validation_alias=AliasChoices("APP_ENV", "ENVIRONMENT", "ENV"),
    )
    """
    Application runtime environment: 'production', 'development', 'staging', 'test'.
    Defaults securely to 'production' so diagnostics and database details fail-safe
    and are never leaked if the variable is omitted.
    """

    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() in ("production", "prod")

    @property
    def is_development(self) -> bool:
        return self.app_env.strip().lower() in ("development", "dev", "local")

    backend_port: int = Field(default=8000, validation_alias=AliasChoices("BACKEND_PORT", "PORT"))
    backend_host: str = "0.0.0.0"

    allowed_origins_str: str = Field(
        default=(
            "http://localhost:5500,"
            "http://localhost:5501,"
            "http://localhost:8080,"
            "http://127.0.0.1:5500,"
            "http://127.0.0.1:5501,"
            "http://127.0.0.1:8080,"
            "https://algoquest-9aab0.web.app,"
            "https://algoquest-9aab0.firebaseapp.com"
        ),
        validation_alias=AliasChoices("ALLOWED_ORIGINS_STR", "ALLOWED_ORIGINS"),
    )
    """
    Comma-separated list of allowed CORS origins.
    Override via ALLOWED_ORIGINS_STR or ALLOWED_ORIGINS env var.
    Example: ALLOWED_ORIGINS=https://algoquest-9aab0.web.app,https://algoquest-9aab0.firebaseapp.com
    """

    @property
    def allowed_origins(self) -> list:
        return [o.strip() for o in self.allowed_origins_str.split(",") if o.strip()]

    # ── Logging & Observability (Phase Eight) ─────────────────────────────────
    log_level: str = Field(
        default="INFO",
        validation_alias=AliasChoices("LOG_LEVEL"),
    )
    """Log level threshold: 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'."""

    log_format: str = Field(
        default="text",
        validation_alias=AliasChoices("LOG_FORMAT"),
    )
    """Log format: 'text' (human-readable) or 'json' (structured JSON for log aggregators)."""

    @property
    def effective_log_format(self) -> str:
        fmt = self.log_format.strip().lower()
        if fmt in ("json", "structured"):
            return "json"
        if self.is_production and fmt != "text":
            return "json"
        return "text"


    # ── Execution ─────────────────────────────────────────────────────────────
    judge0_max_poll_attempts: int = 20
    """Maximum number of polling attempts for a Judge0 submission."""

    judge0_poll_interval_seconds: float = 2.0
    """Seconds to wait between polling attempts."""

    # ── Async submission queue ─────────────────────────────────────────────────
    submission_workers: int = 2
    """
    Number of asyncio background workers processing the submit queue.
    Defaults to 2 for concurrent throughput; bounded to prevent overloading Judge0.
    Override via SUBMISSION_WORKERS env var.
    """

    submission_queue_max_size: int = 100
    """
    Maximum number of queued jobs before applying backpressure (HTTP 503).
    Prevents unbounded memory growth and excessive wait times.
    Override via SUBMISSION_QUEUE_MAX_SIZE env var.
    """

    # ── Private Test Suite & Grading Isolation ─────────────────────────────────
    hidden_tests_path: str = Field(
        default="",
        validation_alias=AliasChoices("HIDDEN_TESTS_PATH", "HIDDEN_TEST_CASES_PATH"),
    )
    """
    Path to the private hidden test suite JSON file.
    In production (Render), typically mounted as a Secret File at /etc/secrets/hidden_test_cases.json.
    If left empty, the application checks /etc/secrets/hidden_test_cases.json,
    then backend/data/hidden_test_cases.json.
    """

    allow_sample_only_grading: bool = Field(
        default=False,
        validation_alias=AliasChoices("ALLOW_SAMPLE_ONLY_GRADING"),
    )
    """
    Explicit switch for local development ONLY.
    When False (default / production), submissions fail closed if private test data is missing,
    malformed, or does not cover the question.
    When True, local development allows grading with sample tests, but results in a distinct
    'Sample Accepted (Dev Only)' verdict and NEVER updates user progress or records an official Accepted submission.
    """

    # ── Durable PostgreSQL-Backed Queue (Phase Ten) ───────────────────────────
    queue_enable_pg_backend: bool = Field(
        default=False,
        validation_alias=AliasChoices("QUEUE_ENABLE_PG_BACKEND"),
    )
    """
    When True, the submission queue persists jobs in PostgreSQL (queue_jobs table)
    so queued jobs survive backend restarts.
    Requires database_backend='supabase' and a valid supabase_db_url.
    When False (default), uses the legacy in-memory asyncio.Queue.
    """

    queue_max_retries: int = Field(
        default=3,
        validation_alias=AliasChoices("QUEUE_MAX_RETRIES"),
    )
    """Maximum number of execution attempts for a single submission before dead-lettering."""

    queue_worker_lease_seconds: int = Field(
        default=120,
        validation_alias=AliasChoices("QUEUE_WORKER_LEASE_SECONDS"),
    )
    """
    Worker lease TTL in seconds.
    If a worker holds a job for longer than this without a heartbeat,
    the job is eligible for orphan recovery by any other worker.
    """

    queue_poll_interval_seconds: float = Field(
        default=1.0,
        validation_alias=AliasChoices("QUEUE_POLL_INTERVAL_SECONDS"),
    )
    """Seconds between DB polls when the PG queue is idle (no pending jobs)."""

    queue_heartbeat_interval_seconds: float = Field(
        default=30.0,
        validation_alias=AliasChoices("QUEUE_HEARTBEAT_INTERVAL_SECONDS"),
    )
    """Seconds between heartbeat UPDATEs while a job is running."""

    queue_orphan_recovery_interval_seconds: float = Field(
        default=60.0,
        validation_alias=AliasChoices("QUEUE_ORPHAN_RECOVERY_INTERVAL_SECONDS"),
    )
    """Seconds between orphan-recovery sweeps."""

    queue_cleanup_older_than_seconds: int = Field(
        default=1800,
        validation_alias=AliasChoices("QUEUE_CLEANUP_OLDER_THAN_SECONDS"),
    )
    """Delete completed/failed job rows older than this many seconds (default 30 min)."""


settings = Settings()
