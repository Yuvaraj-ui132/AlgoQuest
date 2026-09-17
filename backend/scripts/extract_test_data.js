#!/usr/bin/env node
/**
 * extract_test_data.js
 *
 * One-time extraction script.
 * Reads js/question-metadata.js and extracts test case data into
 * backend/data/test_cases.json for server-side use.
 *
 * What moves to the backend (test_cases.json):
 *   - sampleTests[].stdin       (combined stdin string)
 *   - sampleTests[].expectedRaw (raw output for comparison)
 *   - sampleTests[].input       (human-readable display)
 *   - sampleTests[].expected    (human-readable display)
 *   - hiddenTests[]             (stdin + expectedRaw — NEVER sent to browser)
 *   - compareMode
 *
 * What stays in question-metadata.js (frontend):
 *   - functionName, parameters, returnType  (needed for driver code generation)
 *   - starterCode                           (needed for Monaco editor templates)
 *   - sampleTests[].input/expected          (display only — already there)
 *   NOTE: sampleTests[].stdin and sampleTests[].expectedRaw are still in
 *         question-metadata.js for legacy reasons but the frontend no longer
 *         uses them for execution (the backend handles that now).
 *
 * Usage:
 *   node backend/scripts/extract_test_data.js
 *
 * Run from the project root (DSA Dashboard/).
 */

const fs = require('fs');
const path = require('path');

// ── Load question-metadata.js ─────────────────────────────────────────────────
const { execSync } = require('child_process');
const metadataPath = path.resolve(__dirname, '../../js/question-metadata.js');

let src = '';
// Prefer git HEAD which has the full unstripped test cases (stdin, expectedRaw, hiddenTests)
try {
  const headSrc = execSync('git show HEAD:js/question-metadata.js', {
    maxBuffer: 50 * 1024 * 1024,
    encoding: 'utf8'
  });
  if (headSrc && headSrc.includes('hiddenTests')) {
    src = headSrc;
    console.log('✓ Loaded full test metadata from git HEAD (includes hiddenTests).');
  }
} catch (e) {
  // Git show failed, fall back to file
}

if (!src) {
  if (!fs.existsSync(metadataPath)) {
    console.error('ERROR: Could not find js/question-metadata.js at', metadataPath);
    process.exit(1);
  }
  src = fs.readFileSync(metadataPath, 'utf8');
}

// Execute the file in a sandboxed context to populate QUESTION_METADATA_REGISTRY.
// The file uses window.QUESTION_METADATA_REGISTRY = { ... } — we mock window.
const sandbox = { window: {} };
try {
  const fn = new Function('window', src);
  fn(sandbox.window);
} catch (err) {
  console.error('ERROR: Failed to evaluate question-metadata.js:', err.message);
  process.exit(1);
}

const registry = sandbox.window.QUESTION_METADATA_REGISTRY;
if (!registry || typeof registry !== 'object') {
  console.error('ERROR: window.QUESTION_METADATA_REGISTRY not found');
  process.exit(1);
}

// ── Extract test data ─────────────────────────────────────────────────────────
const output = {};

for (const [qId, meta] of Object.entries(registry)) {
  const sampleTests = (meta.sampleTests || []).map(tc => ({
    // Display fields (also returned to frontend for sample tests)
    input:       tc.input    || '',
    expected:    tc.expected || '',
    // Execution fields (server-side only)
    stdin:       tc.stdin        || '',
    expectedRaw: tc.expectedRaw  || '',
  }));

  const hiddenTests = (meta.hiddenTests || []).map(tc => ({
    // Hidden tests: ONLY execution fields — no display fields
    stdin:       tc.stdin        || '',
    expectedRaw: tc.expectedRaw  || '',
  }));

  output[qId] = {
    id:          meta.id,
    name:        meta.name,
    compareMode: meta.compareMode || 'ordered',
    sampleTests,
    hiddenTests,
  };
}

// ── Write output ──────────────────────────────────────────────────────────────
const outputDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'test_cases.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');

const count = Object.keys(output).length;
const sampleCount = Object.values(output).reduce((s, q) => s + q.sampleTests.length, 0);
const hiddenCount = Object.values(output).reduce((s, q) => s + q.hiddenTests.length, 0);

console.log(`✓ Extracted ${count} questions`);
console.log(`  ${sampleCount} sample test cases`);
console.log(`  ${hiddenCount} hidden test cases`);
console.log(`  Output: ${outputPath}`);
console.log('');
console.log('Hidden test stdin/expectedRaw is now SERVER-SIDE ONLY.');
console.log('Add backend/data/test_cases.json to .gitignore if it contains sensitive data.');
