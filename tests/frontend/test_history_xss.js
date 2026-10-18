/**
 * test_history_xss.js
 *
 * Regression test suite verifying that malicious verdict, question title,
 * runtime, memory, error messages, and question IDs in submission history
 * are sanitized and do not introduce XSS vectors.
 */

const assert = require('assert');
const path = require('path');

const historyModulePath = path.resolve(__dirname, '../../js/history.js');
const history = require(historyModulePath);

const {
  escapeHtml,
  buildSubmissionRowHtml,
  buildProblemSubmissionRowHtml,
} = history;

console.log('Running History XSS & Sanitization Regression Tests...');

// 1. Basic escapeHtml functionality
assert.strictEqual(
  escapeHtml('<script>alert("XSS")</script>'),
  '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
  'escapeHtml must escape <, >, and "'
);
assert.strictEqual(
  escapeHtml("Test & 'quotes'"),
  'Test &amp; &#039;quotes&#039;',
  'escapeHtml must escape & and \''
);
assert.strictEqual(escapeHtml(null), '', 'escapeHtml(null) should return empty string');
assert.strictEqual(escapeHtml(undefined), '', 'escapeHtml(undefined) should return empty string');
assert.strictEqual(escapeHtml(123), '123', 'escapeHtml(123) should cast number to string');

// 2. Malicious submission row with XSS payloads
const maliciousItem = {
  questionId: '42"><script>alert("XSS")</script>',
  verdict: '<img src=x onerror=alert("verdict_xss")>',
  language: 'cpp<script>alert("lang")</script>',
  passedCount: 25,
  totalCount: 25,
  runtime: '12ms<script>alert("rt")</script>',
  memory: '14MB<script>alert("mem")</script>',
  submittedAt: '2026-10-17T09:00:00Z"><script>alert("ts")</script>',
};

const rowHtml = buildSubmissionRowHtml(maliciousItem);

// Verify raw malicious tags are NOT present
assert(
  !rowHtml.includes('<script>'),
  'Malicious row must not contain unescaped <script> tag'
);
assert(
  !rowHtml.includes('<img'),
  'Malicious row must not contain unescaped <img> tag'
);
assert(
  rowHtml.includes('&lt;img src=x onerror=alert(&quot;verdict_xss&quot;)&gt;'),
  'Verdict must be safely HTML escaped'
);
assert(
  rowHtml.includes('onclick="window.openHistoryProblem(42)"'),
  'Question ID must be sanitized to integer in onclick handler'
);
assert(
  rowHtml.includes('data-qid="42"'),
  'Question ID must be sanitized to integer in data-qid attribute'
);

// 3. Malicious problem submission row (Problem Workspace panel)
const problemRowHtml = buildProblemSubmissionRowHtml({
  verdict: '<svg/onload=alert("svg_xss")>',
  language: 'java"><b onmouseover=alert(1)>',
  passedCount: 1,
  totalCount: 2,
  runtime: '0.05s"><script>',
  submittedAt: '2026-10-17T10:00:00Z',
});

assert(
  !problemRowHtml.includes('<svg/onload'),
  'Problem row must not contain unescaped svg/onload'
);
assert(
  !problemRowHtml.includes('<script>'),
  'Problem row must not contain unescaped <script>'
);
assert(
  problemRowHtml.includes('&lt;svg/onload=alert(&quot;svg_xss&quot;)&gt;'),
  'SVG XSS vector must be safely HTML escaped'
);
// 4. Malicious question title resolution & attribute escaping
if (typeof global !== 'undefined') {
  global.window = global.window || {};
  global.window.App = {
    questions: [
      { id: 99, name: '<script>alert("title_xss")</script>" onmouseover="alert(1)' },
    ],
  };
}

const itemWithMaliciousTitle = {
  questionId: 99,
  verdict: 'Accepted',
  language: 'python',
  passedCount: 10,
  totalCount: 10,
  runtime: '10ms',
  memory: '8MB',
  submittedAt: '2026-10-17T10:00:00Z',
};

const titleRowHtml = buildSubmissionRowHtml(itemWithMaliciousTitle);
assert(
  !titleRowHtml.includes('<script>alert("title_xss")</script>'),
  'Malicious title must not appear unescaped in row HTML'
);
assert(
  titleRowHtml.includes('&lt;script&gt;alert(&quot;title_xss&quot;)&lt;/script&gt;&quot; onmouseover=&quot;alert(1)'),
  'Malicious title must be properly escaped in both attribute and text content'
);
assert(
  titleRowHtml.includes('title="Open &lt;script&gt;alert(&quot;title_xss&quot;)&lt;/script&gt;&quot; onmouseover=&quot;alert(1)"'),
  'Title attribute must have quotes and tags safely escaped to prevent attribute breakout'
);

console.log('✓ All History XSS & Sanitization Regression Tests Passed successfully!');
