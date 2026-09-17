"""
FastAPI dependency: verify Firebase ID token and extract authenticated UID.

Usage in any route:
    @router.get("/something")
    async def handler(uid: str = Depends(get_current_user)):
        ...
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import logging
import firebase_admin.auth as firebase_auth
from firebase_admin.exceptions import FirebaseError

logger = logging.getLogger("algoquest.auth")

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """
    Verify the Firebase ID token supplied as a Bearer token.

    Returns the authenticated Firebase UID on success.
    Raises HTTP 401 on missing or invalid token.

    The frontend obtains this token via:
        await firebase.auth().currentUser.getIdToken(true)

    The UID is derived server-side from the verified token.
    The client NEVER supplies the UID directly.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token. "
                   "Provide a Firebase ID token as: Authorization: Bearer <token>",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
        uid: str = decoded.get("uid")
        if not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload missing uid.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return uid
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Firebase ID token has expired. Please refresh your session.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except (firebase_auth.InvalidIdTokenError, firebase_auth.RevokedIdTokenError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or revoked Firebase ID token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.CertificateFetchError as exc:
        logger.error("Failed to fetch Firebase public key certificates: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable (public key certificate fetch failed).",
        )
    except Exception as exc:
        logger.error("Unexpected error during Firebase ID token verification: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token verification service error: {exc}",
        )

