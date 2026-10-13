# AlgoQuest — OWASP Threat Review & Security Assessment

This document provides a threat model and architectural security assessment for the AlgoQuest backend and browser client, analyzing risks across the nine critical domains identified in the autonomous roadmap.

---

## 1. Broken Access Control & IDOR (Insecure Direct Object References)

- **Threat**: An authenticated user attempts to read, mutate, or delete another user's progress, notes, bookmarks, editor drafts, or submission history by supplying target user IDs or job identifiers.
- **Controls & Enforcement**:
  - The application completely forbids client-supplied user identifiers (`uid`) in route paths, query parameters, or request bodies.
  - Authenticated UID is exclusively derived server-side via `app.dependencies.get_current_user` from the cryptographically verified Firebase ID token.
  - Asynchronous submission polling (`GET /api/submissions/{job_id}`) verifies that `job.uid == authenticated_uid`. If a user attempts to poll another user's job, an explicit `PermissionError` is caught and returns `HTTP 403 Forbidden`.
  - Keyset history queries (`GET /api/submissions/history`) query strictly by `Submission.user_id == uid`. Cross-tenant record leakage is prevented at both the application and database query layer.
- **Residual Risks**: None identified in application logic. Multi-tenant partitioning verified by automated integration tests.

---

## 2. Authentication & Token Validation

- **Threat**: Forged, expired, revoked, or tampered JWT tokens used to execute privileged endpoints or access user data.
- **Controls & Enforcement**:
  - Firebase Admin SDK validates token signatures against Google's public key certificates (`https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com`).
  - Strict exception handling in `app/dependencies.py` differentiates:
    - `ExpiredIdTokenError` → `HTTP 401 Unauthorized` ("Firebase ID token has expired. Please refresh your session.")
    - `InvalidIdTokenError` / `RevokedIdTokenError` → `HTTP 401 Unauthorized`
    - `CertificateFetchError` → `HTTP 503 Service Unavailable`
  - Tokens missing the required `uid` claim fail closed with `HTTP 401 Unauthorized`.
- **Residual Risks**: Token replay if an ID token is stolen from client local storage before its 1-hour expiration. Client should ensure tokens are stored securely in memory or session storage.

---

## 3. Input Validation & Injection

- **Threat**: SQL injection, OS command injection, template injection, or malformed payloads causing server crashes or arbitrary code execution outside the sandbox.
- **Controls & Enforcement**:
  - **Pydantic Validation**: Strict Pydantic models validate all incoming request bodies (`SubmissionRequest`, `ProgressUpdateRequest`, `BatchSyncRequest`, `UserInitRequest`).
  - **Strict Field Boundaries**:
    - `question_id`: strictly constrained to integer `1 <= qid <= 10000`.
    - `language_id`: constrained to explicit whitelist `{50, 54, 62, 63, 71, 76}`.
    - `source_code`: bounded to `1 <= length <= 300,000` bytes.
    - `execution_type`: strictly validated via `Literal["run", "submit", "general"]` with Pydantic `model_validator` requiring `question_id` for DSA modes.
  - **SQL Injection Prevention**: SQLAlchemy parameterized queries and ORM objects are used exclusively. No raw string interpolation into SQL queries.
  - **String Sanitization**: `UserInitRequest` strips null bytes and ASCII control characters (`ord(ch) < 32`).
- **Residual Risks**: Low. Path parameters and request payloads are validated prior to execution.

---

## 4. Rate Limiting & Resource Exhaustion

- **Threat**: High-frequency submission flooding draining backend worker pools, overloading Judge0 external quotas, or causing memory exhaustion.
- **Controls & Enforcement**:
  - **In-Memory Rolling Window Limiter**: Enforces a maximum of 10 submissions per 60 seconds per user (`RATE_LIMIT_MAX = 10`, `RATE_WINDOW_SECONDS = 60`).
  - **Early Rejection**: Rate limiting triggers before queue insertion, returning `HTTP 429 Too Many Requests` with `Retry-After: 60`.
  - **Periodic Garbage Collection**: The rate limiting store automatically prunes inactive UIDs once store size exceeds 500 entries to prevent memory leaks.
  - **Queue Backpressure**: When active jobs exceed `SUBMISSION_QUEUE_MAX_SIZE` (default 100), the backend fails fast with `HTTP 503 Service Unavailable` and `Retry-After: 5`.
- **Residual Risks**: Distributed unauthenticated rate limiting requires a reverse proxy (e.g., Cloudflare or Render edge rate limiting) to protect public health check and catalogue read endpoints against high-volume DDoS.

---

## 5. Secret Exposure & Sensitive Logging

- **Threat**: Accidental leakage of Firebase private keys, database passwords, Judge0 RapidAPI tokens, or private test cases in application logs, error responses, or Git repositories.
- **Controls & Enforcement**:
  - **Log Redacting Filter**: `SensitiveDataFilter` in `app/utils/logging.py` scrubs sensitive key patterns (`private_key`, `password`, `token`, `secret`, `bearer`, `api_key`) and replaces them with `[REDACTED]`.
  - **Database Error Sanitization**: `sanitize_db_error()` in `app/utils/errors.py` intercepts SQLAlchemy/psycopg errors, strips raw SQL statements, usernames, and connection strings, and logs only normalized error codes.
  - **Transient Source Scrubbing**: Worker clears `QueueJob.source_code = ""` immediately upon job completion or dead-lettering.
  - **Hidden Test Case Isolation**: Hidden test inputs and expected outputs are never cached on the client, never returned in API payloads, and omitted from `TestCaseResult` responses.
  - **CI & Docker Safeguards**: Git index is scanned for secrets via automated CI checks. `.dockerignore` blocks `.env` and credential files.
- **Residual Risks**: None identified in checked code.

---

## 6. CORS & Defensive Security Headers

- **Threat**: Cross-site request forgery, clickjacking, MIME sniffing, and insecure origin access.
- **Controls & Enforcement**:
  - **CORS Middleware**: Explicit origin whitelist (`settings.allowed_origins`) restricts API access to known frontend origins (`https://algoquest-9aab0.web.app`, `https://algoquest-9aab0.firebaseapp.com`, and local dev hosts).
  - **Defensive Headers (`SecurityHeadersMiddleware`)**:
    - `X-Content-Type-Options: nosniff` (blocks MIME confusion attacks).
    - `X-Frame-Options: DENY` (prevents framing and clickjacking).
    - `Referrer-Policy: strict-origin-when-cross-origin` (prevents path and token leakage in referrers).
    - `Permissions-Policy: geolocation=(), camera=(), microphone=()` (disables unnecessary browser APIs).
- **Residual Risks**: None.

---

## 7. Database Permissions & Tenant Isolation

- **Threat**: Cross-tenant data tampering or privilege escalation on the Supabase PostgreSQL cluster.
- **Controls & Enforcement**:
  - Schema migrations enforce composite `UNIQUE (user_id, question_id)` constraints on `user_progress`, `user_bookmarks`, `user_notes`, `user_editor_drafts`, and `user_compiler_drafts`.
  - Foreign key constraints reference `users(id) ON DELETE CASCADE`.
  - All database queries filter strictly by verified `user_id`.
  - Concurrency safety: Worker job claiming uses `FOR UPDATE SKIP LOCKED` to prevent duplicate execution across workers.
- **Residual Risks**: Production database connection strings should use a dedicated application role with `SELECT`, `INSERT`, `UPDATE`, `DELETE` grants, rather than a superuser role.

---

## 8. Submission Abuse & External Execution Risks

- **Threat**: User code escaping sandbox containers, performing network requests, consuming unbounded CPU/RAM, or tampering with grading harnesses.
- **Controls & Enforcement**:
  - **Isolated Container Execution**: Judge0 CE executes untrusted code in isolated cgroups/namespaces with strict resource limits (CPU time limit, memory limit, process count limit, network disabled).
  - **Cryptographic Session Nonces**: Anti-spoofing mechanism injects random execution nonces into stdout markers (`<<<AQ_BEGIN_TEST_...>>>`) preventing student code from faking passed test case delimiters.
  - **Code Cleansing**: `driver_generator.py` strips malicious compiler pragmas and wrappers before compilation.
- **Residual Risks**: Relies on Judge0 CE's container isolation (Isolate / nsjail) for kernel-level security.

---

## 9. Dependency Vulnerabilities

- **Threat**: Exploitable vulnerabilities in third-party Python packages or container base images.
- **Controls & Enforcement**:
  - `pip-audit` runs automatically in CI against `backend/requirements.txt` to detect known CVEs in the PyPI dependency tree.
  - Python base images use slim Debian releases (`python:3.11-slim`), minimizing extraneous installed binaries.
- **Residual Risks**: New CVEs disclosed after build. Periodic automated CI dependency scans maintain visibility.
