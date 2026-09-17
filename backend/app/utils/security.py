"""
Firebase Admin SDK initialization and ID token verification.
"""

import logging
import os
import firebase_admin
from firebase_admin import credentials, auth
from app.config import settings

logger = logging.getLogger("algoquest.security")

_firebase_initialized = False


def initialize_firebase() -> None:
    """
    Initialize the Firebase Admin SDK with explicit project ID and credentials.

    Called once at application startup (via lifespan context manager in main.py).

    Resolution:
      1. Project ID: from settings.firebase_project_id, FIREBASE_PROJECT_ID env, or 'algoquest-9aab0'
      2. Service account JSON: from settings.google_application_credentials or GOOGLE_APPLICATION_CREDENTIALS
      3. Fallback: Application Default Credentials (ADC) with explicit projectId options
    """
    global _firebase_initialized
    if _firebase_initialized or firebase_admin._apps:
        return

    project_id = (
        settings.firebase_project_id
        or os.environ.get("FIREBASE_PROJECT_ID")
        or "algoquest-9aab0"
    ).strip()

    creds_path = (
        settings.google_application_credentials
        or os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "")
    ).strip()

    # Populate environment variables for Google client libraries & Firestore
    if project_id:
        os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
        os.environ["GCLOUD_PROJECT"] = project_id
        os.environ["FIREBASE_PROJECT_ID"] = project_id
    if creds_path:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = creds_path

    options = {}
    if project_id:
        options["projectId"] = project_id

    if creds_path and os.path.isfile(creds_path):
        logger.info(
            "Initializing Firebase Admin with service account certificate: %s (projectId: %s)",
            creds_path,
            project_id,
        )
        cred = credentials.Certificate(creds_path)
        firebase_admin.initialize_app(cred, options=options)
    else:
        logger.info(
            "Initializing Firebase Admin with default credentials and explicit projectId: %s",
            project_id,
        )
        firebase_admin.initialize_app(options=options)

    _firebase_initialized = True

