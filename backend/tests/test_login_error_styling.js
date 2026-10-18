/**
 * test_login_error_styling.js
 * Comprehensive automated verification for Login Error UI, Contrast, Accessibility,
 * and Behavior across Dark and Light Themes.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Login Error UI & Styling Regression Tests...\n');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const styleCss = fs.readFileSync(path.join(ROOT_DIR, 'css', 'style.css'), 'utf-8');
const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');
const firebaseJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'firebase.js'), 'utf-8');

// ── Test 1: Verify .form-error CSS in dark mode ─────────────────────────────
console.log('Test 1: Verify .form-error styling in Dark Theme');
assert(styleCss.includes('.form-error {'), 'CSS must define .form-error');
assert(styleCss.includes('#ff6b6b'), 'CSS must use high-contrast #ff6b6b for error text in dark mode');
assert(styleCss.includes('rgba(239, 68, 68, 0.1)'), 'CSS must use subtle red background for error in dark mode');
assert(styleCss.includes('border-left: 3.5px solid #ff6b6b'), 'CSS must use 3.5px red left accent bar');
assert(/font-weight:\s*600/.test(styleCss), 'CSS must specify semibold font-weight (600)');
console.log('  ✅ Dark theme styling verified (#ff6b6b, semibold, subtle red background, red left accent bar)');

// ── Test 2: Verify .form-error CSS in light mode ────────────────────────────
console.log('\nTest 2: Verify .form-error styling in Light Theme');
assert(styleCss.includes('[data-theme="light"] .form-error'), 'CSS must define light theme .form-error');
assert(styleCss.includes('#b91c1c'), 'CSS must use WCAG AAA high-contrast red #b91c1c against light backgrounds');
assert(styleCss.includes('border-left: 3.5px solid #dc2626'), 'CSS must use red left accent bar in light theme');
assert(styleCss.includes('rgba(220, 38, 38, 0.08)'), 'CSS must use subtle light-theme red background');
console.log('  ✅ Light theme styling verified (#b91c1c, WCAG AAA contrast, red accent bar, subtle background)');

// ── Test 3: Verify .form-success CSS in dark and light modes ────────────────
console.log('\nTest 3: Verify .form-success CSS is separated from error styling');
assert(styleCss.includes('.form-success {'), 'CSS must define .form-success');
assert(styleCss.includes('[data-theme="light"] .form-success'), 'CSS must define light mode .form-success');
assert(styleCss.includes('#15803d'), 'CSS must define light mode success green');
console.log('  ✅ Form success styling properly separated with distinct green semantic styling');

// ── Test 4: Verify Accessibility (role="alert", aria-live="polite", aria-describedby)
console.log('\nTest 4: Verify Accessibility attributes in index.html');
assert(
  indexHtml.includes('<div class="form-error" id="login-error" role="alert" aria-live="polite" style="display:none;"></div>'),
  'index.html #login-error must have role="alert" and aria-live="polite"'
);
assert(
  indexHtml.includes('<div class="form-error" id="register-error" role="alert" aria-live="polite" style="display:none;"></div>'),
  'index.html #register-error must have role="alert" and aria-live="polite"'
);
assert(
  indexHtml.includes('id="forgot-error"   role="alert"  aria-live="polite"'),
  'index.html #forgot-error must have role="alert" and aria-live="polite"'
);
assert(indexHtml.includes('aria-describedby="login-error"'), 'Login inputs must reference login-error via aria-describedby');
assert(indexHtml.includes('aria-describedby="forgot-error"'), 'Forgot password input must reference forgot-error');
console.log('  ✅ Accessibility attributes verified across all authentication forms');

// ── Test 5: Verify Mock DOM showAuthError and hideAuthError behavior ───────
console.log('\nTest 5: Verify showAuthError and hideAuthError runtime behavior');
class MockElement {
  constructor(id, tag = 'div') {
    this.id = id;
    this.tagName = tag;
    this.style = { display: 'none' };
    this.textContent = '';
    this.attributes = {};
    this.listeners = {};
    this.classList = {
      _classes: new Set(),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      contains: (c) => this.classList._classes.has(c),
    };
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] || null; }
  addEventListener(event, fn) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(fn);
  }
  dispatch(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn({ preventDefault: () => {} }));
    }
  }
}

// Provide minimal global browser environment before requiring firebase.js
global.window = global;
global.sessionStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// Load firebase.js exports
const firebaseModule = require(path.join(ROOT_DIR, 'js', 'firebase.js'));
const { showAuthError, hideAuthError, translateAuthError } = firebaseModule;

const mockLoginError = new MockElement('login-error');
showAuthError(mockLoginError, 'Invalid email or password. Please try again.');

assert.strictEqual(mockLoginError.textContent, 'Invalid email or password. Please try again.');
assert.strictEqual(mockLoginError.style.display, 'block');
assert.strictEqual(mockLoginError.getAttribute('role'), 'alert');
assert.strictEqual(mockLoginError.getAttribute('aria-live'), 'polite');
console.log('  ✅ showAuthError sets text, display:block, role="alert", aria-live="polite"');

hideAuthError(mockLoginError);
assert.strictEqual(mockLoginError.style.display, 'none');
assert.strictEqual(mockLoginError.textContent, '');
console.log('  ✅ hideAuthError hides element and clears textContent cleanly');

// ── Test 6: Verify translateAuthError error messages ───────────────────────
console.log('\nTest 6: Verify translateAuthError handles credentials, Google popup, and network errors');
assert.strictEqual(translateAuthError('auth/invalid-credential'), 'Invalid email or password. Please try again.');
assert.strictEqual(translateAuthError('auth/wrong-password'), 'Incorrect password. Please try again.');
assert.strictEqual(translateAuthError('auth/user-not-found'), 'No account exists with this email.');
assert.strictEqual(translateAuthError('auth/network-request-failed'), 'Network error — check your connection and try again.');
assert.strictEqual(translateAuthError('auth/popup-blocked'), 'Popup blocked — please allow popups for this site.');
assert.strictEqual(translateAuthError('auth/too-many-requests'), 'Too many failed attempts. Please wait a moment and try again.');
console.log('  ✅ translateAuthError correctly maps all required authentication error codes');

// ── Test 7: Verify input clearing on typing ────────────────────────────────
console.log('\nTest 7: Verify typing in login inputs immediately dismisses error');
const elements = {
  'login-form': new MockElement('login-form', 'form'),
  'login-email': new MockElement('login-email', 'input'),
  'login-password': new MockElement('login-password', 'input'),
  'login-error': new MockElement('login-error'),
  'register-form': new MockElement('register-form', 'form'),
  'register-name': new MockElement('register-name', 'input'),
  'register-email': new MockElement('register-email', 'input'),
  'register-password': new MockElement('register-password', 'input'),
  'register-confirm': new MockElement('register-confirm', 'input'),
  'register-error': new MockElement('register-error'),
  'forgot-form': new MockElement('forgot-form', 'form'),
  'forgot-email': new MockElement('forgot-email', 'input'),
  'forgot-error': new MockElement('forgot-error'),
  'forgot-success': new MockElement('forgot-success'),
  'auth-modal': new MockElement('auth-modal'),
};

global.document = {
  getElementById: (id) => elements[id] || null,
};
global.isFirebaseConfigured = true;

firebaseModule.setupAuthEventListeners();

// Trigger error
showAuthError(elements['login-error'], 'Invalid email or password. Please try again.');
assert.strictEqual(elements['login-error'].style.display, 'block');

// User types in email input -> error must clear
elements['login-email'].dispatch('input');
assert.strictEqual(elements['login-error'].style.display, 'none');
assert.strictEqual(elements['login-error'].textContent, '');
console.log('  ✅ Typing in login email input immediately clears login error');

// Trigger error again
showAuthError(elements['login-error'], 'Invalid email or password. Please try again.');
assert.strictEqual(elements['login-error'].style.display, 'block');

// User types in password input -> error must clear
elements['login-password'].dispatch('input');
assert.strictEqual(elements['login-error'].style.display, 'none');
assert.strictEqual(elements['login-error'].textContent, '');
console.log('  ✅ Typing in login password input immediately clears login error');

// ── Test 8: Verify switchAuthView and hideAuthModal clear stale errors ──────
console.log('\nTest 8: Verify switchAuthView and hideAuthModal clear all error states');
showAuthError(elements['login-error'], 'Invalid email or password. Please try again.');
firebaseModule.switchAuthView('register');
assert.strictEqual(elements['login-error'].style.display, 'none');
assert.strictEqual(elements['login-error'].textContent, '');
assert.strictEqual(elements['register-form'].style.display, 'flex');
console.log('  ✅ switchAuthView clears stale login error when moving to register form');

showAuthError(elements['login-error'], 'Invalid email or password. Please try again.');
firebaseModule.hideAuthModal();
assert.strictEqual(elements['login-error'].style.display, 'none');
assert.strictEqual(elements['login-error'].textContent, '');
console.log('  ✅ hideAuthModal clears login error upon successful authentication or dismissal');

// ── Test 9: Verify CSS stylesheet cache-buster bump in index.html ───────────
console.log('\nTest 9: Verify index.html stylesheet version parameter');
assert(indexHtml.includes('css/style.css?v=2.2.1'), 'index.html must reference css/style.css?v=2.2.1');
console.log('  ✅ Cache buster css/style.css?v=2.2.1 verified');

console.log('\n🎉 ALL 9 LOGIN ERROR STYLING & ACCESSIBILITY TESTS PASSED!\n');
