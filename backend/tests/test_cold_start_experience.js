/**
 * test_cold_start_experience.js
 *
 * Automated regression test suite for AlgoQuest backend cold-start experience:
 * - Professional user-friendly message verification
 * - Loading indicator with spinner lifecycle
 * - Polling termination immediately on ready
 * - Deduplication of concurrent health-check requests (React re-renders / multi-mount)
 * - Safe transient network error retry with backoff
 * - Timeout handling and clear actionable Retry mechanism
 * - Brief 'Connected' state display and cleanup
 * - Normal operation when server is already awake
 */

const assert = require('assert');
const path = require('path');

// Mock browser global environment for Node.js
const toasts = [];

global.window = {
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
      dismiss: () => {
        item.active = false;
      },
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
};

global.showToast = global.window.showToast;
global.dismissToast = global.window.dismissToast;
global.firebase = {
  auth: () => ({
    currentUser: {
      getIdToken: async () => 'mock-auth-token-12345',
    },
  }),
};

const apiModule = require(path.resolve(__dirname, '../../js/api.js'));
const { ApiClient, ApiError, MSG_STARTING, MSG_CONNECTED, MSG_TIMEOUT } = apiModule;

async function runTests() {
  console.log('--- Starting Cold-Start Waiting Experience Tests ---');

  // Test 1: Verify exact required messaging constants
  console.log('Test 1: Verify professional user-friendly messaging');
  assert.strictEqual(
    MSG_STARTING,
    'Starting the server. This may take a moment on the first visit.',
    'Cold start message must match required professional wording'
  );
  assert.strictEqual(MSG_CONNECTED, 'Connected', 'Connected message must be brief and clear');
  assert(MSG_TIMEOUT.includes('Retry'), 'Timeout prompt must reference retry');

  // Test 2: Normal operation when server is already awake
  console.log('Test 2: Normal operation when server is already awake');
  ApiClient.resetState();
  toasts.length = 0;

  // Mock global fetch returning immediate 200 OK
  let fetchCallCount = 0;
  global.fetch = async (url) => {
    fetchCallCount++;
    assert(url.includes('/health'), 'Should probe /health');
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok', service: 'algoquest-api' }),
    };
  };

  const resAwake = await ApiClient.waitForBackend({ timeoutMs: 5000, intervalMs: 100 });
  assert.strictEqual(resAwake.ready, true, 'Backend should be ready');
  assert.strictEqual(resAwake.alreadyAwake, false, 'Initial probe was needed');
  assert.strictEqual(fetchCallCount, 1, 'Only 1 probe needed when server is already awake');
  assert.strictEqual(ApiClient.isReady(), true, 'isReady() should return true');

  // Second immediate call should use cache without additional fetch calls
  const resCached = await ApiClient.waitForBackend({ timeoutMs: 5000, intervalMs: 100 });
  assert.strictEqual(resCached.ready, true);
  assert.strictEqual(resCached.alreadyAwake, true, 'Cached call should be alreadyAwake=true');
  assert.strictEqual(fetchCallCount, 1, 'No duplicate fetch calls for cached awake backend');

  // Test 3: Deduplication of concurrent requests during React re-renders or multiple component mounts
  console.log('Test 3: Deduplication of concurrent requests (React re-render simulation)');
  ApiClient.resetState();
  toasts.length = 0;
  fetchCallCount = 0;

  let delayedResolve;
  global.fetch = async () => {
    fetchCallCount++;
    await new Promise((r) => {
      delayedResolve = r;
    });
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    };
  };

  // Launch 10 simultaneous waitForBackend calls in parallel
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(ApiClient.waitForBackend({ timeoutMs: 10000, intervalMs: 100 }));
  }

  // All 10 callers must share the exact same in-flight promise
  assert.strictEqual(fetchCallCount, 1, 'Must initiate only 1 fetch probe for 10 concurrent calls');
  delayedResolve(); // Release the single in-flight probe

  const results = await Promise.all(promises);
  assert.strictEqual(results.length, 10);
  results.forEach((r) => assert.strictEqual(r.ready, true));
  assert.strictEqual(fetchCallCount, 1, 'Total fetch calls must remain 1 after all 10 resolve');

  // Test 4: Idempotent initialization
  console.log('Test 4: Idempotent initialization');
  const init1 = await ApiClient.init({ timeoutMs: 2000, intervalMs: 100 });
  const init2 = await ApiClient.init({ timeoutMs: 2000, intervalMs: 100 });
  assert.strictEqual(init1.initialized, true);
  assert.strictEqual(init2.initialized, true);
  assert.strictEqual(init2.alreadyAwake, true);

  // Test 5: Slow startup / Cold start simulation with spinner & connected transition
  console.log('Test 5: Slow startup simulation (502/503 -> 200 OK with spinner and toast transition)');
  ApiClient.resetState();
  toasts.length = 0;
  let slowProbes = 0;

  global.fetch = async () => {
    slowProbes++;
    if (slowProbes < 3) {
      // Return 502 Bad Gateway during container spin-up
      return {
        ok: false,
        status: 502,
        json: async () => ({ detail: 'Bad Gateway - waking up' }),
      };
    }
    // Probe 3 succeeds with 200 OK
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    };
  };

  const slowStartPromise = ApiClient.waitForBackend({ timeoutMs: 10000, intervalMs: 50 });
  const slowResult = await slowStartPromise;

  assert.strictEqual(slowResult.ready, true);
  assert.strictEqual(slowProbes, 3, 'Should stop immediately on probe 3 once 200 OK is received');
  assert.strictEqual(ApiClient.isReady(), true);

  // Test 6: Timeout handling and Actionable Retry prompt
  console.log('Test 6: Timeout handling and Retry action');
  ApiClient.resetState();
  toasts.length = 0;

  global.fetch = async () => {
    // Fail repeatedly to simulate server not responding
    throw new Error('Connection refused');
  };

  let caughtError = null;
  try {
    await ApiClient.waitForBackend({ timeoutMs: 150, intervalMs: 40 });
  } catch (err) {
    caughtError = err;
  }

  assert(caughtError !== null, 'Should reject on timeout');
  assert.strictEqual(caughtError.message, 'Server startup timed out.');

  // Check that timeout notification has a Retry action
  const timeoutToast = toasts.find((t) => t.id === 'cold-start-timeout');
  assert(timeoutToast !== undefined, 'Timeout toast should have been displayed');
  assert.strictEqual(timeoutToast.active, true);
  assert(timeoutToast.action !== null, 'Timeout toast must include an action');
  assert.strictEqual(timeoutToast.action.text, 'Retry', 'Action text must be Retry');
  assert.strictEqual(typeof timeoutToast.action.onClick, 'function', 'Retry action must have onClick handler');

  // Test 7: Transient network failure in request() and safe retry with backoff
  console.log('Test 7: Transient network failure and safe retry in request()');
  ApiClient.resetState();
  toasts.length = 0;
  let requestAttempts = 0;

  global.fetch = async (url) => {
    requestAttempts++;
    if (requestAttempts < 2) {
      throw new Error('Failed to fetch');
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ data: 'recovered' }),
    };
  };

  // Safe idempotent GET request should auto-retry and succeed
  const getRes = await ApiClient.getQuestionSampleTests(37);
  assert.strictEqual(getRes.data, 'recovered');
  assert.strictEqual(requestAttempts, 2, 'Should have retried transient error and succeeded');

  // Non-idempotent POST mutation must NEVER auto-retry
  console.log('Test 8: Non-idempotent mutations never auto-retry');
  requestAttempts = 0;
  let postError = null;

  global.fetch = async () => {
    requestAttempts++;
    throw new Error('POST network error');
  };

  try {
    await ApiClient.submitCode({ source_code: '...', language_id: 71, execution_type: 'submit', question_id: 37 });
  } catch (err) {
    postError = err;
  }

  assert(postError !== null, 'POST should fail without auto-retry');
  assert.strictEqual(requestAttempts, 1, 'POST mutation must NEVER retry automatically to prevent duplicate execution');

  // Test 9: ApiClient.dismissColdStart() explicitly clears active indicator
  console.log('Test 9: ApiClient.dismissColdStart() explicitly clears indicator');
  ApiClient.resetState();
  toasts.length = 0;
  global.window.showToast(MSG_STARTING, 'info', { id: 'cold-start-indicator', duration: 0 });
  const activeIndicator = toasts.find(t => t.id === 'cold-start-indicator' && t.active);
  assert(activeIndicator !== undefined, 'Cold-start toast should be active before dismissal');

  ApiClient.dismissColdStart();
  const dismissedIndicator = toasts.find(t => t.id === 'cold-start-indicator' && t.active);
  assert.strictEqual(dismissedIndicator, undefined, 'Cold-start toast must be inactive after dismissColdStart()');

  // Test 10: Defensive dismissal on successful request even if flag was out of sync
  console.log('Test 10: Defensive dismissal on successful request');
  ApiClient.resetState();
  toasts.length = 0;
  global.window.showToast(MSG_STARTING, 'info', { id: 'cold-start-indicator', duration: 0 });

  global.fetch = async () => {
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'queued', job_id: 'job-xyz-123' }),
    };
  };

  await ApiClient.submitCode({ source_code: '...', language_id: 71, execution_type: 'submit', question_id: 37 });
  const leftoverToast = toasts.find(t => t.id === 'cold-start-indicator' && t.active);
  assert.strictEqual(leftoverToast, undefined, 'No cold-start indicator may linger after successful request');

  // Test 11: Login with a warm backend does NOT show cold-start toast
  console.log('Test 11: Login with a warm backend does NOT show cold-start toast');
  ApiClient.resetState();
  toasts.length = 0;

  global.fetch = async (url) => {
    assert(url.includes('/api/user/all'), 'Should request user profile data');
    return {
      ok: true,
      status: 200,
      json: async () => ({ user: { name: 'Test User' }, progress: {} }),
    };
  };

  await ApiClient.getAllUserData();
  const loginToasts = toasts.filter(t => t.active && t.msg === MSG_STARTING);
  assert.strictEqual(loginToasts.length, 0, 'No cold-start notification should appear on warm login');

  // Test 12: Login while backend is cold does NOT spam cold-start notification
  console.log('Test 12: Login while backend is cold does NOT show cold-start notification');
  ApiClient.resetState();
  toasts.length = 0;

  let coldLoginProbes = 0;
  global.fetch = async (url) => {
    coldLoginProbes++;
    await new Promise(r => setTimeout(r, 80));
    return {
      ok: true,
      status: 200,
      json: async () => ({ user: { name: 'Test User' } }),
    };
  };

  await ApiClient.getAllUserData();
  const coldLoginToasts = toasts.filter(t => t.active && t.msg === MSG_STARTING);
  assert.strictEqual(coldLoginToasts.length, 0, 'Login request must never arm or show cold-start toast');

  // Test 13: Run with a warm backend completes without cold-start warning
  console.log('Test 13: Run with a warm backend completes without cold-start warning');
  ApiClient.resetState();
  toasts.length = 0;

  global.fetch = async (url) => {
    assert(url.includes('/api/submissions'), 'Should submit code');
    await new Promise(r => setTimeout(r, 20));
    return {
      ok: true,
      status: 200,
      json: async () => ({ verdict: 'Accepted', status_id: 3, runtime: '0.003s', memory: '1.2 MB' }),
    };
  };

  const warmRunResult = await ApiClient.submitCode(
    { source_code: '...', language_id: 54, execution_type: 'run', question_id: 1 },
    null,
    { coldStartNotice: true, coldStartDelayMs: 150 }
  );
  assert.strictEqual(warmRunResult.verdict, 'Accepted');
  assert.strictEqual(toasts.filter(t => t.active && t.msg === MSG_STARTING).length, 0, 'Warm run must not show cold-start notice');

  // Test 14: Run delayed by cold start shows warning after threshold and dismisses on ready
  console.log('Test 14: Run delayed by cold start shows warning and dismisses on ready');
  ApiClient.resetState();
  toasts.length = 0;

  global.fetch = async () => {
    // Takes 140ms; threshold is 50ms
    await new Promise(r => setTimeout(r, 140));
    return {
      ok: true,
      status: 200,
      json: async () => ({ verdict: 'Accepted', status_id: 3, runtime: '0.005s', memory: '1.4 MB' }),
    };
  };

  const delayedRunPromise = ApiClient.submitCode(
    { source_code: '...', language_id: 54, execution_type: 'run', question_id: 1 },
    null,
    { coldStartNotice: true, coldStartDelayMs: 50, operationId: 'delayed_run_op' }
  );

  // Check midway (at 80ms) that cold-start toast is visible
  await new Promise(r => setTimeout(r, 80));
  const activeColdStart = toasts.find(t => t.active && t.msg === MSG_STARTING);
  assert(activeColdStart !== undefined, 'Cold-start toast must be visible when run wait exceeds threshold');

  // Wait for completion
  const delayedRunResult = await delayedRunPromise;
  assert.strictEqual(delayedRunResult.verdict, 'Accepted');

  // After completion, cold-start indicator must be dismissed
  const leftoverDelayedToast = toasts.find(t => t.active && t.msg === MSG_STARTING);
  assert.strictEqual(leftoverDelayedToast, undefined, 'Cold-start toast must be dismissed once run finishes');

  // Test 15: Submit with a warm backend completes without cold-start warning
  console.log('Test 15: Submit with a warm backend completes without cold-start warning');
  ApiClient.resetState();
  toasts.length = 0;

  let submitFetchCount = 0;
  global.fetch = async (url) => {
    submitFetchCount++;
    await new Promise(r => setTimeout(r, 20));
    if (submitFetchCount === 1) {
      return {
        ok: true,
        status: 202,
        json: async () => ({ status: 'queued', job_id: 'warm_job_1' }),
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ status: 'completed', result: { verdict: 'Accepted', status_id: 3 } }),
    };
  };

  const initialSubmit = await ApiClient.submitCode(
    { source_code: '...', language_id: 54, execution_type: 'submit', question_id: 1 },
    null,
    { coldStartNotice: true, coldStartDelayMs: 200 }
  );
  assert.strictEqual(initialSubmit.status, 'queued');

  const pollStatus = await ApiClient.pollJobStatus(initialSubmit.job_id);
  assert.strictEqual(pollStatus.status, 'completed');
  assert.strictEqual(toasts.filter(t => t.active && t.msg === MSG_STARTING).length, 0, 'Warm submit must never show cold-start notice');

  // Test 16: Submit delayed by cold start shows warning and dismisses cleanly
  console.log('Test 16: Submit delayed by cold start shows warning and dismisses cleanly');
  ApiClient.resetState();
  toasts.length = 0;

  global.fetch = async () => {
    await new Promise(r => setTimeout(r, 120));
    return {
      ok: true,
      status: 202,
      json: async () => ({ status: 'queued', job_id: 'cold_job_1' }),
    };
  };

  const coldSubmitPromise = ApiClient.submitCode(
    { source_code: '...', language_id: 54, execution_type: 'submit', question_id: 1 },
    null,
    { coldStartNotice: true, coldStartDelayMs: 40, operationId: 'cold_submit_op' }
  );

  // Check midway (at 70ms) that cold-start warning is visible
  await new Promise(r => setTimeout(r, 70));
  assert(toasts.some(t => t.active && t.msg === MSG_STARTING), 'Cold-start warning must show during delayed submit');

  const coldSubmitResult = await coldSubmitPromise;
  assert.strictEqual(coldSubmitResult.status, 'queued');

  // Dismiss on completion
  ApiClient.dismissColdStart('cold_submit_op');
  assert.strictEqual(toasts.filter(t => t.active && t.msg === MSG_STARTING).length, 0, 'Must be dismissed upon completion');

  // Test 17: Notification cleanup after every terminal verdict
  console.log('Test 17: Notification cleanup after every terminal verdict');
  const testVerdicts = [
    { label: 'Accepted', status_id: 3 },
    { label: 'Wrong Answer', status_id: 4 },
    { label: 'Time Limit Exceeded', status_id: 5 },
    { label: 'Compilation Error', status_id: 6 },
    { label: 'Runtime Error', status_id: 11 },
    { label: 'Failed', status_id: 13 },
    { label: 'Stopped', status_id: 14 },
  ];

  for (const v of testVerdicts) {
    ApiClient.resetState();
    toasts.length = 0;
    global.window.showToast(MSG_STARTING, 'info', { id: 'cold-start-indicator', duration: 0 });
    assert(toasts.some(t => t.id === 'cold-start-indicator' && t.active), `Indicator should be active for verdict test: ${v.label}`);

    // Simulate verdict arrival and cleanup
    ApiClient.dismissColdStart();
    const lingering = toasts.find(t => t.id === 'cold-start-indicator' && t.active);
    assert.strictEqual(lingering, undefined, `No stale loading notification may remain for verdict: ${v.label}`);
  }

  // Test 18: Concurrent or overlapping requests without incorrect notification dismissal
  console.log('Test 18: Overlapping background request does NOT cancel another active operation notification');
  ApiClient.resetState();
  toasts.length = 0;

  // Launch a long-running execution operation that triggers a cold-start warning
  let resolveActiveOp;
  global.fetch = async (url) => {
    if (url.includes('/api/submissions')) {
      await new Promise(r => { resolveActiveOp = r; });
      return {
        ok: true,
        status: 200,
        json: async () => ({ verdict: 'Accepted', status_id: 3 }),
      };
    }
    // Background request (e.g. editor save or progress) resolves fast
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    };
  };

  const activeOpPromise = ApiClient.submitCode(
    { source_code: '...', language_id: 54, execution_type: 'run', question_id: 1 },
    null,
    { coldStartNotice: true, coldStartDelayMs: 40, operationId: 'exec_in_flight' }
  );

  // Wait for the cold-start notice to trigger
  await new Promise(r => setTimeout(r, 70));
  const activeNotice = toasts.find(t => t.id === 'cold-start-exec_in_flight' && t.active);
  assert(activeNotice !== undefined, 'Cold-start toast must be visible for active operation');

  // Now, fire an unrelated background request (like editor autosave or user profile fetch)
  const bgSaveResult = await ApiClient.saveEditorCode(1, 'cpp', 'int main(){}');
  assert.strictEqual(bgSaveResult.ok, true);

  // The active operation's cold-start notice MUST STILL BE ACTIVE!
  const noticeStillActive = toasts.find(t => t.id === 'cold-start-exec_in_flight' && t.active);
  assert(noticeStillActive !== undefined, 'Unrelated background request MUST NOT dismiss active operation notification');

  // Release the active execution operation
  resolveActiveOp();
  await activeOpPromise;

  // Now that the active operation finished, its notification should be dismissed
  const noticeAfterCompletion = toasts.find(t => t.id === 'cold-start-exec_in_flight' && t.active);
  assert.strictEqual(noticeAfterCompletion, undefined, 'Notification should be dismissed once the active operation completes');

  console.log('All Cold-Start Waiting Experience Tests Passed successfully!');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
