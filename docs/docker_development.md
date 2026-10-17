# AlgoQuest — Docker Compose Local Development Environment

This guide explains how to run the AlgoQuest backend and PostgreSQL database locally using Docker Compose.

---

## 1. Architecture Overview

The local Docker development stack consists of two isolated services running on a shared bridge network (`algoquest-net`):

1. **`db` (PostgreSQL 16 Alpine)**:
   - Persists data to a named Docker volume (`algoquest_postgres_data`).
   - Automatically bootstraps migrations on first startup by mounting `./backend/migrations` into `/docker-entrypoint-initdb.d` in versioned order (`V1__initial_schema.sql`, `V2__durable_queue.sql`, `V3__indexing_and_query_optimization.sql`).
   - Exposes port `5432` for external psql / IDE connection.
   - Includes container health check using `pg_isready`.

2. **`api` (FastAPI Python 3.11 Backend)**:
   - Builds from `Dockerfile` or `backend/Dockerfile`.
   - Runs securely as an unprivileged, non-root user (`appuser`, UID/GID 1001).
   - Depends on `db` being healthy before starting.
   - Connects to PostgreSQL using internal DNS `db:5432`.
   - Mounts `./backend/app` and `./backend/data` for live code updates during development.
   - Exposes port `8000`.
   - Probes `/health` for container liveness.

---

## 2. Prerequisites

- Docker Engine 24+ and Docker Compose v2+ (e.g., Docker Desktop on Windows/macOS or Docker CE on Linux).
- Optional: Python 3.11+ for local CLI development outside Docker.

---

## 3. Quick Start

### Step 1: Copy Environment Template

```bash
cp .env.docker.example .env
```

Review `.env` and adjust passwords or port bindings if necessary:
- `POSTGRES_PORT=5432` (or e.g. `5433` if you already have a host PostgreSQL instance running).
- `BACKEND_PORT=8000`

### Step 2: Build and Start Services

```bash
docker compose up -d --build
```

### Step 3: Verify Status and Health

Check that all containers report healthy:

```bash
docker compose ps
```

You should see:
```text
NAME            IMAGE           COMMAND                  SERVICE   STATUS                    PORTS
algoquest-db    postgres:16     "docker-entrypoint.s…"   db        Up (healthy)              0.0.0.0:5432->5432/tcp
algoquest-api   algoquest-api   "uvicorn app.main:ap…"   api       Up (healthy)              0.0.0.0:8000->8000/tcp
```

### Step 4: Verify Health Endpoints

- **Liveness check**:
  ```bash
  curl http://localhost:8000/health
  # Expected: {"status":"ok","service":"algoquest-api","environment":"development"}
  ```

- **Readiness check**:
  ```bash
  curl http://localhost:8000/health/ready
  # Expected: {"status":"ready", "database":{"backend":"supabase","status":"connected"}, ...}
  ```

- **API Documentation**:
  Visit [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

---

## 4. Database Management & Migrations

### Access PostgreSQL Shell via Docker

```bash
docker compose exec db psql -U postgres -d algoquest_dev
```

### Check Applied Tables & Indexes

```sql
\dt
\d+ queue_jobs
\d+ submissions
```

### Apply a New Migration Manually

If you create `V4__new_feature.sql`, you can apply it directly to the running database:

```bash
docker compose exec -T db psql -U postgres -d algoquest_dev < backend/migrations/V4__new_feature.sql
```

---

## 5. Running Tests

### Running Tests in Local Virtual Environment against Docker PostgreSQL

If you have a local Python virtual environment activated:

```bash
cd backend
$env:SUPABASE_DB_URL="postgresql://postgres:postgres@localhost:5432/algoquest_dev"
$env:DATABASE_BACKEND="supabase"
$env:QUEUE_ENABLE_PG_BACKEND="true"
pytest tests/ -v
```

### Running Tests Inside the API Container

```bash
docker compose exec api pytest tests/ -v
```

---

## 6. External Service Configuration

### Firebase Authentication

By default, in `development` mode the server starts and allows public routes without requiring Firebase credentials.
To test authenticated routes:
1. Generate a Firebase Service Account key in the Firebase Console.
2. Either:
   - Provide the JSON string in `.env`:
     ```env
     FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
     ```
   - Or set `FIREBASE_PROJECT_ID=algoquest-9aab0`.

### Judge0 CE Code Execution

For real code execution:
1. Sign up on RapidAPI for the Judge0 CE API.
2. Put your RapidAPI key in `.env`:
   ```env
   JUDGE0_API_KEY=your_rapidapi_key_here
   JUDGE0_USE_RAPIDAPI=true
   ```
If omitted, local dev allows sample test evaluations when `ALLOW_SAMPLE_ONLY_GRADING=true`.

---

## 7. Shutdown and Cleanup

### Stop Services (Retaining Data)

```bash
docker compose down
```

The database volume `algoquest_postgres_data` is preserved.

### Stop and Wipe Database (Clean Reset)

```bash
docker compose down -v
```

This removes the persistent volume. The next `docker compose up -d` will reinitialize the database and reapply migrations `V1`, `V2`, and `V3` from scratch.

---

## 8. Troubleshooting

| Issue | Cause | Resolution |
| :--- | :--- | :--- |
| `port 5432 is already allocated` | Another PostgreSQL instance is running on the host | Set `POSTGRES_PORT=5433` in `.env` and restart |
| `port 8000 is already allocated` | Another process is listening on 8000 | Set `BACKEND_PORT=8080` in `.env` and restart |
| `db` container unhealthy | Corrupt volume or permission error | Run `docker compose down -v` and rebuild |
| `api` container degraded health | Database connection timeout | Check `docker compose logs db` for postgres crash logs |
| Missing migrations | Migrations only run automatically on empty volume | If volume already exists, apply migrations manually or reset with `-v` |
