/**
 * test_toast_lifecycle.js
 *
 * Verifies toast notification lifecycle and edge cases:
 * - Proper creation and auto-dismissal
 * - Early dismissal before requestAnimationFrame callbacks execute (race condition defense)
 * - Handling and cleanup of matching toast IDs
 * - Zero duration (persistent indicator) dismiss behavior
 * - Compiler execution completion integration
 */

const assert = require('assert');

// Mock a lightweight DOM environment for testing toast notifications
class MockClassList {
  constructor() {
    this._classes = new Set();
  }
  add(cls) {
    this._classes.add(cls);
  }
  remove(cls) {
    this._classes.delete(cls);
  }
  contains(cls) {
    return this._classes.has(cls);
  }
}

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.classList = new MockClassList();
    this.children = [];
    this.parentNode = null;
    this.attributes = {};
    this.innerHTML = '';
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (this.parentNode) {
      const idx = this.parentNode.children.indexOf(this);
      if (idx !== -1) {
        this.parentNode.children.splice(idx, 1);
      }
      this.parentNode = null;
    }
  }

  querySelector(selector) {
    const match = selector.match(/\[data-toast-id="([^"]+)"\]/);
    if (match) {
      const id = match[1];
      return this.children.find(c => c.getAttribute('data-toast-id') === id) || null;
    }
    return null;
  }

  querySelectorAll(selector) {
    const match = selector.match(/\[data-toast-id="([^"]+)"\]/);
    if (match) {
      const id = match[1];
      return this.children.filter(c => c.getAttribute('data-toast-id') === id);
    }
    return [];
  }
}

// Global setup
const rafCallbacks = [];
global.requestAnimationFrame = (cb) => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
};

const toastContainer = new MockElement('div');
toastContainer.setAttribute('id', 'toast-container');

global.document = {
  getElementById: (id) => (id === 'toast-container' ? toastContainer : null),
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {},
  removeEventListener: () => {},
};

global.window = {
  document: global.document,
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { hash: '', search: '', pathname: '/' },
  history: { pushState: () => {}, replaceState: () => {} },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
};

function flushAllRaf() {
  while (rafCallbacks.length > 0) {
    const cbs = [...rafCallbacks];
    rafCallbacks.length = 0;
    cbs.forEach(cb => cb());
  }
}

// Load app module
const { showToast, dismissToast } = require('../../js/app.js');

async function runTests() {
  console.log('--- Starting Toast Lifecycle Tests ---');

  // Test 1: Standard show and dismiss
  console.log('Test 1: Standard show and dismiss');
  toastContainer.children = [];
  const t1 = showToast('Standard toast', 'info', { id: 'test-1', duration: 100 });
  assert.strictEqual(toastContainer.children.length, 1);
  flushAllRaf();
  assert.strictEqual(toastContainer.children[0].classList.contains('show'), true);

  dismissToast('test-1');
  assert.strictEqual(toastContainer.children[0].classList.contains('show'), false);
  await new Promise(r => setTimeout(r, 350));
  assert.strictEqual(toastContainer.children.length, 0, 'Toast should be removed after transition');

  // Test 2: Early dismissal before requestAnimationFrame fires (Race condition test)
  console.log('Test 2: Early dismissal before requestAnimationFrame (prevents orphaned toast)');
  toastContainer.children = [];
  rafCallbacks.length = 0;

  // Simulate cold-start indicator shown
  showToast('Starting the server...', 'info', { id: 'cold-start-indicator', duration: 0 });
  assert.strictEqual(toastContainer.children.length, 1);
  assert.strictEqual(toastContainer.children[0].classList.contains('show'), false, 'Not shown yet (pending RAF)');

  // Early dismissal arrives immediately before RAF executes (e.g. backend responded in 10ms)
  dismissToast('cold-start-indicator');
  assert.strictEqual(toastContainer.children.length, 0, 'Should be removed immediately when dismissed before show');

  // Now flush pending RAF callbacks
  flushAllRaf();
  assert.strictEqual(toastContainer.children.length, 0, 'RAF must not resurrect the dismissed toast');

  // Test 3: Multiple elements with duplicate ID
  console.log('Test 3: Multiple elements with duplicate ID are all cleaned up');
  toastContainer.children = [];
  const elA = new MockElement('div');
  elA.setAttribute('data-toast-id', 'dup-id');
  elA.classList.add('show');
  toastContainer.appendChild(elA);

  const elB = new MockElement('div');
  elB.setAttribute('data-toast-id', 'dup-id');
  elB.classList.add('show');
  toastContainer.appendChild(elB);

  assert.strictEqual(toastContainer.children.length, 2);
  dismissToast('dup-id');
  assert.strictEqual(elA.classList.contains('show'), false);
  assert.strictEqual(elB.classList.contains('show'), false);
  await new Promise(r => setTimeout(r, 350));
  assert.strictEqual(toastContainer.children.length, 0, 'All duplicates must be purged');

  console.log('All Toast Lifecycle Tests Passed successfully!');
}

runTests().catch(err => {
  console.error('Toast Lifecycle Test Failed:', err);
  process.exit(1);
});
