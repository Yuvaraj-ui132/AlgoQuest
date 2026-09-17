/**
 * history.js — AlgoQuest Submission History & Analytics
 *
 * Two new SPA pages:
 *   History   (#history)   — paginated submission table + filters
 *   Analytics (#analytics) — summary cards + breakdowns from loaded history
 *
 * Architecture:
 *   Browser → ApiClient.getSubmissionHistory() → FastAPI → Firestore
 *   Never queries Firestore directly.
 *   UID always comes from the verified Firebase token (backend enforced).
 *
 * Data strategy:
 *   - Initial load: 20 most recent submissions
 *   - "Load more" appends next page (cursor-based)
 *   - Simple in-memory cache (_historyCache) is reused on repeated navigation
 *   - Cache is invalidated after a successful Submit
 *   - Analytics are calculated from the currently loaded dataset only
 *     (not the full lifetime history — clearly communicated in the UI)
 */

'use strict';

// ─── Module-level cache ───────────────────────────────────────────────────────
const _historyCache = {
  uid:          null,     // Firebase UID associated with cached items
  items:        [],       // accumulated pages
  hasMore:      false,
  nextCursor:   null,
  loaded:       false,    // true once at least one page has been fetched
  loading:      false,
  filterStatus: 'all',
  filterLang:   'all',
  search:       '',
};

// Expose for external invalidation (e.g., from compiler.js after Submit, or logout/user-switch)
window.invalidateHistoryCache = function () {
  _historyCache.items      = [];
  _historyCache.hasMore    = false;
  _historyCache.nextCursor = null;
  _historyCache.loaded     = false;
  _historyCache.loading    = false;
  _historyCache.uid        = null;

  // Clear any rendered history table
  const container = document.getElementById('history-table-container');
  if (container) {
    container.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon"><i class="fas fa-circle-notch fa-spin"></i></div>
        <div class="history-empty-text">Loading submissions...</div>
      </div>`;
  }
  const countBadge = document.querySelector('.history-count-badge');
  if (countBadge) countBadge.innerHTML = '';

  // Clear analytics containers if rendered
  const topEl = document.getElementById('analytics-top-problems');
  if (topEl) topEl.innerHTML = `<div class="analytics-empty-msg">No data loaded yet.</div>`;
  const activityEl = document.getElementById('analytics-activity');
  if (activityEl) activityEl.innerHTML = `<div class="analytics-empty-msg">No data loaded yet.</div>`;

  console.log('[History] Cache invalidated.');
};

// ─── Question title resolution ────────────────────────────────────────────────
// Reuses the already-loaded App.questions array — no separate fetch needed.
function resolveQuestionTitle(questionId) {
  if (!questionId) return null;
  if (window.App && window.App.questions) {
    const q = window.App.questions.find(x => x.id === questionId || x.id === Number(questionId));
    if (q) return q.name;
  }
  return null;
}

function questionDisplayName(questionId) {
  const name = resolveQuestionTitle(questionId);
  return name || `Question #${questionId}`;
}

// ─── Verdict helpers ──────────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  'Accepted':          { cls: 'verdict-accepted',  short: 'AC'  },
  'Wrong Answer':      { cls: 'verdict-wrong',     short: 'WA'  },
  'Compilation Error': { cls: 'verdict-ce',        short: 'CE'  },
  'Runtime Error':     { cls: 'verdict-re',        short: 'RE'  },
  'Time Limit Exceeded': { cls: 'verdict-tle',     short: 'TLE' },
  'Memory Limit Exceeded': { cls: 'verdict-mle',   short: 'MLE' },
};

function verdictClass(verdict) {
  return (VERDICT_CONFIG[verdict] || { cls: 'verdict-other' }).cls;
}

function isAccepted(verdict) {
  return verdict === 'Accepted';
}

function isFailure(verdict) {
  if (!verdict) return false;
  return !isAccepted(verdict);
}

// ─── Language display ─────────────────────────────────────────────────────────
const LANG_DISPLAY = {
  cpp:        'C++',
  c:          'C',
  java:       'Java',
  python:     'Python',
  javascript: 'JS',
  js:         'JS',
};

function langDisplay(lang) {
  return LANG_DISPLAY[lang] || lang || '—';
}

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(isoStr) {
  if (!isoStr) return '—';
  try {
    const ms = Date.now() - new Date(isoStr).getTime();
    if (isNaN(ms)) return '—';
    const s = Math.floor(ms / 1000);
    if (s < 60)  return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30)  return `${d}d ago`;
    const mo = Math.floor(d / 30);
    return `${mo}mo ago`;
  } catch {
    return '—';
  }
}

// ─── API fetch ────────────────────────────────────────────────────────────────
async function fetchNextPage() {
  if (_historyCache.loading) return;
  if (_historyCache.loaded && !_historyCache.hasMore) return;
  if (!window.ApiClient) {
    throw new Error('ApiClient not available.');
  }

  const currentUid = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser)
    ? firebase.auth().currentUser.uid : null;

  if (_historyCache.uid && _historyCache.uid !== currentUid) {
    _historyCache.items      = [];
    _historyCache.hasMore    = false;
    _historyCache.nextCursor = null;
    _historyCache.loaded     = false;
  }
  _historyCache.uid = currentUid;

  _historyCache.loading = true;
  try {
    const result = await window.ApiClient.getSubmissionHistory({
      limit:  20,
      after:  _historyCache.nextCursor,
    });

    // Session guard: make sure user didn't switch during fetch
    const postFetchUid = (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser)
      ? firebase.auth().currentUser.uid : null;
    if (postFetchUid !== currentUid || !currentUid) {
      console.warn('[History] Stale history fetch discarded (user switched)');
      return;
    }

    // Deduplicate by id (cursor re-fetch guard)
    const existingIds = new Set(_historyCache.items.map(x => x.id));
    const newItems    = (result.items || []).filter(x => !existingIds.has(x.id));

    _historyCache.items      = [..._historyCache.items, ...newItems];
    _historyCache.hasMore    = result.hasMore || false;
    _historyCache.nextCursor = result.nextCursor || null;
    _historyCache.loaded     = true;
  } finally {
    _historyCache.loading = false;
  }
}

// ─── Filtered view ────────────────────────────────────────────────────────────
function getFilteredItems() {
  const { filterStatus, filterLang, search } = _historyCache;
  return _historyCache.items.filter(item => {
    // Status filter
    if (filterStatus === 'accepted'  && item.verdict !== 'Accepted') return false;
    if (filterStatus === 'wrong'     && item.verdict !== 'Wrong Answer') return false;
    if (filterStatus === 'ce'        && item.verdict !== 'Compilation Error') return false;
    if (filterStatus === 'failures'  && isAccepted(item.verdict)) return false;

    // Language filter
    if (filterLang !== 'all' && item.language !== filterLang) return false;

    // Search (by problem name or ID)
    if (search) {
      const title = questionDisplayName(item.questionId).toLowerCase();
      const idStr = String(item.questionId);
      if (!title.includes(search) && !idStr.includes(search)) return false;
    }

    return true;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HISTORY PAGE
// ─────────────────────────────────────────────────────────────────────────────

function renderHistoryPage() {
  const page = document.getElementById('page-history');
  if (!page) return;
  page.innerHTML = buildHistoryHTML();
  attachHistoryEvents();
}

function buildHistoryHTML() {
  const total = _historyCache.items.length;
  const countLabel = _historyCache.loaded
    ? `<span class="history-count-badge"><strong>${total}</strong> submission${total !== 1 ? 's' : ''} loaded</span>`
    : '';

  return `
    <div class="history-page-inner">
      <div class="history-header">
        <div class="history-header-left">
          <div class="history-page-title">
            <i class="fas fa-history"></i>
            Submission History
          </div>
          <div class="history-page-subtitle">Track your coding attempts, results, and execution performance.</div>
        </div>
        <div class="history-header-actions">
          ${countLabel}
          <button class="action-btn" id="history-refresh-btn" title="Refresh history">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      <!-- Compact filter toolbar -->
      <div class="history-filters">
        <div class="history-filter-group">
          <div class="filter-chip-row" id="hist-status-chips">
            <button class="filter-chip active" data-status="all">All</button>
            <button class="filter-chip" data-status="accepted">Accepted</button>
            <button class="filter-chip" data-status="wrong">Wrong Answer</button>
            <button class="filter-chip" data-status="ce">Compile Error</button>
            <button class="filter-chip" data-status="failures">All Failures</button>
          </div>
        </div>
        <div class="history-filter-divider"></div>
        <div class="history-filter-group">
          <select class="history-lang-select" id="hist-lang-select">
            <option value="all">All Languages</option>
            <option value="cpp">C++</option>
            <option value="c">C</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>
        <div class="history-filter-divider"></div>
        <div class="history-filter-group history-search-group">
          <div class="history-search-wrap">
            <i class="fas fa-search"></i>
            <input type="text" id="hist-search-input" placeholder="Search problem name..." autocomplete="off" />
          </div>
        </div>
      </div>

      <!-- Table area -->
      <div class="history-table-wrap">
        <div id="history-table-container">
          <!-- Populated by renderHistoryTable() -->
        </div>
        <div id="history-load-more-wrap" style="display:none;text-align:center;padding:14px 0 18px;border-top:1px solid var(--border);">
          <button class="action-btn" id="history-load-more-btn">
            <i class="fas fa-chevron-down"></i> Load More
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderHistoryTable(resetScroll) {
  const container = document.getElementById('history-table-container');
  if (!container) return;

  const items = getFilteredItems();

  if (_historyCache.loading && _historyCache.items.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon"><i class="fas fa-circle-notch fa-spin"></i></div>
        <div class="history-empty-text">Loading submissions...</div>
      </div>`;
    return;
  }

  if (_historyCache.loaded && _historyCache.items.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon"><i class="fas fa-code"></i></div>
        <div class="history-empty-title">No submissions yet</div>
        <div class="history-empty-text">Submit a solution to a problem to start building your history.</div>
      </div>`;
    hideLoadMore();
    return;
  }

  if (items.length === 0) {
    container.innerHTML = `
      <div class="history-empty">
        <div class="history-empty-icon"><i class="fas fa-filter"></i></div>
        <div class="history-empty-title">No submissions found</div>
        <div class="history-empty-text">Try adjusting your filters or search to find what you're looking for.</div>
      </div>`;
    hideLoadMore();
    return;
  }

  let rows = '';
  items.forEach(item => {
    const vclass  = verdictClass(item.verdict);
    const title   = questionDisplayName(item.questionId);
    const lang    = langDisplay(item.language);
    const allPass = item.passedCount != null && item.totalCount != null
                    && item.passedCount === item.totalCount && item.totalCount > 0;
    const tests   = (item.passedCount != null && item.totalCount != null)
      ? `${item.passedCount}/${item.totalCount}` : '—';
    const rt      = item.runtime || '—';
    const mem     = item.memory  || '—';
    const ts      = relativeTime(item.submittedAt);
    const qid     = item.questionId;
    const testsClass = `history-cell-tests${allPass ? ' all-pass' : ''}`;

    rows += `
      <tr class="history-row" data-qid="${qid}">
        <td><span class="verdict-badge ${vclass}">${item.verdict || '—'}</span></td>
        <td><span class="history-problem-link" onclick="window.openHistoryProblem(${qid})" title="Open ${title}">${title}</span></td>
        <td><span class="history-lang-chip">${lang}</span></td>
        <td class="${testsClass}">${tests}</td>
        <td class="history-cell-number">${rt}</td>
        <td class="history-cell-number">${mem}</td>
        <td class="history-cell-time" title="${item.submittedAt || ''}">${ts}</td>
      </tr>`;
  });

  container.innerHTML = `
    <table class="history-table">
      <colgroup>
        <col style="width:140px"/><!-- Status -->
        <col/>                    <!-- Problem: takes all remaining space -->
        <col style="width:82px"/> <!-- Language -->
        <col style="width:68px"/> <!-- Tests -->
        <col style="width:90px"/> <!-- Runtime -->
        <col style="width:90px"/> <!-- Memory -->
        <col style="width:96px"/> <!-- Submitted -->
      </colgroup>
      <thead>
        <tr>
          <th>Status</th>
          <th>Problem</th>
          <th>Language</th>
          <th>Tests</th>
          <th>Runtime</th>
          <th>Memory</th>
          <th>Submitted</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;

  // Update count badge in header if rendered
  const countBadge = document.querySelector('.history-count-badge');
  if (countBadge) {
    const n = _historyCache.items.length;
    countBadge.innerHTML = `<strong>${n}</strong> submission${n !== 1 ? 's' : ''} loaded`;
  }

  // Load more button
  const wrap = document.getElementById('history-load-more-wrap');
  if (wrap) {
    wrap.style.display = _historyCache.hasMore ? 'block' : 'none';
  }
}

function hideLoadMore() {
  const wrap = document.getElementById('history-load-more-wrap');
  if (wrap) wrap.style.display = 'none';
}

function showHistoryError(msg) {
  const container = document.getElementById('history-table-container');
  if (!container) return;
  container.innerHTML = `
    <div class="history-empty history-error-state">
      <div class="history-empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="history-empty-title">Unable to load history</div>
      <div class="history-empty-text">${msg}</div>
      <button class="action-btn" style="margin-top:14px" onclick="window.loadHistoryPage()">
        <i class="fas fa-sync-alt"></i> Retry
      </button>
    </div>`;
}

async function loadHistoryPage(forceRefresh) {
  if (forceRefresh) {
    window.invalidateHistoryCache();
  }

  const page = document.getElementById('page-history');
  if (!page || !page.classList.contains('active')) return;

  // Render skeleton immediately
  if (!_historyCache.loaded) {
    const container = document.getElementById('history-table-container');
    if (container) {
      container.innerHTML = `
        <div class="history-empty">
          <div class="history-empty-icon"><i class="fas fa-circle-notch fa-spin"></i></div>
          <div class="history-empty-text">Loading submissions...</div>
        </div>`;
    }
  }

  try {
    await fetchNextPage();
    renderHistoryTable();
    syncHistoryFilterUI();
  } catch (err) {
    console.error('[History] Failed to load:', err);
    if (err && err.status === 401) {
      showHistoryError('Please log in to view your submission history.');
    } else {
      showHistoryError('Could not fetch history. Check your connection or try again.');
    }
  }
}

window.loadHistoryPage = loadHistoryPage;

function syncHistoryFilterUI() {
  // Status chips
  const chips = document.querySelectorAll('#hist-status-chips .filter-chip');
  chips.forEach(c => {
    c.classList.toggle('active', c.dataset.status === _historyCache.filterStatus);
  });
  // Lang select
  const langSel = document.getElementById('hist-lang-select');
  if (langSel) langSel.value = _historyCache.filterLang;
  // Search
  const searchInput = document.getElementById('hist-search-input');
  if (searchInput) searchInput.value = _historyCache.search;
}

function attachHistoryEvents() {
  // Refresh button
  const refreshBtn = document.getElementById('history-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => loadHistoryPage(true));
  }

  // Status filter chips
  const chipContainer = document.getElementById('hist-status-chips');
  if (chipContainer) {
    chipContainer.addEventListener('click', e => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      _historyCache.filterStatus = chip.dataset.status;
      chipContainer.querySelectorAll('.filter-chip').forEach(c =>
        c.classList.toggle('active', c === chip)
      );
      renderHistoryTable();
    });
  }

  // Language filter
  const langSel = document.getElementById('hist-lang-select');
  if (langSel) {
    langSel.addEventListener('change', () => {
      _historyCache.filterLang = langSel.value;
      renderHistoryTable();
    });
  }

  // Search input (debounced)
  let searchTimer;
  const searchInput = document.getElementById('hist-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        _historyCache.search = searchInput.value.toLowerCase().trim();
        renderHistoryTable();
      }, 200);
    });
  }

  // Load more button
  const loadMoreBtn = document.getElementById('history-load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', async () => {
      loadMoreBtn.disabled = true;
      loadMoreBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Loading...';
      try {
        await fetchNextPage();
        renderHistoryTable();
      } catch (err) {
        console.error('[History] Load more failed:', err);
        if (typeof showToast === 'function') {
          showToast('Failed to load more submissions.', 'error');
        }
      } finally {
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = '<i class="fas fa-chevron-down"></i> Load More';
      }
    });
  }
}

// Open a problem from history — reuses the existing problem workspace
window.openHistoryProblem = function (questionId) {
  if (!questionId) return;
  if (window.openProblemWorkspace) {
    window.openProblemWorkspace(questionId, true);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PROBLEM-LEVEL SUBMISSION PANEL (inside problem workspace)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Render a compact submission panel inside the problem description tab area.
 * Called when the user switches to the "Submissions" tab within the workspace.
 * Uses the global cache — no new API call if we already have data.
 */
async function renderProblemSubmissionsPanel(containerId, questionId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="prob-sub-loading">
      <i class="fas fa-circle-notch fa-spin"></i> Loading...
    </div>`;

  // Ensure at least the first page is loaded
  if (!_historyCache.loaded) {
    try {
      await fetchNextPage();
    } catch (err) {
      console.error('[History] Problem panel load failed:', err);
      container.innerHTML = `<div class="prob-sub-error">Could not load submissions.</div>`;
      return;
    }
  }

  const qItems = _historyCache.items.filter(
    x => x.questionId === questionId || x.questionId === Number(questionId)
  );

  if (qItems.length === 0) {
    container.innerHTML = `
      <div class="prob-sub-empty">
        <i class="fas fa-inbox"></i>
        <span>No submissions for this problem yet.</span>
      </div>`;
    return;
  }

  let rows = '';
  qItems.slice(0, 10).forEach(item => {
    const vclass = verdictClass(item.verdict);
    const lang   = langDisplay(item.language);
    const tests  = (item.passedCount != null && item.totalCount != null)
      ? `${item.passedCount}/${item.totalCount}` : '—';
    const rt     = item.runtime || '—';
    const ts     = relativeTime(item.submittedAt);

    rows += `
      <tr class="prob-sub-row">
        <td><span class="verdict-badge ${vclass} verdict-badge-sm">${item.verdict || '—'}</span></td>
        <td><span class="history-lang-chip history-lang-chip-sm">${lang}</span></td>
        <td class="prob-sub-cell">${tests}</td>
        <td class="prob-sub-cell">${rt}</td>
        <td class="prob-sub-cell history-cell-time">${ts}</td>
      </tr>`;
  });

  const moreNote = qItems.length > 10
    ? `<div class="prob-sub-more">Showing latest 10 of ${qItems.length} loaded submissions</div>` : '';

  container.innerHTML = `
    <table class="prob-sub-table">
      <thead>
        <tr>
          <th>Status</th><th>Lang</th><th>Tests</th><th>Runtime</th><th>When</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${moreNote}
    <div style="text-align:right;margin-top:8px;">
      <button class="action-btn" style="font-size:11px;padding:4px 10px;"
        onclick="navigateTo('history')">
        <i class="fas fa-history"></i> View All
      </button>
    </div>`;
}
window.renderProblemSubmissionsPanel = renderProblemSubmissionsPanel;

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS PAGE
// ─────────────────────────────────────────────────────────────────────────────

function renderAnalyticsPage() {
  const page = document.getElementById('page-analytics');
  if (!page) return;
  page.innerHTML = buildAnalyticsHTML();
  attachAnalyticsEvents();
  populateAnalytics();
}

function buildAnalyticsHTML() {
  return `
    <div class="analytics-page-inner">
      <div class="history-header">
        <div>
          <div class="section-title"><i class="fas fa-chart-bar"></i> Analytics</div>
          <div class="page-breadcrumb" style="margin-top:2px" id="analytics-scope-note">
            Calculated from recently loaded submissions
          </div>
        </div>
        <button class="action-btn" id="analytics-refresh-btn" title="Refresh">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <!-- Summary stat cards -->
      <div class="analytics-stats-grid" id="analytics-stats-grid">
        <!-- Populated by populateAnalytics() -->
      </div>

      <!-- Two-column breakdown -->
      <div class="analytics-breakdown-row">

        <!-- Verdict breakdown -->
        <div class="analytics-breakdown-card">
          <div class="section-header" style="margin-bottom:12px">
            <div class="section-title"><i class="fas fa-pie-chart"></i> Verdict Breakdown</div>
          </div>
          <div id="analytics-verdict-breakdown"></div>
        </div>

        <!-- Language breakdown -->
        <div class="analytics-breakdown-card">
          <div class="section-header" style="margin-bottom:12px">
            <div class="section-title"><i class="fas fa-code"></i> By Language</div>
          </div>
          <div id="analytics-lang-breakdown"></div>
        </div>

      </div>

      <!-- Most attempted problems -->
      <div class="analytics-section-card" style="margin-top:18px">
        <div class="section-header" style="margin-bottom:12px">
          <div class="section-title"><i class="fas fa-fire"></i> Most Attempted Problems</div>
        </div>
        <div id="analytics-top-problems"></div>
      </div>

      <!-- Recent activity -->
      <div class="analytics-section-card" style="margin-top:18px">
        <div class="section-header" style="margin-bottom:12px">
          <div class="section-title"><i class="fas fa-calendar-alt"></i> Recent Activity</div>
        </div>
        <div id="analytics-activity"></div>
      </div>

      <div class="analytics-disclaimer">
        <i class="fas fa-info-circle"></i>
        Analytics are calculated from your <strong>currently loaded submissions</strong> (up to 50 most recent).
        They may not reflect your complete lifetime history.
        Use "Load More" on the History page to include older submissions.
      </div>
    </div>`;
}

async function populateAnalytics() {
  // ── PHASE 1: Progress-based stats ─────────────────────────────────────────
  // Read from localStorage via the existing lsGet() abstraction.
  // This NEVER touches the API and NEVER fails due to a network error.
  // UID-namespacing is handled internally by lsGet() / getStorageKey().

  const solvedList = (() => {
    try { return window.lsGet ? window.lsGet('dsa_solved') : []; }
    catch { return []; }
  })();
  const problemsSolved = solvedList.length;

  // ── PHASE 2: Submission-history stats ─────────────────────────────────────
  // Attempt to load submission history. On failure, still render Phase 1 cards.
  let historyAvailable = true;

  if (!_historyCache.loaded) {
    // Show a loading skeleton in the stats grid while the API call is in-flight.
    const grid = document.getElementById('analytics-stats-grid');
    if (grid) grid.innerHTML = `<div style="color:var(--text-muted);padding:20px"><i class="fas fa-circle-notch fa-spin"></i> Loading...</div>`;

    try {
      await fetchNextPage();
    } catch (err) {
      console.error('[Analytics] Submission history fetch failed:', err);
      historyAvailable = false;
    }
  }

  const items    = _historyCache.items;  // [] when historyAvailable=false
  const total    = items.length;
  const accepted = items.filter(x => isAccepted(x.verdict)).length;
  const rate     = total > 0 ? Math.round((accepted / total) * 100) : 0;

  // Unique problem IDs from loaded submission history
  const attempted = new Set(items.map(x => x.questionId)).size;

  // Scope note — always update
  const scopeNote = document.getElementById('analytics-scope-note');
  if (scopeNote) {
    if (!historyAvailable) {
      scopeNote.textContent = 'Submission history unavailable — showing local progress only';
    } else {
      scopeNote.textContent = `Calculated from ${total} loaded submission${total !== 1 ? 's' : ''}`;
    }
  }

  // ── Stat cards ──────────────────────────────────────────────────────────────
  // Problems Solved always comes from lsGet() (Phase 1 — never fails).
  // Submission-derived cards show "—" when history is unavailable.
  const grid = document.getElementById('analytics-stats-grid');
  if (grid) {
    if (historyAvailable) {
      grid.innerHTML = `
        ${analyticsCard(total,          'Total Submissions', 'fa-database',     'accent-blue')}
        ${analyticsCard(accepted,       'Accepted',          'fa-check-circle', 'accent-green')}
        ${analyticsCard(rate + '%',     'Success Rate',      'fa-percentage',   rate >= 50 ? 'accent-green' : 'accent-orange')}
        ${analyticsCard(attempted,      'Problems Attempted','fa-flask',        'accent-purple')}
        ${analyticsCard(problemsSolved, 'Problems Solved',   'fa-trophy',       'accent-yellow')}
      `;
    } else {
      // History API failed — show progress cards with full data, history cards grayed
      grid.innerHTML = `
        ${analyticsCard('—',            'Total Submissions', 'fa-database',     'accent-blue')}
        ${analyticsCard('—',            'Accepted',          'fa-check-circle', 'accent-green')}
        ${analyticsCard('—',            'Success Rate',      'fa-percentage',   'accent-orange')}
        ${analyticsCard('—',            'Problems Attempted','fa-flask',        'accent-purple')}
        ${analyticsCard(problemsSolved, 'Problems Solved',   'fa-trophy',       'accent-yellow')}
      `;
    }
  }

  // ── Submission-history-dependent sections ─────────────────────────────────
  // When history is unavailable, show a compact inline notice per section
  // rather than leaving them blank or crashing the page.

  const _historyUnavailableMsg = `
    <div class="analytics-empty-msg" style="color:var(--text-muted);font-style:italic;">
      <i class="fas fa-wifi" style="margin-right:4px;opacity:.5;"></i>
      Submission history unavailable
    </div>`;

  // ── Verdict breakdown ────────────────────────────────────────────────────────
  const verdictEl = document.getElementById('analytics-verdict-breakdown');
  if (verdictEl) {
    if (!historyAvailable) {
      verdictEl.innerHTML = _historyUnavailableMsg;
    } else {
      const verdictMap = {};
      items.forEach(x => {
        const v = x.verdict || 'Unknown';
        verdictMap[v] = (verdictMap[v] || 0) + 1;
      });
      if (Object.keys(verdictMap).length === 0) {
        verdictEl.innerHTML = `<div class="analytics-empty-msg">No data yet.</div>`;
      } else {
        const sorted = Object.entries(verdictMap).sort((a, b) => b[1] - a[1]);
        verdictEl.innerHTML = sorted.map(([v, n]) => {
          const pct  = total > 0 ? Math.round((n / total) * 100) : 0;
          const vCls = verdictClass(v);
          return `
            <div class="analytics-bar-row">
              <span class="verdict-badge ${vCls}" style="min-width:120px;text-align:center">${v}</span>
              <div class="analytics-bar-track">
                <div class="analytics-bar-fill ${vCls}-bar" style="width:${pct}%"></div>
              </div>
              <span class="analytics-bar-count">${n} <span class="analytics-bar-pct">(${pct}%)</span></span>
            </div>`;
        }).join('');
      }
    }
  }

  // ── Language breakdown ───────────────────────────────────────────────────────
  const langEl = document.getElementById('analytics-lang-breakdown');
  if (langEl) {
    if (!historyAvailable) {
      langEl.innerHTML = _historyUnavailableMsg;
    } else {
      const langMap = {};
      items.forEach(x => {
        const l = x.language || 'unknown';
        langMap[l] = (langMap[l] || 0) + 1;
      });
      if (Object.keys(langMap).length === 0) {
        langEl.innerHTML = `<div class="analytics-empty-msg">No data yet.</div>`;
      } else {
        const sorted = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
        langEl.innerHTML = sorted.map(([l, n]) => {
          const pct = total > 0 ? Math.round((n / total) * 100) : 0;
          return `
            <div class="analytics-bar-row">
              <span class="analytics-lang-label">${langDisplay(l)}</span>
              <div class="analytics-bar-track">
                <div class="analytics-bar-fill analytics-bar-fill-blue" style="width:${pct}%"></div>
              </div>
              <span class="analytics-bar-count">${n} <span class="analytics-bar-pct">(${pct}%)</span></span>
            </div>`;
        }).join('');
      }
    }
  }

  // ── Most attempted problems ──────────────────────────────────────────────────
  const topEl = document.getElementById('analytics-top-problems');
  if (topEl) {
    if (!historyAvailable) {
      topEl.innerHTML = _historyUnavailableMsg;
    } else {
      const problemMap = {};
      items.forEach(x => {
        const k = x.questionId;
        if (!problemMap[k]) problemMap[k] = { attempts: 0, accepted: false };
        problemMap[k].attempts++;
        if (isAccepted(x.verdict)) problemMap[k].accepted = true;
      });
      const topProblems = Object.entries(problemMap)
        .sort((a, b) => b[1].attempts - a[1].attempts)
        .slice(0, 8);

      if (topProblems.length === 0) {
        topEl.innerHTML = `<div class="analytics-empty-msg">No data yet.</div>`;
      } else {
        topEl.innerHTML = `
          <div class="analytics-top-list">
            ${topProblems.map(([qid, data], i) => `
              <div class="analytics-top-item" onclick="window.openHistoryProblem(${qid})">
                <span class="analytics-rank">${i + 1}</span>
                <span class="analytics-top-name">${questionDisplayName(qid)}</span>
                <span class="analytics-top-meta">
                  ${data.attempts} attempt${data.attempts !== 1 ? 's' : ''}
                  ${data.accepted ? '<span class="analytics-solved-badge">Solved</span>' : ''}
                </span>
              </div>
            `).join('')}
          </div>`;
      }
    }
  }

  // ── Recent activity (group by date) ─────────────────────────────────────────
  const activityEl = document.getElementById('analytics-activity');
  if (activityEl) {
    if (!historyAvailable) {
      activityEl.innerHTML = _historyUnavailableMsg;
    } else {
      const dateMap = {};
      items.forEach(x => {
        if (!x.submittedAt) return;
        try {
          const d = new Date(x.submittedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          if (!dateMap[d]) dateMap[d] = { total: 0, accepted: 0 };
          dateMap[d].total++;
          if (isAccepted(x.verdict)) dateMap[d].accepted++;
        } catch {}
      });
      const entries = Object.entries(dateMap).slice(0, 14);
      if (entries.length === 0) {
        activityEl.innerHTML = `<div class="analytics-empty-msg">No recent activity.</div>`;
      } else {
        const maxTotal = Math.max(...entries.map(([, v]) => v.total), 1);
        activityEl.innerHTML = `
          <div class="analytics-activity-grid">
            ${entries.map(([date, data]) => {
              const pct = Math.round((data.total / maxTotal) * 100);
              return `
                <div class="analytics-activity-day">
                  <div class="analytics-activity-bar-wrap">
                    <div class="analytics-activity-bar" style="height:${Math.max(pct, 8)}%" title="${data.total} submissions on ${date}">
                      <span class="analytics-activity-count">${data.total}</span>
                    </div>
                  </div>
                  <div class="analytics-activity-label">${date}</div>
                </div>`;
          }).join('')}
        </div>`;
      }    // end else (entries.length > 0)
    }    // end else (!historyAvailable)
  }    // end if (activityEl)
}    // end populateAnalytics()

function analyticsCard(value, label, icon, colorClass) {
  return `
    <div class="analytics-stat-card">
      <div class="analytics-stat-icon ${colorClass}"><i class="fas ${icon}"></i></div>
      <div class="analytics-stat-value">${value}</div>
      <div class="analytics-stat-label">${label}</div>
    </div>`;
}

function attachAnalyticsEvents() {
  const refreshBtn = document.getElementById('analytics-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      window.invalidateHistoryCache();
      populateAnalytics();
    });
  }
}

// ─── Export: called by app.js navigateTo ─────────────────────────────────────
window.HistoryModule = {
  renderHistoryPage,
  loadHistoryPage,
  renderAnalyticsPage,
  populateAnalytics,
  clearUserCache: window.invalidateHistoryCache,
};

// ─── Toggle collapsible My Submissions in problem workspace ───────────────────
window.toggleProblemSubmissions = function () {
  const panel = document.getElementById('dsa-problem-submissions-panel');
  const icon  = document.getElementById('dsa-submissions-toggle-icon');
  if (!panel) return;

  const isOpen = panel.style.display !== 'none';
  if (isOpen) {
    panel.style.display = 'none';
    if (icon) icon.style.transform = 'rotate(0deg)';
    return;
  }

  // Open: show panel and load submissions for current question
  panel.style.display = 'block';
  if (icon) icon.style.transform = 'rotate(180deg)';

  const qid = window.App?.currentQuestion?.id;
  if (qid) {
    window.renderProblemSubmissionsPanel('dsa-problem-submissions-panel', qid);
  } else {
    panel.innerHTML = `<div class="prob-sub-empty"><i class="fas fa-info-circle"></i><span>No problem selected.</span></div>`;
  }
};

// ─── When a new problem opens, collapse the panel so it loads fresh ───────────
// Hook into populateDsaProblemPanel if it exists (defined in compiler.js or app.js)
const _origPopulateDsaProblemPanel = window.populateDsaProblemPanel;
if (typeof _origPopulateDsaProblemPanel === 'function') {
  window.populateDsaProblemPanel = function (question) {
    // Collapse My Submissions when switching problems
    const panel = document.getElementById('dsa-problem-submissions-panel');
    const icon  = document.getElementById('dsa-submissions-toggle-icon');
    if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
    if (icon) icon.style.transform = 'rotate(0deg)';
    return _origPopulateDsaProblemPanel(question);
  };
}

