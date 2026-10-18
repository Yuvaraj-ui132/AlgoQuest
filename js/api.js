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

  // ── Notification Helpers ───────────────────────────────────────────────────
  const MSG_STARTING = 'Starting the server. This may take a moment on the first visit.';
  const MSG_CONNECTED = 'Connected';
  const MSG_TIMEOUT = 'Server did not respond. Check your connection or click Retry.';

  function _notify(msg, type, opts) {
    const fn = (typeof showToast === 'function') ? showToast : (typeof window !== 'undefined' && window.showToast ? window.showToast : null);
    if (fn) {
      return fn(msg, type, opts);
    }
    return { dismiss: () => {} };
  }

  function _dismissNotify(idOrEl) {
    const fn = (typeof dismissToast === 'function') ? dismissToast : (typeof window !== 'undefined' && window.dismissToast ? window.dismissToast : null);
    if (fn) {
      fn(idOrEl);
    }
  }

  // ── Readiness & Deduplication State ─────────────────────────────────────────
  let _coldStartToastActive = false;
  let _isBackendReady = false;
  let _lastReadyTimestamp = 0;
  let _backendReadyPromise = null;
  let _hasInitialized = false;
  let _initPromise = null;
  const READY_CACHE_TTL_MS = 120000; // 2 minutes cache for confirmed awake state

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

    const method = (options.method || 'GET').toUpperCase();
    // Safe retry: ONLY idempotent read requests (GET / HEAD) may be retried.
    // Critical: POST/PUT/DELETE/PATCH mutations (especially POST /api/submissions)
    // MUST NEVER be automatically retried to prevent duplicate queue jobs or duplicate submissions.
    const isIdempotent = (method === 'GET' || method === 'HEAD');
    const canRetry = isIdempotent && options.retry !== false;
    const maxRetries = canRetry ? 3 : 0;

    let coldStartTimer = null;
    let didShowColdStartToast = false;
    if (!_isBackendReady && !_coldStartToastActive) {
      coldStartTimer = setTimeout(() => {
        if (!_isBackendReady) {
          _coldStartToastActive = true;
          didShowColdStartToast = true;
          _notify(MSG_STARTING, 'info', {
            id: 'cold-start-indicator',
            duration: 0,
            icon: 'fa-spinner fa-spin',
          });
        }
      }, 3000);
    }

    let response = null;
    let lastNetworkError = null;

    try {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          response = await fetch(url, fetchOptions);
        } catch (networkErr) {
          if (networkErr.name === 'AbortError') {
            throw new ApiError(0, 'Request cancelled.');
          }
          lastNetworkError = networkErr;

          // If retryable and attempts remain, wait with exponential backoff
          if (canRetry && attempt < maxRetries && !fetchOptions.signal?.aborted) {
            const backoffMs = Math.min(1000 * Math.pow(2, attempt), 4000);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            continue;
          }
          throw new ApiError(0, `Network error: ${networkErr.message}. Is the backend running at ${BACKEND_URL}?`);
        }

        // Handle transient cold-start HTTP errors (502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout)
        if (
          canRetry &&
          (response.status === 502 || response.status === 503 || response.status === 504) &&
          attempt < maxRetries &&
          !fetchOptions.signal?.aborted
        ) {
          const backoffMs = Math.min(1000 * Math.pow(2, attempt), 4000);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        }

        // Valid response or non-transient status reached
        break;
      }
    } finally {
      if (coldStartTimer) clearTimeout(coldStartTimer);
    }

    if (!response || !response.ok) {
      // Clear cold-start active state on error without leaving persistent spinner
      if (didShowColdStartToast || _coldStartToastActive) {
        _coldStartToastActive = false;
        _dismissNotify('cold-start-indicator');
      }

      if (!response) {
        if (canRetry && !fetchOptions.signal?.aborted) {
          _notify(MSG_TIMEOUT, 'error', {
            id: 'cold-start-retry-prompt',
            duration: 6000,
            action: {
              text: 'Retry',
              onClick: () => {
                request(path, options, withAuth).catch(() => {});
              },
            },
          });
        }
        throw new ApiError(0, `Network error: ${lastNetworkError ? lastNetworkError.message : 'Unknown error'}`);
      }

      let detail = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        detail = body.detail || detail;
      } catch (_) { /* ignore parse error */ }

      if (response.status === 401) {
        // Token expired or invalid — force re-auth
        _onUnauthorized();
      }

      if (canRetry && (response.status === 502 || response.status === 503 || response.status === 504)) {
        _notify(MSG_TIMEOUT, 'error', {
          id: 'cold-start-retry-prompt',
          duration: 6000,
          action: {
            text: 'Retry',
            onClick: () => {
              request(path, options, withAuth).catch(() => {});
            },
          },
        });
      }

      throw new ApiError(response.status, detail);
    }

    // A real successful API response confirms the backend is awake!
    _isBackendReady = true;
    _lastReadyTimestamp = Date.now();

    if (coldStartTimer) clearTimeout(coldStartTimer);

    if (didShowColdStartToast || _coldStartToastActive) {
      _coldStartToastActive = false;
      _dismissNotify('cold-start-indicator');
      _notify(MSG_CONNECTED, 'success', { id: 'cold-start-connected', duration: 2500 });
    } else {
      // Defensive guarantee: backend is confirmed awake, make sure no stale indicator lingers
      _dismissNotify('cold-start-indicator');
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

    // ── Health & Backend Readiness ──────────────────────────────────────────

    /**
     * Check the health of the backend once (non-blocking).
     * @param {AbortSignal} [signal] - optional abort signal
     * @returns {Promise<any>}
     */
    async healthCheck(signal) {
      return request('/health', { signal }, false);
    },

    /**
     * Synchronously check whether the backend is already known to be awake.
     * @returns {boolean}
     */
    isReady() {
      return Boolean(_isBackendReady && (Date.now() - _lastReadyTimestamp < READY_CACHE_TTL_MS));
    },

    /**
     * Reset cached readiness state (useful for test isolation or forced re-probe).
     */
    resetState() {
      _isBackendReady = false;
      _lastReadyTimestamp = 0;
      _coldStartToastActive = false;
      _backendReadyPromise = null;
      _hasInitialized = false;
      _initPromise = null;
    },

    /**
     * Explicitly dismiss any active cold-start indicator and reset active flag.
     */
    dismissColdStart() {
      _coldStartToastActive = false;
      _dismissNotify('cold-start-indicator');
    },

    /**
     * Poll the existing /health endpoint at a reasonable interval until the backend
     * is awake, with a maximum wait time and proper error handling.
     * Stops polling immediately once the backend responds.
     * Deduplicated: concurrent calls share the exact same in-flight Promise.
     *
     * @param {object} [opts]
     * @param {number} [opts.timeoutMs=60000] - maximum wait time (ms)
     * @param {number} [opts.intervalMs=2500] - polling interval (ms)
     * @param {AbortSignal} [opts.signal]     - optional abort signal
     * @param {boolean} [opts.silent=false]   - if true, do not display toasts
     * @returns {Promise<{ready: boolean, alreadyAwake: boolean}>}
     */
    async waitForBackend(opts = {}) {
      const timeoutMs = opts.timeoutMs || 60000;
      const intervalMs = opts.intervalMs || 2500;
      const signal = opts.signal || null;
      const silent = Boolean(opts.silent);

      // If backend was confirmed awake within TTL, resolve immediately without duplicate network call
      if (_isBackendReady && (Date.now() - _lastReadyTimestamp < READY_CACHE_TTL_MS)) {
        return { ready: true, alreadyAwake: true };
      }

      // Deduplication: if a check/wait is already running, return the shared in-flight promise
      if (_backendReadyPromise) {
        return _backendReadyPromise;
      }

      _backendReadyPromise = (async () => {
        const startTime = Date.now();
        let coldStartTimer = null;
        let didShowToast = false;

        if (!silent && !_coldStartToastActive) {
          coldStartTimer = setTimeout(() => {
            if (!_isBackendReady) {
              _coldStartToastActive = true;
              didShowToast = true;
              _notify(MSG_STARTING, 'info', {
                id: 'cold-start-indicator',
                duration: 0,
                icon: 'fa-spinner fa-spin',
              });
            }
          }, 2500);
        }

        try {
          while (true) {
            if (signal?.aborted) {
              throw new ApiError(0, 'Health check aborted.');
            }

            if (Date.now() - startTime > timeoutMs) {
              throw new ApiError(0, 'Server startup timed out.');
            }

            try {
              const res = await fetch(`${BACKEND_URL}/health`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                signal,
                cache: 'no-cache',
              });

              if (res.ok) {
                _isBackendReady = true;
                _lastReadyTimestamp = Date.now();

                if (coldStartTimer) clearTimeout(coldStartTimer);
                if (didShowToast || _coldStartToastActive) {
                  _coldStartToastActive = false;
                  _dismissNotify('cold-start-indicator');
                  if (!silent) {
                    _notify(MSG_CONNECTED, 'success', { duration: 2500, id: 'cold-start-connected' });
                  }
                }
                return { ready: true, alreadyAwake: false };
              }
            } catch (probeErr) {
              if (probeErr.name === 'AbortError') {
                throw new ApiError(0, 'Health check aborted.');
              }
              // Server is waking up (502, 503, connection refused) - continue polling
            }

            await new Promise((resolve) => setTimeout(resolve, intervalMs));
          }
        } catch (err) {
          if (coldStartTimer) clearTimeout(coldStartTimer);
          if (didShowToast || _coldStartToastActive) {
            _coldStartToastActive = false;
            _dismissNotify('cold-start-indicator');
          }

          if (!silent && !signal?.aborted) {
            _notify(MSG_TIMEOUT, 'error', {
              id: 'cold-start-timeout',
              duration: 6000,
              action: {
                text: 'Retry',
                onClick: () => {
                  ApiClient.waitForBackend({ ...opts, silent: false }).catch(() => {});
                },
              },
            });
          }
          throw err;
        } finally {
          if (coldStartTimer) clearTimeout(coldStartTimer);
          _backendReadyPromise = null;
        }
      })();

      return _backendReadyPromise;
    },

    /**
     * Idempotent initialization helper safe for React re-renders or multiple component mounts.
     * @param {object} [opts]
     * @returns {Promise<{initialized: boolean, ready: boolean, alreadyAwake: boolean}>}
     */
    async init(opts = {}) {
      if (_hasInitialized) {
        return { initialized: true, ready: ApiClient.isReady(), alreadyAwake: true };
      }
      if (_initPromise) {
        return _initPromise;
      }
      _initPromise = (async () => {
        try {
          const res = await ApiClient.waitForBackend(opts);
          _hasInitialized = true;
          return { initialized: true, ...res };
        } finally {
          _initPromise = null;
        }
      })();
      return _initPromise;
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

    // ── Batch Sync (Reliable Cloud-Synced State) ───────────────────────────

    /**
     * Atomically sync pending/offline progress, bookmarks, and notes.
     * @param {{ progress?: Array, bookmarks?: Array, notes?: Array }} payload
     * @returns {Promise<UserAllDataResponse>}
     */
    async batchSync(payload) {
      return request('/api/sync/batch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
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

  // ── Expose globally / CommonJS ─────────────────────────────────────────────
  if (typeof window !== 'undefined') {
    window.ApiClient = ApiClient;
    window.ApiError  = ApiError;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      ApiClient,
      ApiError,
      MSG_STARTING,
      MSG_CONNECTED,
      MSG_TIMEOUT,
    };
  }

})();
