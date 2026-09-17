"""
User initialization route.

POST /api/user/init  — idempotent user profile bootstrap.

Called by the frontend immediately after Firebase signup to ensure the
Firestore user document exists.  Safe to call multiple times (merge=True).

Authentication:
  UID is derived from the verified Firebase ID token.
  The client NEVER supplies the UID directly.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.dependencies import get_current_user
from app.models.requests import UserInitRequest
from app.models.responses import SuccessResponse
from app.services import firestore_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/user/init",
    response_model=SuccessResponse,
    status_code=status.HTTP_200_OK,
    summary="Initialize or reconcile the Firestore user document",
    description=(
        "Creates the user's Firestore profile document if it does not exist, "
        "or updates it if it does (idempotent — safe to call multiple times). "
        "Called by the frontend once after Firebase signup or on login to "
        "reconcile accounts that have a Firebase Auth record but no Firestore data.\\n\\n"
        "The UID is derived exclusively from the Firebase ID token — "
        "the client never supplies it directly."
    ),
)
async def init_user(
    body: UserInitRequest,
    uid: str = Depends(get_current_user),
) -> SuccessResponse:
    """
    Idempotent user initialization.

    Stage order (frontend is responsible for these):
      1. Firebase createUserWithEmailAndPassword   (client)
      2. user.updateProfile({displayName})         (client)
      3. POST /api/user/init                       ← this endpoint
         → backend verifies token, gets UID, writes Firestore

    If this endpoint is called for a user whose doc already exists,
    it merges the provided fields — it will NOT overwrite existing data.
    """
    try:
        created = firestore_service.init_user_document(
            uid=uid,
            name=body.name,
            email=body.email,
            photo_url=body.photo_url,
        )
        action = "created" if created else "already exists (reconciled)"
        logger.info("[user/init] uid=%s — user document %s", uid, action)
        return SuccessResponse(
            ok=True,
            message=f"User profile {action}.",
        )
    except Exception as exc:
        logger.error("[user/init] uid=%s — FAILED: %s", uid, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize user profile: {exc}",
        )

