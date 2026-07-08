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

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Set display name
        await user.updateProfile({ displayName: name });

        // Create Firestore user profile
        await db.collection('users').doc(user.uid).set({
          uid:       user.uid,
          name:      name,
          email:     email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          migrated:  true, // Guest mode removed, so always marked migrated
        });

        const displayName = name || user.email?.split('@')[0] || 'there';
        showToast(`Welcome to AlgoQuest, ${displayName}! 🚀`, 'success');

      } catch (err) {
        showAuthError(errorDiv, translateAuthError(err.code));
      } finally {
        hideLoadingOverlay();
      }
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
// INITIAL AUTH STATE CHECK
// ─────────────────────────────────────────────────────────────
function checkInitialAuthState() {
  if (!isFirebaseConfigured) {
    setupGuestUI();
    hideAuthModal();
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      window.isGuestMode = false;
      sessionStorage.removeItem('dsa_guest_mode');
      setupUserUI(user);
      await loadUserData(user);
      hideAuthModal();
    } else {
      setupGuestUI();
      showAuthModal(); // Always display the modal if not authenticated
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
      await db.collection('users').doc(user.uid).set({
        uid:       user.uid,
        name:      user.displayName || 'User',
        email:     user.email || '',
        photoURL:  user.photoURL || '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        migrated:  true, // Always marked migrated as Guest Mode is removed
      });
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
// USER UI SETUP
// ─────────────────────────────────────────────────────────────
function setupUserUI(user) {
  const profileContainer = document.getElementById('profile-container');
  const guestSignInBtn   = document.getElementById('guest-signin-btn');
  const initialsEl       = document.getElementById('user-avatar-initials');
  const photoEl          = document.getElementById('user-avatar-photo');

  if (profileContainer) profileContainer.style.display = 'block';
  if (guestSignInBtn)   guestSignInBtn.style.display   = 'none';

  const photoURL = user.photoURL || '';
  if (photoEl && photoURL) {
    photoEl.src          = photoURL;
    photoEl.style.display = 'block';
    if (initialsEl) initialsEl.style.display = 'none';
  } else {
    if (photoEl)    photoEl.style.display    = 'none';
    if (initialsEl) initialsEl.style.display = 'flex';
  }

  db.collection('users').doc(user.uid).get().then(doc => {
    if (doc.exists) {
      const data        = doc.data();
      const displayName = data.name || user.displayName || 'User';
      const displayEmail = data.email || user.email || '';
      document.getElementById('user-profile-name').textContent  = displayName;
      document.getElementById('user-profile-email').textContent = displayEmail;
      if (!photoURL && initialsEl) {
        initialsEl.textContent = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
      }
    } else {
      const displayName = user.displayName || 'User';
      document.getElementById('user-profile-name').textContent  = displayName;
      document.getElementById('user-profile-email').textContent = user.email || '';
      if (!photoURL && initialsEl) {
        initialsEl.textContent = (user.email || 'U').slice(0, 2).toUpperCase();
      }
    }
  }).catch(e => {
    console.error('Error reading profile:', e);
    document.getElementById('user-profile-name').textContent  = user.displayName || 'User';
    document.getElementById('user-profile-email').textContent = user.email || '';
  });
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
// LOAD USER DATA FROM FIRESTORE
// ─────────────────────────────────────────────────────────────
async function loadUserData(user) {
  try {
    const userDocRef = db.collection('users').doc(user.uid);
    await fetchUserDataFromCloud(user.uid);
    await userDocRef.update({ lastLogin: firebase.firestore.FieldValue.serverTimestamp() });

    if (typeof refreshAllUI === 'function') refreshAllUI();
  } catch (error) {
    console.error('Failed to load user data from cloud:', error);
    showToast('Failed to load cloud progress.', 'error');
  }
}

// ─────────────────────────────────────────────────────────────
// FETCH USER DATA FROM CLOUD
// ─────────────────────────────────────────────────────────────
async function fetchUserDataFromCloud(uid) {
  // 1. Solved progress
  const progressSnap = await db.collection('users').doc(uid).collection('progress').get();
  const solvedList = [];
  progressSnap.forEach(doc => { if (doc.data().solved) solvedList.push(parseInt(doc.id)); });
  localStorage.setItem(`dsa_solved_${uid}`, JSON.stringify(solvedList));

  // 2. Revisions
  const revisionsSnap = await db.collection('users').doc(uid).collection('revisions').get();
  const rev1List = [], rev2List = [];
  revisionsSnap.forEach(doc => {
    const data = doc.data();
    if (data.rev1) rev1List.push(parseInt(doc.id));
    if (data.rev2) rev2List.push(parseInt(doc.id));
  });
  localStorage.setItem(`dsa_rev1_${uid}`, JSON.stringify(rev1List));
  localStorage.setItem(`dsa_rev2_${uid}`, JSON.stringify(rev2List));

  // 3. Bookmarks
  const bookmarksSnap = await db.collection('users').doc(uid).collection('bookmarks').get();
  const bookmarksList = [];
  bookmarksSnap.forEach(doc => bookmarksList.push(parseInt(doc.id)));
  localStorage.setItem(`dsa_bookmarks_${uid}`, JSON.stringify(bookmarksList));

  // 4. Notes
  const notesSnap = await db.collection('users').doc(uid).collection('notes').get();
  const notesObj = {};
  notesSnap.forEach(doc => { notesObj[doc.id] = doc.data().content || ''; });
  localStorage.setItem(`dsa_notes_${uid}`, JSON.stringify(notesObj));

  // 5. Editor code
  const editorSnap = await db.collection('users').doc(uid).collection('editor').get();
  editorSnap.forEach(doc => {
    const data = doc.data();
    if (data && data.code !== undefined && data.language) {
      const localData = {
        questionId: String(doc.id),
        language:   data.language,
        code:       data.code,
        updatedAt:  data.updatedAt ? (data.updatedAt.toMillis ? data.updatedAt.toMillis() : Date.now()) : Date.now(),
      };
      localStorage.setItem(`dsa_workspace_code_${uid}_${doc.id}_${data.language}`, JSON.stringify(localData));
      localStorage.setItem(`dsa_workspace_code_${uid}_${doc.id}`, JSON.stringify(localData));
      localStorage.setItem(`dsa_workspace_last_lang_${uid}_${doc.id}`, data.language);
    }
  });

  // 6. General compiler code
  const generalCompilerSnap = await db.collection('users').doc(uid).collection('general_compiler').get();
  generalCompilerSnap.forEach(doc => {
    const data = doc.data();
    if (data && data.code !== undefined && data.language) {
      localStorage.setItem(`general_compiler_code_${uid}_${data.language}`, data.code);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// CLOUD SYNC ACTIONS
// ─────────────────────────────────────────────────────────────

window.syncProgressToCloud = async function (questionId, solved) {
  if (!isFirebaseConfigured || !auth.currentUser) {
    console.log('[FIREBASE DIAG] syncProgressToCloud skipped (Firebase not configured or no current user)');
    return;
  }
  try {
    const uid         = auth.currentUser.uid;
    const progressRef = db.collection('users').doc(uid).collection('progress').doc(String(questionId));
    const rev1 = lsGet('dsa_rev1').includes(questionId);
    const rev2 = lsGet('dsa_rev2').includes(questionId);
    const syncData = { solved, rev1, rev2, lastSolved: firebase.firestore.FieldValue.serverTimestamp() };
    console.log('[FIREBASE DIAG] syncProgressToCloud — writing data for qId:', questionId, syncData);
    await progressRef.set(syncData, { merge: true });
    console.log('[FIREBASE DIAG] syncProgressToCloud — write SUCCESS for qId:', questionId);
  } catch (error) {
    console.error('[FIREBASE DIAG] ❌ Failed to sync progress to cloud:', error);
  }
};

window.syncRevisionToCloud = async function (questionId, revNum, active) {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const uid     = auth.currentUser.uid;
    const revRef  = db.collection('users').doc(uid).collection('revisions').doc(String(questionId));
    await revRef.set({ [`rev${revNum}`]: active }, { merge: true });
    const progressRef = db.collection('users').doc(uid).collection('progress').doc(String(questionId));
    await progressRef.set({ [`rev${revNum}`]: active }, { merge: true });
  } catch (error) {
    console.error('Failed to sync revision:', error);
  }
};

window.syncBookmarkToCloud = async function (questionId, bookmarked) {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const uid         = auth.currentUser.uid;
    const bookmarkRef = db.collection('users').doc(uid).collection('bookmarks').doc(String(questionId));
    if (bookmarked) {
      await bookmarkRef.set({ bookmarked: true, bookmarkedAt: firebase.firestore.FieldValue.serverTimestamp() });
    } else {
      await bookmarkRef.delete();
    }
  } catch (error) {
    console.error('Failed to sync bookmark:', error);
  }
};

window.syncNoteToCloud = async function (questionId, content) {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const uid     = auth.currentUser.uid;
    const noteRef = db.collection('users').doc(uid).collection('notes').doc(String(questionId));
    await noteRef.set({ content, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  } catch (error) {
    console.error('Failed to sync note:', error);
  }
};

// ─────────────────────────────────────────────────────────────
// HANDLE LOGOUT
// ─────────────────────────────────────────────────────────────
async function handleLogout() {
  if (!isFirebaseConfigured) return;

  const profileDropdown = document.getElementById('profile-dropdown');
  if (profileDropdown) profileDropdown.classList.remove('show');

  // Capture display name before sign-out
  const displayName =
    auth.currentUser?.displayName ||
    document.getElementById('user-profile-name')?.textContent ||
    'there';

  try {
    // Stop active compiler
    if (window.Compiler) {
      if (typeof window.Compiler.stopExecution === 'function') window.Compiler.stopExecution('User logged out.');
      if (typeof window.Compiler.resetState   === 'function') window.Compiler.resetState();
    }

    await auth.signOut();

    // Reset App state
    if (window.App) {
      window.App.currentQuestion = null;
      window.App.currentPage     = 'dashboard';
      window.App.currentTopic    = 'all';
      window.App.currentPattern  = 'all';
      window.App.filters         = { search: '', difficulty: 'all', tier: 'all', tcs: 'all', status: 'all' };
      window.App.sort            = { col: 'id', dir: 'asc' };
    }

    // Reset editors
    if (window.App?.editor    && window.STARTER_CODE) window.App.editor.setValue(window.STARTER_CODE[window.App.editorLanguage] || '');
    if (window.App?.dsaEditor && window.STARTER_CODE) window.App.dsaEditor.setValue(window.STARTER_CODE[window.App.dsaEditorLanguage] || '');

    sessionStorage.removeItem('dsa_guest_mode');
    window.isGuestMode = false;

    // Reset avatar
    const photoEl    = document.getElementById('user-avatar-photo');
    const initialsEl = document.getElementById('user-avatar-initials');
    if (photoEl)    { photoEl.src = ''; photoEl.style.display = 'none'; }
    if (initialsEl) { initialsEl.style.display = 'flex'; initialsEl.textContent = 'U'; }

    if (typeof refreshAllUI === 'function') refreshAllUI();

    setupGuestUI();
    switchAuthView('login');
    showAuthModal();

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
// TRANSLATE FIREBASE ERROR CODES
// ─────────────────────────────────────────────────────────────
function translateAuthError(code) {
  const map = {
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
  };
  return map[code] || 'Something went wrong. Please try again.';
}

// ─────────────────────────────────────────────────────────────
// SYNC EDITOR CODE TO CLOUD
// ─────────────────────────────────────────────────────────────
window.syncEditorCodeToCloud = async function (questionId, language, code) {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const uid    = auth.currentUser.uid;
    const docRef = db.collection('users').doc(uid).collection('editor').doc(String(questionId));
    await docRef.set({ questionId: String(questionId), language, code, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    console.log('Editor code synced to Firestore for question:', questionId, 'language:', language);
  } catch (error) {
    console.error('Failed to sync editor code:', error);
  }
};

// ─────────────────────────────────────────────────────────────
// SYNC GENERAL COMPILER CODE TO CLOUD
// ─────────────────────────────────────────────────────────────
window.syncGeneralCompilerCodeToCloud = async function (language, code) {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const uid    = auth.currentUser.uid;
    const docRef = db.collection('users').doc(uid).collection('general_compiler').doc(String(language));
    await docRef.set({ language, code, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    console.log('General compiler code synced to Firestore for language:', language);
  } catch (error) {
    console.error('Failed to sync general compiler code:', error);
  }
};