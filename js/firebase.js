/**
 * firebase.js — AlgoQuest DSA Dashboard
 * Firebase Authentication + Firestore Sync
 */

'use strict';

// ─────────────────────────────────────────────────────────────
// GUEST MODE STATE (Always false as Guest Mode is removed)
// ─────────────────────────────────────────────────────────────
window.isGuestMode = false;

// ─────────────────────────────────────────────────────────────
// UTILITY: EMAIL VALIDATION
// ─────────────────────────────────────────────────────────────
function isValidEmail(email) {
  // Requires: chars @ chars . chars(2+)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// ─────────────────────────────────────────────────────────────
// UTILITY: PASSWORD POLICY
// ─────────────────────────────────────────────────────────────
function getPasswordRequirements(pw) {
  return {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[^A-Za-z0-9]/.test(pw),
  };
}

function getPasswordScore(pw) {
  return Object.values(getPasswordRequirements(pw)).filter(Boolean).length;
}

function getStrengthInfo(score) {
  if (score <= 1) return { label: 'Weak',        cls: 'strength-weak',      pct: 20  };
  if (score === 2) return { label: 'Medium',      cls: 'strength-medium',    pct: 45  };
  if (score === 3) return { label: 'Strong',      cls: 'strength-strong',    pct: 72  };
  return              { label: 'Very Strong', cls: 'strength-verystrong', pct: 100 };
}

// ─────────────────────────────────────────────────────────────
// LIVE UI: Password requirements panel + strength bar
// ─────────────────────────────────────────────────────────────
function updatePasswordUI(pw) {
  const req   = getPasswordRequirements(pw);
  const score = getPasswordScore(pw);
  const info  = getStrengthInfo(score);

  // Requirement pill states
  const pillMap = {
    'req-length':    req.length,
    'req-uppercase': req.uppercase,
    'req-lowercase': req.lowercase,
    'req-number':    req.number,
    'req-special':   req.special,
  };
  Object.entries(pillMap).forEach(([id, ok]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('req-ok',   ok);
    el.classList.toggle('req-fail', !ok && pw.length > 0);
    el.querySelector('.req-icon').textContent = ok ? '✔' : '✖';
  });

  // Strength bar
  const bar      = document.getElementById('pw-strength-fill');
  const labelEl  = document.getElementById('pw-strength-label');
  if (bar) {
    bar.style.width = pw.length ? `${info.pct}%` : '0%';
    bar.className = 'pw-strength-fill' + (pw.length ? ` ${info.cls}` : '');
  }
  if (labelEl) {
    labelEl.textContent = pw.length ? info.label : '';
    labelEl.className   = 'pw-strength-text' + (pw.length ? ` ${info.cls}` : '');
  }
}

// ─────────────────────────────────────────────────────────────
// LIVE UI: Confirm password match indicator
// ─────────────────────────────────────────────────────────────
function updateConfirmMatchUI(pw, confirm) {
  const el = document.getElementById('confirm-match-msg');
  if (!el) return;
  if (!confirm) { el.textContent = ''; el.className = 'confirm-match-msg'; return; }
  if (pw === confirm) {
    el.textContent = '✔ Passwords match';
    el.className   = 'confirm-match-msg match-ok';
  } else {
    el.textContent = '✖ Passwords don\'t match';
    el.className   = 'confirm-match-msg match-fail';
  }
}

// ─────────────────────────────────────────────────────────────
// FULL-SCREEN LOADING OVERLAY HELPERS
// ─────────────────────────────────────────────────────────────
function showLoadingOverlay(titleText) {
  const overlay = document.getElementById('auth-loading-overlay');
  const title = document.getElementById('auth-loading-title');
  if (overlay && title) {
    title.textContent = titleText;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => {
      overlay.classList.add('active');
    });
  }
  toggleModalInputsDisabled(true);
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('auth-loading-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
      if (!overlay.classList.contains('active')) {
        overlay.style.display = 'none';
      }
    }, 250);
  }
  toggleModalInputsDisabled(false);
}

function toggleModalInputsDisabled(disabled) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;
  const elements = modal.querySelectorAll('input, button, a');
  elements.forEach(el => {
    if (disabled) {
      el.setAttribute('data-prev-tabindex', el.getAttribute('tabindex') || '');
      el.setAttribute('tabindex', '-1');
      if (el.tagName === 'BUTTON') {
        el.disabled = true;
      }
      if (el.tagName === 'A') {
        el.style.pointerEvents = 'none';
      }
    } else {
      const prev = el.getAttribute('data-prev-tabindex');
      if (prev) {
        el.setAttribute('tabindex', prev);
      } else {
        el.removeAttribute('tabindex');
      }
      if (el.tagName === 'BUTTON') {
        el.disabled = false;
      }
      if (el.tagName === 'A') {
        el.style.pointerEvents = 'auto';
      }
    }
  });
}

// ─────────────────────────────────────────────────────────────
// DOM READY: Wire all listeners
// ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupAuthEventListeners();
  checkInitialAuthState();
});

// ─────────────────────────────────────────────────────────────
// SETUP: All auth event listeners
// ─────────────────────────────────────────────────────────────
function setupAuthEventListeners() {

  // ── Login Form ───────────────────────────────────────────
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email     = document.getElementById('login-email').value.trim();
      const password  = document.getElementById('login-password').value;
      const errorDiv  = document.getElementById('login-error');
      const rememberMe = document.getElementById('remember-me')?.checked ?? false;

      if (!isFirebaseConfigured) {
        showAuthError(errorDiv, 'Firebase is not configured. Check js/firebase-config.js');
        return;
      }

      // Client-side email validation
      if (!isValidEmail(email)) {
        showAuthError(errorDiv, 'Please enter a valid email address (e.g. name@domain.com).');
        return;
      }

      showLoadingOverlay('Signing you in...');
      hideAuthError(errorDiv);

      try {
        // Apply persistence before sign-in
        const persistence = rememberMe
          ? firebase.auth.Auth.Persistence.LOCAL
          : firebase.auth.Auth.Persistence.SESSION;
        await auth.setPersistence(persistence);

        const credential = await auth.signInWithEmailAndPassword(email, password);
        const user = credential.user;
        // Mark sign-in time so ApiClient doesn't force-signout on initial 401s
        if (typeof window._apiClientOnSignIn === 'function') window._apiClientOnSignIn();

        const displayName = user.displayName
          || document.getElementById('user-profile-name')?.textContent
          || email.split('@')[0];
        showToast(`Welcome back, ${displayName}! 👋`, 'success');

      } catch (err) {
        showAuthError(errorDiv, translateAuthError(err.code));
      } finally {
        hideLoadingOverlay();
      }
    });
  }

  // ── Register Form ────────────────────────────────────────
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name      = document.getElementById('register-name').value.trim();
      const email     = document.getElementById('register-email').value.trim();
      const password  = document.getElementById('register-password').value;
      const confirm   = document.getElementById('register-confirm').value;
      const errorDiv  = document.getElementById('register-error');

      if (!isFirebaseConfigured) {
        showAuthError(errorDiv, 'Firebase is not configured. Check js/firebase-config.js');
        return;
      }

      // Email validation
      if (!isValidEmail(email)) {
        showAuthError(errorDiv, 'Please enter a valid email address (e.g. name@domain.com).');
        return;
      }

      // Password policy
      const req    = getPasswordRequirements(password);
      const allMet = Object.values(req).every(Boolean);
      if (!allMet) {
        const missing = [];
        if (!req.length)    missing.push('at least 8 characters');
        if (!req.uppercase) missing.push('an uppercase letter');
        if (!req.lowercase) missing.push('a lowercase letter');
        if (!req.number)    missing.push('a number');
        if (!req.special)   missing.push('a special character (!@#…)');
        showAuthError(errorDiv, `Password needs: ${missing.join(', ')}.`);
        return;
      }

      // Confirm match
      if (password !== confirm) {
        showAuthError(errorDiv, 'Passwords do not match.');
        return;
      }

      showLoadingOverlay('Creating your account...');
      hideAuthError(errorDiv);

      // ── STAGE 1: Firebase Authentication ─────────────────────────────────
      // If this fails, the account was NOT created. Show the auth error and stop.
      let user;
      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        user = userCredential.user;
        // Mark sign-in time so ApiClient doesn't force-signout on initial 401s
        if (typeof window._apiClientOnSignIn === 'function') window._apiClientOnSignIn();
      } catch (authErr) {
        // Firebase Auth failed — account was never created.
        console.error('[SIGNUP] Stage 1 (Firebase Auth) failed:', authErr.code, authErr.message);
        showAuthError(errorDiv, translateAuthError(authErr.code));
        hideLoadingOverlay();
        return;
      }

      // ── STAGE 2: Profile update + backend Firestore init ──────────────────
      // Firebase account now EXISTS. Any failure here is non-fatal — the user
      // CAN sign in. We show a specific, honest message rather than hiding the
      // partial success behind a generic "Something went wrong."
      let profileOk = true;
      let backendOk = false;

      // 2a. Set display name on the Firebase Auth profile
      try {
        await user.updateProfile({ displayName: name });
      } catch (profileErr) {
        console.warn('[SIGNUP] Stage 2a (updateProfile) failed:', profileErr.message);
        profileOk = false;
      }

      // 2b. Initialize backend user document via Admin SDK (authoritative path —
      //     bypasses Firestore security rules entirely).
      if (window.ApiClient) {
        try {
          await window.ApiClient.initUser({
            name:  name  || null,
            email: email || null,
          });
          backendOk = true;
        } catch (backendErr) {
          console.error(
            '[SIGNUP] Stage 2b (backend /api/user/init) failed:',
            backendErr.status,
            backendErr.message
          );
        }
      } else {
        console.warn('[SIGNUP] Stage 2b skipped — ApiClient not available.');
      }

      // 2c. Belt-and-suspenders: also write via client Firestore SDK
      //     (works now that firestore.rules covers /users/{uid}, and
      //      merge:true ensures it's idempotent with step 2b).
      try {
        await db.collection('users').doc(user.uid).set({
          uid:       user.uid,
          name:      name,
          email:     email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          migrated:  true,
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn(
          '[SIGNUP] Stage 2c (client Firestore set) failed:',
          firestoreErr.code,
          firestoreErr.message
        );
      }

      hideLoadingOverlay();

      const displayName = name || user.email?.split('@')[0] || 'there';

      if (!profileOk || !backendOk) {
        // Account created but some post-auth setup had non-fatal errors.
        // The Firebase account IS valid and the user is signed in.
        console.warn(
          '[SIGNUP] Post-auth setup had non-fatal errors — profileOk=%s backendOk=%s',
          profileOk, backendOk
        );
        showToast(`Welcome to AlgoQuest, ${displayName}! 🚀`, 'success');
      } else {
        showToast(`Welcome to AlgoQuest, ${displayName}! 🚀`, 'success');
      }
      // onAuthStateChanged fired automatically from Stage 1 and will call
      // loadUserData → fetchUserDataFromCloud to complete the session setup.
    });
  }



  // ── Forgot Password Form ──────────────────────────────────
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email      = document.getElementById('forgot-email').value.trim();
      const errorDiv   = document.getElementById('forgot-error');
      const successDiv = document.getElementById('forgot-success');

      if (!isFirebaseConfigured) {
        showAuthError(errorDiv, 'Firebase is not configured. Check js/firebase-config.js');
        return;
      }

      if (!isValidEmail(email)) {
        showAuthError(errorDiv, 'Please enter a valid email address.');
        return;
      }

      showLoadingOverlay('Sending reset link...');
      hideAuthError(errorDiv);
      if (successDiv) successDiv.style.display = 'none';

      try {
        await auth.sendPasswordResetEmail(email);
        if (successDiv) {
          successDiv.textContent = `Reset link sent to ${email}`;
          successDiv.style.display = 'block';
        }
        showToast(`Password reset email sent to ${email} 📬`, 'success');
      } catch (err) {
        showAuthError(errorDiv, translateAuthError(err.code));
      } finally {
        hideLoadingOverlay();
      }
    });
  }

  // ── Profile Dropdown Toggle ───────────────────────────────
  const profileBtn      = document.getElementById('profile-btn');
  const profileDropdown = document.getElementById('profile-dropdown');
  if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('show');
    });
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('show');
      }
    });
  }

  // ── Logout ────────────────────────────────────────────────
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  // ── Google Sign-In ────────────────────────────────────────
  const googleSignInBtn = document.getElementById('google-signin-btn');
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', () => handleGoogleSignIn('login'));
  }
  const googleRegisterBtn = document.getElementById('google-register-btn');
  if (googleRegisterBtn) {
    googleRegisterBtn.addEventListener('click', () => handleGoogleSignIn('register'));
  }

  // ── Live Password Strength ────────────────────────────────
  const regPw = document.getElementById('register-password');
  if (regPw) {
    regPw.addEventListener('input', () => {
      updatePasswordUI(regPw.value);
      const conf = document.getElementById('register-confirm');
      if (conf && conf.value) updateConfirmMatchUI(regPw.value, conf.value);
    });
  }

  // ── Live Confirm Match ────────────────────────────────────
  const regConfirm = document.getElementById('register-confirm');
  if (regConfirm) {
    regConfirm.addEventListener('input', () => {
      const pw = document.getElementById('register-password')?.value || '';
      updateConfirmMatchUI(pw, regConfirm.value);
    });
  }
}

// ─────────────────────────────────────────────────────────────
// AUTH STATE & SESSION MANAGEMENT
// ─────────────────────────────────────────────────────────────
let authState = 'loading'; // 'loading' | 'authenticated' | 'unauthenticated'
let authSessionId = 0;
let currentAuthUid = null;

window.getAuthState = function () {
  return authState;
};

// ─────────────────────────────────────────────────────────────
// INITIAL AUTH STATE CHECK
// ─────────────────────────────────────────────────────────────
function checkInitialAuthState() {
  if (!isFirebaseConfigured) {
    setupGuestUI();
    hideAuthModal();
    hideLoadingOverlay();
    const appEl = document.getElementById('app');
    if (appEl) appEl.style.display = 'flex';
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const isNewUser = (currentAuthUid !== user.uid);
      authSessionId++;
      const sessionId = authSessionId;
      currentAuthUid = user.uid;
      authState = 'authenticated';

      window.isGuestMode = false;
      sessionStorage.removeItem('dsa_guest_mode');

      if (isNewUser) {
        if (window.HistoryModule?.clearUserCache) window.HistoryModule.clearUserCache();
        if (window.Compiler?.resetState) window.Compiler.resetState();
      }

      // Fast synchronous profile setup from auth object
      setupUserUI(user);

      // Reveal authenticated application immediately
      const appEl = document.getElementById('app');
      if (appEl) appEl.style.display = 'flex';
      hideAuthModal();
      hideLoadingOverlay();

      // Trigger App authenticated initialization
      if (window.App && typeof window.App.onUserAuthenticated === 'function') {
        window.App.onUserAuthenticated(user, isNewUser);
      }

      // Load user data in background with session guard (non-blocking)
      loadUserData(user, sessionId);

    } else {
      authSessionId++;
      currentAuthUid = null;
      authState = 'unauthenticated';

      // Clear all protected state and active operations
      if (window.Compiler) {
        if (typeof window.Compiler.stopExecution === 'function') window.Compiler.stopExecution('Logged out.');
        if (typeof window.Compiler.resetState === 'function') window.Compiler.resetState();
      }
      if (window.HistoryModule && typeof window.HistoryModule.clearUserCache === 'function') {
        window.HistoryModule.clearUserCache();
      }
      if (window.App && typeof window.App.clearUserState === 'function') {
        window.App.clearUserState();
      }

      setupGuestUI();

      // Ensure protected app container is hidden
      const appEl = document.getElementById('app');
      if (appEl) appEl.style.display = 'none';

      hideLoadingOverlay();
      switchAuthView('login');
      showAuthModal();
    }
  });
}

// ─────────────────────────────────────────────────────────────
// GOOGLE SIGN-IN
// ─────────────────────────────────────────────────────────────
async function handleGoogleSignIn(formContext) {
  const errorDivId = formContext === 'register' ? 'register-error' : 'login-error';
  const errorDiv   = document.getElementById(errorDivId);

  const btns = [
    document.getElementById('google-signin-btn'),
    document.getElementById('google-register-btn'),
  ].filter(Boolean);
  btns.forEach(b => { b.disabled = true; });

  if (!isFirebaseConfigured) {
    showAuthError(errorDiv, 'Firebase is not configured. Check js/firebase-config.js');
    btns.forEach(b => { b.disabled = false; });
    return;
  }

  hideAuthError(errorDiv);
  showLoadingOverlay('Connecting to Google...');

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    let userCredential;
    try {
      userCredential = await auth.signInWithPopup(provider);
      // Mark sign-in time so ApiClient doesn't force-signout on initial 401s
      if (typeof window._apiClientOnSignIn === 'function') window._apiClientOnSignIn();
    } catch (popupErr) {
      if (
        popupErr.code === 'auth/popup-closed-by-user' ||
        popupErr.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      if (popupErr.code === 'auth/popup-blocked') {
        showAuthError(errorDiv, 'Popup blocked — please allow popups for this site and try again.');
        return;
      }
      throw popupErr;
    }

    const user      = userCredential.user;
    const isNewUser = userCredential.additionalUserInfo?.isNewUser;

    if (isNewUser) {
      // Authoritative user doc init via backend (Admin SDK, bypasses rules)
      if (window.ApiClient) {
        try {
          await window.ApiClient.initUser({
            name:      user.displayName || null,
            email:     user.email       || null,
            photo_url: user.photoURL    || null,
          });
        } catch (initErr) {
          console.error('[GOOGLE SIGNUP] Backend initUser failed:', initErr.status, initErr.message);
        }
      }
      // Belt-and-suspenders: also write via client SDK (merge:true = idempotent)
      try {
        await db.collection('users').doc(user.uid).set({
          uid:       user.uid,
          name:      user.displayName || 'User',
          email:     user.email || '',
          photoURL:  user.photoURL || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          migrated:  true,
        }, { merge: true });
      } catch (firestoreErr) {
        console.warn('[GOOGLE SIGNUP] Client Firestore set failed:', firestoreErr.code, firestoreErr.message);
      }
    } else {
      // Existing user — reconcile user document if it ever got out of sync
      if (window.ApiClient) {
        try {
          await window.ApiClient.initUser({
            name:      user.displayName || null,
            email:     user.email       || null,
            photo_url: user.photoURL    || null,
          });
        } catch (_) { /* non-fatal */ }
      }
    }

    const displayName = user.displayName || user.email?.split('@')[0] || 'there';
    const greeting    = isNewUser ? `Welcome to AlgoQuest, ${displayName}! 🚀` : `Welcome back, ${displayName}! 👋`;
    showToast(greeting, 'success');

  } catch (err) {
    console.error('Google sign-in error:', err);
    showAuthError(errorDiv, translateAuthError(err.code));
  } finally {
    hideLoadingOverlay();
    btns.forEach(b => { b.disabled = false; });
  }
}

// ─────────────────────────────────────────────────────────────
// USER UI SETUP (Fast synchronous setup without network latency)
// ─────────────────────────────────────────────────────────────
function setupUserUI(user) {
  const profileContainer = document.getElementById('profile-container');
  const guestSignInBtn   = document.getElementById('guest-signin-btn');
  const initialsEl       = document.getElementById('user-avatar-initials');
  const photoEl          = document.getElementById('user-avatar-photo');
  const nameEl           = document.getElementById('user-profile-name');
  const emailEl          = document.getElementById('user-profile-email');

  if (profileContainer) profileContainer.style.display = 'block';
  if (guestSignInBtn)   guestSignInBtn.style.display   = 'none';

  const photoURL = user.photoURL || '';
  if (photoEl && photoURL) {
    photoEl.src           = photoURL;
    photoEl.style.display = 'block';
    if (initialsEl) initialsEl.style.display = 'none';
  } else {
    if (photoEl)    photoEl.style.display    = 'none';
    if (initialsEl) initialsEl.style.display = 'flex';
  }

  const displayName = user.displayName || user.email?.split('@')[0] || 'User';
  const displayEmail = user.email || '';

  if (nameEl)  nameEl.textContent  = displayName;
  if (emailEl) emailEl.textContent = displayEmail;

  if (!photoURL && initialsEl) {
    initialsEl.textContent = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  }
}

// ─────────────────────────────────────────────────────────────
// GUEST UI SETUP (Legacy stub)
// ─────────────────────────────────────────────────────────────
function setupGuestUI() {
  const profileContainer = document.getElementById('profile-container');
  const guestSignInBtn   = document.getElementById('guest-signin-btn');
  if (profileContainer) profileContainer.style.display = 'none';
  if (guestSignInBtn)   guestSignInBtn.style.display   = 'none';
}

// ─────────────────────────────────────────────────────────────
// LOAD USER DATA FROM FIRESTORE (Session-guarded)
// ─────────────────────────────────────────────────────────────
async function loadUserData(user, sessionId) {
  try {
    await fetchUserDataFromCloud(user.uid, sessionId);

    // Update lastLogin in background (metadata-only)
    if (db && db.collection) {
      db.collection('users').doc(user.uid)
        .update({ lastLogin: firebase.firestore.FieldValue.serverTimestamp() })
        .catch(e => console.warn('[FIREBASE] lastLogin update failed:', e));
    }
  } catch (error) {
    console.error('Failed to load user data from cloud:', error);
  }
}

// ─────────────────────────────────────────────────────────────
// FETCH USER DATA FROM CLOUD (via FastAPI backend with session guard)
// ─────────────────────────────────────────────────────────────
async function fetchUserDataFromCloud(uid, sessionId) {
  if (!window.ApiClient) {
    console.warn('[FIREBASE] ApiClient not available, skipping cloud data fetch.');
    return;
  }

  let data;
  try {
    data = await window.ApiClient.getAllUserData();
  } catch (err) {
    console.error('[FIREBASE] Failed to fetch user data from backend:', err);
    return;
  }

  // Session guard: if user logged out or switched while fetch was in-flight, discard!
  if (sessionId !== authSessionId || currentAuthUid !== uid) {
    console.warn('[FIREBASE] Stale user data fetch discarded (session changed).');
    return;
  }

  // Update profile display name from backend if available
  if (data.user?.name) {
    const nameEl = document.getElementById('user-profile-name');
    if (nameEl) nameEl.textContent = data.user.name;
    const initialsEl = document.getElementById('user-avatar-initials');
    if (initialsEl && initialsEl.style.display !== 'none') {
      initialsEl.textContent = data.user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
  }

  // 1. Progress (solved)
  const solvedList = data.progress?.solved || [];
  localStorage.setItem(`dsa_solved_${uid}`, JSON.stringify(solvedList));

  // 2. Revisions
  const rev1List = data.progress?.rev1 || [];
  const rev2List = data.progress?.rev2 || [];
  localStorage.setItem(`dsa_rev1_${uid}`, JSON.stringify(rev1List));
  localStorage.setItem(`dsa_rev2_${uid}`, JSON.stringify(rev2List));

  // 3. Bookmarks
  const bookmarksList = data.bookmarks?.bookmarks || [];
  localStorage.setItem(`dsa_bookmarks_${uid}`, JSON.stringify(bookmarksList));

  // 4. Notes
  const notesObj = data.notes || {};
  localStorage.setItem(`dsa_notes_${uid}`, JSON.stringify(notesObj));

  // 5. Editor code
  const editorMap = data.editor || {};
  Object.entries(editorMap).forEach(([qId, editorData]) => {
    if (editorData && editorData.code !== undefined && editorData.language) {
      const localData = {
        questionId: String(qId),
        language:   editorData.language,
        code:       editorData.code,
        updatedAt:  Date.now(),
      };
      localStorage.setItem(`dsa_workspace_code_${uid}_${qId}_${editorData.language}`, JSON.stringify(localData));
      localStorage.setItem(`dsa_workspace_code_${uid}_${qId}`, JSON.stringify(localData));
      localStorage.setItem(`dsa_workspace_last_lang_${uid}_${qId}`, editorData.language);
    }
  });

  // 6. General compiler code
  const compilerMap = data.general_compiler || {};
  Object.entries(compilerMap).forEach(([lang, code]) => {
    if (code !== undefined) {
      localStorage.setItem(`general_compiler_code_${uid}_${lang}`, code);
    }
  });

  if (typeof refreshAllUI === 'function') refreshAllUI();
}

// ─────────────────────────────────────────────────────────────
// CLOUD SYNC ACTIONS (via FastAPI backend)
// ─────────────────────────────────────────────────────────────

window.syncProgressToCloud = async function (questionId, solved) {
  if (!isFirebaseConfigured || !auth.currentUser || !window.ApiClient) return;
  try {
    await window.ApiClient.updateProgress(questionId, { solved });
  } catch (error) {
    console.error('[BACKEND] Failed to sync progress:', error);
  }
};

window.syncRevisionToCloud = async function (questionId, revNum, active) {
  if (!isFirebaseConfigured || !auth.currentUser || !window.ApiClient) return;
  try {
    const update = {};
    update[`rev${revNum}`] = active;
    await window.ApiClient.updateProgress(questionId, update);
  } catch (error) {
    console.error('[BACKEND] Failed to sync revision:', error);
  }
};

window.syncBookmarkToCloud = async function (questionId, bookmarked) {
  if (!isFirebaseConfigured || !auth.currentUser || !window.ApiClient) return;
  try {
    if (bookmarked) {
      await window.ApiClient.addBookmark(questionId);
    } else {
      await window.ApiClient.removeBookmark(questionId);
    }
  } catch (error) {
    console.error('[BACKEND] Failed to sync bookmark:', error);
  }
};

window.syncNoteToCloud = async function (questionId, content) {
  if (!isFirebaseConfigured || !auth.currentUser || !window.ApiClient) return;
  try {
    await window.ApiClient.saveNote(questionId, content);
  } catch (error) {
    console.error('[BACKEND] Failed to sync note:', error);
  }
};

// ─────────────────────────────────────────────────────────────
// HANDLE LOGOUT
// ─────────────────────────────────────────────────────────────
async function handleLogout() {
  if (!isFirebaseConfigured) return;

  const profileDropdown = document.getElementById('profile-dropdown');
  if (profileDropdown) profileDropdown.classList.remove('show');

  const displayName =
    auth.currentUser?.displayName ||
    document.getElementById('user-profile-name')?.textContent ||
    'there';

  try {
    authSessionId++;
    currentAuthUid = null;
    authState = 'unauthenticated';

    // 1. Stop active compiler & polling
    if (window.Compiler) {
      if (typeof window.Compiler.stopExecution === 'function') window.Compiler.stopExecution('User logged out.');
      if (typeof window.Compiler.resetState   === 'function') window.Compiler.resetState();
    }

    // 2. Clear history & analytics caches
    if (window.HistoryModule && typeof window.HistoryModule.clearUserCache === 'function') {
      window.HistoryModule.clearUserCache();
    }

    // 3. Clear App state
    if (window.App && typeof window.App.clearUserState === 'function') {
      window.App.clearUserState();
    }

    // 4. Reset editors
    if (window.App?.editor    && window.STARTER_CODE) window.App.editor.setValue(window.STARTER_CODE[window.App.editorLanguage || 'cpp'] || '');
    if (window.App?.dsaEditor && window.STARTER_CODE) window.App.dsaEditor.setValue(window.STARTER_CODE[window.App.dsaEditorLanguage || 'cpp'] || '');

    // 5. Reset avatar & profile display
    const photoEl    = document.getElementById('user-avatar-photo');
    const initialsEl = document.getElementById('user-avatar-initials');
    if (photoEl)    { photoEl.src = ''; photoEl.style.display = 'none'; }
    if (initialsEl) { initialsEl.style.display = 'flex'; initialsEl.textContent = 'U'; }
    const nameEl = document.getElementById('user-profile-name');
    const emailEl = document.getElementById('user-profile-email');
    if (nameEl)  nameEl.textContent  = 'User Name';
    if (emailEl) emailEl.textContent = 'user@example.com';

    // 6. Reset SPA routing URL & history state
    try {
      history.replaceState({ page: 'all', topic: 'all', pattern: 'all' }, '', '#dashboard');
    } catch (_) {}

    // 7. Hide app container
    const appEl = document.getElementById('app');
    if (appEl) appEl.style.display = 'none';

    setupGuestUI();
    switchAuthView('login');
    showAuthModal();

    await auth.signOut();
    showToast(`Goodbye, ${displayName}! See you soon. 👋`, 'info');

  } catch (err) {
    console.error('Failed to logout:', err);
    showToast('Logout failed. Please try again.', 'error');
  }
}

// ─────────────────────────────────────────────────────────────
// MODAL HELPERS
// ─────────────────────────────────────────────────────────────
function showAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('active');
}

function hideAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('active');
}

function showAuthError(div, message) {
  if (!div) return;
  div.textContent    = message;
  div.style.display  = 'block';
}

function hideAuthError(div) {
  if (div) div.style.display = 'none';
}

// ─────────────────────────────────────────────────────────────
// LOADING STATE (button spinner + context text)
// ─────────────────────────────────────────────────────────────
const _btnOrigText = {};

function setLoadingState(btn, isLoading, loadingText) {
  if (!btn) return;
  btn.disabled = isLoading;
  const textEl = btn.querySelector('.btn-text');
  const spinEl = btn.querySelector('.btn-spinner');

  if (isLoading) {
    btn.classList.add('loading');
    if (textEl) {
      _btnOrigText[btn.id] = textEl.textContent;
      if (loadingText) textEl.textContent = loadingText;
    }
    if (spinEl) spinEl.style.display = 'block';
  } else {
    btn.classList.remove('loading');
    if (textEl && _btnOrigText[btn.id]) {
      textEl.textContent = _btnOrigText[btn.id];
    }
    if (spinEl) spinEl.style.display = 'none';
  }
}

// ─────────────────────────────────────────────────────────────
// VIEW SWITCHER
// ─────────────────────────────────────────────────────────────
window.switchAuthView = function (view, event) {
  if (event) event.preventDefault();

  const forms = ['login-form', 'register-form', 'forgot-form'];
  forms.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });

  const target = document.getElementById(`${view}-form`);
  if (target) target.style.display = 'flex';
};

// ─────────────────────────────────────────────────────────────
// TOGGLE PASSWORD VISIBILITY
// ─────────────────────────────────────────────────────────────
window.togglePasswordVisibility = function (inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.className = 'fas fa-eye-slash';
    btn.setAttribute('aria-label', 'Hide password');
  } else {
    input.type = 'password';
    if (icon) icon.className = 'fas fa-eye';
    btn.setAttribute('aria-label', 'Show password');
  }
};

// ─────────────────────────────────────────────────────────────
// TRANSLATE FIREBASE / FIRESTORE ERROR CODES
// ─────────────────────────────────────────────────────────────
function translateAuthError(code) {
  const map = {
    // ── Firebase Auth ──────────────────────────────────────
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/user-not-found':          'No account exists with this email.',
    'auth/wrong-password':          'Incorrect password. Please try again.',
    'auth/invalid-credential':      'Invalid email or password. Please try again.',
    'auth/email-already-in-use':    'This email is already registered. Try signing in instead.',
    'auth/weak-password':           'Password is too weak. Use at least 8 characters.',
    'auth/too-many-requests':       'Too many failed attempts. Please wait a moment and try again.',
    'auth/user-disabled':           'This account has been disabled. Contact support.',
    'auth/operation-not-allowed':   'This sign-in method is not enabled.',
    'auth/network-request-failed':  'Network error — check your connection and try again.',
    'auth/popup-closed-by-user':    'Sign-in was cancelled.',
    'auth/popup-blocked':           'Popup blocked — please allow popups for this site.',
    'auth/requires-recent-login':   'Please sign in again to continue.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
    // ── Firestore client SDK ───────────────────────────────
    'firestore/permission-denied':  'Permission denied — your account does not have access to this data.',
    'firestore/unavailable':        'Firestore is temporarily unavailable — please try again.',
    'firestore/deadline-exceeded':  'Request timed out — check your connection and try again.',
    'firestore/not-found':          'The requested data was not found.',
    'firestore/already-exists':     'This record already exists.',
    'firestore/resource-exhausted': 'Too many requests — please wait and try again.',
    'firestore/unauthenticated':    'Please sign in before accessing your data.',
  };
  if (!code) {
    return 'An unexpected error occurred. Please try again.';
  }
  return map[code] || `Something went wrong (${code}). Please try again.`;
}



// ─────────────────────────────────────────────────────────────
// SYNC EDITOR CODE TO CLOUD (via FastAPI backend)
// ─────────────────────────────────────────────────────────────
window.syncEditorCodeToCloud = async function (questionId, language, code) {
  if (!isFirebaseConfigured || !auth.currentUser || !window.ApiClient) return;
  try {
    await window.ApiClient.saveEditorCode(questionId, language, code);
  } catch (error) {
    console.error('[BACKEND] Failed to sync editor code:', error);
  }
};

// ─────────────────────────────────────────────────────────────
// SYNC GENERAL COMPILER CODE TO CLOUD (via FastAPI backend)
// ─────────────────────────────────────────────────────────────
window.syncGeneralCompilerCodeToCloud = async function (language, code) {
  if (!isFirebaseConfigured || !auth.currentUser || !window.ApiClient) return;
  try {
    await window.ApiClient.saveGeneralCompilerCode(language, code);
  } catch (error) {
    console.error('[BACKEND] Failed to sync general compiler code:', error);
  }
};