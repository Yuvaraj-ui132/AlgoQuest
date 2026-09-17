#!/usr/bin/env node
/**
 * strip_client_test_data.js
 *
 * Priority 1 hardening — removes execution-only data from question-metadata.js.
 * After running extract_test_data.js, the backend owns all test case data.
 * The frontend only needs what the driver-code generator and UI display require.
 *
 * REMOVES from question-metadata.js:
 *   - hiddenTests[]          (secret test cases — now server-side only)
 *   - sampleTests[].stdin    (execution stdin — backend constructs this)
 *   - sampleTests[].expectedRaw (comparison string — backend does comparison)
 *
 * KEEPS:
 *   - id, name               (identification)
 *   - compareMode            (harmless, kept for reference)
 *   - functionName, parameters, returnType  (driver code generation)
 *   - starterCode            (Monaco editor templates)
 *   - sampleTests[].input    (human-readable display)
 *   - sampleTests[].expected (human-readable display)
 *
 * Usage (run from project root):
 *   node backend/scripts/strip_client_test_data.js
 *
 * IMPORTANT: Run extract_test_data.js FIRST to ensure test data is safely
 * copied to backend/data/test_cases.json before stripping from frontend.
 */

const fs = require('fs');
const path = require('path');

// ── Verify backend test data exists before stripping frontend ──────────────────
const testDataPath = path.resolve(__dirname, '../data/test_cases.json');
if (!fs.existsSync(testDataPath)) {
  console.error('ERROR: backend/data/test_cases.json does not exist.');
  console.error('Run extract_test_data.js first to copy test data to the backend.');
  process.exit(1);
}
const backendData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
const backendCount = Object.keys(backendData).length;
console.log(`✓ Verified backend/data/test_cases.json exists (${backendCount} questions)`);

// ── Load question-metadata.js ─────────────────────────────────────────────────
const metadataPath = path.resolve(__dirname, '../../js/question-metadata.js');
if (!fs.existsSync(metadataPath)) {
  console.error('ERROR: Could not find js/question-metadata.js');
  process.exit(1);
}

const src = fs.readFileSync(metadataPath, 'utf8');

// Check if already stripped (idempotent)
if (!src.includes('hiddenTests') && !src.includes('expectedRaw') && !src.includes('"stdin"')) {
  console.log('ℹ question-metadata.js has already been stripped. Nothing to do.');
  process.exit(0);
}

// ── Evaluate in sandbox ───────────────────────────────────────────────────────
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
  console.error('ERROR: window.QUESTION_METADATA_REGISTRY not found.');
  process.exit(1);
}

// ── Strip sensitive fields ────────────────────────────────────────────────────
let removedHiddenTests = 0;
let removedStdin = 0;
let removedExpectedRaw = 0;

const cleaned = {};
for (const [qId, meta] of Object.entries(registry)) {
  removedHiddenTests += (meta.hiddenTests || []).length;

  const cleanedSampleTests = (meta.sampleTests || []).map(tc => {
    const clean = {};
    if (tc.input    !== undefined) clean.input    = tc.input;
    if (tc.expected !== undefined) clean.expected = tc.expected;
    if (tc.stdin        !== undefined) removedStdin++;
    if (tc.expectedRaw  !== undefined) removedExpectedRaw++;
    // REMOVED: stdin, expectedRaw
    return clean;
  });

  cleaned[qId] = {};
  // Preserve field order for readability
  if (meta.id            !== undefined) cleaned[qId].id            = meta.id;
  if (meta.name          !== undefined) cleaned[qId].name          = meta.name;
  if (meta.compareMode   !== undefined) cleaned[qId].compareMode   = meta.compareMode;
  if (meta.functionName  !== undefined) cleaned[qId].functionName  = meta.functionName;
  if (meta.parameters    !== undefined) cleaned[qId].parameters    = meta.parameters;
  if (meta.returnType    !== undefined) cleaned[qId].returnType    = meta.returnType;
  if (meta.starterCode   !== undefined) cleaned[qId].starterCode   = meta.starterCode;
  cleaned[qId].sampleTests = cleanedSampleTests;
  // hiddenTests: intentionally omitted
}

// ── Write back ────────────────────────────────────────────────────────────────
const header = `/**
 * question-metadata.js — AlgoQuest DSA Dashboard
 *
 * SECURITY HARDENING (Priority 1):
 *   Test execution data has been removed from this file and moved to
 *   backend/data/test_cases.json (server-side, never served to browser).
 *
 * This file contains ONLY what the client-side code needs:
 *   - functionName, parameters, returnType  → driver code generation (compiler.js)
 *   - starterCode                           → Monaco editor language templates
 *   - sampleTests[].input / .expected      → human-readable UI display
 *   - compareMode                          → reference only (unused client-side)
 *
 * REMOVED:
 *   - hiddenTests[]          (secret — server-side only)
 *   - sampleTests[].stdin    (execution — backend constructs this)
 *   - sampleTests[].expectedRaw (comparison — backend does this)
 */

window.QUESTION_METADATA_REGISTRY = `;

const body = JSON.stringify(cleaned, null, 2);
const output = header + body + ';\n';

// Backup original before overwriting
const backupPath = metadataPath + '.bak';
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(metadataPath, backupPath);
  console.log(`✓ Backup saved to js/question-metadata.js.bak`);
}

fs.writeFileSync(metadataPath, output, 'utf8');

const origSize = src.length;
const newSize  = output.length;
const reduction = ((1 - newSize / origSize) * 100).toFixed(1);

console.log(`\n✓ question-metadata.js stripped successfully`);
console.log(`  Questions:          ${Object.keys(cleaned).length}`);
console.log(`  Removed hiddenTests: ${removedHiddenTests} test cases`);
console.log(`  Removed stdin:       ${removedStdin} entries`);
console.log(`  Removed expectedRaw: ${removedExpectedRaw} entries`);
console.log(`  File size: ${(origSize/1024).toFixed(1)} KB → ${(newSize/1024).toFixed(1)} KB (${reduction}% reduction)`);
console.log(`\nHidden test cases and comparison data are now SERVER-SIDE ONLY.`);
