# AlgoForge — Deep Project Explanation for Resume & Interview

---

## 📌 One-Line Resume Summary

> **AlgoForge** — A full-stack, placement-focused DSA practice dashboard built with Vanilla JS, Firebase, Monaco Editor, and Judge0 CE API, featuring real-time progress sync, an in-browser code execution engine, and Chart.js analytics. Deployed on Firebase Hosting.

---

## 🔗 Quick Facts

| Property | Value |
|---|---|
| **Live URL** | [algoquest-9aab0.web.app](https://algoquest-9aab0.web.app) |
| **GitHub** | [github.com/Yuvaraj-ui132/AlgoQuest](https://github.com/Yuvaraj-ui132/AlgoQuest) |
| **Stack** | HTML5 · Vanilla CSS · JavaScript ES6+ · Firebase · Judge0 API · Monaco · Chart.js |
| **Lines of Code** | ~5,000+ (JS alone: ~4,500 lines across 4 files) |
| **Question Bank** | 400+ curated DSA problems |

---

## 🧠 What Is AlgoForge? (Explain In Interviews)

AlgoForge is a **self-contained DSA preparation platform** you run entirely in the browser — no backend server, no framework overhead. Think of it as your personal LeetCode + VSCode hybrid, purpose-built for coding interview and placement preparation (FAANG and top-tier tech companies).

It solves a real problem: **placement candidates are scattered across multiple tabs** — LeetCode for problems, some IDE for coding, a spreadsheet for tracking progress. AlgoForge brings all of that into one beautiful, synced dashboard.

---

## 🏗️ Architecture Deep Dive

```
Browser (SPA — Single Page Application)
│
├── index.html          → App shell, all page sections present, toggled by JS
├── css/style.css       → 79KB design system (CSS variables, dark/light themes, glassmorphism)
│
├── js/
│   ├── app.js          → Core controller (2,636 lines) — State, routing, rendering, filters
│   ├── compiler.js     → Judge0 API integration + Monaco editor setup (1,712 lines)
│   ├── firebase.js     → Auth (email+Google) + Firestore sync (864 lines)
│   ├── firebase-config.js → Firebase SDK bootstrap
│   └── question-metadata.js → Curated question bank (static data)
│
├── data/
│   ├── questions.json  → 172KB — Problem definitions (statement, I/O, tags, hints)
│   └── tiers.json      → Tier/difficulty metadata
│
└── Firebase Hosting    → Static file CDN deployment
```

### Key Architectural Decisions

1. **No Framework (Vanilla JS SPA)** — The entire UI is a single `index.html` with multiple "pages" (divs) toggled via CSS `display`. Navigation is handled by `navigateTo()` in `app.js`. This was a conscious choice to demonstrate DOM mastery without React/Vue abstraction.

2. **Global State Object** — All application state lives in a central `window.App` object, similar to a Redux store but without the overhead:
   ```js
   const App = {
     questions: [],         // All 400+ questions loaded from JSON
     filteredQuestions: [], // Filtered subset after applying filters
     currentQuestion: null, // Currently selected question
     currentPage: 'dashboard',
     filters: { search, difficulty, tier, status },
     sort: { col: 'id', dir: 'asc' },
     editor: null,          // Monaco editor instance (general)
     dsaEditor: null,       // Monaco editor instance (DSA workspace)
   };
   ```

3. **Namespaced LocalStorage** — All user data (solved, bookmarks, notes, code) is stored with a `_<uid>` suffix, so multiple users on the same device get isolated data. Falls back to `_guest` when not logged in.

4. **Offline-first Hybrid** — The app works immediately with LocalStorage, then syncs to/from Firestore on login. This means zero loading lag for returning users.

---

## 🔑 Core Features Explained (For Interviews)

### 1. 📋 Problem Tracker with Smart Filtering

- **400+ curated questions** organized across 18 DSA topics (11 core + 7 advanced)
- **Multi-dimensional filters**: difficulty (Easy/Medium/Hard), tier (Core/Advanced/Optional), solve status (solved/unsolved)
- **Pattern-based navigation**: Within each topic (e.g., Arrays), you can drill into sub-patterns: Hashing, Two Pointers, Sliding Window, Prefix Sum
- **Sortable table view** with columns: ID, Name, Topic, Pattern, Difficulty, Tier, Status, Complexity

**How the filter pipeline works:**
```js
// applyFilters() chains independent filter predicates:
App.filteredQuestions = App.questions.filter(q =>
  topicMatch && patternMatch && searchMatch &&
  diffMatch && tierMatch && statusMatch
);
```

### 2. 💻 Monaco Code Editor (VS Code Engine)

- Embedded **Microsoft Monaco Editor** — the same engine that powers VS Code
- Supports **C++17, C, Java, Python, JavaScript** with full syntax highlighting and IntelliSense
- **Two editor instances**:
  - **General Editor** (`/compiler` page) — free-form scratchpad
  - **DSA Workspace** (`/dsa-compiler` page) — LeetCode-style split view with problem on left, editor on right
- Code is **auto-saved per question per language** using namespaced LocalStorage keys
- Dark/Light theme syncs with app theme via `monaco.editor.setTheme()`

### 3. ⚙️ Judge0 CE API — In-Browser Code Execution

- Integrates with the **Judge0 CE REST API** (open-source online judge) via RapidAPI
- **Execution flow**:
  1. User clicks "Run" → code + stdin + language ID are sent to Judge0 (`POST /submissions`)
  2. Judge0 responds with a `token`
  3. App **polls** `GET /submissions/{token}` every ~1s until status ≠ 1 or 2 (Queued/Processing)
  4. Final verdict (Accepted, Wrong Answer, TLE, Compilation Error, Runtime Error, etc.) is rendered with color-coded badges and runtime/memory stats
- **Smart stdin detection** — scans code for `cin >>`, `scanf()`, `input()`, `Scanner` patterns. If input is required but stdin is empty, shows a warning modal
- Supports **14 execution status codes** with user-friendly explanations (e.g., SIGSEGV, SIGABRT, NZEC)

**Why Judge0?** It's a free, open-source, self-hostable judge that supports 60+ languages — no vendor lock-in, full control.

### 4. 🔥 Firebase Auth + Firestore Sync

**Authentication:**
- **Email/Password** with a full-featured signup flow: live password strength meter (5 criteria), confirm-match indicator, real-time validation
- **Google OAuth** via `signInWithPopup` — handles edge cases (popup blocked, cancelled by user)
- **Password reset** via `sendPasswordResetEmail`
- **Remember Me** toggle — switches between `LOCAL` (persistent) and `SESSION` persistence

**Firestore Data Model:**
```
users/{uid}/
  ├── progress/{questionId}    → { solved: true }
  ├── revisions/{questionId}   → { rev1: bool, rev2: bool }
  ├── bookmarks/{questionId}   → { bookmarked: true }
  ├── notes/{questionId}       → { content: "user's note" }
  ├── editor/{questionId}      → { code, language, updatedAt }
  └── general_compiler/{lang}  → { code, language }
```

**Sync Strategy:** On login, `fetchUserDataFromCloud()` downloads all subcollections and writes them to namespaced LocalStorage keys. All subsequent writes go to both LocalStorage (immediate UI update) and Firestore (cloud persistence), giving a **write-through cache** pattern.

### 5. 📊 Progress Analytics with Chart.js

- **Animated SVG progress ring** on the dashboard (custom CSS stroke-dashoffset math)
- **Bar chart** — topic-wise solved vs total, using Chart.js with fully custom dark/light theming
- **Progress grid cards** — each DSA topic shows a mini progress bar with % completion
- **Streak tracking** — daily practice streak stored in LocalStorage with date comparison logic
- **Revision system** — mark questions for "Rev 1" and "Rev 2" passes (spaced repetition concept)
- **Bookmarks** — saved to Firestore, accessible on a dedicated `/bookmarks` page

### 6. 🌗 Dark / Light Mode

- Uses a single `data-theme` attribute on `<html>` root
- **80KB CSS design system** with CSS custom properties (`--bg-primary`, `--text-primary`, `--accent-green`, etc.)
- Theme toggle instantly updates Monaco editor themes (`vs-dark` / `vs`)
- Preference persisted to LocalStorage (separate key, not namespaced, shared across users)

---

## 🛠️ Technical Challenges Solved

### Challenge 1: Multi-User Data Isolation
**Problem:** Multiple users signing in on the same browser would see each other's progress.  
**Solution:** Implemented `getStorageKey(key)` — all LocalStorage keys are suffixed with the Firebase UID (`dsa_solved_<uid>`). Falls back to `_guest` for unauthenticated users.

### Challenge 2: Stale Editor State Between Questions
**Problem:** Switching between questions could show the wrong code in the editor.  
**Solution:** Each code save uses a composite key: `dsa_workspace_code_<uid>_<questionId>_<language>`. When a question is opened, the app loads the last used language first, then loads the code for that language.

### Challenge 3: Offline-First + Cloud Sync
**Problem:** Cloud calls are async — if the user interacts before data loads, state can be inconsistent.  
**Solution:** LocalStorage is the **source of truth** for all UI rendering. Firestore loads run in the background on login and overwrite LocalStorage when complete, then trigger `refreshAllUI()` to re-render.

### Challenge 4: Judge0 Polling Race Condition
**Problem:** If the user runs code twice quickly, both polling loops could race and display stale results.  
**Solution:** An `executionId` counter is incremented on each run. Only the response that matches the current `executionId` is rendered — all older responses are silently dropped.

### Challenge 5: Monaco in a Non-Module Environment
**Problem:** Monaco Editor requires a web worker and AMD module loader — non-trivial to embed in a plain HTML file.  
**Solution:** Loaded via CDN using `require.config` with the AMD loader path pointing to the Monaco CDN. Editor instances are initialized asynchronously inside `monaco.editor.create()` after the `require(['vs/editor/editor.main'])` callback.

---

## 📐 Design System Highlights

- **Dark-first** palette inspired by Linear/Vercel/GitHub — not just `#000` black but layered grays (`#0d1117`, `#161b22`, `#21262d`)
- **Glassmorphism** cards with `backdrop-filter: blur()` and semi-transparent backgrounds
- **Micro-animations** — hover transitions, fade-ins on question load, animated progress ring, toast notifications
- **Typography** — Google Fonts (system-ui stack for speed), monospace (`JetBrains Mono`) for code elements
- **Responsive sidebar** — collapsible with CSS transforms, smooth expand/collapse for topic groups

---

## 📊 Scale & Complexity

| Metric | Value |
|---|---|
| JavaScript lines | ~4,500+ across 4 files |
| CSS lines | ~3,000+ (79KB) |
| Question bank | 400+ problems |
| DSA topics | 18 (11 core + 7 advanced) |
| Supported languages | 5 (C++, C, Java, Python, JS) |
| Firestore collections | 6 per user |
| Execution status codes handled | 14 |
| API integrations | 2 (Firebase, Judge0 CE) |

---

## 🎯 Resume Bullet Points (Copy-Paste Ready)

```
• Built AlgoForge, a full-stack DSA practice dashboard with 400+ curated problems, real-time
  code execution via Judge0 CE API, and cross-device progress sync via Firebase Firestore.

• Integrated Microsoft Monaco Editor (VS Code engine) with multi-language support (C++, Java,
  Python, JS, C), per-question code persistence, and synchronized dark/light theming.

• Implemented Firebase Authentication (email/password + Google OAuth) with live password
  strength validation and a write-through cache architecture (LocalStorage + Firestore).

• Designed a multi-dimensional filter/sort system over 400+ questions (topic, pattern, difficulty,
  tier, solve-status) with O(n) client-side filtering and real-time search.

• Built a Chart.js analytics dashboard with topic-wise progress visualization, an animated SVG
  progress ring, daily streak tracking, and a spaced-repetition revision system.

• Deployed on Firebase Hosting as a zero-build-step Vanilla JS SPA with a CSS design system
  featuring glassmorphism, CSS custom property theming, and micro-animations.
```

---

## ❓ Common Interview Questions & Answers

**Q: Why did you use Vanilla JS instead of React?**
> I wanted to demonstrate deep understanding of the DOM, event delegation, and state management without framework abstractions. The app is essentially a manual implementation of what React does — a global state object, a render function that re-paints the view, and event listeners for user actions. It also means zero build tooling, zero `node_modules`, just open the file in a browser.

**Q: How do you handle real-time sync with Firebase?**
> I use a write-through cache pattern. All reads come from LocalStorage (fast, synchronous), and all writes go to both LocalStorage and Firestore simultaneously. On login, I fetch the full cloud state and overwrite LocalStorage, then re-render the UI. This ensures the app works offline and feels instant even on slow connections.

**Q: How does the code execution work?**
> I integrate Judge0 CE via RapidAPI. The flow is: user writes code → I encode it in base64, POST it to Judge0 `/submissions` endpoint with the language ID and stdin → get a token back → poll `/submissions/{token}` until the status changes from "Processing" to a terminal state → parse the verdict, runtime, and memory from the response and render them with appropriate styling.

**Q: How do you prevent data leakage between users on the same device?**
> All LocalStorage keys are namespaced with the Firebase UID: `dsa_solved_<uid>`, `dsa_code_<uid>`, etc. When a user logs out and another logs in, they get a completely different namespace. A `getStorageKey()` utility function centralizes this logic across the entire app.

**Q: What was the hardest bug you fixed?**
> The Judge0 polling race condition. If a user quickly clicked "Run" twice, two polling loops would be active, and the slower one could overwrite the result of the faster one with stale data. I fixed it with an `executionId` counter — each run increments it, and poll callbacks only update the UI if their captured `executionId` matches the current one.

**Q: How does the Monaco Editor integrate in a plain HTML page?**
> Monaco requires AMD module loading (the same loader used internally by VS Code). I include the Monaco CDN loader script, configure `require.config()` with the CDN path, then use `require(['vs/editor/editor.main'], callback)` to initialize the editor asynchronously after the module loads. I maintain two separate editor instances — one for the general scratchpad, one for the DSA workspace.

**Q: How is the theme system implemented?**
> I set a `data-theme` attribute on the `<html>` root element. The entire CSS uses custom properties (variables) like `--bg-primary`, `--text-primary`, `--accent-green`. When the theme toggles, all CSS variables re-cascade instantly across every element — no class toggling per component needed. Monaco editor themes are updated via the global `monaco.editor.setTheme()` call.

**Q: What design patterns does your code use?**
> - **Module pattern** — `Compiler` is an IIFE that exposes only a public API (`Compiler.init()`, `Compiler.run()`, `Compiler.resetState()`)
> - **Observer-like pattern** — `auth.onAuthStateChanged()` drives all post-login UI setup
> - **Strategy pattern** — `applyFilters()` chains multiple independent predicate functions
> - **Write-through cache** — LocalStorage + Firestore dual-write for sync
> - **Optimistic updates** — UI updates immediately from LocalStorage, cloud sync is fire-and-forget

---

## 🚀 What You Can Say to Impress Interviewers

> *"The interesting part of this project isn't just that it works — it's the engineering decisions behind it. I deliberately avoided React to deeply understand the underlying patterns it abstracts. The result is an app that has essentially no dependencies at runtime, loads in under 500ms, and handles state management, routing, theming, and data sync all from scratch. The Judge0 integration taught me about async polling, race conditions, and API rate limiting. The Firebase sync taught me about data modeling, write-through caching, and how to design for offline-first scenarios."*

---

*Made by Yuvaraj Murkunde — AlgoForge / AlgoQuest*
