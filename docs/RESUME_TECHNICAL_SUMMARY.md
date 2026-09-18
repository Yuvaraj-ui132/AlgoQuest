# AlgoQuest — Resume & Technical Interview Summary

> **Canonical Summary for Software Engineering Roles (Full-Stack / Backend / Systems)**  
> **Repository**: [Yuvaraj-ui132/AlgoQuest](https://github.com/Yuvaraj-ui132/AlgoQuest)  

---

## 1. Resume Project Descriptions

### A. 3-Line Resume Summary
> Engineered **AlgoQuest**, a full-stack algorithmic problem-solving platform featuring a curriculum of 174 curated DSA questions with multi-language code execution (C++, Java, Python, JS). Built an asynchronous backend pipeline in FastAPI using `asyncio.Queue` and background workers to evaluate code against hidden test suites via Judge0 CE while returning HTTP 202 status codes. Integrated Firebase Authentication and Google Cloud Firestore with server-side RS256 token verification, rolling-window rate limiting, and cursor-paginated submission telemetry.

---

### B. 4 High-Impact, Technically Defensible Resume Bullets
- **Asynchronous Execution Pipeline**: Architected an asynchronous submission pipeline in **FastAPI** leveraging Python's `asyncio.Queue` to decouple heavy multi-case code evaluation from HTTP lifecycles, returning `HTTP 202 Accepted` with client-side polling and achieving non-blocking execution under Judge0 API constraints.
- **Security & Multi-Tenant Isolation**: Enforced server-side **Firebase Admin SDK** token verification on all protected endpoints, extracting cryptographically validated UIDs to isolate user progress, notes, bookmarks, and draft code across 6 Firestore subcollections while preventing client UID spoofing.
- **Assessment Integrity & Hidden Test Engine**: Designed a server-side test harness storing hidden test suites in an isolated JSON registry; bundled multi-case standard input streams with custom output delimiters (`---END_TC---`) and evaluated results using 4 comparison modes without ever exposing hidden inputs to the client DOM.
- **Traffic Throttling & Telemetry Persistence**: Implemented a thread-safe rolling-window token bucket rate limiter (10 submissions/60s per UID) before queue ingestion, and built a cursor-based paginated history ledger in **Google Cloud Firestore** powering client-side analytical breakdowns.

---

## 2. Technical Interview Explanations

### A. 30-Second Elevator Pitch
> *"AlgoQuest is an end-to-end DSA preparation platform supporting 174 questions across 14 topics in 5 programming languages. Rather than running simple in-browser evaluation or exposing API keys on the frontend, I engineered a decoupled FastAPI backend that verifies Firebase ID tokens, manages an asynchronous `asyncio.Queue` worker pool for test evaluation against Judge0 CE, hides protected test cases server-side, and persists paginated submission telemetry into Google Cloud Firestore."*

---

### B. 2-Minute Technical Explanation
> *"The primary engineering challenge in building AlgoQuest was designing an execution pipeline that balances interactive feedback with secure, long-running test validation.*
> 
> *For fast developer feedback, I built a synchronous 'Run' flow that evaluates code against public sample test cases. However, for full problem submission, evaluating multi-case hidden test suites, parsing outputs, and performing dual database writes can exceed standard HTTP gateway timeouts.*
> 
> *To solve this, I designed an asynchronous submit pipeline. When a user submits code, FastAPI validates their Firebase RS256 token, checks an in-memory rolling-window rate limiter (10 requests per minute per UID), enqueues the job into an `asyncio.Queue`, and immediately returns `HTTP 202 Accepted` with a UUID. A background worker coroutine dequeues the job, bundles sample and hidden test inputs with custom delimiters, invokes Judge0 CE, normalizes and compares the output slices against server-held test definitions, and offloads synchronous Firestore writes using `asyncio.to_thread` to keep the event loop non-blocking.*
> 
> *The frontend polls the job endpoint every second until completion and renders test pass badges without ever receiving hidden test inputs or expected outputs, preserving assessment integrity identical to platforms like LeetCode."*

---

### C. 5-Minute Deep Architectural Deep Dive
> *"When designing AlgoQuest, I focused on three core engineering pillars: **Security & Isolation**, **Execution Decoupling**, and **Data Integrity**.*
> 
> *1. **Security & Zero-Trust Client Model**:*
> *In many student or portfolio projects, client applications either hold API keys in browser memory or trust client-supplied user IDs. In AlgoQuest, the frontend is treated as untrusted. All requests attach a Firebase ID token. FastAPI's `get_current_user` dependency verifies the RS256 signature against Google's public key certificates, checks issuer and audience claims, and extracts the verified `uid`. All Firestore paths (`users/{uid}/*`) and async job ownership checks strictly use this server-derived identity. Furthermore, Judge0 credentials and hidden test suites are isolated on the backend.*
> 
> *2. **Execution Pipeline & Non-Blocking Asynchrony**:*
> *We support C++17, C, Java, Python 3, and Node.js. For full submissions, the backend loads test cases from `backend/data/test_cases.json`, formats a concatenated standard input stream prefixed by test count $T$, and executes it in an isolated container. To handle the blocking nature of synchronous Firestore SDK operations inside the async worker, I wrapped all database operations in `asyncio.to_thread()`, preventing event loop starvation. Rate limiting is enforced via a thread-locked monotonic timestamp window before queue insertion, protecting the worker from queue flooding.*
> 
> *3. **Optimized Persistence & State Synchronization**:*
> *To eliminate the classic 'N+1 roundtrip' problem on user login, I built a bulk-load endpoint (`GET /api/user/all`) that streams progress, bookmarks, notes, editor drafts, and general compiler code in parallel server streams, populating the client cache in a single HTTP transaction. For historical submissions, we separate the deterministic progress state (`progress/{qid}`) from the append-only submission ledger (`submissions/{auto_id}`), using Firestore document snapshot cursor pagination (`start_after`) with a `limit + 1` query to determine `hasMore` without costly count aggregations.*
> 
> *4. **Trade-offs & Scalability Path**:*
> *I intentionally used an in-memory `asyncio.Queue` and process-level rate limiter to avoid requiring external infrastructure like Redis or Celery on single-container deployments. If scaling horizontally across multiple container instances, the architecture is designed to cleanly transition by swapping the in-memory queue for a Redis-backed Celery worker pool and moving rate-limiting counters to Redis sliding-window sets."*

---

## 3. Measurable Facts & Verified Codebase Metrics

| Dimension | Metric | Source Verification |
| :--- | :--- | :--- |
| **Curriculum Scale** | 174 Curated Problems | `backend/data/test_cases.json`, `js/question-metadata.js` |
| **Topic Coverage** | 14 DSA Categories | Arrays, Strings, Trees, Graphs, DP, Heaps, etc. |
| **Execution Runtimes** | 5 Languages | C++17 (`76`), C (`50`), Java (`62`), Python 3 (`71`), JS (`63`) |
| **Test Suite Coverage** | 43 Automated Tests | `backend/tests/` (100% Passing via `pytest`) |
| **API Surface** | 16 Registered Endpoints | FastAPI OpenAPI schema |
| **Rate Limit Window** | 10 req / 60s per UID | `backend/app/routes/submissions.py` (`_rate_store`) |
| **Job Retention TTL** | 20 min retention, 5 min cleanup | `backend/app/services/submission_queue.py` |
| **Database Structure** | 6 Subcollections per User | `progress`, `revisions`, `bookmarks`, `notes`, `editor`, `submissions` |

---

## 4. Key Engineering Decisions & Trade-Offs (ADR Summary)

| Decision | Why Chosen | Major Benefit | Trade-Off / Limitation |
| :--- | :--- | :--- | :--- |
| **Async Submit (`HTTP 202`)** | Full test runs can take 3–8s; risks reverse proxy timeouts. | Non-blocking, robust client polling, zero connection drops. | Requires client polling loop and transient job state tracking. |
| **In-Memory `asyncio.Queue`** | Eliminates external daemon requirements for single containers. | Zero extra cost, zero Redis/RabbitMQ infrastructure overhead. | In-flight jobs lost if backend crashes; single-container bound. |
| **Server-Side Hidden Tests** | Prevents client inspect-element extraction of hidden edge cases. | High assessment integrity matching production platforms. | Server must execute comparator logic instead of delegating to client. |
| **No Source Code in History Docs** | Active code is already in `editor/{qid}`; history is just telemetry. | Minimal Firestore document size, low storage cost, fast queries. | User cannot review past historical code snapshots. |
| **Bulk User Hydration (`/api/user/all`)** | Eliminates 5–6 sequential client Firestore queries on initial load. | Single round-trip login hydration (<250ms), snappy UX. | Slightly larger single JSON payload on login. |

---

## 5. Architectural Limitations & Production Scaling Strategy

1. **Horizontal Scaling Bottleneck**:
   - *Current*: `asyncio.Queue` and `_rate_store` live in the memory space of a single Uvicorn process.
   - *Production Solution*: Replace with **Redis** as a distributed message broker (via **Celery** or **ARQ**) and use Redis sliding-window sorted sets (`ZADD`/`ZREMRANGEBYSCORE`) for distributed rate limiting across $N$ instances.
2. **Server Restart Resilience**:
   - *Current*: Queued or running jobs are lost if the container terminates mid-execution.
   - *Production Solution*: Use Redis persistence (AOF/RDB) or Google Cloud Tasks / AWS SQS for guaranteed at-least-once task delivery.
3. **Telemetry Aggregations**:
   - *Current*: Detailed verdict and language breakdown analytics are computed on the client over the loaded history window.
   - *Production Solution*: Deploy Firestore Eventarc triggers / Cloud Functions to maintain pre-aggregated lifetime counter documents under `users/{uid}/analytics/summary`.
