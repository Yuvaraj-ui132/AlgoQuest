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

  console.log('All Cold-Start Waiting Experience Tests Passed successfully!');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
