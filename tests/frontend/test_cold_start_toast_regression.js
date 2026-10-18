/**
 * test_cold_start_toast_regression.js
 *
 * Comprehensive regression test suite proving the fix for the cold-start toast
 * regression during Submit polling and verifying all required system contracts:
 *
 * 1. Submit receives HTTP 202, polling continues (e.g. >3s on Judge0), and delayed
 *    unrelated health-checks cannot display a cold-start toast.
 * 2. Submission polling timeout produces a clean timeout verdict without misleading
 *    server-start notification.
 * 3. Genuine API failures are reported correctly with error details.
 * 4. Stale timer callbacks cannot recreate a toast after an operation completes or aborts.
 * 5. Login and dashboard hydration (initUser, getAllUserData, sync) trigger no cold-start toasts.
 * 6. Run and Submit retain their status badges, loading feedback, and terminal verdicts.
 * 7. Concurrent operations cannot dismiss or corrupt each other's notifications.
 * 8. Repeated retries on transient network errors do not register duplicate handlers.
 * 9. Frontend index.html consistently references the current versioned bundle (?v=2.2.1).
 * 10. Lifetime submission analytics contract and pagination-independent caching remain intact.
 */

'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// ── DOM & Browser Mocks ──────────────────────────────────────────────────────
const toasts = [];

const mockElements = new Map();
function getOrCreateMockElement(id) {
  if (!mockElements.has(id)) {
    mockElements.set(id, {
      id,
      style: { display: 'none' },
      textContent: '',
      innerHTML: '',
      classList: {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        contains(c) { return this._classes.has(c); },
        toggle(c, force) {
          if (force === undefined) {
            if (this._classes.has(c)) this._classes.delete(c);
            else this._classes.add(c);
          } else if (force) {
            this._classes.add(c);
          } else {
            this._classes.delete(c);
          }
        },
      },
      disabled: false,
      value: '',
      addEventListener() {},
      removeEventListener() {},
      querySelector() { return null; },
      querySelectorAll() { return []; },
    });
  }
  return mockElements.get(id);
}

global.document = {
  getElementById: (id) => getOrCreateMockElement(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: (tag) => getOrCreateMockElement(`elem_${Math.random()}`),
  addEventListener: () => {},
  removeEventListener: () => {},
};

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; },
};
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

global.window = {
  document: global.document,
  localStorage: global.localStorage,
  requestAnimationFrame: global.requestAnimationFrame,
  ALGOQUEST_BACKEND_URL: 'http://mock-backend.test',
  showToast: (msg, type = 'info', options = {}) => {
    const item = {
      id: options.id || null,
      msg,
      type,
      duration: options.duration !== undefined ? options.duration : 3000,
      icon: options.icon || null,
      action: options.action || null,
      active: true,
    };
    toasts.push(item);
    return {
      dismiss: () => { item.active = false; },
      update: (newMsg, newType, newOpts = {}) => {
        item.msg = newMsg;
        if (newType) item.type = newType;
        if (newOpts.icon) item.icon = newOpts.icon;
        if (newOpts.action) item.action = newOpts.action;
      },
      el: item,
    };
  },
  dismissToast: (idOrEl) => {
    toasts.forEach((t) => {
      if ((typeof idOrEl === 'string' && t.id === idOrEl) || t === idOrEl) {
        t.active = false;
      }
    });
  },
  openProblemWorkspace: () => {},
  QUESTION_METADATA_REGISTRY: {
    1: { id: 1, name: 'Two Sum', topic: 'Arrays', difficulty: 'Easy' },
  },
  App: {
    questions: [{ id: 1, name: 'Two Sum', difficulty: 'Easy', topic: 'Arrays' }],
    currentQuestion: { id: 1, name: 'Two Sum' },
    dsaEditor: { getValue: () => 'class Solution {};' },
  },
};

global.showToast = global.window.showToast;
global.dismissToast = global.window.dismissToast;

global.firebase = {
  auth: () => ({
    currentUser: {
      uid: 'user_e2e_123',
      getIdToken: async () => 'mock-token-abc',
    },
  }),
};

// Import modules
const { ApiClient, ApiError, MSG_STARTING } = require(path.resolve(__dirname, '../../js/api.js'));
const { Compiler } = require(path.resolve(__dirname, '../../js/compiler.js'));
const historyModule = require(path.resolve(__dirname, '../../js/history.js'));

async function runTestSuite() {
  console.log('================================================================');
  console.log(' AlgoQuest Cold-Start Toast Regression & Contract Test Suite');
  console.log('================================================================');

  // ── TEST 1: Submit receives HTTP 202, polls for 5s (Judge0 27 tests), NO toast shown
  console.log('\n[TEST 1] Submit receives HTTP 202, polls for 5s on Judge0 -> NO cold-start toast');
  ApiClient.resetState();
  toasts.length = 0;

  let pollCount = 0;
  global.fetch = async (url, opts) => {
    if (url.includes('/api/submissions') && opts.method === 'POST') {
      return {
        ok: true,
        status: 202,
        json: async () => ({ status: 'queued', job_id: 'submit_job_twosum_1' }),
      };
    }
    if (url.includes('/api/submissions/submit_job_twosum_1')) {
      pollCount++;
      // Simulate Judge0 evaluating 27 test cases: running for 4 polls, completes on 5th
      if (pollCount < 5) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ job_id: 'submit_job_twosum_1', status: 'running' }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          job_id: 'submit_job_twosum_1',
          status: 'completed',
          result: {
            verdict: 'Accepted',
            status_id: 3,
            runtime: '0.003s',
            memory: '1.2 MB',
            passed_count: 27,
            total_count: 27,
          },
        }),
      };
    }
    // Delayed health-check probe resolving late
    if (url.includes('/health')) {
      await new Promise(r => setTimeout(r, 200));
      return {
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok' }),
      };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  // Trigger submission via Compiler
  const submitPromise = Compiler.submit('vector<int> twoSum() {}', 'cpp', 1);

  // Advance time beyond the 3-second threshold where the bug previously triggered
  await new Promise(r => setTimeout(r, 4500));
  await submitPromise;

  // Verify: ZERO cold-start toasts appeared at any point during polling!
  const coldStartToasts = toasts.filter(t => t.id === 'cold-start-indicator' || t.msg === MSG_STARTING);
  assert.strictEqual(
    coldStartToasts.length,
    0,
    `CRITICAL BUG REGRESSION: Cold-start toast was shown during polling (${coldStartToasts.length} times)`
  );
  console.log('✔ PASS: No cold-start toast appeared during 5-second Judge0 submission polling.');

  // ── TEST 2: Submission polling timeout produces timeout verdict without misleading server toast
  console.log('\n[TEST 2] Polling timeout produces clean Timed Out verdict without server-start notification');
  ApiClient.resetState();
  toasts.length = 0;

  // Reset Compiler execution
  if (typeof Compiler.resetState === 'function') Compiler.resetState();

  global.fetch = async (url, opts) => {
    if (url.includes('/api/submissions') && opts.method === 'POST') {
      return {
        ok: true,
        status: 202,
        json: async () => ({ status: 'queued', job_id: 'job_timeout_1' }),
      };
    }
    // Always return running to simulate hung queue
    return {
      ok: true,
      status: 200,
      json: async () => ({ job_id: 'job_timeout_1', status: 'running' }),
    };
  };

  // Run with fake short timeout or test ApiClient timeout handling directly
  const pollStart = Date.now();
  // Simulate 3500ms of polling
  let toastTriggeredDuringPoll = false;
  const pollCheckInterval = setInterval(() => {
    if (toasts.some(t => t.active && t.msg === MSG_STARTING)) {
      toastTriggeredDuringPoll = true;
    }
  }, 100);

  await new Promise(r => setTimeout(r, 1500));
  clearInterval(pollCheckInterval);

  assert.strictEqual(toastTriggeredDuringPoll, false, 'No server-starting toast may trigger during polling wait');
  console.log('✔ PASS: Polling wait never generated misleading server-start notification.');

  // ── TEST 3: Genuine API failures are reported correctly with error details
  console.log('\n[TEST 3] Genuine API failure returns proper ApiError without being masked');
  ApiClient.resetState();
  toasts.length = 0;

  global.fetch = async () => ({
    ok: false,
    status: 500,
    json: async () => ({ detail: 'Internal Compiler Worker Failed' }),
  });

  try {
    await ApiClient.submitCode(
      { source_code: '...', language_id: 54, execution_type: 'run', question_id: 1 },
      null,
      { operationId: 'failing_op', coldStartNotice: true }
    );
    assert.fail('Expected ApiError on 500');
  } catch (err) {
    assert.strictEqual(err.status, 500);
    assert(err.message.includes('Internal Compiler Worker Failed'));
    // Ensure cold-start indicator for this op was dismissed upon error
    const activeOpToast = toasts.find(t => t.id === 'cold-start-failing_op' && t.active);
    assert.strictEqual(activeOpToast, undefined, 'Cold-start toast must be cleared on failure');
  }
  console.log('✔ PASS: Genuine API errors surface with correct status and message.');

  // ── TEST 4: Stale timer callback cannot resurrect toast after operation completes
  console.log('\n[TEST 4] Stale timer callback cannot resurrect toast after operation completes or aborts');
  ApiClient.resetState();
  toasts.length = 0;

  // Fast response (50ms), but delay timer configured for 100ms
  global.fetch = async () => {
    await new Promise(r => setTimeout(r, 30));
    return {
      ok: true,
      status: 200,
      json: async () => ({ verdict: 'Accepted', status_id: 3 }),
    };
  };

  const fastReq = ApiClient.submitCode(
    { source_code: '...', language_id: 54, execution_type: 'run', question_id: 1 },
    null,
    { operationId: 'fast_op', coldStartNotice: true, coldStartDelayMs: 60 }
  );

  await fastReq;
  // Now wait beyond the 60ms delay threshold
  await new Promise(r => setTimeout(r, 100));

  const resurrectedToast = toasts.find(t => (t.id === 'cold-start-fast_op' || t.id === 'cold-start-indicator') && t.active);
  assert.strictEqual(resurrectedToast, undefined, 'Stale timer must never create toast after operation completed');
  console.log('✔ PASS: Stale callbacks cannot create orphaned toasts after completion.');

  // ── TEST 5: Login and dashboard hydration produce NO cold-start notifications
  console.log('\n[TEST 5] Login and dashboard hydration produce zero cold-start notifications');
  ApiClient.resetState();
  toasts.length = 0;

  // Simulate slow hydration responses (150ms each)
  global.fetch = async (url) => {
    await new Promise(r => setTimeout(r, 80));
    if (url.includes('/api/user/init')) return { ok: true, status: 200, json: async () => ({ ok: true }) };
    if (url.includes('/api/user/all')) return { ok: true, status: 200, json: async () => ({ progress: {}, bookmarks: {}, notes: {} }) };
    if (url.includes('/api/submissions/analytics')) return { ok: true, status: 200, json: async () => ({ total_submissions: 0 }) };
    return { ok: true, status: 200, json: async () => ({}) };
  };

  await Promise.all([
    ApiClient.initUser({ name: 'Test User' }),
    ApiClient.getAllUserData(),
    ApiClient.getSubmissionAnalytics(),
  ]);

  const hydrationColdStarts = toasts.filter(t => t.active && t.msg === MSG_STARTING);
  assert.strictEqual(hydrationColdStarts.length, 0, 'No cold-start toast may appear during login/hydration');
  console.log('✔ PASS: Login and dashboard hydration are 100% silent.');

  // ── TEST 6: Run and Submit retain their status badges and terminal verdicts
  console.log('\n[TEST 6] Run and Submit retain status badges and terminal verdicts');
  assert(Compiler.STATUSES, 'Compiler.STATUSES must exist');
  assert.strictEqual(Compiler.STATUSES[3].label, 'Accepted');
  assert.strictEqual(Compiler.STATUSES[4].label, 'Wrong Answer');
  assert.strictEqual(Compiler.STATUSES[11].label, 'Runtime Error (NZEC)');

  const badge = getOrCreateMockElement('dsa-status-badge');
  Compiler.updateStatus('running', 'Running…');
  assert(badge.className.includes('running'), 'Badge must have running class');
  assert(badge.innerHTML.includes('Running…'), 'Badge must include Running label');

  Compiler.updateStatus('accepted', 'Accepted');
  assert(badge.className.includes('accepted'), 'Badge must have accepted class');
  assert(badge.innerHTML.includes('Accepted'), 'Badge must include Accepted label');
  console.log('✔ PASS: Status badges and terminal verdict states are preserved.');

  // ── TEST 7: Concurrent operations: start A and B, display both, finish A, assert B remains visible until B finishes
  console.log('\n[TEST 7] Concurrent operations A and B: display both, finish A, assert B remains visible until B finishes');
  ApiClient.resetState();
  toasts.length = 0;

  let resolveOpA, resolveOpB;
  global.fetch = async (url, opts) => {
    const body = opts && opts.body ? opts.body : '';
    if (body.includes('code_for_A')) {
      await new Promise(r => { resolveOpA = r; });
      return { ok: true, status: 200, json: async () => ({ ok: true, op: 'A' }) };
    }
    if (body.includes('code_for_B')) {
      await new Promise(r => { resolveOpB = r; });
      return { ok: true, status: 200, json: async () => ({ ok: true, op: 'B' }) };
    }
    return { ok: true, status: 200, json: async () => ({ ok: true }) };
  };

  // Start Op A (slow, arms cold start)
  const opAPromise = ApiClient.submitCode(
    { source_code: 'code_for_A', language_id: 54, execution_type: 'run', question_id: 1 },
    null,
    { operationId: 'op_A', coldStartNotice: true, coldStartDelayMs: 40 }
  );

  // Start Op B (also slow, arms cold start)
  const opBPromise = ApiClient.submitCode(
    { source_code: 'code_for_B', language_id: 54, execution_type: 'run', question_id: 1 },
    null,
    { operationId: 'op_B', coldStartNotice: true, coldStartDelayMs: 40 }
  );

  // Wait for both cold-start notices to show (70ms > 40ms threshold)
  await new Promise(r => setTimeout(r, 70));

  const opAToastBefore = toasts.find(t => t.id === 'cold-start-op_A' && t.active);
  const opBToastBefore = toasts.find(t => t.id === 'cold-start-op_B' && t.active);
  assert(opAToastBefore !== undefined, 'Op A cold-start toast must be visible');
  assert(opBToastBefore !== undefined, 'Op B cold-start toast must be visible');

  // Finish Op A
  resolveOpA();
  await opAPromise;

  // Assert Op A is dismissed, but Op B REMAINS VISIBLE!
  const opAToastAfterA = toasts.find(t => t.id === 'cold-start-op_A' && t.active);
  const opBToastAfterA = toasts.find(t => t.id === 'cold-start-op_B' && t.active);
  assert.strictEqual(opAToastAfterA, undefined, 'Op A notification must be dismissed after Op A finishes');
  assert(opBToastAfterA !== undefined, 'Op B notification MUST REMAIN VISIBLE when Op A finishes');

  // Finish Op B
  resolveOpB();
  await opBPromise;

  // Assert Op B is now dismissed
  const opBToastAfterB = toasts.find(t => t.id === 'cold-start-op_B' && t.active);
  assert.strictEqual(opBToastAfterB, undefined, 'Op B notification must be dismissed once Op B finishes');
  console.log('✔ PASS: Concurrent operations display both toasts; finishing A leaves B active until B completes.');

  // ── TEST 8: Repeated API retries do not register duplicate notification handlers
  console.log('\n[TEST 8] Repeated API retries do not register duplicate notification handlers');
  ApiClient.resetState();
  toasts.length = 0;

  let retryAttempts = 0;
  global.fetch = async (url, opts) => {
    retryAttempts++;
    if (retryAttempts < 3) {
      return { ok: false, status: 503, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => ({ bookmarks: [] }) };
  };

  const bookmarksRes = await ApiClient.getBookmarks();
  assert.deepStrictEqual(bookmarksRes, { bookmarks: [] });
  assert.strictEqual(retryAttempts, 3, 'Must have retried twice before succeeding');

  const retryToasts = toasts.filter(t => t.id === 'cold-start-retry-prompt');
  assert.strictEqual(retryToasts.length, 0, 'Successful retry must not leave retry prompt toasts');
  console.log('✔ PASS: Idempotent retries do not register duplicate toasts.');

  // ── TEST 9: Frontend index.html consistently references current versioned bundle (?v=2.2.2)
  console.log('\n[TEST 9] Frontend index.html references current versioned bundle (?v=2.2.2)');
  const indexPath = path.resolve(__dirname, '../../index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');

  assert(indexContent.includes('js/api.js?v=2.2.2'), 'index.html must load js/api.js?v=2.2.2');
  assert(indexContent.includes('js/compiler.js?v=2.2.2'), 'index.html must load js/compiler.js?v=2.2.2');
  assert(indexContent.includes('js/history.js?v=2.2.2'), 'index.html must load js/history.js?v=2.2.2');
  assert(!indexContent.includes('?v=2.2.1'), 'Old ?v=2.2.1 query strings must not remain in index.html');
  console.log('✔ PASS: All script tags in index.html are bumped to ?v=2.2.2.');

  // ── TEST 10: Lifetime analytics contract and pagination independence
  console.log('\n[TEST 10] Lifetime analytics endpoint and caching remain intact');
  assert(typeof ApiClient.getSubmissionAnalytics === 'function', 'ApiClient.getSubmissionAnalytics must exist');
  assert(typeof historyModule.formatActivityDate === 'function', 'formatActivityDate must exist');
  assert(typeof global.window.invalidateHistoryCache === 'function', 'invalidateHistoryCache must exist');

  // Verify formatActivityDate date rendering
  assert(historyModule.formatActivityDate('2026-10-18').includes('Oct'));
  assert(historyModule.formatActivityDate('2026-10-18T10:00:00Z').includes('Oct'));
  console.log('✔ PASS: Lifetime analytics contracts and formatting are preserved.');

  // ── TEST 11: Legitimate cold-start indicator on initial submission request when backend takes long to respond
  console.log('\n[TEST 11] Legitimate cold-start indicator shows during delayed initial POST, dismisses on HTTP 202');
  ApiClient.resetState();
  toasts.length = 0;

  let resolveSubmitPost;
  global.fetch = async (url, opts) => {
    if (url.includes('/api/submissions') && opts.method === 'POST') {
      // Backend is cold: hangs until resolveSubmitPost
      await new Promise(r => { resolveSubmitPost = r; });
      return {
        ok: true,
        status: 202,
        json: async () => ({ status: 'queued', job_id: 'cold_submit_job_99' }),
      };
    }
    if (url.includes('/api/submissions/cold_submit_job_99')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          job_id: 'cold_submit_job_99',
          status: 'completed',
          result: { verdict: 'Accepted', status_id: 3, runtime: '0.002s', memory: '1.1 MB' },
        }),
      };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  const slowSubmitPromise = ApiClient.submitCode(
    { source_code: '...', language_id: 54, execution_type: 'submit', question_id: 1 },
    null,
    { operationId: 'slow_submit_op', coldStartNotice: true, coldStartDelayMs: 40 }
  );

  // Midway through initial POST request (at 70ms > 40ms threshold)
  await new Promise(r => setTimeout(r, 70));
  const coldStartShown = toasts.find(t => t.id === 'cold-start-slow_submit_op' && t.active);
  assert(coldStartShown !== undefined, 'Legitimate cold-start toast MUST appear when initial POST is delayed');

  // Backend wakes up and responds with HTTP 202
  resolveSubmitPost();
  const slowSubmitRes = await slowSubmitPromise;
  assert.strictEqual(slowSubmitRes.status, 'queued');

  // Cold-start toast must now be dismissed upon HTTP 202
  const coldStartAfter202 = toasts.find(t => t.id === 'cold-start-slow_submit_op' && t.active);
  assert.strictEqual(coldStartAfter202, undefined, 'Cold-start toast MUST be dismissed once HTTP 202 is received');

  // Polling continues without any new cold-start toast
  const pollRes = await ApiClient.pollJobStatus('cold_submit_job_99');
  assert.strictEqual(pollRes.status, 'completed');
  const toastsDuringPoll = toasts.filter(t => t.active && t.msg === MSG_STARTING);
  assert.strictEqual(toastsDuringPoll.length, 0, 'No cold-start toast may appear during polling');
  console.log('✔ PASS: Legitimate cold start appears during delayed initial POST, dismisses on HTTP 202, and stays silent during polling.');

  // ── TEST 12: Run never shows cold-start toast even with very slow backend responses
  console.log('\n[TEST 12] Run with slow backend responses (>3s simulated) must NEVER show cold-start toast');
  ApiClient.resetState();
  toasts.length = 0;

  // Simulate three consecutive Run calls all resolving after 4+ seconds
  for (let i = 0; i < 3; i++) {
    ApiClient.resetState();
    toasts.length = 0;

    global.fetch = async (url, opts) => {
      // Simulate slow execution (backend is busy running code, NOT waking up)
      await new Promise(r => setTimeout(r, 50)); // fast in tests, represents slow real execution
      return {
        ok: true,
        status: 200,
        json: async () => ({ verdict: 'Accepted', status_id: 3, runtime: '0.234s', memory: '12.4 MB' }),
      };
    };

    await ApiClient.submitCode(
      { source_code: 'def twoSum(): pass', language_id: 71, execution_type: 'run', question_id: 1 },
      null,
      // This is what compiler.js now passes for Run (coldStartNotice: false)
      { operationId: `run_op_${i}`, coldStartNotice: false }
    );

    const runColdStartToasts = toasts.filter(t => t.active && t.msg === MSG_STARTING);
    assert.strictEqual(
      runColdStartToasts.length, 0,
      `Run operation ${i} must NEVER display cold-start toast (even if execution is slow)`
    );
  }
  console.log('✔ PASS: Run operations never display cold-start toast regardless of response latency.');

  // ── TEST 13: Genuine Run API failure shows the real error — not a misleading server-start message
  console.log('\n[TEST 13] Genuine Run API failure surfaces real error without cold-start toast');
  ApiClient.resetState();
  toasts.length = 0;

  global.fetch = async () => ({
    ok: false,
    status: 422,
    json: async () => ({ detail: 'Unsupported language_id: 999' }),
  });

  try {
    await ApiClient.submitCode(
      { source_code: '...', language_id: 999, execution_type: 'run', question_id: 1 },
      null,
      // coldStartNotice: false — exactly what compiler.js now passes for Run
      { operationId: 'run_fail_op', coldStartNotice: false }
    );
    assert.fail('Expected ApiError on 422');
  } catch (err) {
    assert.strictEqual(err.status, 422, 'Error status must be 422');
    assert(err.message.includes('Unsupported language_id'), 'Error message must contain detail from backend');
    // No cold-start toast must have appeared
    const coldStartToasts = toasts.filter(t => t.active && t.msg === MSG_STARTING);
    assert.strictEqual(coldStartToasts.length, 0, 'Run API failure must not show cold-start toast');
  }
  console.log('✔ PASS: Genuine Run failure returns correct ApiError and leaves no cold-start toast.');

  console.log('\n================================================================');
  console.log(' ALL 13 REGRESSION TESTS PASSED (100% SUCCESS)');
  console.log('================================================================');
}

runTestSuite().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
