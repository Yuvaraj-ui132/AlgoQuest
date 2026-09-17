/**
 * api.js — AlgoQuest API Client
 *
 * Centralizes all communication with the FastAPI backend.
 * Every request automatically attaches the Firebase ID token
 * as Authorization: Bearer <token>.
 *
 * Architecture:
 *   Browser → ApiClient → FastAPI → (Firestore | Judge0)
 *
 * Usage:
 *   ApiClient.submitCode(payload)
 *   ApiClient.getProgress()
 *   ApiClient.updateProgress(qId, { solved: true })
 *   ApiClient.addBookmark(qId)
 *   ...
 *
 * Configuration:
 *   Set window.ALGOQUEST_BACKEND_URL before loading this script,
 *   or it defaults to http://localhost:8000.
 *
 *   In index.html for production:
 *     <script>window.ALGOQUEST_BACKEND_URL = 'https://your-backend.com';</script>
 */

(function () {
  'use strict';

  // ── Backend URL ─────────────────────────────────────────────────────────────
  const BACKEND_URL = (window.ALGOQUEST_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

  // ── Token helpers ───────────────────────────────────────────────────────────

  /**
   * Get the current Firebase ID token.
   * Forces a refresh if the token might be expired (Firebase handles this automatically).
   * Returns null if no user is signed in.
   */
  async function getIdToken() {
    try {
      if (
        typeof firebase === 'undefined' ||
        !firebase.auth ||
        !firebase.auth().currentUser
      ) {
        return null;
      }
      return await firebase.auth().currentUser.getIdToken(/* forceRefresh */ false);
    } catch (err) {
      console.warn('[ApiClient] Failed to get ID token:', err);
      return null;
    }
  }

  // ── Core fetch wrapper ──────────────────────────────────────────────────────

  /**
   * Send an authenticated request to the backend.
   *
   * @param {string} path        - API path, e.g. '/api/progress'
   * @param {object} options     - fetch options (method, body, signal, ...)
   * @param {boolean} withAuth   - whether to attach Bearer token (default true)
   * @returns {Promise<any>}     - parsed JSON response
   * @throws {ApiError}          - on HTTP errors
   */
  async function request(path, options = {}, withAuth = true) {
    const url = `${BACKEND_URL}${path}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };

    if (withAuth) {
      const token = await getIdToken();
      if (!token) {
        throw new ApiError(401, 'Not authenticated. Please log in first.');
      }
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fetchOptions = {
      ...options,
      headers,
    };

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (networkErr) {
      if (networkErr.name === 'AbortError') {
        throw new ApiError(0, 'Request cancelled.');
      }
      throw new ApiError(0, `Network error: ${networkErr.message}. Is the backend running at ${BACKEND_URL}?`);
    }

    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        detail = body.detail || detail;
      } catch (_) { /* ignore parse error */ }

      if (response.status === 401) {
        // Token expired or invalid — force re-auth
        _onUnauthorized();
      }

      throw new ApiError(response.status, detail);
    }

    // 204 No Content
    if (response.status === 204) return null;

    return response.json();
  }

  // Timestamp of the last successful sign-in — used to avoid signing out
  // immediately after login when the backend returns 401 (e.g. credentials
  // not yet configured or token not yet propagated).
  let _signInTimestamp = 0;

  // Call this whenever the user signs in so we know when the session started.
  window._apiClientOnSignIn = function () {
    _signInTimestamp = Date.now();
  };

  /**
   * Called when the backend returns 401.
   *
   * IMPORTANT: We do NOT force sign-out immediately after login.
   * A 401 right after signing in means the backend credentials are missing
   * or the token hasn't propagated — it does NOT mean the session expired.
   * We only force sign-out if the user has been signed in for > 60 seconds
   * (genuine session expiry).
   */
  function _onUnauthorized() {
    const sessionAge = Date.now() - _signInTimestamp;
    const isInitialLoad = sessionAge < 60_000; // within 60s of sign-in

    if (isInitialLoad) {
      // Backend issue or token not yet valid — do NOT sign out.
      // Log the real error so it's visible in DevTools console.
      console.warn(
        '[ApiClient] 401 on initial load (session age %dms) — backend credentials missing or token not yet valid. NOT signing out.',
        sessionAge
      );
      return;
    }

    // Genuine session expiry — token is old and expired.
    console.warn('[ApiClient] 401 Unauthorized — session expired, forcing re-authentication.');
    if (typeof showToast === 'function') {
      showToast('Session expired. Please log in again.', 'error');
    }
    try {
      if (firebase && firebase.auth) firebase.auth().signOut();
    } catch (_) {}
  }


  // ── Custom error class ──────────────────────────────────────────────────────

  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  // ── API methods ─────────────────────────────────────────────────────────────

  const ApiClient = {

    // ── Health ──────────────────────────────────────────────────────────────

    async healthCheck() {
      return request('/health', {}, false);
    },

    // ── Code Execution ──────────────────────────────────────────────────────

    /**
     * Submit code for execution.
     *
     * @param {object} payload
     *   source_code:      string   — base64-encoded, driver-wrapped source
     *   language_id:      number   — Judge0 language ID
     *   execution_type:   string   — 'run' | 'submit' | 'general'
     *   question_id:      number?  — required for run/submit
     *   stdin:            string?  — base64-encoded; only for general mode
     *   compiler_options: string?  — e.g. '-std=c++17'
     * @param {AbortSignal} signal  — optional, to cancel in-flight request
     *
     * @returns {SubmissionResponse}
     *   verdict, status_id, runtime, memory,
     *   passed_count?, total_count?, test_cases?,
     *   stdout?, compile_output?, stderr?
     */
    async submitCode(payload, signal) {
      return request('/api/submissions', {
        method: 'POST',
        body: JSON.stringify(payload),
        signal,
      });
    },

    /**
     * Poll the status of an async submission job.
     *
     * Called after POST /api/submissions returns HTTP 202 with a job_id.
     * The caller is responsible for the polling loop and timeout.
     *
     * @param {string} jobId    — job ID returned from submitCode (HTTP 202)
     * @param {AbortSignal} signal — optional cancel signal
     *
     * @returns {JobStatusResponse}
     *   {
     *     job_id: string,
     *     status: 'queued' | 'running' | 'completed' | 'failed',
     *     result?: SubmissionResponse,   // present when status='completed'
     *     error?: string,               // present when status='failed'
     *   }
     */
    async pollJobStatus(jobId, signal) {
      return request(`/api/submissions/${encodeURIComponent(jobId)}`, { signal });
    },

    async getQuestionSampleTests(questionId) {
      return request(`/api/questions/${questionId}/sample-tests`, {}, false);
    },

    // ── User initialization (called once after signup) ───────────────────────

    /**
     * Initialize or reconcile the backend Firestore user document.
     * Called immediately after Firebase signup succeeds.
     * Safe to call multiple times — idempotent (merge=True on the backend).
     *
     * The UID is derived server-side from the verified Firebase ID token;
     * it is NOT sent in the request body.
     *
     * @param {{ name?: string, email?: string, photo_url?: string }} profile
     * @returns {{ ok: boolean, message: string }}
     */
    async initUser(profile = {}) {
      return request('/api/user/init', {
        method: 'POST',
        body: JSON.stringify(profile),
      });
    },

    // ── User data (bulk load on login) ──────────────────────────────────────

    /**
     * Load ALL user data in a single request.
     * Called once after login to populate localStorage caches.
     *
     * @returns {UserAllDataResponse}
     *   { progress: {solved, rev1, rev2}, bookmarks: {bookmarks},
     *     notes: {qId: content}, editor: {qId: {language, code}},
     *     general_compiler: {lang: code} }
     */
    async getAllUserData() {
      return request('/api/user/all');
    },


    // ── Progress ─────────────────────────────────────────────────────────────

    async getProgress() {
      return request('/api/progress');
    },

    /**
     * Update progress for one question.
     * @param {number} questionId
     * @param {{ solved?: boolean, rev1?: boolean, rev2?: boolean }} updates
     */
    async updateProgress(questionId, updates) {
      return request(`/api/progress/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    // ── Bookmarks ─────────────────────────────────────────────────────────────

    async getBookmarks() {
      return request('/api/bookmarks');
    },

    async addBookmark(questionId) {
      return request(`/api/bookmarks/${questionId}`, { method: 'PUT' });
    },

    async removeBookmark(questionId) {
      return request(`/api/bookmarks/${questionId}`, { method: 'DELETE' });
    },

    // ── Notes ─────────────────────────────────────────────────────────────────

    async getNote(questionId) {
      return request(`/api/notes/${questionId}`);
    },

    async saveNote(questionId, content) {
      return request(`/api/notes/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
    },

    // ── DSA Editor ────────────────────────────────────────────────────────────

    async getEditorCode(questionId) {
      return request(`/api/editor/${questionId}`);
    },

    async saveEditorCode(questionId, language, code) {
      return request(`/api/editor/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify({ language, code }),
      });
    },

    // ── General Compiler ──────────────────────────────────────────────────────

    async getGeneralCompilerCode(language) {
      return request(`/api/general-compiler/${language}`);
    },

    async saveGeneralCompilerCode(language, code) {
      return request(`/api/general-compiler/${language}`, {
        method: 'PUT',
        body: JSON.stringify({ code }),
      });
    },

    // ── Submission History ────────────────────────────────────────────────────

    /**
     * Fetch submission history for the authenticated user.
     *
     * UID is NEVER sent from the frontend — the backend derives it from
     * the verified Firebase ID token.
     *
     * @param {{ limit?: number, after?: string }} options
     *   limit  — page size, 1–50 (default 20)
     *   after  — cursor: document ID of the last item from the previous page
     *
     * @returns {{ items: SubmissionHistoryItem[], hasMore: boolean, nextCursor: string|null }}
     */
    async getSubmissionHistory({ limit = 20, after = null } = {}) {
      let path = `/api/submissions/history?limit=${limit}`;
      if (after) path += `&after=${encodeURIComponent(after)}`;
      return request(path);
    },
  };

  // ── Expose globally ─────────────────────────────────────────────────────────
  window.ApiClient = ApiClient;
  window.ApiError  = ApiError;

})();
