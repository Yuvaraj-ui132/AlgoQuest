/**
 * firebase.js - AlgoForge DSA Dashboard Firebase Authentication and Sync Logic
 */

'use strict';

// Global variables for guest state and UI toggles
window.isGuestMode = sessionStorage.getItem('dsa_guest_mode') === 'true';

// Initialize UI elements when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  setupAuthEventListeners();
  checkInitialAuthState();
});

// Setup form submit handlers and visibility controls
function setupAuthEventListeners() {
  // Login Form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error');
      const submitBtn = document.getElementById('login-submit-btn');

      if (!isFirebaseConfigured) {
        showAuthError(errorDiv, "Firebase is not configured in js/firebase-config.js");
        return;
      }

      setLoadingState(submitBtn, true);
      hideAuthError(errorDiv);

      try {
        await auth.signInWithEmailAndPassword(email, password);
        showToast("Signed in successfully!", "success");
      } catch (err) {
        showAuthError(errorDiv, translateAuthError(err.code));
      } finally {
        setLoadingState(submitBtn, false);
      }
    });
  }

  // Register Form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('register-name').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;
      const confirm = document.getElementById('register-confirm').value;
      const errorDiv = document.getElementById('register-error');
      const submitBtn = document.getElementById('register-submit-btn');

      if (!isFirebaseConfigured) {
        showAuthError(errorDiv, "Firebase is not configured in js/firebase-config.js");
        return;
      }

      if (password !== confirm) {
        showAuthError(errorDiv, "Passwords do not match.");
        return;
      }

      setLoadingState(submitBtn, true);
      hideAuthError(errorDiv);

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        await db.collection('users').doc(user.uid).set({
          uid: user.uid,
          name: name,
          email: email,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
          migrated: false
        });

        showToast("Account created successfully!", "success");
      } catch (err) {
        showAuthError(errorDiv, translateAuthError(err.code));
      } finally {
        setLoadingState(submitBtn, false);
      }
    });
  }

  // Forgot Password Form
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email').value.trim();
      const errorDiv = document.getElementById('forgot-error');
      const successDiv = document.getElementById('forgot-success');
      const submitBtn = document.getElementById('forgot-submit-btn');

      if (!isFirebaseConfigured) {
        showAuthError(errorDiv, "Firebase is not configured in js/firebase-config.js");
        return;
      }

      setLoadingState(submitBtn, true);
      hideAuthError(errorDiv);
      successDiv.style.display = 'none';

      try {
        await auth.sendPasswordResetEmail(email);
        successDiv.textContent = "Reset instructions sent to your email!";
        successDiv.style.display = 'block';
      } catch (err) {
        showAuthError(errorDiv, translateAuthError(err.code));
      } finally {
        setLoadingState(submitBtn, false);
      }
    });
  }

  // Continue as Guest Button
  const guestBtn = document.getElementById('auth-guest-btn');
  if (guestBtn) {
    guestBtn.addEventListener('click', () => {
      sessionStorage.setItem('dsa_guest_mode', 'true');
      window.isGuestMode = true;
      hideAuthModal();
      setupGuestUI();
      showToast("Running as Guest (local storage sync)", "info");
    });
  }

  // Profile Button Dropdown Toggle
  const profileBtn = document.getElementById('profile-btn');
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

  // Logout Button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }

  // Guest Sign In Button
  const guestSignInBtn = document.getElementById('guest-signin-btn');
  if (guestSignInBtn) {
    guestSignInBtn.addEventListener('click', () => {
      showAuthModal();
    });
  }
}

// Check initial authentication state
function checkInitialAuthState() {
  if (!isFirebaseConfigured) {
    // If firebase is not configured, load guest mode immediately
    setupGuestUI();
    hideAuthModal();
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      // User is logged in
      window.isGuestMode = false;
      sessionStorage.removeItem('dsa_guest_mode');
      setupUserUI(user);
      await loadUserData(user);
      hideAuthModal();
    } else {
      // User is logged out
      setupGuestUI();
      if (window.isGuestMode) {
        hideAuthModal();
      } else {
        showAuthModal();
      }
    }
  });
}

// User UI updates
function setupUserUI(user) {
  const profileContainer = document.getElementById('profile-container');
  const guestSignInBtn = document.getElementById('guest-signin-btn');
  const initialsEl = document.getElementById('user-avatar-initials');

  if (profileContainer) profileContainer.style.display = 'block';
  if (guestSignInBtn) guestSignInBtn.style.display = 'none';

  // Fetch name from user doc if available
  db.collection('users').doc(user.uid).get().then(doc => {
    if (doc.exists) {
      const data = doc.data();
      document.getElementById('user-profile-name').textContent = data.name || "User";
      document.getElementById('user-profile-email').textContent = data.email || user.email;

      const initials = (data.name || "U")
        .split(' ')
        .map(n => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      if (initialsEl) initialsEl.textContent = initials;
    } else {
      document.getElementById('user-profile-name').textContent = "User";
      document.getElementById('user-profile-email').textContent = user.email;
      if (initialsEl) initialsEl.textContent = user.email.slice(0, 2).toUpperCase();
    }
  }).catch(e => {
    console.error("Error reading profile:", e);
    document.getElementById('user-profile-name').textContent = "User";
    document.getElementById('user-profile-email').textContent = user.email;
  });
}

// Guest UI updates
function setupGuestUI() {
  const profileContainer = document.getElementById('profile-container');
  const guestSignInBtn = document.getElementById('guest-signin-btn');
  if (profileContainer) profileContainer.style.display = 'none';
  if (guestSignInBtn) guestSignInBtn.style.display = 'block';
}

// Fetch user data from Firestore on login
async function loadUserData(user) {
  try {
    const userDocRef = db.collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) return;
    const userData = userDoc.data();

    // Check if migration of local storage progress is needed
    if (!userData.migrated) {
      await migrateLocalStorageToCloud(user.uid);
      // Mark as migrated
      await userDocRef.update({ migrated: true, lastLogin: firebase.firestore.FieldValue.serverTimestamp() });
    } else {
      // Normal load: Overwrite local storage from Cloud Firestore
      await fetchUserDataFromCloud(user.uid);
      // Update last login timestamp
      await userDocRef.update({ lastLogin: firebase.firestore.FieldValue.serverTimestamp() });
    }

    // Refresh UI
    if (typeof refreshAllUI === 'function') {
      refreshAllUI();
    }
  } catch (error) {
    console.error("Failed to load user data from cloud:", error);
    showToast("Failed to load cloud progress.", "error");
  }
}

// Migrate existing localStorage data to Firestore (without duplicates)
async function migrateLocalStorageToCloud(uid) {
  showToast("Syncing your local progress to the cloud...", "info");

  // Read guest storage explicitly (fallback to legacy key if namespaced guest key does not exist yet)
  const getGuestList = (key) => {
    try {
      const guestKey = `${key}_guest`;
      let val = localStorage.getItem(guestKey);
      if (val === null) {
        val = localStorage.getItem(key);
      }
      return JSON.parse(val) || [];
    } catch {
      return [];
    }
  };

  const getGuestObj = (key) => {
    try {
      const guestKey = `${key}_guest`;
      let val = localStorage.getItem(guestKey);
      if (val === null) {
        val = localStorage.getItem(key);
      }
      return JSON.parse(val) || {};
    } catch {
      return {};
    }
  };

  const solved = getGuestList('dsa_solved');
  const rev1 = getGuestList('dsa_rev1');
  const rev2 = getGuestList('dsa_rev2');
  const bookmarks = getGuestList('dsa_bookmarks');
  const notes = getGuestObj('dsa_notes');

  const batch = db.batch();

  // Migrate Solved questions
  solved.forEach(qId => {
    const isRev1 = rev1.includes(qId);
    const isRev2 = rev2.includes(qId);
    const docRef = db.collection('users').doc(uid).collection('progress').doc(String(qId));
    batch.set(docRef, {
      solved: true,
      rev1: isRev1,
      rev2: isRev2,
      lastSolved: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  // Migrate Revisions (in case a question is in revision but not marked solved)
  const allRevs = new Set([...rev1, ...rev2]);
  allRevs.forEach(qId => {
    const isRev1 = rev1.includes(qId);
    const isRev2 = rev2.includes(qId);
    const docRef = db.collection('users').doc(uid).collection('revisions').doc(String(qId));
    batch.set(docRef, {
      rev1: isRev1,
      rev2: isRev2
    }, { merge: true });
  });

  // Migrate Bookmarks
  bookmarks.forEach(qId => {
    const docRef = db.collection('users').doc(uid).collection('bookmarks').doc(String(qId));
    batch.set(docRef, {
      bookmarked: true,
      bookmarkedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  // Migrate Notes
  Object.keys(notes).forEach(qId => {
    const docRef = db.collection('users').doc(uid).collection('notes').doc(String(qId));
    batch.set(docRef, {
      content: notes[qId],
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  });

  // Migrate Guest Editor Code to User Editor Code
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    // Current scheme: dsa_workspace_code_guest_{qId}_{lang}  (per-language record)
    if (key.startsWith('dsa_workspace_code_guest_')) {
      const parts = key.split('_');
      // dsa(0) workspace(1) code(2) guest(3) qId(4) lang(5) -> 6 parts = per-language key
      if (parts.length === 6 && !isNaN(parts[4])) {
        const qId = parts[4];
        const lang = parts[5];
        try {
          const raw = localStorage.getItem(key);
          const data = JSON.parse(raw);
          if (data && data.code !== undefined && data.language) {
            const docRef = db.collection('users').doc(uid).collection('editor').doc(String(qId));
            batch.set(docRef, {
              questionId: String(qId),
              language: data.language,
              code: data.code,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Copy to the real user-specific keys the DSA editor actually reads
            const userLangKey = `dsa_workspace_code_${uid}_${qId}_${lang}`;
            const userSingleKey = `dsa_workspace_code_${uid}_${qId}`;
            localStorage.setItem(userLangKey, raw);
            localStorage.setItem(userSingleKey, raw);
            localStorage.setItem(`dsa_workspace_last_lang_${uid}_${qId}`, data.language);
          }
        } catch (e) {
          console.error("Migration error for guest workspace key:", key, e);
        }
      }
      continue;
    }

    if (key.startsWith('dsa_code_guest_')) {
      // Guest key under new design is: dsa_code_guest_{questionId}
      // Old namespaced guest key was: dsa_code_guest_{qId}_{lang}
      const parts = key.split('_');
      if (parts.length === 4 && !isNaN(parts[3])) {
        const qId = parts[3];
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (data && data.code !== undefined && data.language) {
            const docRef = db.collection('users').doc(uid).collection('editor').doc(String(qId));
            batch.set(docRef, {
              questionId: String(qId),
              language: data.language,
              code: data.code,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            // Copy to user-specific localStorage key
            localStorage.setItem(`dsa_code_${uid}_${qId}`, JSON.stringify(data));
          }
        } catch (e) {
          console.error("Migration error for guest key:", key, e);
        }
      } else if (parts.length === 5 && parts[2] === 'guest' && !isNaN(parts[3])) {
        const qId = parts[3];
        const lang = parts[4];
        const code = localStorage.getItem(key);
        const docRef = db.collection('users').doc(uid).collection('editor').doc(String(qId));
        batch.set(docRef, {
          questionId: String(qId),
          language: lang,
          code: code,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        const data = {
          questionId: String(qId),
          language: lang,
          code: code,
          updatedAt: Date.now()
        };
        localStorage.setItem(`dsa_code_${uid}_${qId}`, JSON.stringify(data));
      }
    } else if (key.startsWith('dsa_code_') && !key.startsWith(`dsa_code_${uid}_`) && !key.includes('_guest_')) {
      // Legacy global guest keys: dsa_code_{qId}_{lang}
      const parts = key.split('_');
      if (parts.length === 4 && !isNaN(parts[2])) {
        const qId = parts[2];
        const lang = parts[3];
        const code = localStorage.getItem(key);
        const docRef = db.collection('users').doc(uid).collection('editor').doc(String(qId));
        batch.set(docRef, {
          questionId: String(qId),
          language: lang,
          code: code,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        const data = {
          questionId: String(qId),
          language: lang,
          code: code,
          updatedAt: Date.now()
        };
        localStorage.setItem(`dsa_code_${uid}_${qId}`, JSON.stringify(data));
      }
    }
  }

  // Save migrated data to the user's localized keys
  localStorage.setItem(`dsa_solved_${uid}`, JSON.stringify(solved));
  localStorage.setItem(`dsa_rev1_${uid}`, JSON.stringify(rev1));
  localStorage.setItem(`dsa_rev2_${uid}`, JSON.stringify(rev2));
  localStorage.setItem(`dsa_bookmarks_${uid}`, JSON.stringify(bookmarks));
  localStorage.setItem(`dsa_notes_${uid}`, JSON.stringify(notes));

  await batch.commit();
  console.log("Migration complete!");
}

// Fetch all cloud progress and replace local storage cache
async function fetchUserDataFromCloud(uid) {
  // 1. Solved progress
  const progressSnap = await db.collection('users').doc(uid).collection('progress').get();
  const solvedList = [];
  progressSnap.forEach(doc => {
    if (doc.data().solved) {
      solvedList.push(parseInt(doc.id));
    }
  });
  localStorage.setItem(`dsa_solved_${uid}`, JSON.stringify(solvedList));

  // 2. Revisions
  const revisionsSnap = await db.collection('users').doc(uid).collection('revisions').get();
  const rev1List = [];
  const rev2List = [];
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
  bookmarksSnap.forEach(doc => {
    bookmarksList.push(parseInt(doc.id));
  });
  localStorage.setItem(`dsa_bookmarks_${uid}`, JSON.stringify(bookmarksList));

  // 4. Notes
  const notesSnap = await db.collection('users').doc(uid).collection('notes').get();
  const notesObj = {};
  notesSnap.forEach(doc => {
    notesObj[doc.id] = doc.data().content || '';
  });
  localStorage.setItem(`dsa_notes_${uid}`, JSON.stringify(notesObj));

  // 5. Editor code
  const editorSnap = await db.collection('users').doc(uid).collection('editor').get();
  editorSnap.forEach(doc => {
    const data = doc.data();
    if (data && data.code !== undefined && data.language) {
      const localData = {
        questionId: String(doc.id),
        language: data.language,
        code: data.code,
        updatedAt: data.updatedAt ? (data.updatedAt.toMillis ? data.updatedAt.toMillis() : Date.now()) : Date.now()
      };
      // Per-language key — this is what the DSA editor actually reads (getDsaUserCodeKey)
      const langKey = `dsa_workspace_code_${uid}_${doc.id}_${data.language}`;
      localStorage.setItem(langKey, JSON.stringify(localData));
      // Convenience "last used" keys so the correct language auto-loads on open
      localStorage.setItem(`dsa_workspace_code_${uid}_${doc.id}`, JSON.stringify(localData));
      localStorage.setItem(`dsa_workspace_last_lang_${uid}_${doc.id}`, data.language);
    }
  });

  // 6. General compiler code
  const generalCompilerSnap = await db.collection('users').doc(uid).collection('general_compiler').get();
  generalCompilerSnap.forEach(doc => {
    const data = doc.data();
    if (data && data.code !== undefined && data.language) {
      const key = `general_compiler_code_${uid}_${data.language}`;
      localStorage.setItem(key, data.code);
    }
  });
}

// Dedicated Sync Actions (Save on change)

// Sync progress solved status
window.syncProgressToCloud = async function (questionId, solved) {
  if (!isFirebaseConfigured || !auth.currentUser) {
    console.log('[FIREBASE DIAG] syncProgressToCloud skipped (Firebase not configured or no current user)');
    return;
  }
  try {
    const uid = auth.currentUser.uid;
    const progressRef = db.collection('users').doc(uid).collection('progress').doc(String(questionId));

    // Check if revision settings are already saved locally to maintain alignment
    const rev1 = lsGet('dsa_rev1').includes(questionId);
    const rev2 = lsGet('dsa_rev2').includes(questionId);

    const syncData = {
      solved: solved,
      rev1: rev1,
      rev2: rev2,
      lastSolved: firebase.firestore.FieldValue.serverTimestamp()
    };

    console.log('[FIREBASE DIAG] syncProgressToCloud — writing data for qId:', questionId, syncData);

    await progressRef.set(syncData, { merge: true });

    console.log('[FIREBASE DIAG] syncProgressToCloud — write SUCCESS for qId:', questionId);
  } catch (error) {
    console.error("[FIREBASE DIAG] ❌ Failed to sync progress to cloud:", error);
  }
};

// Sync revision checks
window.syncRevisionToCloud = async function (questionId, revNum, active) {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const uid = auth.currentUser.uid;

    // Write to revisions collection
    const revRef = db.collection('users').doc(uid).collection('revisions').doc(String(questionId));
    await revRef.set({
      [`rev${revNum}`]: active
    }, { merge: true });

    // Mirror to progress collection
    const progressRef = db.collection('users').doc(uid).collection('progress').doc(String(questionId));
    await progressRef.set({
      [`rev${revNum}`]: active
    }, { merge: true });
  } catch (error) {
    console.error("Failed to sync revision:", error);
  }
};

// Sync bookmarks
window.syncBookmarkToCloud = async function (questionId, bookmarked) {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const uid = auth.currentUser.uid;
    const bookmarkRef = db.collection('users').doc(uid).collection('bookmarks').doc(String(questionId));
    if (bookmarked) {
      await bookmarkRef.set({
        bookmarked: true,
        bookmarkedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await bookmarkRef.delete();
    }
  } catch (error) {
    console.error("Failed to sync bookmark:", error);
  }
};

// Sync personal notes
window.syncNoteToCloud = async function (questionId, content) {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const uid = auth.currentUser.uid;
    const noteRef = db.collection('users').doc(uid).collection('notes').doc(String(questionId));
    await noteRef.set({
      content: content,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Failed to sync note:", error);
  }
};

// Handle user logout
async function handleLogout() {
  if (isFirebaseConfigured) {
    try {
      await auth.signOut();

      // Clear memory state
      if (window.App) {
        window.App.currentQuestion = null;
        window.App.currentPage = 'dashboard';
        window.App.currentTopic = 'all';
        window.App.currentPattern = 'all';
        window.App.filters = {
          search: '',
          difficulty: 'all',
          tier: 'all',
          tcs: 'all',
          status: 'all',
        };
        window.App.sort = { col: 'id', dir: 'asc' };
      }

      // Reset Monaco editor state to the starter code template
      if (window.App && window.App.editor && window.STARTER_CODE) {
        const defaultCode = window.STARTER_CODE[window.App.editorLanguage] || '';
        window.App.editor.setValue(defaultCode);
      }

      sessionStorage.removeItem('dsa_guest_mode');
      window.isGuestMode = false;

      showToast("Logged out successfully.", "info");

      // Reload UI views with blank state (resets metrics)
      if (typeof refreshAllUI === 'function') {
        refreshAllUI();
      }

      setupGuestUI();
      showAuthModal();
    } catch (err) {
      console.error("Failed to logout:", err);
      showToast("Logout failed.", "error");
    }
  }
}

// Helper methods for validation and UX loading

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
  div.textContent = message;
  div.style.display = 'block';
}

function hideAuthError(div) {
  if (div) div.style.display = 'none';
}

function setLoadingState(btn, isLoading) {
  if (!btn) return;
  btn.disabled = isLoading;
  const textEl = btn.querySelector('.btn-text');
  if (isLoading) {
    btn.classList.add('loading');
    if (textEl) textEl.textContent = "Processing...";
  } else {
    btn.classList.remove('loading');
    if (textEl) {
      if (btn.id === 'login-submit-btn') textEl.textContent = "Sign In";
      if (btn.id === 'register-submit-btn') textEl.textContent = "Create Account";
      if (btn.id === 'forgot-submit-btn') textEl.textContent = "Send Reset Instructions";
    }
  }
}

// Switch between forms inside the Auth Card
window.switchAuthView = function (view, event) {
  if (event) event.preventDefault();

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const forgotForm = document.getElementById('forgot-form');

  if (loginForm) loginForm.style.display = 'none';
  if (registerForm) registerForm.style.display = 'none';
  if (forgotForm) forgotForm.style.display = 'none';

  if (view === 'login' && loginForm) loginForm.style.display = 'flex';
  if (view === 'register' && registerForm) registerForm.style.display = 'flex';
  if (view === 'forgot' && forgotForm) forgotForm.style.display = 'flex';
};

// Toggle password visibility field input type
window.togglePasswordVisibility = function (inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.className = 'fas fa-eye-slash';
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.className = 'fas fa-eye';
    }
  }
};

// Translate Firebase auth error codes
function translateAuthError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/user-not-found':
      return 'There is no user record corresponding to this identifier.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'The email address is already in use by another account.';
    case 'auth/weak-password':
      return 'The password is too weak (should be at least 6 characters).';
    case 'auth/operation-not-allowed':
      return 'Operation not allowed.';
    case 'auth/invalid-credential':
      return 'Invalid credentials provided. Please check and try again.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
}

// Sync editor code to cloud
window.syncEditorCodeToCloud = async function (questionId, language, code) {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const uid = auth.currentUser.uid;
    const docRef = db.collection('users').doc(uid).collection('editor').doc(String(questionId));
    await docRef.set({
      questionId: String(questionId),
      language: language,
      code: code,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Editor code synced to Firestore for question:", questionId, "language:", language);
  } catch (error) {
    console.error("Failed to sync editor code:", error);
  }
};

// Sync general compiler code to cloud
window.syncGeneralCompilerCodeToCloud = async function (language, code) {
  if (!isFirebaseConfigured || !auth.currentUser) return;
  try {
    const uid = auth.currentUser.uid;
    const docRef = db.collection('users').doc(uid).collection('general_compiler').doc(String(language));
    await docRef.set({
      language: language,
      code: code,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("General compiler code synced to Firestore for language:", language);
  } catch (error) {
    console.error("Failed to sync general compiler code:", error);
  }
};