# AlgoQuest — Operational Readiness & Observability Runbook

This guide covers operational readiness, error tracking, observability, alerting thresholds, and failure recovery across the AlgoQuest FastAPI backend, PostgreSQL durable queue, and external Judge0 execution services.

---

## 1. Observability Architecture

### 1.1 Distributed Tracing & Request Correlation
- Every incoming HTTP request is assigned a unique correlation ID by `RequestLoggingMiddleware` (`app/utils/logging.py`).
- If an `X-Request-ID` header is supplied by client or reverse proxy, it is sanitized (alphanumeric and hyphens only, max 64 chars); otherwise, a random ID (`req_<uuid4_hex[:12]>`) is generated.
- The `request_id` is propagated:
  - Into async context variable `request_id_ctx`.
  - Into the response header `X-Request-ID`.
  - Into all log records via `RedactingFilter`.
  - Into background queue jobs and execution records.

### 1.2 Structured JSON Logging
- Production logging format is controlled via `LOG_FORMAT=json` (default in production).
- Output is single-line JSON parseable by Render log streams, Datadog, AWS CloudWatch, or Google Cloud Logging:
  ```json
  {
    "timestamp": "2026-10-13T12:00:00.000000Z",
    "level": "INFO",
    "logger": "algoquest.request",
    "message": "POST /api/submissions 202 23.40ms [req=req_a1b2c3d4e5f6]",
    "request_id": "req_a1b2c3d4e5f6",
    "job_id": "550e8400-e29b-41d4-a716-446655440000",
    "event": "REQUEST_COMPLETED",
    "method": "POST",
    "path": "/api/submissions",
    "status_code": 202,
    "duration_ms": 23.40
  }
  ```

### 1.3 Sensitive Data Scrubbing
- `RedactingFilter` automatically intercepts every log message and arguments:
  - PostgreSQL / Supabase connection strings: `://user:[REDACTED]@host:port`
  - Firebase JWT tokens: `[REDACTED_JWT]`
  - Authorization headers: `Bearer [REDACTED]`
  - Key-value credentials (`password=`, `token=`, `api_key=`, `secret=`): `[REDACTED]`
- Database errors caught by `sanitize_db_error` strip raw statements and schema parameters before writing to logs or error responses.

---

## 2. Health & Readiness Probes

### 2.1 Liveness Probe (`GET /health`)
- Lightweight HTTP 200 endpoint confirming the uvicorn process is listening.
- Used by Render container orchestrator for zero-downtime deployment health validation.
- Output:
  ```json
  {
    "status": "ok",
    "service": "algoquest-api",
    "environment": "production"
  }
  ```

### 2.2 Deep Readiness Probe (`GET /health/ready`)
- Probes core service dependencies before routing traffic:
  1. **Database Connectivity**: Executes active `SELECT 1` on Supabase PostgreSQL or Firestore ping.
  2. **Hidden Test Cases Dataset**: Verifies that the private test dataset is loaded or sample-only mode is active.
  3. **Async Submission Queue**: Verifies that worker tasks are running and queue is operational.
- Status Codes:
  - **HTTP 200 OK**: All subsystems operational (`status: "ready"`).
  - **HTTP 503 Service Unavailable**: Database disconnected, test dataset missing, or queue degraded (`status: "degraded"`).
- Output:
  ```json
  {
    "status": "ready",
    "service": "algoquest-api",
    "environment": "production",
    "database": {
      "backend": "supabase",
      "status": "connected"
    },
    "hidden_tests": {
      "status": "loaded"
    },
    "submission_queue": {
      "status": "healthy",
      "active_workers": 2,
      "queue_size": 3,
      "mode": "pg"
    }
  }
  ```

---

## 3. Operational Queue Health & Alerting

### 3.1 Key Metrics to Monitor
| Metric | Healthy Range | Warning Threshold | Critical Alert | Action |
| :--- | :--- | :--- | :--- | :--- |
| **Active Queue Depth** | 0 – 20 jobs | > 50 jobs | > 100 jobs (Backpressure 503) | Scale submission workers (`SUBMISSION_WORKERS=4`) |
| **Worker Lease Expiry** | 0 recovered/min | > 5 recovered/min | > 20 recovered/min | Check Judge0 execution latency or worker crash logs |
| **Dead-Lettered Jobs** | 0/hour | > 3/hour | > 10/hour | Inspect `QueueJob.error_message` in PostgreSQL |
| **API Error Rate (5xx)** | < 0.1% | > 1% | > 5% | Check `/health/ready` probe output |
| **Judge0 Latency** | < 2.0s | > 8.0s | > 20.0s | Check RapidAPI status page or quota limits |

### 3.2 Backpressure Behavior
- When active queue jobs reach `SUBMISSION_QUEUE_MAX_SIZE` (default 100):
  - New submissions are immediately rejected with `HTTP 503 Service Unavailable`.
  - Response header includes `Retry-After: 5`.
  - Prevents unbounded memory growth and worker task starvation.

---

## 4. External Error Tracking Setup (Sentry Runbook)

To enable cloud error tracking with Sentry:

### Step 1: Install Sentry SDK
Add `sentry-sdk[fastapi]>=2.0.0` to `backend/requirements.txt`:
```bash
pip install sentry-sdk
```

### Step 2: Configure Environment Variable
In your Render Dashboard (or `.env` locally):
```env
SENTRY_DSN=https://<public_key>@o<org_id>.ingest.sentry.io/<project_id>
```

### Step 3: Initialization Configuration
The application automatically binds Sentry when `SENTRY_DSN` is present in `app/main.py`:
```python
if os.environ.get("SENTRY_DSN"):
    import sentry_sdk
    sentry_sdk.init(
        dsn=os.environ["SENTRY_DSN"],
        environment=settings.app_env,
        traces_sample_rate=0.1,  # 10% performance tracing
        send_default_pii=False,  # Never transmit user emails/passwords
    )
```

---

## 5. Incident Recovery Procedures

### 5.1 Database Disconnect / Pool Exhaustion
1. Probe `/health/ready` to verify `database.status == "error"`.
2. Inspect Render logs for `[HEALTH_CHECK] PostgreSQL connectivity probe failed`.
3. Check Supabase connection limits (free tier pooler limit = 15 connections).
4. Restart application container if pool is wedged.

### 5.2 Judge0 Quota Exhaustion / 429
1. When Judge0 returns 429 or RapidAPI limits are reached:
   - Worker logs: `[Judge0] Quota or rate limit exceeded`.
   - Affected jobs transition to retry state (`retries < max_retries`).
2. Action:
   - Upgrade RapidAPI plan tier or switch `JUDGE0_USE_RAPIDAPI=false` to use public endpoint temporarily.
