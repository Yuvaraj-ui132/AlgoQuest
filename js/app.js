/**
 * app.js — AlgoForge DSA Dashboard
 * Main application controller
 */

'use strict';

// ============================================================
// GLOBAL STATE
// ============================================================
const App = {
  questions: [],
  filteredQuestions: [],
  currentQuestion: null,
  currentPage: 'dashboard',
  currentTopic: 'all',
  currentPattern: 'all',
  prevPage: null,
  prevTopic: null,
  prevPattern: null,
  _advancedOpen: false,
  filters: {
    search: '',
    difficulty: 'all',
    tier: 'all',
    tcs: 'all',
    status: 'all',
  },
  sort: { col: 'id', dir: 'asc' },
  editor: null,
  dsaEditor: null,
  editorLanguage: 'cpp',
  dsaEditorLanguage: 'cpp',
  showHint: false,
  showSolution: false,
};
window.App = App;

// ============================================================
// LOCAL STORAGE KEYS
// ============================================================
const LS = {
  SOLVED: 'dsa_solved',
  REV1: 'dsa_rev1',
  REV2: 'dsa_rev2',
  LAST_Q: 'dsa_last_q',
  THEME: 'dsa_theme',
  CODE: 'dsa_code_',
  STREAK: 'dsa_streak',
  LAST_DAY: 'dsa_last_day',
  BOOKMARKS: 'dsa_bookmarks',
  NOTES: 'dsa_notes',
};

function getStorageKey(key) {
  if (key === 'dsa_theme' || key === LS.THEME) {
    return key;
  }
  if (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured && firebase.auth && firebase.auth() && firebase.auth().currentUser) {
    const uid = firebase.auth().currentUser.uid;
    return `${key}_${uid}`;
  }
  return `${key}_guest`;
}
window.getStorageKey = getStorageKey;

function lsGet(key) {
  try {
    const nsKey = getStorageKey(key);
    let val = localStorage.getItem(nsKey);
    if (val === null) {
      const legacyVal = localStorage.getItem(key);
      if (legacyVal !== null) {
        localStorage.setItem(nsKey, legacyVal);
        val = legacyVal;
      }
    }
    return JSON.parse(val) || [];
  } catch {
    return [];
  }
}

function lsSet(key, val) {
  localStorage.setItem(getStorageKey(key), JSON.stringify(val));
}

function lsGetObj(key) {
  try {
    const nsKey = getStorageKey(key);
    let val = localStorage.getItem(nsKey);
    if (val === null) {
      const legacyVal = localStorage.getItem(key);
      if (legacyVal !== null) {
        localStorage.setItem(nsKey, legacyVal);
        val = legacyVal;
      }
    }
    return JSON.parse(val) || {};
  } catch {
    return {};
  }
}

window.lsGet = lsGet;
window.lsSet = lsSet;
window.lsGetObj = lsGetObj;

// ============================================================
// TOPICS CONFIGURATION
// ============================================================
// Main topics (shown in sidebar by default)
const HIGH_LEVEL_TOPICS = [
  { id: 'Arrays', label: 'Arrays', icon: 'fa-layer-group' },
  { id: 'Strings', label: 'Strings', icon: 'fa-font' },
  { id: 'Linked List', label: 'Linked List', icon: 'fa-link' },
  { id: 'Stacks & Queues', label: 'Stacks & Queues', icon: 'fa-stream' },
  { id: 'Trees & BST', label: 'Trees & BST', icon: 'fa-tree' },
  { id: 'Recursion & Backtracking', label: 'Recursion & Backtracking', icon: 'fa-redo' },
  { id: 'Sorting', label: 'Sorting', icon: 'fa-sort-amount-up' },
  { id: 'Binary Search', label: 'Binary Search', icon: 'fa-search' },
  { id: 'Greedy', label: 'Greedy', icon: 'fa-bolt' },
  { id: 'Dynamic Programming', label: 'Dynamic Programming', icon: 'fa-brain' },
  { id: 'Graphs', label: 'Graphs', icon: 'fa-project-diagram' },
];

// Advanced topics (shown in collapsed section)
const ADVANCED_TOPICS = [
  { id: 'Heap', label: 'Heap', icon: 'fa-mountain' },
  { id: 'Trie', label: 'Trie', icon: 'fa-spell-check' },
  { id: 'Segment Tree', label: 'Segment Tree', icon: 'fa-bezier-curve' },
  { id: 'Matrix', label: 'Matrix', icon: 'fa-border-all' },
  { id: 'Union Find', label: 'Union Find', icon: 'fa-circle-notch' },
  { id: 'Bit Manipulation', label: 'Bit Manipulation', icon: 'fa-microchip' },
  { id: 'Number Theory', label: 'Number Theory', icon: 'fa-infinity' },
];

// All topics combined
const ALL_TOPICS = [...HIGH_LEVEL_TOPICS, ...ADVANCED_TOPICS];

// Get canonical topic from a question (uses canonicalTopic field first)
function getCanonical(q) {
  return q.canonicalTopic || q.topic || 'Unknown';
}

// Get patterns for a topic (ordered by user's hierarchy)
const TOPIC_PATTERN_ORDER = {
  'Arrays': ['Hashing', 'Two Pointers', 'Sliding Window', 'Prefix Sum', 'General'],
  'Strings': ['Hashing', 'Two Pointers', 'Sliding Window', 'General'],
  'Linked List': ['Fast & Slow Pointer', 'Reversal', 'General'],
  'Stacks & Queues': ['Stack', 'Monotonic Stack', 'Queue'],
  'Trees & BST': ['DFS', 'BFS'],
  'Recursion & Backtracking': ['Recursion', 'Backtracking'],
  'Sorting': ['Comparison Sorts', 'Non-Comparison Sorts', 'Application'],
  'Binary Search': ['Binary Search'],
  'Greedy': ['Greedy'],
  'Dynamic Programming': ['1D DP', '2D DP'],
  'Graphs': ['BFS', 'DFS', 'Topological Sort', 'Union Find'],
  'Heap': ['Heap'],
  'Trie': ['Trie'],
  'Segment Tree': ['Segment Tree'],
  'Matrix': ['Matrix'],
  'Union Find': ['Union Find'],
  'Bit Manipulation': ['Bit Manipulation'],
  'Number Theory': ['Number Theory'],
};

function getPatternsForTopic(topicId) {
  // Return patterns in the user-defined order, only including ones that have questions
  const ordered = TOPIC_PATTERN_ORDER[topicId] || [];
  const existing = new Set();
  App.questions.forEach(q => {
    if (getCanonical(q) === topicId && q.pattern) existing.add(q.pattern);
  });
  // Return ordered patterns that exist, plus any extras not in order list
  const result = ordered.filter(p => existing.has(p));
  existing.forEach(p => { if (!result.includes(p)) result.push(p); });
  return result;
}

// ============================================================
// DEFAULT STARTER CODE
// ============================================================
const STARTER_CODE = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    return 0;
}`,
  c: `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    return 0;
}`,
  java: `public class Main {
    public static void main(String[] args) {
        
    }
}`,
  python: `def main():
    pass

if __name__ == "__main__":
    main()`,
  js: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
const lines = [];
rl.on('line', l => lines.push(l.trim()));
rl.on('close', () => {
    
});`,
};

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadQuestions();
  buildSidebar();
  initTheme();
  initTopbar();
  updateStreak();
  navigateTo('all');
  initMonaco();
  Compiler.init();
  restoreLastQuestion();
  initNotes();
});

// ============================================================
// LOAD QUESTIONS
// ============================================================
async function loadQuestions() {
  try {
    const resp = await fetch('data/questions.json');
    App.questions = await resp.json();
    App.filteredQuestions = [...App.questions];
  } catch (e) {
    console.error('Failed to load questions:', e);
    App.questions = [];
    App.filteredQuestions = [];
  }
}

// ============================================================
// SIDEBAR
// ============================================================
function buildSidebar() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  const solved = lsGet(LS.SOLVED);
  let html = '';

  // 1. Navigation Section
  html += `<div class="nav-section-title">Navigation</div>`;
  const mainItems = [
    { id: 'all', label: 'Dashboard', icon: 'fa-th-large' },
    { id: 'table', label: 'All Questions', icon: 'fa-table' },
    { id: 'bookmarks', label: 'Bookmarks', icon: 'fa-bookmark' },
    { id: 'compiler', label: 'Code Editor', icon: 'fa-code' }
  ];

  mainItems.forEach(item => {
    const isActive = App.currentPage === item.id;
    html += `
      <div class="nav-item ${isActive ? 'active' : ''}" data-nav="${item.id}" onclick="navigateTo('${item.id}')">
        <i class="fas ${item.icon}"></i>
        <span class="nav-label">${item.label}</span>
      </div>`;
  });

  // 2. Core Topics Section
  html += `<div class="nav-section-title">Topics</div>`;

  function buildTopicGroup(topic) {
    const topicQs = App.questions.filter(q => getCanonical(q) === topic.id);
    const totalCount = topicQs.length;
    if (totalCount === 0) return '';

    const solvedCount = topicQs.filter(q => solved.includes(q.id)).length;
    const isTopicActive = App.currentPage === 'questions' && App.currentTopic === topic.id;
    const patterns = getPatternsForTopic(topic.id);
    const pct = totalCount ? Math.round((solvedCount / totalCount) * 100) : 0;

    let topicHtml = `
      <div class="sidebar-topic-group ${isTopicActive ? 'expanded' : ''}">
        <div class="sidebar-topic-header ${isTopicActive ? 'active' : ''}" onclick="selectTopic('${topic.id}')">
          <i class="fas ${topic.icon}"></i>
          <span class="topic-label">${topic.label}</span>
          <span class="nav-badge">${solvedCount}/${totalCount}</span>
          <i class="fas fa-chevron-down toggle-icon"></i>
        </div>
        <div class="sidebar-patterns-list">`;

    const isAllPatternsActive = isTopicActive && App.currentPattern === 'all';
    topicHtml += `
      <div class="sidebar-pattern-item ${isAllPatternsActive ? 'active' : ''}" onclick="selectPattern('${topic.id}', 'all')">
        <span class="pattern-label">All Patterns</span>
        <span class="pattern-badge">${solvedCount}/${totalCount}</span>
      </div>`;

    patterns.forEach(p => {
      const patternQs = topicQs.filter(q => q.pattern === p);
      const patSolved = patternQs.filter(q => solved.includes(q.id)).length;
      const isActivePattern = isTopicActive && App.currentPattern === p;
      topicHtml += `
        <div class="sidebar-pattern-item ${isActivePattern ? 'active' : ''}" onclick="selectPattern('${topic.id}', '${p}')">
          <span class="pattern-label">${p}</span>
          <span class="pattern-badge">${patSolved}/${patternQs.length}</span>
        </div>`;
    });

    topicHtml += `</div></div>`;
    return topicHtml;
  }

  HIGH_LEVEL_TOPICS.forEach(topic => {
    html += buildTopicGroup(topic);
  });

  // 3. Advanced Topics (collapsed section)
  const advancedActiveId = ADVANCED_TOPICS.find(t => t.id === App.currentTopic)?.id;
  const isAdvancedSectionOpen = !!advancedActiveId || App._advancedOpen;
  html += `
    <div class="nav-section-title advanced-section-toggle" onclick="toggleAdvancedSection()" id="advanced-section-header" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
      <span>Advanced Topics</span>
      <i class="fas fa-chevron-${isAdvancedSectionOpen ? 'up' : 'down'}" style="font-size:10px;"></i>
    </div>
    <div class="advanced-topics-list" id="advanced-topics-list" style="display:${isAdvancedSectionOpen ? 'block' : 'none'};">`;

  ADVANCED_TOPICS.forEach(topic => {
    html += buildTopicGroup(topic);
  });

  html += `</div>`;

  nav.innerHTML = html;
  updateSidebarStats();
}

function updateSidebarStats() {
  const solved = lsGet(LS.SOLVED);
  const total = App.questions.length;
  const pct = total ? Math.round((solved.length / total) * 100) : 0;

  const fill = document.getElementById('sidebar-progress-fill');
  const text = document.getElementById('sidebar-progress-text');
  if (fill) fill.style.width = pct + '%';
  if (text) text.textContent = `${solved.length}/${total} Solved`;
}

function toggleAdvancedSection() {
  App._advancedOpen = !App._advancedOpen;
  const list = document.getElementById('advanced-topics-list');
  const header = document.getElementById('advanced-section-header');
  if (list) list.style.display = App._advancedOpen ? 'block' : 'none';
  if (header) {
    const icon = header.querySelector('.fas');
    if (icon) {
      icon.className = `fas fa-chevron-${App._advancedOpen ? 'up' : 'down'}`;
      icon.style.fontSize = '10px';
    }
  }
}

// ============================================================
// THEME
// ============================================================
function initTheme() {
  const saved = localStorage.getItem(LS.THEME) || 'dark';
  applyTheme(saved);

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(LS.THEME, theme);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = `<i class="fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>`;

  // Keep the Monaco code editors (general + DSA compiler) in sync with the app theme.
  // monaco.editor.setTheme() is global and updates every existing editor instance at once.
  if (typeof monaco !== 'undefined' && monaco.editor && typeof monaco.editor.setTheme === 'function') {
    monaco.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
  }
}

// ============================================================
// TOPBAR
// ============================================================
function initTopbar() {
  // Sidebar toggle
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  // Search — triggers filter on all pages except dashboard
  document.getElementById('search-input').addEventListener('input', e => {
    App.filters.search = e.target.value.toLowerCase();
    if (App.currentPage !== 'all') {
      applyFilters();
      renderCurrentView();
    }
  });


  // Filter buttons
  // Generic filter wiring
  document.querySelectorAll('[data-filter-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-diff]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`[data-filter-diff="${btn.dataset.filterDiff}"]`).forEach(b => b.classList.add('active'));
      App.filters.difficulty = btn.dataset.filterDiff;
      if (App.currentPage !== 'all') { applyFilters(); renderCurrentView(); }
    });
  });

  document.querySelectorAll('[data-filter-tier]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-tier]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`[data-filter-tier="${btn.dataset.filterTier}"]`).forEach(b => b.classList.add('active'));
      App.filters.tier = btn.dataset.filterTier;
      if (App.currentPage !== 'all') { applyFilters(); renderCurrentView(); }
    });
  });

  document.querySelectorAll('[data-filter-tcs]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-tcs]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`[data-filter-tcs="${btn.dataset.filterTcs}"]`).forEach(b => b.classList.add('active'));
      App.filters.tcs = btn.dataset.filterTcs;
      if (App.currentPage !== 'all') { applyFilters(); renderCurrentView(); }
    });
  });

  document.querySelectorAll('[data-filter-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-filter-status]').forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`[data-filter-status="${btn.dataset.filterStatus}"]`).forEach(b => b.classList.add('active'));
      App.filters.status = btn.dataset.filterStatus;
      if (App.currentPage !== 'all') { applyFilters(); renderCurrentView(); }
    });
  });
}

// ============================================================
// FILTERS
// ============================================================
function applyFilters() {
  const { search, difficulty, tier, tcs, status } = App.filters;
  const solved = lsGet(LS.SOLVED);

  App.filteredQuestions = App.questions.filter(q => {
    // Topic filter — use canonicalTopic field directly
    const canonical = getCanonical(q);
    const topicMatch = (App.currentTopic === 'all' || App.currentTopic === 'table' ||
      App.currentTopic === 'compiler' || canonical === App.currentTopic);

    // Pattern filter
    const patternMatch = (App.currentPattern === 'all' || q.pattern === App.currentPattern);

    // Search
    const searchMatch = !search ||
      q.name.toLowerCase().includes(search) ||
      canonical.toLowerCase().includes(search) ||
      (q.pattern || '').toLowerCase().includes(search) ||
      (q.tags || []).some(t => t.toLowerCase().includes(search));

    // Difficulty
    const diffMatch = difficulty === 'all' || (q.difficulty || '').toLowerCase() === difficulty;

    // Tier
    const tierMatch = tier === 'all' || (q.tier || '').toLowerCase() === tier;

    // TCS
    const tcsMatch = tcs === 'all' || (tcs === 'tcs' ? q.tcs : !q.tcs);

    // Status
    const isSolved = solved.includes(q.id);
    const statusMatch = status === 'all' || (status === 'solved' ? isSolved : !isSolved);

    return topicMatch && patternMatch && searchMatch && diffMatch && tierMatch && tcsMatch && statusMatch;
  });
}

// ============================================================
// NAVIGATION
// ============================================================
function navigateTo(id) {
  if (id === 'compiler' || id === 'dsa-compiler') {
    if (App.currentPage !== 'compiler' && App.currentPage !== 'dsa-compiler') {
      App.prevPage = App.currentPage;
      App.prevTopic = App.currentTopic;
      App.prevPattern = App.currentPattern;
    }
  }

  App.currentPage = id;
  App.currentTopic = id;
  App.currentPattern = 'all';

  const appContainer = document.getElementById('app');
  if (appContainer) {
    if (id === 'dsa-compiler') {
      appContainer.classList.add('dsa-workspace-active');
    } else {
      appContainer.classList.remove('dsa-workspace-active');
    }

    if (id === 'compiler') {
      appContainer.classList.add('general-editor-active');
    } else {
      appContainer.classList.remove('general-editor-active');
    }
  }

  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.nav === id);
  });

  applyFilters();

  // Show/hide topbar filters (only on questions page, hidden on dashboard, editor, table, and bookmarks)
  const filterBar = document.getElementById('topbar-filters');
  if (filterBar) {
    filterBar.classList.toggle('hidden', id === 'all' || id === 'compiler' || id === 'table' || id === 'bookmarks');
  }

  // Show/hide search wrapper (hidden on dashboard, compiler, dsa-compiler, and bookmarks)
  const searchWrap = document.querySelector('.search-wrapper');
  if (searchWrap) {
    searchWrap.classList.toggle('hidden', id === 'all' || id === 'compiler' || id === 'dsa-compiler' || id === 'bookmarks');
  }

  // Show correct page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

  if (id === 'all') {
    document.getElementById('page-dashboard').classList.add('active');
    renderDashboard();
  } else if (id === 'table') {
    document.getElementById('page-table').classList.add('active');
    renderTable();
  } else if (id === 'bookmarks') {
    document.getElementById('page-bookmarks').classList.add('active');
    renderBookmarksPage();
  } else if (id === 'compiler') {
    document.getElementById('page-compiler').classList.add('active');
    updatePageTitle('Code Editor', 'Monaco + Judge0 CE');
    loadGeneralCompilerCode();
  } else if (id === 'dsa-compiler') {
    // DSA Compiler page — do NOT reset currentQuestion
    document.getElementById('page-dsa-compiler').classList.add('active');
    setTimeout(() => {
      if (App.dsaEditor) App.dsaEditor.layout();
    }, 150);
    updatePageTitle('Solve Problem', 'LeetCode-Style DSA Compiler');
    // Populate problem panel and load code
    if (App.currentQuestion) {
      populateDsaProblemPanel(App.currentQuestion);
      loadDsaCodeForQuestion(App.currentQuestion);
    }
  } else {
    // Topic page
    document.getElementById('page-questions').classList.add('active');
    renderQuestionsPage();
  }

  updatePageTitle(
    id === 'all' ? 'Dashboard' :
      id === 'table' ? 'All Questions' :
        id === 'bookmarks' ? 'Bookmarks' :
          id === 'compiler' ? 'Code Editor' :
            id === 'dsa-compiler' ? 'Solve Problem' : id,
    ''
  );
  buildSidebar();
}

// Restore the view the user was on before entering the compiler/solve screen.
// 'questions' is a generic page id (used for any topic/pattern-filtered list), so
// navigating back to it via navigateTo('questions') directly would wipe out the
// specific topic/pattern that was active and match zero questions. Restore the
// saved topic/pattern context instead whenever prevPage was 'questions'.
function restorePreviousView() {
  const page = App.prevPage || 'all';
  if (page === 'questions' && App.prevTopic) {
    // Exiting the fullscreen compiler/solve workspace — remove the classes that
    // hide the sidebar and topbar (normally handled inside navigateTo(), but this
    // branch restores topic state directly instead of calling navigateTo()).
    const appContainer = document.getElementById('app');
    if (appContainer) {
      appContainer.classList.remove('dsa-workspace-active');
      appContainer.classList.remove('general-editor-active');
    }

    App.currentTopic = App.prevTopic;
    App.currentPattern = App.prevPattern || 'all';
    App.currentPage = 'questions';
    applyFilters();
    navigateToTopicView();
    buildSidebar();
  } else if (page === 'compiler' || !page) {
    navigateTo('all');
  } else {
    navigateTo(page);
  }
}

function selectTopic(topicId) {
  App.currentTopic = topicId;
  App.currentPattern = 'all';
  App.currentPage = 'questions';
  applyFilters();

  // Show topbar filters & search
  const filterBar = document.getElementById('topbar-filters');
  if (filterBar) filterBar.classList.remove('hidden');
  const searchWrap = document.querySelector('.search-wrapper');
  if (searchWrap) searchWrap.classList.remove('hidden');

  navigateToTopicView();
  buildSidebar();
}

function selectPattern(topicId, patternId) {
  App.currentTopic = topicId;
  App.currentPattern = patternId;
  App.currentPage = 'questions';
  applyFilters();

  // Show topbar filters & search
  const filterBar = document.getElementById('topbar-filters');
  if (filterBar) filterBar.classList.remove('hidden');
  const searchWrap = document.querySelector('.search-wrapper');
  if (searchWrap) searchWrap.classList.remove('hidden');

  navigateToTopicView();
  buildSidebar();
}

function navigateToTopicView() {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-questions').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

  const topicLabel = ALL_TOPICS.find(t => t.id === App.currentTopic)?.label || App.currentTopic;
  const subTitle = App.currentPattern === 'all' ? 'All Patterns' : App.currentPattern;
  updatePageTitle(topicLabel, `${subTitle} • ${App.filteredQuestions.length} questions`);

  // Ensure topbar filters and search are visible on questions/topic view
  const filterBar = document.getElementById('topbar-filters');
  if (filterBar) filterBar.classList.remove('hidden');
  const searchWrap = document.querySelector('.search-wrapper');
  if (searchWrap) searchWrap.classList.remove('hidden');

  renderQuestionsPage();
}

function renderCurrentView() {
  if (App.currentPage === 'all') renderDashboard();
  else if (App.currentPage === 'table') renderTable();
  else renderQuestionsPage();
}

function updatePageTitle(title, sub) {
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-breadcrumb').textContent = sub || '';
}

// ============================================================
// DASHBOARD
// ============================================================
function renderDashboard() {
  const solved = lsGet(LS.SOLVED);
  const rev1 = lsGet(LS.REV1);
  const rev2 = lsGet(LS.REV2);
  const total = App.questions.length;
  const pct = total ? Math.round((solved.length / total) * 100) : 0;

  // Main stats
  setText('stat-total', total);
  setText('stat-solved', solved.length);
  setText('stat-unsolved', total - solved.length);
  setText('stat-rev', [...new Set([...rev1, ...rev2])].length);

  const pctSub = document.getElementById('stat-pct-sub');
  if (pctSub) pctSub.textContent = `${pct}% complete`;

  // Tier stats
  const core = App.questions.filter(q => q.tier === 'core');
  const adv = App.questions.filter(q => q.tier === 'advanced');
  const opt = App.questions.filter(q => q.tier === 'optional');
  setText('stat-core', `${core.filter(q => solved.includes(q.id)).length}/${core.length}`);
  setText('stat-advanced', `${adv.filter(q => solved.includes(q.id)).length}/${adv.length}`);
  setText('stat-optional', `${opt.filter(q => solved.includes(q.id)).length}/${opt.length}`);

  // Progress ring
  updateProgressRing(pct);

  // Chart + grid + recent
  renderTopicChart();
  renderTopicProgressGrid();
  renderRecentQuestions();
  updateSidebarStats();
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function updateProgressRing(pct) {
  const circ = 2 * Math.PI * 54;
  const fill = document.getElementById('ring-fill');
  if (fill) {
    fill.setAttribute('stroke-dasharray', circ);
    fill.setAttribute('stroke-dashoffset', circ - (pct / 100) * circ);
  }
  const lbl = document.getElementById('ring-pct-label');
  if (lbl) lbl.textContent = pct + '%';
}

function renderTopicChart() {
  const ctx = document.getElementById('topic-chart');
  if (!ctx) return;

  const solved = lsGet(LS.SOLVED);

  // Only show main topics in chart for readability
  const topicIds = HIGH_LEVEL_TOPICS.map(t => t.id);
  const topicLabels = HIGH_LEVEL_TOPICS.map(t => t.label);
  const counts = topicIds.map(id =>
    App.questions.filter(q => getCanonical(q) === id && solved.includes(q.id)).length
  );
  const totals = topicIds.map(id =>
    App.questions.filter(q => getCanonical(q) === id).length
  );

  if (window._topicChart) window._topicChart.destroy();

  const isDark = document.documentElement.getAttribute('data-theme') !== 'light';

  window._topicChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topicLabels,
      datasets: [
        {
          label: 'Solved',
          data: counts,
          backgroundColor: 'rgba(63,185,80,0.75)',
          borderColor: 'rgba(63,185,80,1)',
          borderWidth: 1,
          borderRadius: 4,
        },
        {
          label: 'Total',
          data: totals,
          backgroundColor: 'rgba(33,38,45,0.8)',
          borderColor: 'rgba(48,54,61,1)',
          borderWidth: 1,
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          labels: { color: isDark ? '#8b949e' : '#656d76', font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: isDark ? '#21262d' : '#fff',
          borderColor: isDark ? '#30363d' : '#d0d7de',
          borderWidth: 1,
          titleColor: isDark ? '#e6edf3' : '#1f2328',
          bodyColor: isDark ? '#8b949e' : '#656d76',
        }
      },
      scales: {
        x: {
          ticks: { color: isDark ? '#6e7681' : '#818c97', font: { size: 9 }, maxRotation: 45 },
          grid: { color: isDark ? 'rgba(48,54,61,0.5)' : 'rgba(208,215,222,0.5)' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: isDark ? '#6e7681' : '#818c97', font: { size: 10 }, stepSize: 1 },
          grid: { color: isDark ? 'rgba(48,54,61,0.5)' : 'rgba(208,215,222,0.5)' }
        }
      }
    }
  });
}




function renderTopicProgressGrid() {
  const container = document.getElementById('topic-progress-grid');
  if (!container) return;

  const solved = lsGet(LS.SOLVED);
  let html = '';

  // Show all topics (core + advanced) in progress grid
  ALL_TOPICS.forEach(t => {
    const qs = App.questions.filter(q => getCanonical(q) === t.id);
    const total = qs.length;
    if (total === 0) return;

    const solvedCount = qs.filter(q => solved.includes(q.id)).length;
    const pct = total ? Math.round((solvedCount / total) * 100) : 0;

    let fillClass = '';
    if (pct === 100) fillClass = 'complete';
    else if (pct > 0) fillClass = 'partial';

    html += `
      <div class="topic-progress-card" onclick="selectTopic('${t.id}')">
        <div class="topic-name">
          <span><i class="fas ${t.icon}" style="font-size:11px;margin-right:5px;color:var(--text-muted)"></i>${t.label}</span>
          <span class="topic-count">${solvedCount}/${total}</span>
        </div>
        <div class="topic-bar">
          <div class="topic-bar-fill ${fillClass}" style="width:${pct}%"></div>
        </div>
        <div class="topic-progress-pct">${pct}% complete</div>
      </div>`;
  });

  container.innerHTML = html;
}

function renderRecentQuestions() {
  const container = document.getElementById('recent-questions-list');
  if (!container) return;

  const solved = lsGet(LS.SOLVED);
  const recent = App.questions.slice(0, 8);

  let html = '';
  recent.forEach((q, i) => {
    const isSolved = solved.includes(q.id);
    html += `
      <div class="recent-q-item" onclick="openQuestion(${q.id})">
        <div class="recent-q-num">${i + 1}</div>
        <div class="q-status-icon ${isSolved ? 'solved' : 'unsolved'}">
          <i class="fas ${isSolved ? 'fa-check-circle' : 'fa-circle'}"></i>
        </div>
        <div class="recent-q-name">${q.name}</div>
        <div class="recent-q-topic">${q.topic}</div>
        <span class="diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
      </div>`;
  });

  container.innerHTML = html || '<div class="empty-state"><p>No questions loaded</p></div>';
}

// ============================================================
// QUESTIONS PAGE (Topic View)
// ============================================================
function renderQuestionsPage() {
  const container = document.getElementById('questions-list');
  if (!container) return;

  const solved = lsGet(LS.SOLVED);
  const rev1 = lsGet(LS.REV1);
  const rev2 = lsGet(LS.REV2);
  const qs = App.filteredQuestions;

  // Update count badge
  const badge = document.getElementById('questions-count-badge');
  if (badge) badge.textContent = `${qs.length} questions`;

  if (!qs.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No questions found</h3>
        <p>Try adjusting your filters or search term.</p>
      </div>`;
    return;
  }

  let html = '';
  qs.forEach(q => {
    const isSolved = solved.includes(q.id);
    const isRev1 = rev1.includes(q.id);
    const isRev2 = rev2.includes(q.id);
    const isActive = App.currentQuestion?.id === q.id;

    html += `
      <div class="question-row ${isActive ? 'active' : ''} ${isSolved ? 'solved-row' : ''}"
           data-qid="${q.id}" onclick="openQuestion(${q.id})">
        <div class="q-status-icon ${isSolved ? 'solved' : 'unsolved'}">
          <i class="fas ${isSolved ? 'fa-check-circle' : 'fa-circle'}"></i>
        </div>
        <div class="q-info">
          <div class="q-name">${q.id}. ${q.name}</div>
          <div class="q-meta">
            <span>${q.pattern}</span>
            <span style="color:var(--border-light)">•</span>
            <span class="mono" style="font-size:10px">${q.timeComplexity}</span>
          </div>
        </div>
        <div class="q-badges">
          ${isRev2 ? '<span class="rev-badge" title="Revision 2"><i class="fas fa-bookmark"></i></span>' : ''}
          ${isRev1 && !isRev2 ? '<span class="rev-badge" style="color:var(--accent-blue-light)" title="Revision 1"><i class="far fa-bookmark"></i></span>' : ''}
          <span class="tier-badge ${q.tier || 'optional'}">${q.tier ? q.tier.charAt(0).toUpperCase() + q.tier.slice(1) : 'Optional'}</span>
          ${q.tcs ? '<span class="tcs-badge">TCS</span>' : ''}
          <span class="diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
        </div>
      </div>`;
  });

  container.innerHTML = html;
}

// ============================================================
// OPEN QUESTION
// ============================================================
function openQuestion(id) {

  const q = App.questions.find(q => q.id === id);
  if (!q) return;

  App.currentQuestion = q;
  App.showHint = false;
  App.showSolution = false;

  // Reset compiler execution state when changing questions
  if (window.Compiler && typeof window.Compiler.resetState === 'function') {
    window.Compiler.resetState();
  }

  // Reset compiler mode when opening a new question
  if (typeof window.setCompilerMode === 'function') {
    window.setCompilerMode('general');
  } else {
    App.compilerMode = 'general';
  }

  // Navigate to questions page if on dashboard
  if (App.currentPage === 'all' || App.currentPage === 'table') {
    const canon = getCanonical(q);
    App.currentTopic = canon;
    App.currentPattern = q.pattern || 'all';
    applyFilters();
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-questions').classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.nav === canon);
    });
    // Show filters & search
    const filterBar = document.getElementById('topbar-filters');
    if (filterBar) filterBar.classList.remove('hidden');
    const searchWrap = document.querySelector('.search-wrapper');
    if (searchWrap) searchWrap.classList.remove('hidden');

    App.currentPage = 'questions';
    updatePageTitle(canon, `${App.filteredQuestions.length} questions`);
    renderQuestionsPage();
    buildSidebar();
  }

  // Highlight active row
  document.querySelectorAll('.question-row').forEach(row => {
    row.classList.toggle('active', parseInt(row.dataset.qid) === id);
  });

  // Save last opened
  localStorage.setItem(getStorageKey(LS.LAST_Q), id);

  // Render detail
  renderQuestionDetail(q);

  // Load notes
  const notesObj = lsGetObj(LS.NOTES);
  const noteText = notesObj[id] || '';
  const textarea = document.getElementById('notes-textarea');
  if (textarea) textarea.value = noteText;
  if (typeof updateNotesStatus === 'function') {
    updateNotesStatus('saved');
  }

  // Update Bookmark button state
  if (typeof updateBookmarkButton === 'function') {
    updateBookmarkButton(id);
  }
}

function solveCurrentQuestion() {
  if (!App.currentQuestion) return;
  App.prevPage = App.currentPage;
  App.prevTopic = App.currentTopic;
  App.prevPattern = App.currentPattern;
  // Navigate to DSA compiler (do NOT reset currentQuestion)
  navigateTo('dsa-compiler');
  // Load code and populate problem panel (done in navigateTo, but ensure it's called)
  populateDsaProblemPanel(App.currentQuestion);
  loadDsaCodeForQuestion(App.currentQuestion);
}

function restoreLastQuestion() {
  const lastId = parseInt(localStorage.getItem(getStorageKey(LS.LAST_Q)));
  if (lastId && App.questions.find(q => q.id === lastId)) {
    // Don't auto-navigate, just remember
    App.currentQuestion = App.questions.find(q => q.id === lastId);
  }
}

// ============================================================
// QUESTION DETAIL PANEL
// ============================================================
function renderQuestionDetail(q) {
  const detail = document.getElementById('question-detail');
  const placeholder = document.getElementById('detail-placeholder');
  const content = document.getElementById('detail-content');

  if (placeholder) placeholder.style.display = 'none';
  if (content) content.style.display = 'flex';

  const solved = lsGet(LS.SOLVED);
  const rev1 = lsGet(LS.REV1);
  const rev2 = lsGet(LS.REV2);
  const isSolved = solved.includes(q.id);
  const isRev1 = rev1.includes(q.id);
  const isRev2 = rev2.includes(q.id);

  // Header
  document.getElementById('detail-title').textContent = q.name;
  document.getElementById('detail-time').textContent = q.timeComplexity;
  document.getElementById('detail-space').textContent = q.spaceComplexity;
  document.getElementById('detail-pattern-meta').textContent = q.pattern;
  document.getElementById('detail-topic-meta').textContent = getCanonical(q);

  const tierEl = document.getElementById('detail-tier-meta');
  if (tierEl) {
    tierEl.textContent = q.tier ? q.tier.charAt(0).toUpperCase() + q.tier.slice(1) : 'Optional';
  }

  const badgesEl = document.getElementById('detail-badges');
  badgesEl.innerHTML = `
    <span class="tier-badge ${q.tier || 'optional'}">${q.tier ? q.tier.charAt(0).toUpperCase() + q.tier.slice(1) : 'Optional'}</span>
    <span class="diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
    ${q.tcs ? '<span class="tcs-badge">TCS</span>' : ''}`;

  // Actions
  updateDetailActions(q);

  // Problem Statement
  document.getElementById('problem-statement').textContent = q.statement;
  document.getElementById('sample-input').textContent = q.sampleInput;
  document.getElementById('sample-output').textContent = q.sampleOutput;
  document.getElementById('constraints-text').textContent = q.constraints;

  // Tags
  const tags = (q.tags || []).map(t => `<span class="tag-pill">${t}</span>`).join('');
  document.getElementById('tags-container').innerHTML = tags;

  // Hint box
  updateHintSolutionBoxes(q);

  // Complexity tab
  document.getElementById('complexity-time-val').textContent = q.timeComplexity;
  document.getElementById('complexity-space-val').textContent = q.spaceComplexity;
  document.getElementById('complexity-difficulty').textContent = q.difficulty;
  document.getElementById('complexity-pattern').textContent = q.pattern;

  // Reset to first tab
  switchDetailTab('problem');

  // Animate
  content.classList.add('fade-in');
  setTimeout(() => content.classList.remove('fade-in'), 400);
}

function updateDetailActions(q) {
  const solved = lsGet(LS.SOLVED);
  const rev1 = lsGet(LS.REV1);
  const rev2 = lsGet(LS.REV2);
  const isSolved = solved.includes(q.id);
  const isRev1 = rev1.includes(q.id);
  const isRev2 = rev2.includes(q.id);

  const solveBtn = document.getElementById('btn-mark-solved');
  if (solveBtn) {
    solveBtn.className = `action-btn ${isSolved ? 'active' : 'success'}`;
    solveBtn.innerHTML = `<i class="fas ${isSolved ? 'fa-check' : 'fa-trophy'}"></i> ${isSolved ? 'Solved ✓' : 'Mark Solved'}`;
  }

  const rev1Btn = document.getElementById('btn-rev1');
  if (rev1Btn) {
    rev1Btn.className = `action-btn warning ${isRev1 ? 'active' : ''}`;
    rev1Btn.innerHTML = `<i class="fas fa-bookmark"></i> Rev 1 ${isRev1 ? '✓' : ''}`;
  }

  const rev2Btn = document.getElementById('btn-rev2');
  if (rev2Btn) {
    rev2Btn.className = `action-btn warning ${isRev2 ? 'active' : ''}`;
    rev2Btn.innerHTML = `<i class="fas fa-bookmark"></i> Rev 2 ${isRev2 ? '✓' : ''}`;
  }

  // LeetCode link
  const lcBtn = document.getElementById('btn-leetcode');
  if (lcBtn) lcBtn.onclick = () => window.open(q.leetcode, '_blank');
}

function updateHintSolutionBoxes(q) {
  const hintBox = document.getElementById('hint-box');
  const solBox = document.getElementById('solution-box');

  if (hintBox) {
    hintBox.style.display = App.showHint ? 'block' : 'none';
    if (App.showHint) {
      document.getElementById('hint-text').textContent = q.hint || 'No hint available.';
    }
  }

  if (solBox) {
    solBox.style.display = App.showSolution ? 'block' : 'none';
    if (App.showSolution) {
      document.getElementById('solution-text').textContent = q.solution || 'No solution available.';
    }
  }
}

function switchDetailTab(tab) {
  document.querySelectorAll('.detail-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  const tabEl = document.querySelector(`[data-tab="${tab}"]`);
  const contentEl = document.getElementById(`tab-${tab}`);

  if (tabEl) tabEl.classList.add('active');
  if (contentEl) contentEl.classList.add('active');
}

// ============================================================
// QUESTION ACTIONS
// ============================================================
function toggleSolved(id) {
  const q = App.questions.find(q => q.id === id);
  if (!q) return;

  let solved = lsGet(LS.SOLVED);
  let isSolved;
  if (solved.includes(id)) {
    solved = solved.filter(s => s !== id);
    isSolved = false;
    showToast(`Marked "${q.name}" as unsolved`, 'info');
  } else {
    solved.push(id);
    isSolved = true;
    showToast(`🎉 "${q.name}" marked as solved!`, 'success');
  }

  lsSet(LS.SOLVED, solved);

  if (typeof syncProgressToCloud === 'function') {
    syncProgressToCloud(id, isSolved);
  }

  updateDetailActions(q);
  renderQuestionsPage();
  updateSidebarStats();
  buildSidebar();
  if (App.currentPage === 'all') renderDashboard();
  if (App.currentPage === 'table') renderTable();
}

function toggleRevision(id, rev) {
  const q = App.questions.find(q => q.id === id);
  if (!q) return;

  const key = rev === 1 ? LS.REV1 : LS.REV2;
  let list = lsGet(key);
  let isActive;

  if (list.includes(id)) {
    list = list.filter(s => s !== id);
    isActive = false;
    showToast(`Removed from Revision ${rev}`, 'info');
  } else {
    list.push(id);
    isActive = true;
    showToast(`Added to Revision ${rev}`, 'warning');
  }

  lsSet(key, list);

  if (typeof syncRevisionToCloud === 'function') {
    syncRevisionToCloud(id, rev, isActive);
  }

  updateDetailActions(q);
  renderQuestionsPage();
  updateSidebarStats();
  buildSidebar();
  if (App.currentPage === 'all') renderDashboard();
  if (App.currentPage === 'table') renderTable();
}

function toggleHint() {
  App.showHint = !App.showHint;
  const btn = document.getElementById('btn-hint');
  if (btn) btn.classList.toggle('active', App.showHint);
  if (App.currentQuestion) updateHintSolutionBoxes(App.currentQuestion);
}

function toggleSolution() {
  App.showSolution = !App.showSolution;
  const btn = document.getElementById('btn-solution');
  if (btn) btn.classList.toggle('active', App.showSolution);
  if (App.currentQuestion) updateHintSolutionBoxes(App.currentQuestion);
}

// ============================================================
// TABLE VIEW
// ============================================================
function renderTable() {
  const tbody = document.getElementById('table-body');
  if (!tbody) return;

  const solved = lsGet(LS.SOLVED);
  const rev1 = lsGet(LS.REV1);
  const rev2 = lsGet(LS.REV2);

  // Sort
  const qs = [...App.filteredQuestions].sort((a, b) => {
    const dir = App.sort.dir === 'asc' ? 1 : -1;
    if (App.sort.col === 'id') return (a.id - b.id) * dir;
    if (App.sort.col === 'name') return a.name.localeCompare(b.name) * dir;
    if (App.sort.col === 'difficulty') {
      const order = { Easy: 1, Medium: 2, Hard: 3 };
      return ((order[a.difficulty] || 0) - (order[b.difficulty] || 0)) * dir;
    }
    if (App.sort.col === 'tier') {
      const order = { core: 1, advanced: 2, optional: 3 };
      const valA = a.tier ? a.tier.toLowerCase() : 'optional';
      const valB = b.tier ? b.tier.toLowerCase() : 'optional';
      return ((order[valA] || 3) - (order[valB] || 3)) * dir;
    }
    if (App.sort.col === 'topic') return a.topic.localeCompare(b.topic) * dir;
    return 0;
  });

  // Count badge
  const badge = document.getElementById('table-count-badge');
  if (badge) badge.textContent = `${qs.length} questions`;

  if (!qs.length) {
    tbody.innerHTML = `
      <tr><td colspan="10">
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>No questions found</h3>
          <p>Try adjusting your filters.</p>
        </div>
      </td></tr>`;
    return;
  }

  let html = '';
  qs.forEach(q => {
    const isSolved = solved.includes(q.id);
    const isRev1 = rev1.includes(q.id);
    const isRev2 = rev2.includes(q.id);
    const isActive = App.currentQuestion?.id === q.id;
    const tierDisplay = q.tier ? q.tier.charAt(0).toUpperCase() + q.tier.slice(1) : 'Optional';

    html += `
      <tr class="${isSolved ? 'solved-row' : ''} ${isActive ? 'active-row' : ''}"
          onclick="openQuestion(${q.id})">
        <td class="id-col">${q.id}</td>
        <td class="name-col">
          <span>${q.name}</span>
        </td>
        <td>${getCanonical(q)}</td>
        <td style="color:var(--text-muted);font-size:11.5px">${q.pattern || '—'}</td>
        <td><span class="diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span></td>
        <td><span class="tier-badge ${q.tier || 'optional'}">${tierDisplay}</span></td>
        <td>${q.tcs ? '<span class="tcs-badge">TCS</span>' : '<span style="color:var(--text-muted);font-size:11px">—</span>'}</td>
        <td>
          <div class="q-status-icon ${isSolved ? 'solved' : 'unsolved'}">
            <i class="fas ${isSolved ? 'fa-check-circle' : 'fa-circle'}"></i>
          </div>
        </td>
        <td onclick="event.stopPropagation()">
          <input type="checkbox" class="rev-checkbox" ${isRev1 ? 'checked' : ''}
                 onchange="toggleRevision(${q.id}, 1)" title="Revision 1">
        </td>
        <td onclick="event.stopPropagation()">
          <input type="checkbox" class="rev-checkbox" ${isRev2 ? 'checked' : ''}
                 onchange="toggleRevision(${q.id}, 2)" title="Revision 2">
        </td>
      </tr>`;
  });

  tbody.innerHTML = html;
}

function sortTable(col) {
  if (App.sort.col === col) {
    App.sort.dir = App.sort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    App.sort.col = col;
    App.sort.dir = 'asc';
  }

  // Update icons
  document.querySelectorAll('.sortable-th').forEach(th => {
    const icon = th.querySelector('.sort-icon');
    if (th.dataset.col === col) {
      th.classList.add('sorted');
      icon.className = `sort-icon fas fa-sort-${App.sort.dir === 'asc' ? 'up' : 'down'}`;
    } else {
      th.classList.remove('sorted');
      icon.className = 'sort-icon fas fa-sort';
    }
  });

  renderTable();
}

// ============================================================
// MONACO EDITOR
// ============================================================
function initMonaco() {
  if (typeof require === 'undefined') return;

  require.config({
    paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }
  });

  require(['vs/editor/editor.main'], function () {
    // Match Monaco's initial theme to whatever light/dark theme is currently active,
    // so editors don't always start dark regardless of the saved preference.
    const currentAppTheme = document.documentElement.getAttribute('data-theme') ||
      localStorage.getItem(LS.THEME) || 'dark';
    const initialMonacoTheme = currentAppTheme === 'light' ? 'vs' : 'vs-dark';

    // General compiler editor
    App.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
      value: STARTER_CODE.cpp,
      language: 'cpp',
      theme: initialMonacoTheme,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontLigatures: true,
      minimap: { enabled: false },
      lineNumbers: 'on',
      roundedSelection: true,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on',
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      formatOnPaste: true,
      scrollbar: {
        verticalScrollbarSize: 5,
        horizontalScrollbarSize: 5,
      }
    });

    loadGeneralCompilerCode();

    // Auto-save for general editor
    App.editor.onDidChangeModelContent(() => {
      handleEditorChange();
    });

    // DSA compiler editor (same config)
    const dsaEditorContainer = document.getElementById('dsa-monaco-editor');
    if (dsaEditorContainer) {
      App.dsaEditor = monaco.editor.create(dsaEditorContainer, {
        value: STARTER_CODE.cpp,
        language: 'cpp',
        theme: initialMonacoTheme,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        roundedSelection: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        formatOnPaste: true,
        scrollbar: {
          verticalScrollbarSize: 5,
          horizontalScrollbarSize: 5,
        }
      });

      // Auto-save for DSA editor
      App.dsaEditor.onDidChangeModelContent(() => {
        handleDsaEditorChange();
      });
    }

    // Explicitly re-apply the theme right after creation. Monaco can sometimes fail
    // to visually apply the `theme` option passed to create() (a known quirk), so
    // calling setTheme() directly guarantees both editors render with the correct
    // theme immediately, matching whatever light/dark mode is currently active.
    monaco.editor.setTheme(initialMonacoTheme);
  });
}

let editorDebounceTimeout = null;

function handleEditorChange() {
  clearTimeout(editorDebounceTimeout);
  editorDebounceTimeout = setTimeout(() => {
    saveEditorCodeImmediate();
  }, 3000);
}

function getUid() {
  const user = (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured && firebase.auth && firebase.auth() && firebase.auth().currentUser);
  return user ? user.uid : 'guest';
}

window.getGeneralCompilerCodeKey = function (lang) {
  const uid = getUid();
  return `general_compiler_code_${uid}_${lang}`;
};

window.getGeneralUserCodeKey = function (qId, lang) {
  const uid = getUid();
  return `general_code_${uid}_${qId}_${lang}`;
};

window.getDsaUserCodeKey = function (qId, lang) {
  const uid = getUid();
  return `dsa_workspace_code_${uid}_${qId}_${lang}`;
};

window.getUserCodeKey = function (qId, lang) {
  const uid = getUid();
  return `dsa_code_${uid}_${qId}_${lang}`;
};

/**
 * Load General Compiler code from isolated storage keys.
 * Never uses a question ID — always uses general_compiler_code_{uid}_{lang}.
 */
function loadGeneralCompilerCode() {
  if (!App.editor) return;
  const uid = getUid();

  // Determine the last used language for the general compiler
  let lang = localStorage.getItem(`general_compiler_last_lang_${uid}`) || App.editorLanguage || 'cpp';

  App.editorLanguage = lang;

  // Sync language dropdown
  const langSelect = document.getElementById('language-select');
  if (langSelect) langSelect.value = lang;

  // Set Monaco language
  const monacoLang = lang === 'cpp' ? 'cpp' : lang === 'c' ? 'c' : lang === 'js' ? 'javascript' : lang;
  if (App.editor.getModel()) {
    monaco.editor.setModelLanguage(App.editor.getModel(), monacoLang);
  }

  // Load saved code from isolated key
  const key = getGeneralCompilerCodeKey(lang);
  const saved = localStorage.getItem(key);
  if (saved !== null) {
    App.editor.setValue(saved);
    console.log('[GENERAL COMPILER] Loaded draft from key:', key);
    return;
  }

  // Fallback to generic starter template (NEVER DSA class template)
  App.editor.setValue(STARTER_CODE[lang] || '');
  console.log('[GENERAL COMPILER] No draft found — loaded starter template for:', lang);
}

window.saveEditorCodeImmediate = function () {
  clearTimeout(editorDebounceTimeout);
  if (!App.editor) return;

  const lang = App.editorLanguage;
  const code = App.editor.getValue();
  const uid = getUid();
  const key = getGeneralCompilerCodeKey(lang);

  localStorage.setItem(key, code);
  localStorage.setItem(`general_compiler_last_lang_${uid}`, lang);

  console.log('[GENERAL COMPILER] Draft saved to key:', key);

  if (typeof syncGeneralCompilerCodeToCloud === 'function') {
    syncGeneralCompilerCodeToCloud(lang, code);
  }
};

function setEditorLanguage(lang) {
  if (!App.editor) return;

  // Save code for previous language first
  const prevLang = App.editorLanguage;
  if (prevLang && prevLang !== lang) {
    const prevCode = App.editor.getValue();
    localStorage.setItem(getGeneralCompilerCodeKey(prevLang), prevCode);
    console.log('[GENERAL COMPILER] Saved previous lang draft:', prevLang);
  }

  App.editorLanguage = lang;
  const uid = getUid();
  localStorage.setItem(`general_compiler_last_lang_${uid}`, lang);

  const monacoLang = lang === 'cpp' ? 'cpp' : lang === 'c' ? 'c' : lang === 'js' ? 'javascript' : lang;
  monaco.editor.setModelLanguage(App.editor.getModel(), monacoLang);

  // Try loading saved code for new language
  const key = getGeneralCompilerCodeKey(lang);
  const saved = localStorage.getItem(key);
  if (saved !== null) {
    App.editor.setValue(saved);
    console.log('[GENERAL COMPILER] Loaded saved draft for lang:', lang);
    return;
  }

  // Fallback to generic starter template (NEVER DSA class template)
  App.editor.setValue(STARTER_CODE[lang] || '');
  console.log('[GENERAL COMPILER] No draft — loaded starter template for:', lang);
}

// loadCodeForQuestion is kept for backward compatibility but is no longer
// called from the General Compiler. The General Compiler now exclusively uses
// loadGeneralCompilerCode() which is isolated from all question IDs.
function loadCodeForQuestion(q) {
  console.warn('[GENERAL COMPILER] loadCodeForQuestion() called — redirecting to loadGeneralCompilerCode()');
  loadGeneralCompilerCode();
}

function resetCode() {
  if (!App.editor) return;
  const lang = App.editorLanguage;
  App.editor.setValue(STARTER_CODE[lang] || '');
  // Save the reset state so it persists
  saveEditorCodeImmediate();
  showToast('Code reset to template', 'info');
}

/**
 * Exit the General Code Editor and return to the previous dashboard page.
 * Stops any active compiler execution and clears state.
 */
window.exitGeneralEditor = function () {
  // Stop any active execution
  if (window.Compiler) {
    if (typeof window.Compiler.stopExecution === 'function') {
      window.Compiler.stopExecution('General editor exited.');
    }
    if (typeof window.Compiler.resetState === 'function') {
      window.Compiler.resetState();
    }
  }

  // Save current code before leaving
  saveEditorCodeImmediate();

  // Clear verdict banner
  const banner = document.getElementById('verdict-banner');
  if (banner) {
    banner.className = 'verdict-banner';
  }

  // Return to previous page
  restorePreviousView();
};

// EXPORT NEW ACTIONS
window.downloadCode = function () {
  if (!App.editor) return;
  const code = App.editor.getValue();
  const lang = App.editorLanguage;

  const extensions = {
    cpp: 'cpp',
    c: 'c',
    java: 'java',
    python: 'py',
    js: 'js'
  };

  const filenames = {
    cpp: 'solution.cpp',
    c: 'solution.c',
    java: 'Main.java',
    python: 'solution.py',
    js: 'solution.js'
  };

  const ext = extensions[lang] || 'txt';
  const filename = filenames[lang] || `solution.${ext}`;

  const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);

  showToast('Code downloaded successfully', 'success');
};

window.toggleFullscreenEditor = function () {
  const panel = document.querySelector('.editor-panel');
  const btn = document.getElementById('fullscreen-btn');
  if (!panel || !btn) return;

  const isFullscreen = panel.classList.toggle('fullscreen');

  if (isFullscreen) {
    btn.innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
    btn.classList.add('active');
  } else {
    btn.innerHTML = '<i class="fas fa-expand"></i> Fullscreen';
    btn.classList.remove('active');
  }

  if (App.editor) {
    setTimeout(() => {
      App.editor.layout();
    }, 100);
  }
};

// Exit fullscreen on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const panel = document.querySelector('.editor-panel');
    if (panel && panel.classList.contains('fullscreen')) {
      window.toggleFullscreenEditor();
    }
  }
});

window.copyOutput = function () {
  const outEl = document.getElementById('exec-output');
  if (!outEl) return;

  const text = outEl.textContent;
  if (!text || text === '(run code to see output)' || text === '(no output)') {
    showToast('No output to copy', 'warning');
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast('Output copied to clipboard', 'success');
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    showToast('Failed to copy output', 'error');
  });
};

window.clearOutput = function () {
  const outEl = document.getElementById('exec-output');
  if (outEl) {
    outEl.textContent = '(no output)';
    outEl.className = 'exec-output';
  }
  const errEl = document.getElementById('exec-error');
  if (errEl) {
    errEl.textContent = '(none)';
    errEl.className = 'exec-output';
  }
  showToast('Output cleared', 'info');
};

function runCode() {
  if (!App.editor) { showToast('Editor not ready', 'error'); return; }
  // Save general compiler draft before running
  saveEditorCodeImmediate();
  const code = App.editor.getValue();
  const stdin = document.getElementById('exec-stdin')?.value || '';
  const lang = App.editorLanguage;
  // Run with custom stdin, no auto-solve
  Compiler.run(code, lang, stdin);
}

function submitCode() {
  console.log("Submit clicked / submitCode called");
  if (!App.editor) { showToast('Editor not ready', 'error'); return; }
  // Save general compiler draft before submitting
  saveEditorCodeImmediate();
  const code = App.editor.getValue();
  const lang = App.editorLanguage;
  // Submit uses sampleInput from question, auto-marks solved on Accepted
  Compiler.submit(code, lang);
}

// Called by Compiler when status 3 (Accepted) is received on submit
window.onQuestionAccepted = function (qId) {
  // ─── DIAGNOSTIC: onQuestionAccepted trace ───────────────────────────────────
  console.group('%c[DASHBOARD DIAG] onQuestionAccepted', 'color:#9c27b0;font-weight:bold');
  console.log('[DASHBOARD DIAG] qId:', qId);

  // Snapshot the solved list at the moment onQuestionAccepted fires
  const solvedAtEntry = lsGet(LS.SOLVED);
  const nsKeyAtEntry = getStorageKey(LS.SOLVED);
  console.log('[DASHBOARD DIAG] namespaced key used by lsGet(LS.SOLVED):', nsKeyAtEntry);
  console.log('[DASHBOARD DIAG] solved list at entry (via lsGet):', JSON.stringify(solvedAtEntry));
  console.log('[DASHBOARD DIAG] qId in solved list?', solvedAtEntry.includes(qId));
  if (!solvedAtEntry.includes(qId)) {
    console.error('[DASHBOARD DIAG] ❌ BUG DETECTED — qId is NOT in the solved list at onQuestionAccepted entry!');
    console.error('[DASHBOARD DIAG]    The lsSet in _autoMarkSolved may have written to a different key.');
    console.error('[DASHBOARD DIAG]    Raw localStorage[\"dsa_solved\"]:', localStorage.getItem('dsa_solved'));
    console.error('[DASHBOARD DIAG]    Raw localStorage["' + nsKeyAtEntry + '"]:', localStorage.getItem(nsKeyAtEntry));
  }
  // ────────────────────────────────────────────────────────────────────────────

  console.log('[DASHBOARD DIAG] → calling updateSidebarStats()');
  updateSidebarStats();

  console.log('[DASHBOARD DIAG] → calling buildSidebar()');
  buildSidebar();

  if (App.currentPage === 'dashboard' || App.currentPage === 'all') {
    console.log('[DASHBOARD DIAG] → calling renderDashboard() (App.currentPage:', App.currentPage, ')');
    renderDashboard();
  } else {
    console.log('[DASHBOARD DIAG] → skipping renderDashboard() (App.currentPage is not dashboard/all)');
  }

  if (App.currentPage === 'table') {
    console.log('[DASHBOARD DIAG] → calling renderTable()');
    renderTable();
  } else {
    console.log('[DASHBOARD DIAG] → skipping renderTable() (App.currentPage is not table)');
  }

  console.log('[DASHBOARD DIAG] → calling renderQuestionsPage()');
  renderQuestionsPage();

  if (App.currentQuestion) {
    console.log('[DASHBOARD DIAG] → calling renderQuestionDetail() for:', App.currentQuestion.id);
    renderQuestionDetail(App.currentQuestion);
  } else {
    console.warn('[DASHBOARD DIAG] App.currentQuestion is null — skipping renderQuestionDetail');
  }

  console.log('[DASHBOARD DIAG] ✅ onQuestionAccepted complete');
  console.groupEnd();
  // ────────────────────────────────────────────────────────────────────────────
};

// ============================================================
// STREAK TRACKING
// ============================================================
function updateStreak() {
  const today = new Date().toDateString();
  const lastDayKey = getStorageKey(LS.LAST_DAY);
  const streakKey = getStorageKey(LS.STREAK);

  const lastDay = localStorage.getItem(lastDayKey);
  let streak = parseInt(localStorage.getItem(streakKey)) || 0;

  if (lastDay !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastDay === yesterday.toDateString()) {
      streak += 1;
    } else if (!lastDay) {
      // Compatibility fallback: check legacy keys
      const legacyLastDay = localStorage.getItem(LS.LAST_DAY);
      const legacyStreak = parseInt(localStorage.getItem(LS.STREAK)) || 0;
      if (legacyLastDay === yesterday.toDateString()) {
        streak = legacyStreak + 1;
      } else if (legacyLastDay === today) {
        streak = legacyStreak;
      } else {
        streak = 1;
      }
    } else {
      streak = 1; // Reset
    }

    localStorage.setItem(streakKey, streak);
    localStorage.setItem(lastDayKey, today);
  }

  const el = document.getElementById('streak-count');
  if (el) el.textContent = streak;
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const icons = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || 'fa-info-circle'}"></i><span>${msg}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
document.addEventListener('keydown', e => {
  // Ctrl+K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    document.getElementById('search-input').focus();
  }

  // Escape to clear search
  if (e.key === 'Escape') {
    const searchInput = document.getElementById('search-input');
    if (document.activeElement === searchInput) {
      searchInput.value = '';
      App.filters.search = '';
      applyFilters();
      renderCurrentView();
      searchInput.blur();
    }
  }
});

// ============================================================
// PERSONAL NOTES HELPERS & AUTO-SAVE
// ============================================================
let noteSaveTimeout = null;

function initNotes() {
  const textarea = document.getElementById('notes-textarea');
  if (textarea) {
    textarea.addEventListener('input', () => {
      updateNotesStatus('unsaved');
      clearTimeout(noteSaveTimeout);
      noteSaveTimeout = setTimeout(() => {
        saveCurrentNote();
      }, 1000);
    });
  }
}

function updateNotesStatus(status) {
  const badge = document.getElementById('notes-status-badge');
  if (!badge) return;

  badge.className = `notes-status ${status}`;
  if (status === 'saved') {
    badge.innerHTML = `<i class="fas fa-check-circle"></i> Saved`;
  } else if (status === 'saving') {
    badge.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;
  } else {
    badge.innerHTML = `<i class="fas fa-exclamation-circle"></i> Unsaved`;
  }
}

function saveCurrentNote() {
  if (!App.currentQuestion) return;
  const qId = App.currentQuestion.id;
  const textarea = document.getElementById('notes-textarea');
  if (!textarea) return;
  const content = textarea.value;

  updateNotesStatus('saving');

  // Save to localStorage
  const notes = lsGetObj(LS.NOTES);
  notes[qId] = content;
  localStorage.setItem(LS.NOTES, JSON.stringify(notes));

  // Sync to Firestore
  if (typeof syncNoteToCloud === 'function' && isFirebaseConfigured && firebase.auth().currentUser) {
    syncNoteToCloud(qId, content).then(() => {
      if (App.currentQuestion && App.currentQuestion.id === qId) {
        updateNotesStatus('saved');
      }
    }).catch(() => {
      if (App.currentQuestion && App.currentQuestion.id === qId) {
        updateNotesStatus('unsaved');
      }
    });
  } else {
    updateNotesStatus('saved');
  }
}

// ============================================================
// BOOKMARKS HELPERS & RENDERING
// ============================================================
window.toggleBookmark = function (id) {
  const q = App.questions.find(q => q.id === id);
  if (!q) return;

  let bookmarks = lsGet(LS.BOOKMARKS);
  let isBookmarked;

  if (bookmarks.includes(id)) {
    bookmarks = bookmarks.filter(b => b !== id);
    isBookmarked = false;
    showToast(`Removed "${q.name}" from bookmarks`, 'info');
  } else {
    bookmarks.push(id);
    isBookmarked = true;
    showToast(`Added "${q.name}" to bookmarks`, 'success');
  }

  lsSet(LS.BOOKMARKS, bookmarks);

  // Sync to cloud
  if (typeof syncBookmarkToCloud === 'function') {
    syncBookmarkToCloud(id, isBookmarked);
  }

  // Update detail action button
  updateBookmarkButton(id);

  // Refresh bookmarks page if active
  if (App.currentPage === 'bookmarks') renderBookmarksPage();
};

window.updateBookmarkButton = function (id) {
  const btn = document.getElementById('btn-bookmark');
  if (!btn) return;
  const bookmarks = lsGet(LS.BOOKMARKS);
  const isBookmarked = bookmarks.includes(id);
  btn.className = `action-btn ${isBookmarked ? 'active' : ''}`;
  btn.innerHTML = `<i class="${isBookmarked ? 'fas' : 'far'} fa-bookmark"></i> ${isBookmarked ? 'Bookmarked ✓' : 'Bookmark'}`;
};

function renderBookmarksPage() {
  const tbody = document.getElementById('bookmarks-table-body');
  if (!tbody) return;

  const solved = lsGet(LS.SOLVED);
  const bookmarks = lsGet(LS.BOOKMARKS);
  const bookmarkedQuestions = App.questions.filter(q => bookmarks.includes(q.id));

  // Update count badge
  const badge = document.getElementById('bookmarks-count-badge');
  if (badge) badge.textContent = `${bookmarkedQuestions.length} bookmarks`;

  if (!bookmarkedQuestions.length) {
    tbody.innerHTML = `
      <tr><td colspan="9">
        <div class="empty-state">
          <i class="fas fa-bookmark" style="font-size:36px;color:var(--border-subtle);margin-bottom:10px;"></i>
          <h3>No bookmarks yet</h3>
          <p>Click the bookmark button on any question details page to save it here.</p>
        </div>
      </td></tr>`;
    return;
  }

  let html = '';
  bookmarkedQuestions.forEach(q => {
    const isSolved = solved.includes(q.id);
    const tierDisplay = q.tier ? q.tier.charAt(0).toUpperCase() + q.tier.slice(1) : 'Optional';

    html += `
      <tr class="${isSolved ? 'solved-row' : ''}">
        <td class="id-col" onclick="openQuestion(${q.id})">${q.id}</td>
        <td class="name-col" onclick="openQuestion(${q.id})">
          <span>${q.name}</span>
        </td>
        <td onclick="openQuestion(${q.id})">${getCanonical(q)}</td>
        <td style="color:var(--text-muted);font-size:11.5px" onclick="openQuestion(${q.id})">${q.pattern || '—'}</td>
        <td onclick="openQuestion(${q.id})"><span class="diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span></td>
        <td onclick="openQuestion(${q.id})"><span class="tier-badge ${q.tier || 'optional'}">${tierDisplay}</span></td>
        <td onclick="openQuestion(${q.id})">${q.tcs ? '<span class="tcs-badge">TCS</span>' : '<span style="color:var(--text-muted);font-size:11px">—</span>'}</td>
        <td onclick="openQuestion(${q.id})">
          <div class="q-status-icon ${isSolved ? 'solved' : 'unsolved'}">
            <i class="fas ${isSolved ? 'fa-check-circle' : 'fa-circle'}"></i>
          </div>
        </td>
        <td style="text-align:center;">
          <button class="bookmark-remove-btn" onclick="toggleBookmark(${q.id})" title="Remove Bookmark">
            <i class="fas fa-trash-alt"></i> Remove
          </button>
        </td>
      </tr>`;
  });

  tbody.innerHTML = html;
}

// ============================================================
// GLOBAL REFRESH HOOKS
// ============================================================
window.refreshAllUI = function () {
  updateSidebarStats();
  buildSidebar();
  renderCurrentView();
  if (App.currentQuestion) {
    renderQuestionDetail(App.currentQuestion);
    // Reload notes for active question
    const notesObj = lsGetObj(LS.NOTES);
    const noteText = notesObj[App.currentQuestion.id] || '';
    const textarea = document.getElementById('notes-textarea');
    if (textarea) textarea.value = noteText;
    updateNotesStatus('saved');
    updateBookmarkButton(App.currentQuestion.id);
  }

  // Reload general compiler code if that page is active
  if (App.currentPage === 'compiler') {
    loadGeneralCompilerCode();
  }
};

// ============================================================
// DSA COMPILER DESCRIPTION & MODE INTEGRATION
// ============================================================
function syncCompilerDescription(q) {
  const placeholder = document.getElementById('compiler-desc-placeholder');
  const content = document.getElementById('compiler-desc-content');
  const title = document.getElementById('compiler-desc-title');
  const badges = document.getElementById('compiler-desc-badges');
  const statement = document.getElementById('compiler-desc-statement');
  const constraints = document.getElementById('compiler-desc-constraints');
  const sampleInput = document.getElementById('compiler-desc-sample-input');
  const sampleOutput = document.getElementById('compiler-desc-sample-output');
  const hintsSection = document.getElementById('compiler-desc-hints-section');
  const hintText = document.getElementById('compiler-desc-hint-text');
  const solveStatus = document.getElementById('compiler-desc-solve-status');

  if (!q) {
    if (placeholder) placeholder.style.display = 'flex';
    if (content) content.classList.add('hidden');
    return;
  }

  if (placeholder) placeholder.style.display = 'none';
  if (content) content.classList.remove('hidden');

  // Title
  if (title) title.textContent = `${q.id}. ${q.name}`;

  // Solve status
  const solved = lsGet(LS.SOLVED);
  const isSolved = solved.includes(q.id);
  if (solveStatus) {
    solveStatus.textContent = isSolved ? 'Solved ✓' : 'Unsolved';
    solveStatus.className = `action-btn ${isSolved ? 'success' : 'warning'}`;
  }

  // Badges
  if (badges) {
    badges.innerHTML = `
      <span class="tier-badge ${q.tier || 'optional'}">${q.tier ? q.tier.charAt(0).toUpperCase() + q.tier.slice(1) : 'Optional'}</span>
      <span class="diff-badge ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
      ${q.tcs ? '<span class="tcs-badge">TCS</span>' : ''}
    `;
  }

  // Statement & constraints
  if (statement) statement.textContent = q.statement;
  if (constraints) constraints.textContent = q.constraints || 'No constraints specified.';

  // Examples
  if (sampleInput) sampleInput.textContent = q.sampleInput || 'N/A';
  if (sampleOutput) sampleOutput.textContent = q.sampleOutput || 'N/A';

  // Hints
  if (hintsSection) {
    if (q.hint) {
      hintsSection.style.display = 'block';
      if (hintText) {
        hintText.textContent = q.hint;
        hintText.classList.add('hidden');
      }
      const btn = document.getElementById('compiler-hint-accordion-btn');
      if (btn) {
        const span = btn.querySelector('span');
        if (span) span.innerHTML = `<i class="fas fa-lightbulb" style="color: var(--accent-yellow); margin-right: 6px;"></i> Show Hint`;
        const chevron = btn.querySelector('.chevron');
        if (chevron) {
          chevron.className = 'fas fa-chevron-down chevron';
        }
      }
    } else {
      hintsSection.style.display = 'none';
    }
  }

  // Automatically switch compiler modes
  const isRegistryQuestion = window.QUESTION_METADATA_REGISTRY && window.QUESTION_METADATA_REGISTRY[q.id];
  const toggleEl = document.getElementById('compiler-mode-toggle');
  if (isRegistryQuestion) {
    if (toggleEl) toggleEl.style.display = 'inline-flex';
    window.setCompilerMode('dsa');
  } else {
    if (toggleEl) toggleEl.style.display = 'none';
    window.setCompilerMode('general');
  }
}

window.toggleCompilerHint = function () {
  const textEl = document.getElementById('compiler-desc-hint-text');
  const btn = document.getElementById('compiler-hint-accordion-btn');
  if (!textEl || !btn) return;

  const isHidden = textEl.classList.contains('hidden');
  if (isHidden) {
    textEl.classList.remove('hidden');
    const span = btn.querySelector('span');
    if (span) span.innerHTML = `<i class="fas fa-lightbulb" style="color: var(--accent-yellow); margin-right: 6px;"></i> Hide Hint`;
    const chevron = btn.querySelector('.chevron');
    if (chevron) {
      chevron.className = 'fas fa-chevron-up chevron';
    }
  } else {
    textEl.classList.add('hidden');
    const span = btn.querySelector('span');
    if (span) span.innerHTML = `<i class="fas fa-lightbulb" style="color: var(--accent-yellow); margin-right: 6px;"></i> Show Hint`;
    const chevron = btn.querySelector('.chevron');
    if (chevron) {
      chevron.className = 'fas fa-chevron-down chevron';
    }
  }
};

window.setCompilerMode = function (mode) {
  if (mode === 'dsa') {
    const q = App?.currentQuestion;
    if (!q || !window.QUESTION_METADATA_REGISTRY || !window.QUESTION_METADATA_REGISTRY[q.id]) {
      showToast('DSA practice mode is not available for this question.', 'info');
      return;
    }
  }

  App.compilerMode = mode;

  const btnDsa = document.getElementById('mode-btn-dsa');
  const btnGen = document.getElementById('mode-btn-general');
  if (btnDsa) btnDsa.classList.toggle('active', mode === 'dsa');
  if (btnGen) btnGen.classList.toggle('active', mode === 'general');

  const containerDsa = document.getElementById('dsa-results-container');
  const containerGen = document.getElementById('general-results-container');
  if (containerDsa) containerDsa.classList.toggle('hidden', mode !== 'dsa');
  if (containerGen) containerGen.classList.toggle('hidden', mode !== 'general');
};

// ============================================================
// DSA COMPILER PAGE FUNCTIONS
// ============================================================

/**
 * Populate the left panel (#page-dsa-compiler) with problem details
 */
function populateDsaProblemPanel(q) {
  if (!q) return;

  // Title
  const title = document.getElementById('dsa-problem-title');
  if (title) title.textContent = q.name;

  // Badges (difficulty, tier, TCS)
  const badgesContainer = document.getElementById('dsa-problem-badges');
  if (badgesContainer) {
    badgesContainer.innerHTML = '';

    // Difficulty badge
    const diffBadge = document.createElement('span');
    diffBadge.className = `diff-badge ${q.difficulty}`;
    diffBadge.textContent = q.difficulty.toUpperCase();
    badgesContainer.appendChild(diffBadge);

    // Tier badge
    const tierBadge = document.createElement('span');
    tierBadge.className = `tier-badge ${q.tier}`;
    tierBadge.textContent = q.tier.charAt(0).toUpperCase() + q.tier.slice(1);
    badgesContainer.appendChild(tierBadge);

    // TCS badge (if applicable)
    if (q.tcs) {
      const tcsBadge = document.createElement('span');
      tcsBadge.className = 'tcs-badge';
      tcsBadge.textContent = 'TCS';
      badgesContainer.appendChild(tcsBadge);
    }

    const supported = getDsaSupportedLanguages(q);
    if (supported.length === 1 && supported[0] === 'cpp') {
      const cppOnlyBadge = document.createElement('span');
      cppOnlyBadge.className = 'tcs-badge';
      cppOnlyBadge.textContent = 'C++ Only';
      badgesContainer.appendChild(cppOnlyBadge);

      const cppOnlyMessage = document.createElement('div');
      cppOnlyMessage.style.cssText = 'flex-basis:100%;margin-top:6px;color:var(--text-muted);font-size:12px;line-height:1.4;';
      cppOnlyMessage.textContent = 'This problem currently supports C++ only because it requires advanced data-structure wrappers.';
      badgesContainer.appendChild(cppOnlyMessage);
    }
  }

  syncDsaLanguageAvailability(q);

  // Problem statement
  const statement = document.getElementById('dsa-problem-statement');
  if (statement) statement.textContent = q.statement || 'No description available.';

  // Constraints
  const constraints = document.getElementById('dsa-constraints');
  if (constraints) constraints.textContent = q.constraints || 'No constraints specified.';

  // Sample input/output
  const sampleInput = document.getElementById('dsa-example-input');
  if (sampleInput) sampleInput.textContent = q.sampleInput || 'N/A';

  const sampleOutput = document.getElementById('dsa-example-output');
  if (sampleOutput) sampleOutput.textContent = q.sampleOutput || 'N/A';

  // Hint (if available)
  const hintBox = document.getElementById('dsa-hint-box');
  const hintText = document.getElementById('dsa-hint-text');
  if (hintBox && hintText) {
    if (q.hint) {
      hintBox.style.display = 'block';
      hintText.textContent = q.hint;
    } else {
      hintBox.style.display = 'none';
    }
  }

  // Solution/Approach (if available)
  const solBox = document.getElementById('dsa-solution-box');
  const solText = document.getElementById('dsa-solution-text');
  if (solBox && solText) {
    if (q.solution) {
      solBox.style.display = 'block';
      solText.textContent = q.solution;
    } else {
      solBox.style.display = 'none';
    }
  }
}

function getDsaStarterCode(q, lang) {
  if (q && window.QUESTION_METADATA_REGISTRY && window.QUESTION_METADATA_REGISTRY[q.id]) {
    const qMeta = window.QUESTION_METADATA_REGISTRY[q.id];
    if (qMeta.starterCode && qMeta.starterCode[lang]) {
      return qMeta.starterCode[lang];
    }
  }
  // Generic main template must NEVER appear inside DSA Workspace.
  return `// No starter code template available for ${lang === 'js' ? 'JavaScript' : lang === 'cpp' ? 'C++' : lang === 'py' ? 'Python' : lang}.`;
}

function getDsaQuestionMetadata(q) {
  return q && window.QUESTION_METADATA_REGISTRY ? window.QUESTION_METADATA_REGISTRY[q.id] : null;
}

function getDsaSupportedLanguages(q) {
  const qMeta = getDsaQuestionMetadata(q);
  if (qMeta && Array.isArray(qMeta.supportedLanguages) && qMeta.supportedLanguages.length > 0) {
    return qMeta.supportedLanguages;
  }
  return ['cpp', 'java', 'python', 'js'];
}

function isDsaLanguageSupported(q, lang) {
  return getDsaSupportedLanguages(q).includes(lang);
}

function syncDsaLanguageAvailability(q) {
  const langSelect = document.getElementById('dsa-language-select');
  if (!langSelect) return;

  const supported = getDsaSupportedLanguages(q);
  Array.from(langSelect.options).forEach(option => {
    option.disabled = !supported.includes(option.value);
  });

  if (!supported.includes(langSelect.value)) {
    const fallback = supported[0] || 'cpp';
    langSelect.value = fallback;
    App.dsaEditorLanguage = fallback;
  }
}


/**
 * Load code for DSA editor, respecting language persistence and template isolation
 */
function loadDsaCodeForQuestion(q) {
  if (!App.dsaEditor) return;
  const uid = getUid();

  // 1. Determine active language from localStorage
  let activeLang = localStorage.getItem(`dsa_workspace_last_lang_${uid}_${q.id}`);

  // 2. If no active language, check if there is a single key
  const singleKey = `dsa_workspace_code_${uid}_${q.id}`;
  const singleSaved = localStorage.getItem(singleKey);
  if (singleSaved && !activeLang) {
    try {
      const data = JSON.parse(singleSaved);
      if (data && data.code !== undefined && data.language) {
        activeLang = data.language;
        const langKey = getDsaUserCodeKey(q.id, data.language);
        if (!localStorage.getItem(langKey)) {
          localStorage.setItem(langKey, JSON.stringify({
            questionId: String(q.id),
            language: data.language,
            code: data.code,
            updatedAt: data.updatedAt || Date.now()
          }));
        }
        localStorage.setItem(`dsa_workspace_last_lang_${uid}_${q.id}`, data.language);
      }
    } catch (e) {
      console.error("Error parsing single saved DSA code:", e);
    }
  }

  // 3. Fallback to an allowed language
  if (!activeLang) {
    const langSelect = document.getElementById('dsa-language-select');
    activeLang = langSelect ? langSelect.value : App.dsaEditorLanguage || 'cpp';
  }

  const supportedLanguages = getDsaSupportedLanguages(q);
  if (!supportedLanguages.includes(activeLang)) {
    activeLang = supportedLanguages[0] || 'cpp';
  }

  App.dsaEditorLanguage = activeLang;
  const langSelect = document.getElementById('dsa-language-select');
  if (langSelect) {
    langSelect.value = activeLang;
  }
  syncDsaLanguageAvailability(q);

  // 4. Try to load saved code for this language
  const key = getDsaUserCodeKey(q.id, activeLang);
  const savedStr = localStorage.getItem(key);

  if (savedStr) {
    try {
      const data = JSON.parse(savedStr);
      if (data && data.code !== undefined) {
        const monacoLang = activeLang === 'cpp' ? 'cpp' : activeLang === 'c' ? 'c' : activeLang === 'js' ? 'javascript' : activeLang;
        monaco.editor.setModelLanguage(App.dsaEditor.getModel(), monacoLang);
        App.dsaEditor.setValue(data.code);
        return;
      }
    } catch (e) {
      console.error("Error parsing saved DSA code:", e);
    }
  }

  // 5. Fallback to registry starter template (never generic main)
  const monacoLang = activeLang === 'cpp' ? 'cpp' : activeLang === 'c' ? 'c' : activeLang === 'js' ? 'javascript' : activeLang;
  monaco.editor.setModelLanguage(App.dsaEditor.getModel(), monacoLang);
  App.dsaEditor.setValue(getDsaStarterCode(q, activeLang));
  localStorage.setItem(`dsa_workspace_last_lang_${uid}_${q.id}`, activeLang);
}

/**
 * Auto-save handler for DSA editor (debounced)
 */
let dsaEditorDebounceTimeout = null;
function handleDsaEditorChange() {
  const qId = App.currentQuestion?.id;
  if (!qId) return;

  clearTimeout(dsaEditorDebounceTimeout);
  dsaEditorDebounceTimeout = setTimeout(() => {
    saveDsaEditorCode(qId);
  }, 3000);
}

/**
 * Save DSA editor code immediately
 */
function saveDsaEditorCode(qId) {
  clearTimeout(dsaEditorDebounceTimeout);
  if (!App.dsaEditor) return;

  const lang = App.dsaEditorLanguage;
  const code = App.dsaEditor.getValue();
  const uid = getUid();
  const key = getDsaUserCodeKey(qId, lang);

  const data = {
    questionId: String(qId),
    language: lang,
    code: code,
    updatedAt: Date.now()
  };

  localStorage.setItem(key, JSON.stringify(data));
  localStorage.setItem(`dsa_workspace_last_lang_${uid}_${qId}`, lang);
  localStorage.setItem(`dsa_workspace_code_${uid}_${qId}`, JSON.stringify(data));

  console.log("DSA Workspace code saved:", key);

  if (typeof syncEditorCodeToCloud === 'function') {
    syncEditorCodeToCloud(qId, lang, code);
  }
}

/**
 * Change language in DSA editor
 */
function setDsaLanguage(lang) {
  if (App.currentQuestion && !isDsaLanguageSupported(App.currentQuestion, lang)) {
    syncDsaLanguageAvailability(App.currentQuestion);
    showToast('This problem currently supports C++ only because it requires advanced data-structure wrappers.', 'info');
    return;
  }

  // Save previous language code
  if (App.currentQuestion && App.dsaEditor) {
    const prevLang = App.dsaEditorLanguage;
    const prevCode = App.dsaEditor.getValue();
    const prevKey = getDsaUserCodeKey(App.currentQuestion.id, prevLang);
    const prevData = {
      questionId: String(App.currentQuestion.id),
      language: prevLang,
      code: prevCode,
      updatedAt: Date.now()
    };
    localStorage.setItem(prevKey, JSON.stringify(prevData));
  }

  App.dsaEditorLanguage = lang;
  if (!App.dsaEditor) return;

  const monacoLang = lang === 'cpp' ? 'cpp' : lang === 'c' ? 'c' : lang === 'js' ? 'javascript' : lang;
  monaco.editor.setModelLanguage(App.dsaEditor.getModel(), monacoLang);

  // Load saved code for new language
  const uid = getUid();
  const key = getDsaUserCodeKey(App.currentQuestion ? App.currentQuestion.id : 'unknown', lang);
  const savedStr = localStorage.getItem(key);

  if (savedStr) {
    try {
      const data = JSON.parse(savedStr);
      if (data && data.code !== undefined) {
        App.dsaEditor.setValue(data.code);
        if (App.currentQuestion) {
          localStorage.setItem(`dsa_workspace_last_lang_${uid}_${App.currentQuestion.id}`, lang);
          saveDsaEditorCode(App.currentQuestion.id);
        }
        return;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Load starter template (never generic main)
  App.dsaEditor.setValue(getDsaStarterCode(App.currentQuestion, lang));
  if (App.currentQuestion) {
    localStorage.setItem(`dsa_workspace_last_lang_${uid}_${App.currentQuestion.id}`, lang);
    saveDsaEditorCode(App.currentQuestion.id);
  }
}

/**
 * Reset DSA editor code to starter template
 */
function resetDsaCode() {
  if (!App.dsaEditor || !App.currentQuestion) return;
  const lang = App.dsaEditorLanguage;
  const starterCode = getDsaStarterCode(App.currentQuestion, lang);
  App.dsaEditor.setValue(starterCode);
  saveDsaEditorCode(App.currentQuestion.id);
  showToast('Code reset to template', 'info');
}

/**
 * Toggle fullscreen for DSA editor panel
 */
function toggleDsaFullscreenEditor() {
  const panel = document.querySelector('#page-dsa-compiler .editor-panel');
  if (panel) {
    panel.classList.toggle('fullscreen');
    setTimeout(() => {
      if (App.dsaEditor) App.dsaEditor.layout();
    }, 100);
  }
}

/**
 * Run DSA code
 */
function dsaRunCode() {
  if (!App.dsaEditor) { showToast('Editor not ready', 'error'); return; }
  if (!App.currentQuestion) { showToast('No question selected', 'error'); return; }

  // Save code before running
  saveDsaEditorCode(App.currentQuestion.id);

  const code = App.dsaEditor.getValue();
  const lang = App.dsaEditorLanguage;
  if (!isDsaLanguageSupported(App.currentQuestion, lang)) {
    syncDsaLanguageAvailability(App.currentQuestion);
    showToast('This problem currently supports C++ only because it requires advanced data-structure wrappers.', 'info');
    return;
  }

  // Auto mode selection
  if (window.QUESTION_METADATA_REGISTRY && window.QUESTION_METADATA_REGISTRY[App.currentQuestion.id]) {
    App.dsaCompilerMode = 'dsa';
    App.compilerMode = 'dsa';
  } else {
    App.dsaCompilerMode = 'general';
    App.compilerMode = 'general';
  }

  Compiler.run(code, lang, '');
}

/**
 * Submit DSA code
 */
function dsaSubmitCode() {
  if (!App.dsaEditor) { showToast('Editor not ready', 'error'); return; }
  if (!App.currentQuestion) { showToast('No question selected', 'error'); return; }

  // Save code before submitting
  saveDsaEditorCode(App.currentQuestion.id);

  const code = App.dsaEditor.getValue();
  const lang = App.dsaEditorLanguage;
  if (!isDsaLanguageSupported(App.currentQuestion, lang)) {
    syncDsaLanguageAvailability(App.currentQuestion);
    showToast('This problem currently supports C++ only because it requires advanced data-structure wrappers.', 'info');
    return;
  }

  // Auto mode selection
  if (window.QUESTION_METADATA_REGISTRY && window.QUESTION_METADATA_REGISTRY[App.currentQuestion.id]) {
    App.dsaCompilerMode = 'dsa';
    App.compilerMode = 'dsa';
  } else {
    App.dsaCompilerMode = 'general';
    App.compilerMode = 'general';
  }

  Compiler.submit(code, lang);
}

/**
 * Exit DSA Workspace: stops polling, cancels execution, clears results, and returns to dashboard
 */
window.exitDsaWorkspace = function () {
  // Cancel active compiler execution and polling
  if (window.Compiler) {
    if (typeof window.Compiler.stopExecution === 'function') {
      window.Compiler.stopExecution('Workspace exited.');
    }
    if (typeof window.Compiler.resetState === 'function') {
      window.Compiler.resetState();
    }
  }

  // Clear verdict banner
  const banner = document.getElementById('dsa-status-banner');
  if (banner) {
    banner.className = 'verdict-banner';
    banner.innerHTML = '';
  }

  // Clear testcase results
  const tabs = document.getElementById('dsa-testcase-tabs');
  if (tabs) tabs.innerHTML = '';
  const content = document.getElementById('dsa-testcase-content');
  if (content) content.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px 0;">Run or submit to see test results</div>';

  // Clear runtime/memory values
  const timeVal = document.getElementById('dsa-exec-time');
  if (timeVal) timeVal.textContent = '--';
  const memVal = document.getElementById('dsa-exec-memory');
  if (memVal) memVal.textContent = '--';

  // Restore dashboard layout
  restorePreviousView();
};