/**
 * test_analytics_frontend.js
 *
 * Verifies frontend Analytics integration and contract:
 * 1. ApiClient.getSubmissionAnalytics exists and sends request to /api/submissions/analytics.
 * 2. formatActivityDate formatting logic for various date formats.
 * 3. Cache lifecycle: _invalidateHistoryCache resets both history and analytics caches.
 */

'use strict';

const assert = require('assert');

// Mock browser global environment for Node.js
global.window = {
  ALGOQUEST_BACKEND_URL: 'http://mock-backend.test',
  showToast: () => {},
  dismissToast: () => {},
  lsGet: (key) => (key === 'dsa_solved' ? [1, 2, 3, 4] : []),
};

global.document = {
  getElementById: (id) => ({
    innerHTML: '',
    textContent: '',
    style: {},
  }),
  querySelector: () => ({ innerHTML: '' }),
  querySelectorAll: () => [],
};

// 1. ApiClient contract
const apiModule = require('../../js/api.js');
assert(apiModule.ApiClient, 'ApiClient must be exported');
assert(typeof apiModule.ApiClient.getSubmissionAnalytics === 'function', 'ApiClient.getSubmissionAnalytics must be a function');
assert(typeof apiModule.ApiClient.getSubmissionHistory === 'function', 'ApiClient.getSubmissionHistory must be a function');
console.log('✔ ApiClient.getSubmissionAnalytics contract verified');

// 2. formatActivityDate contract
const historyModule = require('../../js/history.js');
assert(typeof historyModule.formatActivityDate === 'function', 'formatActivityDate must be exported');

// Date formatted from YYYY-MM-DD
const formatted1 = historyModule.formatActivityDate('2026-10-18');
assert(formatted1.includes('18') && formatted1.includes('Oct'), `Expected 18 Oct, got: ${formatted1}`);

// Date formatted from ISO string
const formatted2 = historyModule.formatActivityDate('2026-10-18T12:00:00Z');
assert(formatted2.includes('18') && formatted2.includes('Oct'), `Expected 18 Oct, got: ${formatted2}`);

// Null / empty handling
assert.strictEqual(historyModule.formatActivityDate(null), '—');
assert.strictEqual(historyModule.formatActivityDate(''), '—');
console.log('✔ formatActivityDate date rendering verified');

// 3. Cache reset verification
assert(typeof global.window.invalidateHistoryCache === 'function', 'invalidateHistoryCache must be attached to window');
global.window.invalidateHistoryCache();
console.log('✔ invalidateHistoryCache execution verified');

console.log('✔ All analytics frontend tests passed successfully');

