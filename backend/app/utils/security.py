"""
Firebase Admin SDK initialization and ID token verification.
"""

import json
import logging
import os
import firebase_admin
from firebase_admin import credentials, auth
from app.config import settings

logger = logging.getLogger("algoquest.security")

_firebase_initialized = False


def initialize_firebase() -> None:
    """
    Initialize the Firebase Admin SDK.

    Credential resolution order (first match wins):
      1. FIREBASE_SERVICE_ACCOUNT_JSON env var — full JSON string (Railway / cloud hosts).
      2. GOOGLE_APPLICATION_CREDENTIALS env var / settings field — path to JSON file (local dev).
      3. Application Default Credentials (ADC) — GCP-managed environments only.

    Called once at application startup via the lifespan context manager in main.py.
    Safe to call multiple times — returns immediately if already initialized.
    """
    global _firebase_initialized
    if _firebase_initialized or firebase_admin._apps:
        return

    project_id = (
        settings.firebase_project_id
        or os.environ.get("FIREBASE_PROJECT_ID")
        or "algoquest-9aab0"
    ).strip()

    # Propagate project ID for Firestore / Google Cloud client libraries.
    if project_id:
        os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
        os.environ["GCLOUD_PROJECT"] = project_id
        os.environ["FIREBASE_PROJECT_ID"] = project_id

    options: dict = {}
    if project_id:
        options["projectId"] = project_id

    # ── Priority 1: inline JSON env var (Railway / cloud deployments) ──────────
    # Set FIREBASE_SERVICE_ACCOUNT_JSON to the full contents of the service-account
    # JSON file as a single-line string in the Railway Variables dashboard.
    # This avoids the need to mount a credentials file into the container.
    sa_json_str = (settings.firebase_service_account_json or "").strip()
    if sa_json_str:
        try:
            sa_dict = json.loads(sa_json_str)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "FIREBASE_SERVICE_ACCOUNT_JSON is set but is not valid JSON. "
                "Paste the entire service-account JSON as a single line."
            ) from exc

        # Log only non-secret fields for diagnostics; never log private_key.
        logger.info(
            "Initializing Firebase Admin from FIREBASE_SERVICE_ACCOUNT_JSON "
            "(project_id=%s, client_email=%s)",
            sa_dict.get("project_id", "[unknown]"),
            sa_dict.get("client_email", "[unknown]"),
        )
        cred = credentials.Certificate(sa_dict)
        firebase_admin.initialize_app(cred, options=options)
        _firebase_initialized = True
        return

    # ── Priority 2: service-account file path (local development) ──────────────
    creds_path = (
        settings.google_application_credentials
        or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    ).strip()

    if creds_path:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path

    if creds_path and os.path.isfile(creds_path):
        logger.info(
            "Initializing Firebase Admin from service account file: %s (projectId: %s)",
            creds_path,
            project_id,
        )
        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred, options=options)
        _firebase_initialized = True
        return

    # ── Priority 3: Application Default Credentials (ADC) ──────────────────────
    # Works on GCP (Cloud Run, GKE, etc.) where a service account is attached.
    # Will fail on Railway unless FIREBASE_SERVICE_ACCOUNT_JSON is set.
    logger.info(
        "Initializing Firebase Admin with Application Default Credentials "
        "(projectId: %s). Set FIREBASE_SERVICE_ACCOUNT_JSON for cloud deployments.",
        project_id,
    )
    firebase_admin.initialize_app(options=options)
    _firebase_initialized = True
