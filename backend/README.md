# AlgoQuest — FastAPI Backend

Full-stack backend for AlgoQuest DSA practice platform.

## Architecture

```
Browser (Vanilla JS)
      │ HTTPS + Bearer <Firebase ID Token>
      ▼
FastAPI Backend  ← this service
      │
      ├── Firebase Admin SDK → Firestore
      └── httpx async client → Judge0 CE API
```

## Quick Start (Local Development)

### 1. Prerequisites

- Python 3.11+
- Node.js (for the extraction script)
- A Firebase project with Firestore enabled
- A Judge0 CE API key (RapidAPI) or use the public endpoint

### 2. Extract test case data (one-time)

Run from the **project root** (not the backend folder):

```bash
node backend/scripts/extract_test_data.js
```

This generates `backend/data/test_cases.json` with all 174 questions' test cases.
Hidden test `stdin` and `expectedRaw` are extracted here — they are never sent to the browser.

### 3. Set up environment

```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

Required `.env` values:

| Variable | Description |
|---|---|
| `JUDGE0_API_KEY` | RapidAPI key for Judge0 CE |
| `JUDGE0_USE_RAPIDAPI` | `true` (RapidAPI) or `false` (public endpoint) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Absolute path to Firebase service account JSON |
| `FIREBASE_PROJECT_ID` | Firebase project ID (e.g. `algoquest-9aab0`) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins |

### 4. Get Firebase service account

1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file somewhere safe (e.g. `~/algoquest-service-account.json`)
4. Set `GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/that/file.json` in `.env`

### 5. Install and run

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 6. Verify

Open http://localhost:8000/health → should return `{"status": "ok"}`

Open http://localhost:8000/docs → interactive Swagger UI with all endpoints

## API Documentation

The `/docs` endpoint provides an interactive Swagger UI that documents all endpoints.
Useful for testing and interview demonstrations.

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/submissions` | Submit code — runs on Judge0, compares outputs, returns verdict |
| `GET` | `/api/progress` | Get all solved/rev1/rev2 for user |
| `PUT` | `/api/progress/{qid}` | Update progress flags for one question |
| `GET` | `/api/bookmarks` | Get all bookmarked question IDs |
| `PUT` | `/api/bookmarks/{qid}` | Add bookmark |
| `DELETE` | `/api/bookmarks/{qid}` | Remove bookmark |
| `GET` | `/api/notes/{qid}` | Get note for a question |
| `PUT` | `/api/notes/{qid}` | Save note |
| `GET` | `/api/editor/{qid}` | Get saved editor code |
| `PUT` | `/api/editor/{qid}` | Save editor code |
| `GET` | `/api/general-compiler/{lang}` | Get general compiler code |
| `PUT` | `/api/general-compiler/{lang}` | Save general compiler code |
| `GET` | `/api/user/all` | Bulk load all user data (called on login) |
| `GET` | `/health` | Health check (no auth) |

All `/api/*` endpoints require: `Authorization: Bearer <Firebase ID Token>`

## Authentication

Firebase Auth remains on the **frontend** (login/signup/Google OAuth).

The backend **verifies** ID tokens:
1. Frontend: `await firebase.auth().currentUser.getIdToken()` → `token`
2. Request header: `Authorization: Bearer <token>`
3. Backend: `firebase_admin.auth.verify_id_token(token)` → `uid`
4. UID used for all Firestore paths — never trusted from client input

## Hidden Test Case Protection

Hidden test cases (stdin + expected outputs) are stored in `backend/data/test_cases.json`.
This file is **never served to the browser**.

When a user submits:
1. Backend loads hidden tests from `test_cases.json`
2. Constructs combined stdin server-side
3. Sends to Judge0
4. Compares outputs server-side
5. Returns: `passed: true/false` + user's actual output (but NOT the expected answer)

## Deployment (Docker)

```bash
# Build image
docker build -t algoquest-backend .

# Run
docker run -p 8000:8000 \
  -e JUDGE0_API_KEY=your_key \
  -e GOOGLE_APPLICATION_CREDENTIALS=/secrets/sa.json \
  -v /path/to/sa.json:/secrets/sa.json:ro \
  algoquest-backend
```

## Frontend Connection

In `index.html`, set the backend URL:

```html
<script>window.ALGOQUEST_BACKEND_URL = 'https://your-backend.com';</script>
```

For local development, the default is `http://localhost:8000`.

## Security Notes

- Judge0 API key: stored in `.env`, never in the browser
- Firebase UID: derived from verified token, never from client input  
- Hidden test cases: stored server-side only
- CORS: restricted to specific origins via `ALLOWED_ORIGINS`
- Pydantic validation: all inputs validated before processing
- `.env` and `serviceAccount.json` are in `.gitignore`
