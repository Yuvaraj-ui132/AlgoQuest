# AlgoQuest

> A full-stack, placement-focused DSA practice platform with in-browser code execution, asynchronous submission processing, real-time Firestore synchronization, and detailed performance analytics.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.109+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_%26_Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)

---

## 📌 Overview

**AlgoQuest** is a comprehensive DSA (Data Structures & Algorithms) preparation platform designed to streamline interview practice into a single unified workspace. Instead of context-switching between problem sheets, code editors, and tracking spreadsheets, AlgoQuest combines a curated bank of **174 coding problems**, a **Monaco-powered IDE**, **Judge0 multi-language execution**, and **real-time progress sync**.

The platform is architected as a decoupled full-stack application: a lightweight Vanilla JS Single Page Application (SPA) on the frontend backed by a high-performance **FastAPI** backend that manages asynchronous submission queues, Judge0 remote code execution, server-side hidden test verification, and per-user data isolation via Firebase ID tokens.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend (Local Browser)"]
        UI[AlgoQuest SPA - Vanilla JS]
        Monaco[Monaco Code Editor]
        Auth[Firebase Client Auth]
    end

    subgraph Backend["FastAPI Backend Service"]
        API[FastAPI Router & Security]
        AuthCheck[Firebase ID Token Verifier]
        RateLimit[In-Memory Rate Limiter]
        Queue[asyncio.Queue Submission Queue]
        Worker[Background Submission Worker]
    end

    subgraph External["Cloud & Execution Services"]
        Judge0[Judge0 CE API]
        Firestore[(Cloud Firestore)]
    end

    UI -->|1. Authenticate| Auth
    UI -->|2. Synchronous Run| API
    UI -->|3. Asynchronous Submit| API

    API --> AuthCheck
    AuthCheck --> RateLimit
    
    API -->|Run: Immediate Sample Test Execution| Judge0
    RateLimit -->|Submit: Enqueue Job & Return HTTP 202| Queue
    
    Queue --> Worker
    Worker -->|Fetch Hidden Tests & Execute| Judge0
    Worker -->|Write Submission Record & Update Solved| Firestore
    
    UI -->|4. Poll Job Status /api/submissions/jobs/{id}| API
    API -->|Read User Progress & History| Firestore
```

---

## ✨ Features

- **Curated Problem Bank**: 174 algorithmic problems categorized across Core and Advanced topics (Arrays, Two Pointers, Trees, Graphs, Dynamic Programming, and more).
- **Professional Code Workspace**: Embedded Microsoft Monaco Editor with multi-language support (**C++17, Java 17, Python 3, JavaScript ES6**), syntax highlighting, and customizable keybindings.
- **Dual Execution Engine**:
  - **Run Code (Synchronous)**: Executes user code against visible sample test cases with instant stdin/stdout feedback.
  - **Submit Solution (Asynchronous)**: Validates against full hidden test suites via an `asyncio.Queue` worker queue returning HTTP 202 with non-blocking client polling.
- **Hidden Test Case Protection**: Hidden test inputs and expected outputs are stored strictly server-side and never exposed to the client.
- **Submission History & Analytics**: Tracks execution runtime, memory consumption, language breakdowns, success rates, and verdict histories.
- **Authentication & Security**: Email/password and Google OAuth via Firebase Authentication, with cryptographically verified JWT tokens and strict UID-isolated Firestore data models.
- **Per-User Rate Limiting**: Token-bucket rate limiting (10 submissions / 60 seconds) prevents API abuse.
- **Warm Graphite UI**: Modern developer workspace design with dark/light themes, zero blue accents, and responsive layout.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
|---|---|---|
| **Frontend** | HTML5, Vanilla CSS, JavaScript (ES6+) | Frameworkless SPA optimized for speed and low overhead |
| **Code Editor** | Monaco Editor CDN | Microsoft VS Code editing engine |
| **Backend** | FastAPI (Python 3.11) | Async REST API with Pydantic v2 validation |
| **Task Queue** | `asyncio.Queue` & Background Workers | Non-blocking in-memory job processing |
| **Code Execution** | Judge0 CE (RapidAPI) | Multi-language containerized compiler engine |
| **Database** | Google Cloud Firestore | NoSQL document database for user progress & history |
| **Authentication** | Firebase Admin SDK + Firebase Auth | Secure token verification and session management |
| **Containerization**| Docker | Production-ready container deployment |

---

## 📂 Project Structure

```
AlgoQuest/
├── index.html                   # Main application shell
├── css/
│   └── style.css                # Warm Graphite design system & layout styles
├── js/
│   ├── app.js                   # Application state controller & router
│   ├── api.js                   # Authenticated API client with token management
│   ├── compiler.js              # Monaco editor & code execution controller
│   ├── firebase.js              # Firebase auth lifecycle & sync management
│   ├── firebase-config.js       # Firebase client SDK initialization
│   ├── history.js               # Submission history & analytics controller
│   └── question-metadata.js     # Question metadata bank
├── data/
│   ├── questions.json           # Problem statements & visible examples
│   └── tiers.json               # Difficulty tiers & topic categories
├── backend/
│   ├── app/
│   │   ├── config.py            # Environment configuration (Pydantic Settings)
│   │   ├── dependencies.py      # Auth & rate-limiting dependencies
│   │   ├── main.py              # FastAPI lifespan & route registration
│   │   ├── models/              # Pydantic request & response schemas
│   │   ├── routes/              # API route controllers (submissions, progress, user)
│   │   ├── services/            # Firestore, Judge0, and Async Queue services
│   │   └── utils/               # Security, error handling, and helpers
│   ├── data/
│   │   └── test_cases.json      # Server-side hidden test cases
│   ├── tests/                   # Pytest test suite (43 test cases)
│   ├── Dockerfile               # Container definition
│   └── requirements.txt         # Python dependencies
├── firebase.json                # Firebase Hosting & Firestore rules config
├── firestore.rules              # Cloud Firestore security rules
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js (v18+) or any static HTTP server
- A Firebase project with Firestore and Authentication enabled
- A Judge0 CE API key (via RapidAPI or self-hosted)

---

### 1. Clone Repository

```bash
git clone https://github.com/Yuvaraj-ui132/AlgoQuest.git
cd AlgoQuest
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your JUDGE0_API_KEY, FIREBASE_PROJECT_ID, and GOOGLE_APPLICATION_CREDENTIALS

# Run backend tests
python -m pytest tests/

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

FastAPI will start at `http://localhost:8000`.  
API Documentation (Swagger UI): `http://localhost:8000/docs`.

---

### 3. Frontend Setup

From the root directory:

```bash
# Start frontend local server
python -m http.server 5500
# or: npx http-server -p 5500
```

Open [http://localhost:5500](http://localhost:5500) in your browser.

---

## 🔐 Environment Variables

Create a `backend/.env` file based on `.env.example`:

| Variable | Description | Required |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID (e.g., `algoquest-9aab0`) | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Firebase Admin service account JSON | Yes |
| `JUDGE0_API_KEY` | RapidAPI key for Judge0 CE | Yes |
| `JUDGE0_USE_RAPIDAPI` | `true` to use RapidAPI, `false` for public endpoint | Yes |
| `ALLOWED_ORIGINS_STR` | Comma-separated CORS allowed origins | Yes |
| `SUBMISSION_WORKERS` | Number of concurrent background submission workers | No (Default: `1`) |

> **Security Note**: Never commit `.env` or service account keys. Both are secured via `.gitignore`.

---

## 🧪 Testing

The backend includes a comprehensive automated test suite covering authentication verification, submission queue execution, synchronous run flows, and per-user rate limiting:

```bash
python -m pytest backend/tests/
```

All 43 tests validate end-to-end functionality including mock Judge0 execution and Firestore transaction simulation.

---

## 🐳 Docker Deployment

Build and run the containerized backend:

```bash
# Build Docker image
docker build -t algoquest-backend -f backend/Dockerfile backend/

# Run container
docker run -p 8000:8000 \
  -e FIREBASE_PROJECT_ID=your-project-id \
  -e JUDGE0_API_KEY=your-rapidapi-key \
  -e GOOGLE_APPLICATION_CREDENTIALS=/secrets/serviceAccount.json \
  -v /path/to/serviceAccount.json:/secrets/serviceAccount.json:ro \
  algoquest-backend
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Yuvaraj Murkunde**  
- GitHub: [@Yuvaraj-ui132](https://github.com/Yuvaraj-ui132)
