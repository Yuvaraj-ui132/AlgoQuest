"""
Firestore Emulator Security Rules Test Suite
Tests `firestore.rules.proposed` using the local Firestore Emulator.

Verifies:
1. Root user profile: legitimate create, update, and read by document owner.
2. Cross-user access: strictly blocked (403 PERMISSION_DENIED).
3. Field whitelisting & validation: unauthorized fields (e.g. 'role', 'admin') or bad types rejected.
4. Immutable identity: uid cannot be changed via update.
5. Deletion prevention: clients cannot delete profiles.
6. Direct subcollection access blocked: progress, submissions, bookmarks, notes, etc.
7. Default-deny on unmapped collections.
"""

import os
import sys
import json
import base64
import time
import shutil
import urllib.request
import urllib.error
import subprocess
from pathlib import Path
import pytest

EMULATOR_JAR = Path(os.path.expanduser("~/.cache/firebase/emulators/cloud-firestore-emulator-v1.19.7.jar"))
RULES_FILE = Path(__file__).resolve().parents[2] / "firestore.rules.proposed"
EMULATOR_PORT = 8089
PROJECT_ID = "algoquest-security-test"
BASE_URL = f"http://127.0.0.1:{EMULATOR_PORT}/v1/projects/{PROJECT_ID}/databases/(default)/documents"


def is_emulator_available():
    """Check if Java and the Firestore emulator jar are installed."""
    if not shutil.which("java"):
        return False
    if not EMULATOR_JAR.is_file():
        return False
    if not RULES_FILE.is_file():
        return False
    return True


@pytest.fixture(scope="module")
def emulator_server():
    """Launch the Firestore emulator with proposed rules, yield, and terminate cleanly."""
    if not is_emulator_available():
        pytest.skip("Java or Cloud Firestore Emulator jar v1.19.7 not available")

    proc = subprocess.Popen(
        [
            "java",
            "-jar",
            str(EMULATOR_JAR),
            "--host",
            "127.0.0.1",
            "--port",
            str(EMULATOR_PORT),
            "--rules",
            str(RULES_FILE),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    # Poll until emulator responds
    ready = False
    for _ in range(30):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{EMULATOR_PORT}/", timeout=1) as resp:
                if resp.status == 200:
                    ready = True
                    break
        except Exception:
            time.sleep(0.3)

    if not ready:
        proc.terminate()
        pytest.fail("Firestore emulator failed to start within 10 seconds")

    yield BASE_URL

    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


def make_mock_jwt(uid: str) -> str:
    """Create an unsigned mock JWT accepted by the Firestore emulator."""
    header = base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').decode().rstrip("=")
    claims = {
        "user_id": uid,
        "sub": uid,
        "aud": PROJECT_ID,
        "iss": f"https://securetoken.google.com/{PROJECT_ID}",
    }
    payload = base64.urlsafe_b64encode(json.dumps(claims).encode()).decode().rstrip("=")
    return f"{header}.{payload}."


def firestore_request(
    url: str,
    method: str = "GET",
    data: dict = None,
    uid: str = None,
):
    """Execute an HTTP request to the Firestore emulator REST API."""
    headers = {"Content-Type": "application/json"}
    if uid is not None:
        token = make_mock_jwt(uid)
        headers["Authorization"] = f"Bearer {token}"

    encoded_data = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=encoded_data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"raw": body}
        return e.code, parsed


# ── TEST CASES ───────────────────────────────────────────────────────────────

def test_unauthenticated_read_denied(emulator_server):
    status, _ = firestore_request(f"{emulator_server}/users/user_alice")
    assert status == 403, f"Expected 403 for unauth read, got {status}"


def test_unauthenticated_create_denied(emulator_server):
    doc = {
        "fields": {
            "uid": {"stringValue": "user_alice"},
            "email": {"stringValue": "alice@algoquest.dev"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users?documentId=user_alice",
        method="POST",
        data=doc,
    )
    assert status == 403, f"Expected 403 for unauth create, got {status}"


def test_owner_create_profile_allowed(emulator_server):
    doc = {
        "fields": {
            "uid": {"stringValue": "user_alice"},
            "email": {"stringValue": "alice@algoquest.dev"},
            "name": {"stringValue": "Alice Developer"},
            "photoURL": {"stringValue": "https://example.com/avatar.png"},
            "createdAt": {"timestampValue": "2026-10-09T00:00:00Z"},
            "lastLogin": {"timestampValue": "2026-10-09T00:00:00Z"},
            "migrated": {"booleanValue": True},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users?documentId=user_alice",
        method="POST",
        data=doc,
        uid="user_alice",
    )
    assert status == 200, f"Expected 200 for valid owner create, got {status}"


def test_owner_read_profile_allowed(emulator_server):
    status, data = firestore_request(
        f"{emulator_server}/users/user_alice",
        uid="user_alice",
    )
    assert status == 200, f"Expected 200 for owner read, got {status}"
    assert data["fields"]["uid"]["stringValue"] == "user_alice"


def test_cross_user_read_profile_denied(emulator_server):
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice",
        uid="user_eve",
    )
    assert status == 403, f"Expected 403 for cross-user read, got {status}"


def test_cross_user_create_denied(emulator_server):
    doc = {
        "fields": {
            "uid": {"stringValue": "user_bob"},
            "email": {"stringValue": "bob@algoquest.dev"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users?documentId=user_bob",
        method="POST",
        data=doc,
        uid="user_eve",  # Eve trying to create Bob's doc
    )
    assert status == 403, f"Expected 403 for cross-user create, got {status}"


def test_create_with_unauthorized_field_denied(emulator_server):
    doc = {
        "fields": {
            "uid": {"stringValue": "user_charlie"},
            "email": {"stringValue": "charlie@algoquest.dev"},
            "role": {"stringValue": "admin"},  # Unauthorized field
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users?documentId=user_charlie",
        method="POST",
        data=doc,
        uid="user_charlie",
    )
    assert status == 403, f"Expected 403 for profile with extra fields, got {status}"


def test_create_with_mismatched_uid_denied(emulator_server):
    doc = {
        "fields": {
            "uid": {"stringValue": "user_different"},
            "email": {"stringValue": "charlie@algoquest.dev"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users?documentId=user_charlie",
        method="POST",
        data=doc,
        uid="user_charlie",
    )
    assert status == 403, f"Expected 403 for mismatched uid in payload, got {status}"


def test_create_without_required_email_denied(emulator_server):
    doc = {
        "fields": {
            "uid": {"stringValue": "user_no_email"},
            "name": {"stringValue": "No Email"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users?documentId=user_no_email",
        method="POST",
        data=doc,
        uid="user_no_email",
    )
    assert status == 403, f"Expected 403 for create without email, got {status}"


def test_owner_update_profile_allowed(emulator_server):
    update_doc = {
        "fields": {
            "name": {"stringValue": "Alice Updated"},
            "lastLogin": {"timestampValue": "2026-10-09T02:00:00Z"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice?updateMask.fieldPaths=name&updateMask.fieldPaths=lastLogin",
        method="PATCH",
        data=update_doc,
        uid="user_alice",
    )
    assert status == 200, f"Expected 200 for legitimate owner update, got {status}"


def test_owner_update_last_login_only_allowed(emulator_server):
    """Verifies legitimate frontend background lastLogin update."""
    update_doc = {
        "fields": {
            "lastLogin": {"timestampValue": "2026-10-09T03:00:00Z"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice?updateMask.fieldPaths=lastLogin",
        method="PATCH",
        data=update_doc,
        uid="user_alice",
    )
    assert status == 200, f"Expected 200 for lastLogin update, got {status}"


def test_owner_update_photo_url_allowed(emulator_server):
    """Verifies legitimate frontend photoURL update."""
    update_doc = {
        "fields": {
            "photoURL": {"stringValue": "https://example.com/new_avatar.png"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice?updateMask.fieldPaths=photoURL",
        method="PATCH",
        data=update_doc,
        uid="user_alice",
    )
    assert status == 200, f"Expected 200 for photoURL update, got {status}"


def test_owner_update_mutate_uid_denied(emulator_server):
    """Attempting to mutate immutable uid alone must be rejected."""
    update_doc = {
        "fields": {
            "uid": {"stringValue": "user_hacked"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice?updateMask.fieldPaths=uid",
        method="PATCH",
        data=update_doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for mutating immutable uid, got {status}"


def test_owner_update_mutate_created_at_denied(emulator_server):
    """Attempting to mutate protected createdAt alone must be rejected."""
    update_doc = {
        "fields": {
            "createdAt": {"timestampValue": "2020-01-01T00:00:00Z"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice?updateMask.fieldPaths=createdAt",
        method="PATCH",
        data=update_doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for mutating protected createdAt, got {status}"


def test_owner_update_mutate_migrated_denied(emulator_server):
    """Attempting to mutate backend-controlled migrated flag alone must be rejected."""
    update_doc = {
        "fields": {
            "migrated": {"booleanValue": False},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice?updateMask.fieldPaths=migrated",
        method="PATCH",
        data=update_doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for mutating backend-controlled migrated flag, got {status}"


def test_owner_update_mutate_created_at_and_migrated_together_denied(emulator_server):
    """Attempting to mutate createdAt and migrated together must be rejected."""
    update_doc = {
        "fields": {
            "createdAt": {"timestampValue": "2021-01-01T00:00:00Z"},
            "migrated": {"booleanValue": False},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice?updateMask.fieldPaths=createdAt&updateMask.fieldPaths=migrated",
        method="PATCH",
        data=update_doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for mutating createdAt and migrated together, got {status}"


def test_owner_update_mutate_all_protected_fields_together_denied(emulator_server):
    """Attempting to mutate uid, createdAt, and migrated together must be rejected."""
    update_doc = {
        "fields": {
            "uid": {"stringValue": "user_hacked"},
            "createdAt": {"timestampValue": "2021-01-01T00:00:00Z"},
            "migrated": {"booleanValue": False},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice?updateMask.fieldPaths=uid&updateMask.fieldPaths=createdAt&updateMask.fieldPaths=migrated",
        method="PATCH",
        data=update_doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for mutating all protected fields together, got {status}"


def test_owner_update_mutate_protected_mixed_with_allowed_denied(emulator_server):
    """Attempting to smuggle a createdAt mutation inside a legitimate name update must be rejected."""
    update_doc = {
        "fields": {
            "name": {"stringValue": "Alice Smuggler"},
            "createdAt": {"timestampValue": "2021-01-01T00:00:00Z"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice?updateMask.fieldPaths=name&updateMask.fieldPaths=createdAt",
        method="PATCH",
        data=update_doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for smuggling protected field mutation, got {status}"


def test_google_signin_profile_create_allowed(emulator_server):
    """Verifies legitimate Google sign-in new user profile creation."""
    doc = {
        "fields": {
            "uid": {"stringValue": "user_google_new"},
            "name": {"stringValue": "Google User"},
            "email": {"stringValue": "google.user@example.com"},
            "photoURL": {"stringValue": "https://lh3.googleusercontent.com/photo.jpg"},
            "createdAt": {"timestampValue": "2026-10-09T10:00:00Z"},
            "lastLogin": {"timestampValue": "2026-10-09T10:00:00Z"},
            "migrated": {"booleanValue": True},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users?documentId=user_google_new",
        method="POST",
        data=doc,
        uid="user_google_new",
    )
    assert status == 200, f"Expected 200 for Google sign-in profile bootstrap, got {status}"


def test_cross_user_update_denied(emulator_server):
    update_doc = {
        "fields": {
            "uid": {"stringValue": "user_alice"},
            "name": {"stringValue": "Alice Defaced By Eve"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice?updateMask.fieldPaths=name",
        method="PATCH",
        data=update_doc,
        uid="user_eve",
    )
    assert status == 403, f"Expected 403 for cross-user update, got {status}"


def test_owner_delete_profile_denied(emulator_server):
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice",
        method="DELETE",
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for profile delete attempt, got {status}"


def test_direct_write_progress_denied(emulator_server):
    doc = {
        "fields": {
            "solved": {"booleanValue": True},
            "solvedAt": {"timestampValue": "2026-10-09T00:00:00Z"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice/progress?documentId=two-sum",
        method="POST",
        data=doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for direct progress write, got {status}"


def test_direct_read_progress_denied(emulator_server):
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice/progress/two-sum",
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for direct progress read, got {status}"


def test_direct_write_submissions_denied(emulator_server):
    doc = {
        "fields": {
            "status": {"stringValue": "Accepted"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice/submissions?documentId=sub_101",
        method="POST",
        data=doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for direct submission write, got {status}"


def test_direct_read_submissions_denied(emulator_server):
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice/submissions/sub_101",
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for direct submission read, got {status}"


def test_direct_write_bookmarks_denied(emulator_server):
    doc = {
        "fields": {
            "bookmarked": {"booleanValue": True},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice/bookmarks?documentId=two-sum",
        method="POST",
        data=doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for direct bookmark write, got {status}"


def test_direct_write_notes_denied(emulator_server):
    doc = {
        "fields": {
            "content": {"stringValue": "hacked note"},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/users/user_alice/notes?documentId=two-sum",
        method="POST",
        data=doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for direct notes write, got {status}"


def test_direct_write_unmapped_collection_denied(emulator_server):
    doc = {
        "fields": {
            "injected": {"booleanValue": True},
        }
    }
    status, _ = firestore_request(
        f"{emulator_server}/system_configs?documentId=bad_doc",
        method="POST",
        data=doc,
        uid="user_alice",
    )
    assert status == 403, f"Expected 403 for unmapped collection write, got {status}"
