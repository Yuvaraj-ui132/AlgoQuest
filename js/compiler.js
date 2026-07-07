/**
 * compiler.js — Judge0 CE API Integration
 * AlgoForge DSA Dashboard
 * Complete production-quality coding environment enhancements.
 */

const Compiler = (() => {

  const JUDGE0_BASE = 'https://judge0-ce.p.rapidapi.com';
  const JUDGE0_SULU = 'https://ce.judge0.com';

  // Language IDs for Judge0
  const LANGUAGE_IDS = {
    'cpp': 76,   // C++17
    'c': 50,
    'java': 62,
    'python': 71,
    'js': 63,
  };

  // Status IDs
  const STATUSES = {
    1: { label: 'Waiting', cls: 'waiting' }, // In Queue
    2: { label: 'Waiting', cls: 'waiting' }, // Processing
    3: { label: 'Accepted', cls: 'accepted' },
    4: { label: 'Wrong Answer', cls: 'wrong' },
    5: { label: 'Time Limit Exceeded', cls: 'error' },
    6: { label: 'Compilation Error', cls: 'error' },
    7: { label: 'Runtime Error (SIGSEGV)', cls: 'error' },
    8: { label: 'Runtime Error (SIGXFSZ)', cls: 'error' },
    9: { label: 'Runtime Error (SIGFPE)', cls: 'error' },
    10: { label: 'Runtime Error (SIGABRT)', cls: 'error' },
    11: { label: 'Runtime Error (NZEC)', cls: 'error' },
    12: { label: 'Runtime Error (Other)', cls: 'error' },
    13: { label: 'Internal Error', cls: 'error' },
    14: { label: 'Exec Format Error', cls: 'error' },
  };

  const CATEGORY_EXPLANATIONS = {
    'Accepted': 'Accepted! Your code compiled and ran successfully, producing the correct output for all test cases.',
    'Wrong Answer': 'Wrong Answer. Your code ran successfully, but produced a different output than expected. Check your logic and edge cases.',
    'Time Limit Exceeded': 'Time Limit Exceeded. Your code took longer to execute than the allowed limit. Optimize your algorithm\'s complexity (e.g. avoid nested loops) or check for infinite loops.',
    'Memory Limit Exceeded': 'Memory Limit Exceeded. Your program exceeded the maximum memory limit. Avoid large unnecessary arrays/data structures or deep/infinite recursion.',
    'Compilation Error': 'Compilation Error. Your code failed to compile. This is usually due to syntax errors, missing declarations, or type mismatches. See compiler logs below.',
    'Runtime Error': 'Runtime Error. The program crashed during execution. Common causes include out-of-bounds array access, null pointer dereferences, division by zero, or stack overflow from deep recursion.'
  };

  let pollingInterval = null;
  let executionTimeout = null;
  let rapidApiKey = '';
  let _isSubmit = false;

  let executionId = 0;
  let renderGenOutput = 0;
  let renderGenError = 0;

  let activeVerdict = null;
  let activeRuntime = null;
  let activeMemory = null;
  let activeMetadata = null;

  function getUid() {
    if (window.App && typeof window.getStorageKey === 'function') {
      const user = (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured && firebase.auth && firebase.auth() && firebase.auth().currentUser);
      return user ? user.uid : 'guest';
    }
    return 'guest';
  }

  function init() {
    rapidApiKey = localStorage.getItem('judge0_api_key') || '';
    const keyInput = document.getElementById('api-key-input');
    if (keyInput) {
      keyInput.value = rapidApiKey;
      keyInput.addEventListener('change', () => {
        rapidApiKey = keyInput.value.trim();
        localStorage.setItem('judge0_api_key', rapidApiKey);
        showToast('API key saved', 'success');
      });
    }
    if (window.App && window.App.currentQuestion) {
      renderHistory(window.App.currentQuestion.id);
    }
  }

  function detectInputRequired(code, language) {
    const cleanCode = code || '';
    if (language === 'cpp') {
      return /cin\s*>>|getline\s*\(/.test(cleanCode);
    } else if (language === 'c') {
      return /\bscanf\s*\(/.test(cleanCode);
    } else if (language === 'python') {
      return /\binput\s*\(/.test(cleanCode);
    } else if (language === 'java') {
      return /\bScanner\b|\bBufferedReader\b/.test(cleanCode);
    }
    return false;
  }

  function checkInputAndExecute(code, language, stdin, onConfirm) {
    const isRequired = detectInputRequired(code, language);
    const isStdinEmpty = !stdin || stdin.trim() === '';

    if (isRequired && isStdinEmpty) {
      const modal = document.getElementById('input-warning-modal');
      if (modal) {
        modal.classList.add('active');

        const continueBtn = document.getElementById('warning-continue-btn');
        const cancelBtn = document.getElementById('warning-cancel-btn');

        const newContinueBtn = continueBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        continueBtn.parentNode.replaceChild(newContinueBtn, continueBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

        newContinueBtn.addEventListener('click', () => {
          modal.classList.remove('active');
          onConfirm();
        });
        newCancelBtn.addEventListener('click', () => {
          modal.classList.remove('active');
        });
      } else {
        if (confirm("This program requires input. Please provide custom input or continue anyway?")) {
          onConfirm();
        }
      }
    } else {
      onConfirm();
    }
  }

  function truncateOutputText(text) {
    if (!text) return { text: '', truncated: false };
    const maxChars = 50000;
    let result = text;
    let truncated = false;

    if (result.length > maxChars) {
      result = result.substring(0, maxChars);
      truncated = true;
    }

    const lines = result.split(/\r?\n/);
    if (lines.length > 1000) {
      result = lines.slice(0, 1000).join('\n');
      truncated = true;
    }

    return { text: result, truncated };
  }

  function renderTextSafe(element, rawText, successClass = '') {
    if (!element) return;

    const { text, truncated } = truncateOutputText(rawText);

    let myRenderGen;
    const isOutput = element.id === 'exec-output';
    if (isOutput) {
      renderGenOutput++;
      myRenderGen = renderGenOutput;
    } else {
      renderGenError++;
      myRenderGen = renderGenError;
    }

    const myExecutionId = executionId;

    element.className = 'exec-output ' + successClass;
    element.textContent = '';

    if (!text) {
      element.textContent = '(no output)';
      return;
    }

    const lines = text.split('\n');
    let index = 0;
    const chunkSize = 100;

    function renderChunk() {
      if (myExecutionId !== executionId) return;

      if (isOutput) {
        if (myRenderGen !== renderGenOutput) return;
      } else {
        if (myRenderGen !== renderGenError) return;
      }

      const chunk = lines.slice(index, index + chunkSize).join('\n');
      element.textContent += (index > 0 ? '\n' : '') + chunk;
      index += chunkSize;

      if (index < lines.length) {
        requestAnimationFrame(renderChunk);
      } else {
        if (truncated) {
          element.textContent += '\n\n⚠ Output truncated due to size limit (max 1000 lines / 50 KB).';
        }
      }
    }

    requestAnimationFrame(renderChunk);
  }

  function run(sourceCode, language, stdin) {
    _isSubmit = false;

    const isDsaPage = window.App?.currentPage === 'dsa-compiler';
    const currentQ = window.App?.currentQuestion;
    let qMeta = currentQ ? window.QUESTION_METADATA_REGISTRY[currentQ.id] : null;
    if (qMeta && currentQ && qMeta.name !== currentQ.name) {
      for (const key in window.QUESTION_METADATA_REGISTRY) {
        if (window.QUESTION_METADATA_REGISTRY[key].name === currentQ.name) {
          qMeta = window.QUESTION_METADATA_REGISTRY[key];
          break;
        }
      }
    }
    const isDsaMode = isDsaPage && !!qMeta;

    if (isDsaMode) {
      activeMetadata = qMeta;
      const activeTests = qMeta.sampleTests;
      const T = activeTests.length;
      let combinedStdin = `${T}\n`;
      activeTests.forEach(tc => {
        combinedStdin += tc.stdin;
        if (!tc.stdin.endsWith('\n')) combinedStdin += '\n';
      });

      const wrapped = generateDriverCode(qMeta, sourceCode, language);
      _execute(wrapped, language, combinedStdin);
    } else {
      activeMetadata = null;
      const inputVal = isDsaPage ? (window.App?.currentQuestion?.sampleInput || '') : (stdin || '');
      if (isDsaPage) {
        _execute(sourceCode, language, inputVal);
      } else {
        checkInputAndExecute(sourceCode, language, inputVal, () => {
          _execute(sourceCode, language, inputVal);
        });
      }
    }
  }

  function submit(sourceCode, language) {
    _isSubmit = true;

    const isDsaPage = window.App?.currentPage === 'dsa-compiler';
    const currentQ = window.App?.currentQuestion;
    let qMeta = currentQ ? window.QUESTION_METADATA_REGISTRY[currentQ.id] : null;
    if (qMeta && currentQ && qMeta.name !== currentQ.name) {
      for (const key in window.QUESTION_METADATA_REGISTRY) {
        if (window.QUESTION_METADATA_REGISTRY[key].name === currentQ.name) {
          qMeta = window.QUESTION_METADATA_REGISTRY[key];
          break;
        }
      }
    }
    const isDsaMode = isDsaPage && !!qMeta;

    if (isDsaMode) {
      activeMetadata = qMeta;
      const activeTests = [...qMeta.sampleTests, ...qMeta.hiddenTests];
      const T = activeTests.length;
      let combinedStdin = `${T}\n`;
      activeTests.forEach(tc => {
        combinedStdin += tc.stdin;
        if (!tc.stdin.endsWith('\n')) combinedStdin += '\n';
      });

      const wrapped = generateDriverCode(qMeta, sourceCode, language);
      _execute(wrapped, language, combinedStdin);
    } else {
      activeMetadata = null;
      const q = window.App?.currentQuestion;
      const stdin = (q && q.sampleInput) ? q.sampleInput : '';
      if (isDsaPage) {
        _execute(sourceCode, language, stdin);
      } else {
        checkInputAndExecute(sourceCode, language, stdin, () => {
          _execute(sourceCode, language, stdin);
        });
      }
    }
  }

  function stopExecution(reason) {
    clearInterval(pollingInterval);
    if (executionTimeout) {
      clearTimeout(executionTimeout);
      executionTimeout = null;
    }

    executionId++;
    renderGenOutput++;
    renderGenError++;

    activeVerdict = 'Stopped';
    activeRuntime = '--';
    activeMemory = '--';

    _setButtonsDisabled(false);

    ['stop-btn', 'dsa-stop-btn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });

    updateStatus('stopped', 'Stopped');

    const msg = reason || 'Execution stopped by user.';

    const errEl = document.getElementById('exec-error');
    if (errEl) {
      errEl.textContent = msg;
      errEl.className = 'exec-output error';
    }

    const outEl = document.getElementById('exec-output');
    if (outEl) {
      outEl.textContent = '(execution terminated)';
      outEl.className = 'exec-output';
    }

    const banner = document.getElementById('verdict-banner');
    if (banner) {
      banner.className = 'verdict-banner show error';
      banner.innerHTML = `
        <div class="verdict-header">
          <i class="fas fa-stop-circle"></i>
          <span>Stopped</span>
        </div>
        <div class="verdict-explanation">${msg}</div>
      `;
    }

    showToast(reason ? 'Execution timed out' : 'Execution stopped', 'info');
  }
  window.stopExecution = stopExecution;

  async function _execute(sourceCode, language, stdin) {
    const langId = LANGUAGE_IDS[language] || 54;
    clearAllOutput();
    executionId++;
    const myExecutionId = executionId;

    activeVerdict = 'Running…';
    activeRuntime = '--';
    activeMemory = '--';

    updateStatus('running', 'Running…');
    _setButtonsDisabled(true);

    ['stop-btn', 'dsa-stop-btn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'flex';
    });

    if (executionTimeout) clearTimeout(executionTimeout);
    executionTimeout = setTimeout(() => {
      if (myExecutionId === executionId) {
        stopExecution('Execution stopped by client timeout.');
      }
    }, 30000);

    const payload = {
      source_code: btoa(unescape(encodeURIComponent(sourceCode))),
      language_id: langId,
      stdin: btoa(unescape(encodeURIComponent(stdin))),
      compiler_options: language === 'cpp' ? "-std=c++17" : "",
      redirect_stderr_to_stdout: false,
      wait: false,
    };

    try {
      let response;
      if (rapidApiKey) {
        response = await fetch(`${JUDGE0_BASE}/submissions?base64_encoded=true&wait=false`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
            'x-rapidapi-key': rapidApiKey,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${JUDGE0_SULU}/submissions?base64_encoded=true&wait=false`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (myExecutionId !== executionId) return;

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      const data = await response.json();
      if (myExecutionId !== executionId) return;

      if (!data.token) throw new Error('No submission token received. Check your API key or try again.');

      updateStatus('waiting', 'Waiting…');
      pollResult(data.token, language, myExecutionId);

    } catch (err) {
      if (myExecutionId === executionId) {
        _handleError(err);
      }
    }
  }

  function pollResult(token, language, myExecutionId) {
    let attempts = 0;
    const MAX_ATTEMPTS = 25;

    clearInterval(pollingInterval);
    pollingInterval = setInterval(async () => {
      if (myExecutionId !== executionId) {
        clearInterval(pollingInterval);
        return;
      }

      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        clearInterval(pollingInterval);
        if (myExecutionId !== executionId) return;

        if (executionTimeout) {
          clearTimeout(executionTimeout);
          executionTimeout = null;
        }
        _setButtonsDisabled(false);
        ['stop-btn', 'dsa-stop-btn'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
        updateStatus('error', 'Timeout');
        _showOutput('', 'Request timed out. Please try again.', '', null, null, null);
        return;
      }

      try {
        let response;
        const fields = 'status,stdout,stderr,compile_output,time,memory,message';

        if (rapidApiKey) {
          response = await fetch(
            `${JUDGE0_BASE}/submissions/${token}?base64_encoded=true&fields=${fields}`,
            {
              headers: {
                'x-rapidapi-host': 'judge0-ce.p.rapidapi.com',
                'x-rapidapi-key': rapidApiKey,
              },
            }
          );
        } else {
          response = await fetch(
            `${JUDGE0_SULU}/submissions/${token}?base64_encoded=true&fields=${fields}`
          );
        }

        if (myExecutionId !== executionId) {
          clearInterval(pollingInterval);
          return;
        }

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const result = await response.json();

        if (myExecutionId !== executionId) {
          clearInterval(pollingInterval);
          return;
        }

        const statusId = result.status?.id;

        if (statusId === 1 || statusId === 2) {
          const statusInfo = STATUSES[statusId] || { label: 'Waiting', cls: 'waiting' };
          updateStatus(statusInfo.cls, statusInfo.label);
          return;
        }

        clearInterval(pollingInterval);
        if (executionTimeout) {
          clearTimeout(executionTimeout);
          executionTimeout = null;
        }
        _setButtonsDisabled(false);
        ['stop-btn', 'dsa-stop-btn'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });

        const statusInfo = STATUSES[statusId] || { label: `Status ${statusId}`, cls: 'error' };
        const stdout = _decode(result.stdout);
        const stderr = _decode(result.stderr);
        const compileOutput = _decode(result.compile_output);
        const time = result.time ? `${result.time}s` : '--';
        const memory = result.memory ? `${(result.memory / 1024).toFixed(1)} MB` : '--';

        const category = getErrorCategory(statusId, result.status?.description || statusInfo.label, result.message);

        const isDsaPage = window.App?.currentPage === 'dsa-compiler';
        const currentQ = window.App?.currentQuestion;
        let qMeta = currentQ ? window.QUESTION_METADATA_REGISTRY[currentQ.id] : null;
        if (qMeta && currentQ && qMeta.name !== currentQ.name) {
          for (const key in window.QUESTION_METADATA_REGISTRY) {
            if (window.QUESTION_METADATA_REGISTRY[key].name === currentQ.name) {
              qMeta = window.QUESTION_METADATA_REGISTRY[key];
              break;
            }
          }
        }
        const isDsaMode = isDsaPage && window.App?.dsaCompilerMode === 'dsa' && !!qMeta;

        activeVerdict = category;
        activeRuntime = time;
        activeMemory = memory;

        if (isDsaPage) {
          let activeTests;
          if (isDsaMode) {
            activeTests = _isSubmit ? [...qMeta.sampleTests, ...qMeta.hiddenTests] : [...qMeta.sampleTests];
          } else {
            const q = window.App?.currentQuestion;
            activeTests = [{
              input: q?.sampleInput || '(none)',
              expected: q?.sampleOutput || '(none)',
              expectedRaw: q?.sampleOutput || ''
            }];
          }

          let passedCount = 0;
          if (isDsaMode) {
            const compareMode = qMeta?.compareMode || 'ordered';
            let outputLines = stdout ? stdout.split('---END_TC---') : [];
            outputLines = outputLines.map(line => line.trim());
            if (outputLines.length > 0 && outputLines[outputLines.length - 1] === "") {
              outputLines.pop();
            }

            activeTests.forEach((tc, idx) => {
              const actualRaw = outputLines[idx] || '';
              const passed = statusId === 3 && normalizeAndCompare(actualRaw, tc.expectedRaw, compareMode);
              if (passed) passedCount++;
            });
          } else {
            const passed = statusId === 3 && normalizeAndCompare(stdout, activeTests[0].expectedRaw, 'ordered');
            if (passed) passedCount = 1;
          }

          const allPassed = passedCount === activeTests.length && statusId === 3;
          const finalCategory = allPassed ? 'Accepted' : (statusId === 3 ? 'Wrong Answer' : category);
          activeVerdict = finalCategory;

          const finalCls = (finalCategory === 'Accepted') ? 'accepted' : ((finalCategory === 'Wrong Answer') ? 'wrong' : statusInfo.cls);
          updateStatus(statusInfo.cls === 'waiting' || statusInfo.cls === 'running' ? 'idle' : finalCls, finalCategory);
          const resolvedCompareMode = isDsaMode ? (qMeta?.compareMode || 'ordered') : 'ordered';
          renderDsaResults(statusId, stdout, stderr || compileOutput, compileOutput, time, memory, activeTests, resolvedCompareMode);
        } else {
          updateStatus(statusInfo.cls === 'waiting' || statusInfo.cls === 'running' ? 'idle' : statusInfo.cls, category);
          _showOutput(stdout, compileOutput || stderr, '', time, memory, statusId);

          _showBanner(statusId, statusInfo.label, result);

          if (window.App && window.App.currentQuestion) {
            updateExecutionHistory(window.App.currentQuestion.id, category, _isSubmit);
          }

          if (statusId === 3 && _isSubmit) {
            _autoMarkSolved();
          }
        }

      } catch (err) {
        if (myExecutionId !== executionId) return;
        clearInterval(pollingInterval);
        if (executionTimeout) {
          clearTimeout(executionTimeout);
          executionTimeout = null;
        }
        _setButtonsDisabled(false);
        ['stop-btn', 'dsa-stop-btn'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
        _handleError(err);
      }
    }, 1500);
  }

  function _autoMarkSolved() {
    const q = window.App?.currentQuestion;
    if (!q) {
      return;
    }

    const lsGetAvailable = typeof window.lsGet === 'function';
    const lsSetAvailable = typeof window.lsSet === 'function';

    if (!lsGetAvailable || !lsSetAvailable) {
      return;
    }

    let solved = window.lsGet('dsa_solved') || [];

    if (!solved.includes(q.id)) {
      solved.push(q.id);
      window.lsSet('dsa_solved', solved);

      if (typeof window.syncProgressToCloud === 'function') {
        window.syncProgressToCloud(q.id, true);
      }

      showToast(`🎉 "${q.name}" — Accepted & Marked Solved!`, 'success');

      if (typeof window.onQuestionAccepted === 'function') {
        window.onQuestionAccepted(q.id);
      }
    } else {
      showToast(`✅ Accepted! (already marked solved)`, 'success');
    }
  }

  function getErrorCategory(statusId, description, message) {
    const desc = (description || '').toLowerCase();
    const msg = (message || '').toLowerCase();

    if (statusId === 3) return 'Accepted';
    if (statusId === 4) return 'Wrong Answer';
    if (statusId === 5 || desc.includes('time limit') || msg.includes('time limit')) return 'Time Limit Exceeded';
    if (statusId === 6 || desc.includes('compilation') || msg.includes('compilation')) return 'Compilation Error';

    if (desc.includes('memory limit') || msg.includes('memory limit')) {
      return 'Memory Limit Exceeded';
    }

    if (statusId >= 7 && statusId <= 12) return 'Runtime Error';
    if (statusId === 13 || statusId === 14) return 'Runtime Error';

    return 'Runtime Error';
  }

  function _showBanner(statusId, label, result) {
    const banner = document.getElementById('verdict-banner');
    if (!banner) return;

    banner.className = 'verdict-banner show';
    let cls = 'error';
    let icon = 'fa-exclamation-triangle';

    const desc = result?.status?.description || label || '';
    const message = result?.message || '';
    const category = getErrorCategory(statusId, desc, message);

    if (category === 'Accepted') {
      cls = 'accepted'; icon = 'fa-check-circle';
    } else if (category === 'Wrong Answer') {
      cls = 'wrong'; icon = 'fa-times-circle';
    } else {
      cls = 'error'; icon = 'fa-exclamation-triangle';
    }

    banner.className = `verdict-banner show ${cls}`;

    let explanation = CATEGORY_EXPLANATIONS[category] || '';
    if (category === 'Runtime Error') {
      if (statusId === 7) {
        explanation = 'Runtime Error (SIGSEGV - Segmentation Fault). Your program tried to access restricted memory. Check for out-of-bound array index, null pointer dereferences, or stack overflow (infinite recursion).';
      } else if (statusId === 9) {
        explanation = 'Runtime Error (SIGFPE - Floating Point Exception). Invalid arithmetic operation. Check for division by zero or modulo by zero.';
      } else if (statusId === 10) {
        explanation = 'Runtime Error (SIGABRT - Aborted). The program aborted execution, often due to assertions failing or allocating too much memory (which can cause a stack overflow or standard abort).';
      } else if (statusId === 11) {
        explanation = 'Runtime Error (NZEC - Non-Zero Exit Code). The program exited with a code other than 0. Check for unhandled exceptions, incorrect class names in Java, or indentation errors in Python.';
      } else if (statusId === 8) {
        explanation = 'Runtime Error (SIGXFSZ - File Size Limit Exceeded). Your program tried to write too much data to a file.';
      }
    }

    banner.innerHTML = `
      <div class="verdict-header">
        <i class="fas ${icon}"></i>
        <span>${category}</span>
      </div>
      <div class="verdict-explanation">${explanation}</div>
    `;
  }

  function _hideBanner() {
    const banner = document.getElementById('verdict-banner');
    if (banner) banner.className = 'verdict-banner';
  }

  function updateExecutionHistory(qId, verdict, isSubmit) {
    const uid = getUid();
    const key = `dsa_exec_history_${uid}_${qId}`;

    let historyData = {
      lastRunTime: null,
      lastSubmissionTime: null,
      lastVerdict: null
    };

    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        historyData = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    const now = Date.now();
    if (isSubmit) {
      historyData.lastSubmissionTime = now;
    } else {
      historyData.lastRunTime = now;
    }
    historyData.lastVerdict = verdict;

    localStorage.setItem(key, JSON.stringify(historyData));
    renderHistory(qId);
  }

  function renderHistory(qId) {
    const uid = getUid();
    const key = `dsa_exec_history_${uid}_${qId}`;
    const dataStr = localStorage.getItem(key);

    const verdictEl = document.getElementById('hist-verdict');
    const runTimeEl = document.getElementById('hist-run-time');
    const submitTimeEl = document.getElementById('hist-submit-time');

    if (!verdictEl || !runTimeEl || !submitTimeEl) return;

    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);

        if (data.lastVerdict) {
          verdictEl.textContent = data.lastVerdict;
          verdictEl.className = 'history-val ' + getVerdictClass(data.lastVerdict);
        } else {
          verdictEl.textContent = '--';
          verdictEl.className = 'history-val';
        }

        runTimeEl.textContent = data.lastRunTime ? formatTime(data.lastRunTime) : '--';
        submitTimeEl.textContent = data.lastSubmissionTime ? formatTime(data.lastSubmissionTime) : '--';

      } catch (e) {
        console.error(e);
      }
    } else {
      verdictEl.textContent = '--';
      verdictEl.className = 'history-val';
      runTimeEl.textContent = '--';
      submitTimeEl.textContent = '--';
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function getVerdictClass(verdict) {
    if (verdict === 'Accepted') return 'accepted';
    if (verdict === 'Wrong Answer') return 'wrong';
    return 'error';
  }

  function _decode(str) {
    if (!str) return '';
    try { return decodeURIComponent(escape(atob(str))); } catch { return str; }
  }

  function _handleError(err) {
    console.error('[Judge0]', err);
    activeVerdict = 'Error';
    activeRuntime = '--';
    activeMemory = '--';
    updateStatus('error', 'Error');
    _showOutput('', err.message || 'An error occurred.', '', null, null, null);
    showToast('Error: ' + (err.message || 'Unknown error'), 'error');
    _setButtonsDisabled(false);
    _showBanner(13, 'Internal Error', { status: { description: 'Internal Error' }, message: err.message });
  }

  function _setButtonsDisabled(disabled) {
    ['run-btn', 'submit-btn', 'dsa-run-btn', 'dsa-submit-btn'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.disabled = disabled;
        el.style.opacity = disabled ? '0.6' : '1';
      }
    });
  }

  function updateStatus(cls, label) {
    const badge = document.getElementById('status-badge');
    const icons = {
      accepted: 'fa-check-circle',
      wrong: 'fa-times-circle',
      error: 'fa-exclamation-triangle',
      running: 'fa-circle-notch fa-spin',
      waiting: 'fa-circle-notch fa-spin',
      idle: 'fa-minus-circle',
      stopped: 'fa-stop-circle',
    };

    if (badge) {
      badge.className = `status-badge ${cls}`;
      badge.innerHTML = `<i class="fas ${icons[cls] || 'fa-info-circle'}"></i> ${label}`;
    }

    const dsaBadge = document.getElementById('dsa-status-badge');
    if (dsaBadge) {
      dsaBadge.className = `status-badge ${cls}`;
      dsaBadge.innerHTML = `<i class="fas ${icons[cls] || 'fa-info-circle'}"></i> ${label}`;
    }

    const inlineIndicator = document.getElementById('compiler-status-indicator');
    if (inlineIndicator) {
      inlineIndicator.className = `compiler-status-indicator ${cls}`;
      inlineIndicator.innerHTML = `<i class="fas ${icons[cls] || 'fa-info-circle'}"></i> ${label}`;
    }

    const dsaIndicator = document.getElementById('dsa-compiler-status-indicator');
    if (dsaIndicator) {
      dsaIndicator.className = `compiler-status-indicator ${cls}`;
      dsaIndicator.innerHTML = `<i class="fas ${icons[cls] || 'fa-info-circle'}"></i> ${label}`;
    }
  }

  function _showOutput(stdout, stderr, expected, time, memory, statusId) {
    const outEl = document.getElementById('exec-output');
    const successCls = (statusId === 3) ? 'success' : '';
    renderTextSafe(outEl, stdout, successCls);

    const errEl = document.getElementById('exec-error');
    const errorCls = stderr ? 'error' : '';
    renderTextSafe(errEl, stderr, errorCls);

    const timeEl = document.getElementById('exec-time');
    const memEl = document.getElementById('exec-memory');
    if (timeEl) timeEl.textContent = time || '--';
    if (memEl) memEl.textContent = memory || '--';
  }

  function clearAllOutput() {
    renderGenOutput++;
    renderGenError++;

    _hideBanner();
    updateStatus('idle', 'Idle');

    const outEl = document.getElementById('exec-output');
    if (outEl) {
      outEl.textContent = '(run code to see output)';
      outEl.className = 'exec-output';
    }

    const errEl = document.getElementById('exec-error');
    if (errEl) {
      errEl.textContent = '(none)';
      errEl.className = 'exec-output';
    }

    const timeEl = document.getElementById('exec-time');
    const memEl = document.getElementById('exec-memory');
    if (timeEl) timeEl.textContent = '--';
    if (memEl) memEl.textContent = '--';
  }

  function resetState() {
    clearInterval(pollingInterval);
    if (executionTimeout) {
      clearTimeout(executionTimeout);
      executionTimeout = null;
    }

    executionId++;
    renderGenOutput++;
    renderGenError++;

    _isSubmit = false;
    activeVerdict = null;
    activeRuntime = null;
    activeMemory = null;
    activeMetadata = null;

    const stopBtn = document.getElementById('stop-btn');
    if (stopBtn) stopBtn.style.display = 'none';

    _setButtonsDisabled(false);

    clearAllOutput();

    const dsaStatusBanner = document.getElementById('dsa-status-banner');
    if (dsaStatusBanner) {
      dsaStatusBanner.className = 'verdict-banner';
      dsaStatusBanner.innerHTML = '';
    }

    const dsaTabs = document.getElementById('dsa-testcase-tabs');
    if (dsaTabs) dsaTabs.innerHTML = '';

    const dsaContent = document.getElementById('dsa-testcase-content');
    if (dsaContent) dsaContent.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px 0;">No test cases evaluated.</div>';

    const execTimeEl = document.getElementById('dsa-exec-time');
    const execMemEl = document.getElementById('dsa-exec-memory');
    if (execTimeEl) execTimeEl.textContent = '--';
    if (execMemEl) execMemEl.textContent = '--';

    if (window.App && window.App.currentQuestion) {
      renderHistory(window.App.currentQuestion.id);
    } else {
      const verdictEl = document.getElementById('hist-verdict');
      const runTimeEl = document.getElementById('hist-run-time');
      const submitTimeEl = document.getElementById('hist-submit-time');
      if (verdictEl) verdictEl.textContent = '--';
      if (runTimeEl) runTimeEl.textContent = '--';
      if (submitTimeEl) submitTimeEl.textContent = '--';
    }
  }

  // =========================================================================
  // DSA Driver Code Generation
  // =========================================================================

  const CPP_HEADERS = `#include <algorithm>
#include <array>
#include <bits/stdc++.h>
#include <cmath>
#include <climits>
#include <functional>
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <stack>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

using namespace std;`;

  const CPP_LIST_NODE = `struct ListNode {
    int val;
    ListNode* next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode* next) : val(x), next(next) {}
};`;

  const CPP_TREE_NODE = `struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;

    TreeNode() : val(0), left(nullptr), right(nullptr) {}

    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}

    TreeNode(int x, TreeNode *left, TreeNode *right)
        : val(x), left(left), right(right) {}
};`;

  const CPP_GRAPH_NODE = `class Node {
public:
    int val;
    vector<Node*> neighbors;
    Node() : val(0), neighbors(vector<Node*>()) {}
    Node(int _val) : val(_val), neighbors(vector<Node*>()) {}
    Node(int _val, vector<Node*> _neighbors) : val(_val), neighbors(_neighbors) {}
};`;

  const CPP_PARAM_HANDLERS = {

    'int': (v, i) =>
      `            int ${v}; if(!(cin>>${v}))break;\n`,

    'bool': (v, i) =>
      `            int ${v}_int; if(!(cin>>${v}_int))break;\n` +
      `            bool ${v}=(${v}_int!=0);\n`,

    'double': (v, i) =>
      `            double ${v}; if(!(cin>>${v}))break;\n`,

    'string': (v, i) =>
      `            string ${v}; if(!(cin>>${v}))break; if(${v}=="@@EMPTY@@")${v}="";\n`,

    'string:line': (v, i) =>
      `            string ${v}; if(!(cin>>${v}))break; if(${v}=="@@EMPTY@@"){${v}="";} else { for(auto& __c:${v}) if(__c=='_') __c=' '; }\n`,

    'vector<char>': (v, i) =>
      `            int n_${i}; if(!(cin>>n_${i}))break;\n` +
      `            vector<char> ${v}(n_${i});\n` +
      `            for(int k=0;k<n_${i};++k){int v_${i};cin>>v_${i};${v}[k]=(char)v_${i};}\n`,

    'vector<int>': (v, i) =>
      `            int n_${i}; if(!(cin>>n_${i}))break;\n` +
      `            vector<int> ${v}(n_${i});\n` +
      `            for(int k=0;k<n_${i};++k)cin>>${v}[k];\n`,

    'vector<string>': (v, i) =>
      `            int n_${i}; if(!(cin>>n_${i}))break;\n` +
      `            vector<string> ${v}(n_${i});\n` +
      `            for(int k=0;k<n_${i};++k){cin>>${v}[k]; if(${v}[k]=="@@EMPTY@@")${v}[k]="";}\n`,

    'vector<vector<int>>': (v, i) =>
      `            int rows_${i},cols_${i}; if(!(cin>>rows_${i}>>cols_${i}))break;\n` +
      `            vector<vector<int>> ${v}(rows_${i},vector<int>(cols_${i}));\n` +
      `            for(int r=0;r<rows_${i};++r)for(int c=0;c<cols_${i};++c)cin>>${v}[r][c];\n`,

    'vector<vector<char>>': (v, i) =>
      `            int rows_${i},cols_${i}; if(!(cin>>rows_${i}>>cols_${i}))break;\n` +
      `            vector<vector<char>> ${v}(rows_${i},vector<char>(cols_${i}));\n` +
      `            for(int r=0;r<rows_${i};++r)for(int c=0;c<cols_${i};++c){int v_${i};cin>>v_${i};${v}[r][c]=(char)v_${i};}\n`,

    'ListNode*': (v, i) =>
      `            int n_${i}; if(!(cin>>n_${i}))break;\n` +
      `            ListNode* ${v}=nullptr;\n` +
      `            {ListNode dummy_${i}(0);ListNode* cur_${i}=&dummy_${i};\n` +
      `            for(int k=0;k<n_${i};++k){int v;cin>>v;cur_${i}->next=new ListNode(v);cur_${i}=cur_${i}->next;}\n` +
      `            ${v}=dummy_${i}.next;}\n`,

    // Builds two linked lists that share a common tail (for Intersection-of-Two-Lists style
    // problems). Stdin format: n1 (vals)  n2 (vals)  n3 (shared-tail vals, n3 may be 0).
    // intersectA reads everything and stores both heads in ctx; intersectB just emits the
    // second head that intersectA already built.
    'ListNode*:intersectA': (v, i, ctx) => {
      ctx.intersectB = `__intersectB_${i}`;
      return (
        `            int na_${i}; if(!(cin>>na_${i}))break;\n` +
        `            vector<int> arrA_${i}(na_${i}); for(int k=0;k<na_${i};++k)cin>>arrA_${i}[k];\n` +
        `            int nb_${i}; cin>>nb_${i};\n` +
        `            vector<int> arrB_${i}(nb_${i}); for(int k=0;k<nb_${i};++k)cin>>arrB_${i}[k];\n` +
        `            int nc_${i}; cin>>nc_${i};\n` +
        `            vector<int> arrC_${i}(nc_${i}); for(int k=0;k<nc_${i};++k)cin>>arrC_${i}[k];\n` +
        `            ListNode* tailHead_${i}=nullptr;\n` +
        `            {ListNode dC_${i}(0); ListNode* cC_${i}=&dC_${i};\n` +
        `            for(int k=0;k<nc_${i};++k){cC_${i}->next=new ListNode(arrC_${i}[k]);cC_${i}=cC_${i}->next;}\n` +
        `            tailHead_${i}=dC_${i}.next;}\n` +
        `            ListNode* ${v}=nullptr;\n` +
        `            {ListNode dA_${i}(0); ListNode* cA_${i}=&dA_${i};\n` +
        `            for(int k=0;k<na_${i};++k){cA_${i}->next=new ListNode(arrA_${i}[k]);cA_${i}=cA_${i}->next;}\n` +
        `            cA_${i}->next=tailHead_${i};\n` +
        `            ${v}=dA_${i}.next;}\n` +
        `            ListNode* __intersectB_${i}=nullptr;\n` +
        `            {ListNode dB_${i}(0); ListNode* cB_${i}=&dB_${i};\n` +
        `            for(int k=0;k<nb_${i};++k){cB_${i}->next=new ListNode(arrB_${i}[k]);cB_${i}=cB_${i}->next;}\n` +
        `            cB_${i}->next=tailHead_${i};\n` +
        `            __intersectB_${i}=dB_${i}.next;}\n`
      );
    },

    'ListNode*:intersectB': (v, i, ctx) =>
      `            ListNode* ${v}=${ctx.intersectB};\n`,

    'vector<ListNode*>': (v, i) =>
      `            int num_lists_${i}; if(!(cin>>num_lists_${i}))break;\n` +
      `            vector<ListNode*> ${v}(num_lists_${i});\n` +
      `            for(int L=0; L<num_lists_${i}; ++L) {\n` +
      `                int n_L; cin>>n_L;\n` +
      `                ListNode dummy(0); ListNode* cur = &dummy;\n` +
      `                for(int k=0; k<n_L; ++k) { int val; cin>>val; cur->next = new ListNode(val); cur = cur->next; }\n` +
      `                ${v}[L] = dummy.next;\n` +
      `            }\n`,

    'ListNode*:cycle': (v, i) =>
      `            int n_${i}; if(!(cin>>n_${i}))break;\n` +
      `            ListNode* ${v}=nullptr; int pos_${i}=-1;\n` +
      `            {vector<int> arr_${i}(n_${i});\n` +
      `            for(int k=0;k<n_${i};++k)cin>>arr_${i}[k];\n` +
      `            cin>>pos_${i};\n` +
      `            if(n_${i}>0){vector<ListNode*> nodes_${i};\n` +
      `            for(int k=0;k<n_${i};++k)nodes_${i}.push_back(new ListNode(arr_${i}[k]));\n` +
      `            for(int k=0;k<n_${i}-1;++k)nodes_${i}[k]->next=nodes_${i}[k+1];\n` +
      `            if(pos_${i}>=0&&pos_${i}<n_${i})nodes_${i}[n_${i}-1]->next=nodes_${i}[pos_${i}];\n` +
      `            ${v}=nodes_${i}[0];}}\n`,

    'TreeNode*': (v, i, ctx) => {
      ctx.treeRootVar = v;
      return (
        `            int n_${i}; if(!(cin>>n_${i}))break;\n` +
        `            TreeNode* ${v}=nullptr;\n` +
        `            {vector<int> arr_${i}(n_${i});\n` +
        `            for(int k=0;k<n_${i};++k)cin>>arr_${i}[k];\n` +
        `            if(n_${i}>0&&arr_${i}[0]!=-1){\n` +
        `              ${v}=new TreeNode(arr_${i}[0]);\n` +
        `              queue<TreeNode*> bq_${i};bq_${i}.push(${v});int idx_${i}=1;\n` +
        `              while(!bq_${i}.empty()&&idx_${i}<n_${i}){\n` +
        `                TreeNode* nd=bq_${i}.front();bq_${i}.pop();\n` +
        `                if(idx_${i}<n_${i}&&arr_${i}[idx_${i}]!=-1){nd->left=new TreeNode(arr_${i}[idx_${i}]);bq_${i}.push(nd->left);}idx_${i}++;\n` +
        `                if(idx_${i}<n_${i}&&arr_${i}[idx_${i}]!=-1){nd->right=new TreeNode(arr_${i}[idx_${i}]);bq_${i}.push(nd->right);}idx_${i}++;\n` +
        `              }\n` +
        `            }}\n`
      );
    },

    'TreeNode*->val': (v, i, ctx) => {
      const root = ctx.treeRootVar || 'nullptr';
      return (
        `            int ${v}_val; if(!(cin>>${v}_val))break;\n` +
        `            TreeNode* ${v}=nullptr;\n` +
        `            {queue<TreeNode*> fq;if(${root})fq.push(${root});\n` +
        `            while(!fq.empty()){TreeNode* fn=fq.front();fq.pop();\n` +
        `            if(fn->val==${v}_val){${v}=fn;break;}\n` +
        `            if(fn->left)fq.push(fn->left);if(fn->right)fq.push(fn->right);}}\n`
      );
    },

    'Node*': (v, i, ctx) => {
      ctx.needsNodeStruct = true;
      return (
        `            int n_${i}; if(!(cin>>n_${i}))break;\n` +
        `            Node* ${v}=nullptr;\n` +
        `            {if(n_${i}>0){\n` +
        `              vector<Node*> nodes_${i};\n` +
        `              for(int k=0;k<n_${i};++k)nodes_${i}.push_back(new Node(k+1));\n` +
        `              for(int k=0;k<n_${i};++k){int deg;cin>>deg;\n` +
        `                for(int j=0;j<deg;++j){int nb;cin>>nb;nodes_${i}[k]->neighbors.push_back(nodes_${i}[nb-1]);}}\n` +
        `              ${v}=nodes_${i}[0];}}\n`
      );
    },

  };

  const CPP_RETURN_HANDLERS = {
    'void': (fn, call, params) => {
      const fp = params[0]; const fa = 'param_0';
      let print = `            cout<<1<<endl;\n`;
      if (fp && fp.type === 'vector<int>') {
        print =
          `            for(int i=0;i<(int)${fa}.size();++i)cout<<${fa}[i]<<(i==(int)${fa}.size()-1?"":" ");\n` +
          `            cout<<endl;\n`;
      } else if (fp && (fp.type === 'vector<vector<int>>' || fp.type === 'vector<vector<char>>')) {
        print =
          `            for(int r=0;r<(int)${fa}.size();++r){for(int c=0;c<(int)${fa}[r].size();++c)cout<<(int)${fa}[r][c]<<(c==(int)${fa}[r].size()-1?"":" ");cout<<endl;}\n`;
      } else if (fp && fp.type === 'vector<char>') {
        print =
          `            for(int i=0;i<(int)${fa}.size();++i)cout<<(int)${fa}[i]<<(i==(int)${fa}.size()-1?"":" ");\n` +
          `            cout<<endl;\n`;
      }
      return `            ${call};\n` + print;
    },

    'void:board': (fn, call) => `            ${call};\n            cout<<1<<endl;\n`,
    'bool': (fn, call) => `            bool res=${call};\n            cout<<(res?"1":"0")<<endl;\n`,
    'int': (fn, call) => `            int res=${call};\n            cout<<res<<endl;\n`,
    'double': (fn, call) => `            double res=${call};\n            cout<<fixed<<setprecision(5)<<res<<endl;\n`,
    'string': (fn, call) => `            string res=${call};\n            cout<<res<<endl;\n`,
    'vector<int>': (fn, call) => `            vector<int> res=${call};\n            for(int i=0;i<(int)res.size();++i)cout<<res[i]<<(i==(int)res.size()-1?"":" ");\n            cout<<endl;\n`,
    'vector<string>': (fn, call) => `            vector<string> res=${call};\n            for(int i=0;i<(int)res.size();++i)cout<<res[i]<<endl;\n`,
    'vector<vector<int>>': (fn, call) => `            vector<vector<int>> res=${call};\n            for(int i=0;i<(int)res.size();++i){for(int j=0;j<(int)res[i].size();++j)cout<<res[i][j]<<(j==(int)res[i].size()-1?"":" ");cout<<endl;}\n`,
    'count:vector<int>': (fn, call) => `            vector<int> res=${call};\n            cout<<(int)res.size()<<endl;\n`,
    'count:vector<vector<int>>': (fn, call) => `            vector<vector<int>> res=${call};\n            cout<<(int)res.size()<<endl;\n`,
    'count:vector<string>': (fn, call) => `            vector<string> res=${call};\n            cout<<(int)res.size()<<endl;\n`,
    'count:vector<vector<string>>': (fn, call) => `            vector<vector<string>> res=${call};\n            cout<<(int)res.size()<<endl;\n`,
    'ListNode*': (fn, call) => `            ListNode* res=${call};\n            {bool first=true;ListNode* cur=res;while(cur){if(!first)cout<<" ";cout<<cur->val;cur=cur->next;first=false;}cout<<endl;}\n`,
    'ListNode*->val': (fn, call) => `            ListNode* res=${call};\n            cout<<(res?res->val:-1)<<endl;\n`,
    'TreeNode*': (fn, call) => `            TreeNode* res=${call};\n            {if(!res){cout<<endl;}else{queue<TreeNode*> bq;bq.push(res);bool first=true;while(!bq.empty()){TreeNode* nd=bq.front();bq.pop();if(!first)cout<<" ";cout<<nd->val;first=false;if(nd->left)bq.push(nd->left);if(nd->right)bq.push(nd->right);}cout<<endl;}}\n`,
    'TreeNode*:raw': (fn, call) => `            TreeNode* res=${call};\n            {if(!res){cout<<endl;}else{queue<TreeNode*> bq;bq.push(res);bool first=true;while(!bq.empty()){TreeNode* nd=bq.front();bq.pop();if(!first)cout<<" ";cout<<nd->val;first=false;if(nd->left)bq.push(nd->left);if(nd->right)bq.push(nd->right);}cout<<endl;}}\n`,
    'TreeNode*->val': (fn, call) => `            TreeNode* res=${call};\n            cout<<(res?res->val:-1)<<endl;\n`,
    'count:TreeNode*': (fn, call) => `            TreeNode* res=${call};\n            {int cnt=0;queue<TreeNode*> cq;if(res)cq.push(res);while(!cq.empty()){TreeNode* nd=cq.front();cq.pop();cnt++;if(nd->left)cq.push(nd->left);if(nd->right)cq.push(nd->right);}cout<<cnt<<endl;}\n`,
    'int:cloneGraph': (fn, call) => `            Node* cloned=${call};\n            {if(!cloned){cout<<0<<endl;}else{\n              unordered_set<Node*> visited;\n              queue<Node*> bq;bq.push(cloned);\n              while(!bq.empty()){Node* nd=bq.front();bq.pop();\n              if(visited.count(nd))continue;visited.insert(nd);\n              for(Node* nb:nd->neighbors)bq.push(nb);}\n              cout<<(int)visited.size()<<endl;}}\n`,

    // Class Design Object Drivers
    'design:MinStack': (fn, call, params) => `            for(int x : param_0) solver.push(x);\n            cout << solver.getMin() << endl;\n`,
    'design:MyQueue': (fn, call, params) => `            for(int x : param_0) solver.push(x);\n            cout << solver.peek() << endl;\n`,
    'design:MyCircularQueue': (fn, call, params) => `            for(int x : param_0) solver.enQueue(x);\n            cout << solver.Rear() << endl;\n`,
    'design:MedianFinder': (fn, call, params) => `            for(int x : param_0) solver.addNum(x);\n            cout << fixed << setprecision(1) << solver.findMedian() << endl;\n`,
    'design:Codec': (fn, call, params) => `            string enc = solver.encode(param_0);\n            vector<string> dec = solver.decode(enc);\n            cout << dec.size() << endl;\n`,
    'design:CodecTree': (fn, call, params) => `            string enc = solver.serialize(param_0);\n            TreeNode* dec = solver.deserialize(enc);\n            int cnt=0;queue<TreeNode*> cq;if(dec)cq.push(dec);while(!cq.empty()){TreeNode* nd=cq.front();cq.pop();cnt++;if(nd->left)cq.push(nd->left);if(nd->right)cq.push(nd->right);}cout<<cnt<<endl;\n`,
  };

  const JAVA_PARAM_HANDLERS = {
    'int': (v) => `            if(!sc.hasNextInt())break;\n            int ${v}=sc.nextInt();\n`,
    'bool': (v) => `            if(!sc.hasNextInt())break;\n            boolean ${v}=(sc.nextInt()!=0);\n`,
    'double': (v) => `            if(!sc.hasNextDouble())break;\n            double ${v}=sc.nextDouble();\n`,
    'string': (v) => `            if(!sc.hasNext())break;\n            String ${v}=sc.next(); if(${v}.equals("@@EMPTY@@"))${v}="";\n`,
    'string:line': (v) => `            if(!sc.hasNext())break;\n            String ${v}=sc.next(); if(${v}.equals("@@EMPTY@@")){${v}="";} else { ${v}=${v}.replace('_',' '); }\n`,
    'vector<char>': (v, i) =>
      `            if(!sc.hasNextInt())break;\n` +
      `            int n_${i}=sc.nextInt();\n` +
      `            char[] ${v}=new char[n_${i}];\n` +
      `            for(int k=0;k<n_${i};k++)${v}[k]=(char)sc.nextInt();\n`,
    'vector<int>': (v, i) =>
      `            if(!sc.hasNextInt())break;\n` +
      `            int n_${i}=sc.nextInt();\n` +
      `            int[] ${v}=new int[n_${i}];\n` +
      `            for(int k=0;k<n_${i};k++)${v}[k]=sc.nextInt();\n`,
    'vector<string>': (v, i) =>
      `            if(!sc.hasNextInt())break;\n` +
      `            int n_${i}=sc.nextInt();\n` +
      `            String[] ${v}=new String[n_${i}];\n` +
      `            for(int k=0;k<n_${i};k++){${v}[k]=sc.next(); if(${v}[k].equals("@@EMPTY@@"))${v}[k]="";}\n`,
    'vector<vector<int>>': (v, i) =>
      `            if(!sc.hasNextInt())break;\n` +
      `            int rows_${i}=sc.nextInt(),cols_${i}=sc.nextInt();\n` +
      `            int[][] ${v}=new int[rows_${i}][cols_${i}];\n` +
      `            for(int r=0;r<rows_${i};r++)for(int c=0;c<cols_${i};c++)${v}[r][c]=sc.nextInt();\n`,
    'vector<ListNode*>': (v, i) =>
      `            if(!sc.hasNextInt())break;\n` +
      `            int num_lists_${i}=sc.nextInt();\n` +
      `            ListNode[] ${v}=new ListNode[num_lists_${i}];\n` +
      `            for(int L=0; L<num_lists_${i}; L++) {\n` +
      `                int n_L = sc.nextInt();\n` +
      `                ListNode dummy = new ListNode(0); ListNode cur = dummy;\n` +
      `                for(int k=0; k<n_L; k++) { cur.next = new ListNode(sc.nextInt()); cur = cur.next; }\n` +
      `                ${v}[L] = dummy.next;\n` +
      `            }\n`,
  };

  const JAVA_RETURN_HANDLERS = {
    'void': (fn, call, params) => {
      const fp = params[0]; const fa = 'param_0';
      let print = `            System.out.println(1);\n`;
      if (fp && fp.type === 'vector<int>') {
        print = `            for(int i=0;i<${fa}.length;i++)System.out.print(${fa}[i]+(i==${fa}.length-1?"":" "));\n            System.out.println();\n`;
      }
      return `            ${call};\n` + print;
    },
    'bool': (fn, call) => `            boolean res=${call};\n            System.out.println(res?"1":"0");\n`,
    'int': (fn, call) => `            int res=${call};\n            System.out.println(res);\n`,
    'double': (fn, call) => `            double res=${call};\n            System.out.printf("%.5f%n",res);\n`,
    'string': (fn, call) => `            String res=${call};\n            System.out.println(res);\n`,
    'vector<int>': (fn, call) => `            int[] res=${call};\n            for(int i=0;i<res.length;i++)System.out.print(res[i]+(i==res.length-1?"":" "));\n            System.out.println();\n`,
    'count:vector<vector<int>>': (fn, call) => `            java.util.List<java.util.List<Integer>> res=${call};\n            System.out.println(res.size());\n`,
    'count:vector<vector<string>>': (fn, call) => `            java.util.List<java.util.List<String>> res=${call};\n            System.out.println(res.size());\n`,
    'count:vector<string>': (fn, call) => `            java.util.List<String> res=${call};\n            System.out.println(res.size());\n`,

    // Class Design Object Drivers
    'design:MinStack': (fn, call, params) => `            for(int x : param_0) solver.push(x);\n            System.out.println(solver.getMin());\n`,
    'design:MyQueue': (fn, call, params) => `            for(int x : param_0) solver.push(x);\n            System.out.println(solver.peek());\n`,
    'design:MyCircularQueue': (fn, call, params) => `            for(int x : param_0) solver.enQueue(x);\n            System.out.println(solver.Rear());\n`,
    'design:MedianFinder': (fn, call, params) => `            for(int x : param_0) solver.addNum(x);\n            System.out.printf(java.util.Locale.US, "%.1f%n", solver.findMedian());\n`,
    'design:Codec': (fn, call, params) => `            String enc = solver.encode(java.util.Arrays.asList(param_0));\n            java.util.List<String> dec = solver.decode(enc);\n            System.out.println(dec.size());\n`,
    'design:CodecTree': (fn, call, params) => `            String enc = solver.serialize(param_0);\n            TreeNode dec = solver.deserialize(enc);\n            int cnt=0; java.util.Queue<TreeNode> cq = new java.util.LinkedList<>(); if(dec!=null)cq.add(dec); while(!cq.isEmpty()){TreeNode nd=cq.poll(); cnt++; if(nd.left!=null)cq.add(nd.left); if(nd.right!=null)cq.add(nd.right);} System.out.println(cnt);\n`,
  };

  const PY_PARAM_HANDLERS = {
    'int': (v) => `            ${v}=int(next(iterator))\n`,
    'bool': (v) => `            ${v}=(int(next(iterator))!=0)\n`,
    'double': (v) => `            ${v}=float(next(iterator))\n`,
    'string': (v) => `            ${v}=next(iterator); ${v}="" if ${v}=="@@EMPTY@@" else ${v}\n`,
    'string:line': (v) => `            ${v}=next(iterator); ${v}="" if ${v}=="@@EMPTY@@" else ${v}.replace('_',' ')\n`,
    'vector<char>': (v, i) =>
      `            n_${i}=int(next(iterator))\n` +
      `            ${v}=[chr(int(next(iterator))) for _ in range(n_${i})]\n`,
    'vector<int>': (v, i) =>
      `            n_${i}=int(next(iterator))\n` +
      `            ${v}=[int(next(iterator)) for _ in range(n_${i})]\n`,
    'vector<string>': (v, i) =>
      `            n_${i}=int(next(iterator))\n` +
      `            ${v}=[(lambda s: "" if s=="@@EMPTY@@" else s)(next(iterator)) for _ in range(n_${i})]\n`,
    'vector<vector<int>>': (v, i) =>
      `            rows_${i}=int(next(iterator));cols_${i}=int(next(iterator))\n` +
      `            ${v}=[[int(next(iterator)) for _ in range(cols_${i})] for _ in range(rows_${i})]\n`,
    'vector<ListNode*>': (v, i) =>
      `            num_lists_${i}=int(next(iterator))\n` +
      `            ${v}=[]\n` +
      `            for _ in range(num_lists_${i}):\n` +
      `                n_L = int(next(iterator))\n` +
      `                dummy = ListNode(0); cur = dummy\n` +
      `                for _ in range(n_L): cur.next = ListNode(int(next(iterator))); cur = cur.next\n` +
      `                ${v}.append(dummy.next)\n`,
  };

  const PY_RETURN_HANDLERS = {
    'void': (fn, call, params) => {
      const fp = params[0]; const fa = 'param_0';
      let print = `            print(1)\n`;
      if (fp && fp.type === 'vector<int>') {
        print = `            print(" ".join(map(str,${fa})))\n`;
      }
      return `            ${call}\n` + print;
    },
    'bool': (fn, call) => `            res=${call}\n            print("1" if res else "0")\n`,
    'int': (fn, call) => `            res=${call}\n            print(res)\n`,
    'double': (fn, call) => `            res=${call}\n            print(f"{res:.5f}")\n`,
    'string': (fn, call) => `            res=${call}\n            print(res)\n`,
    'vector<int>': (fn, call) => `            res=${call}\n            print(" ".join(map(str,res)))\n`,
    'count:vector<vector<int>>': (fn, call) => `            res=${call}\n            print(len(res))\n`,
    'count:vector<vector<string>>': (fn, call) => `            res=${call}\n            print(len(res))\n`,
    'count:vector<string>': (fn, call) => `            res=${call}\n            print(len(res))\n`,

    // Class Design Object Drivers
    'design:MinStack': (fn, call, params) => `            for x in param_0: solver.push(x)\n            print(solver.getMin())\n`,
    'design:MyQueue': (fn, call, params) => `            for x in param_0: solver.push(x)\n            print(solver.peek())\n`,
    'design:MyCircularQueue': (fn, call, params) => `            for x in param_0: solver.enQueue(x)\n            print(solver.Rear())\n`,
    'design:MedianFinder': (fn, call, params) => `            for x in param_0: solver.addNum(x)\n            print(f"{solver.findMedian():.1f}")\n`,
    'design:Codec': (fn, call, params) => `            enc = solver.encode(param_0)\n            dec = solver.decode(enc)\n            print(len(dec))\n`,
    'design:CodecTree': (fn, call, params) => `            enc = solver.serialize(param_0)\n            dec = solver.deserialize(enc)\n            cnt=0; cq=[]; \n            if dec: cq.append(dec)\n            while cq: \n                nd=cq.pop(0); cnt+=1\n                if nd.left: cq.append(nd.left)\n                if nd.right: cq.append(nd.right)\n            print(cnt)\n`,
  };

  const JS_PARAM_HANDLERS = {
    'int': (v) => `        const ${v}=parseInt(tokens[idx++],10);\n`,
    'bool': (v) => `        const ${v}=(parseInt(tokens[idx++],10)!==0);\n`,
    'double': (v) => `        const ${v}=parseFloat(tokens[idx++]);\n`,
    'string': (v) => `        let ${v}=tokens[idx++]; if(${v}==='@@EMPTY@@')${v}='';\n`,
    'string:line': (v) => `        let ${v}=tokens[idx++]; ${v}=(${v}==='@@EMPTY@@')?'':${v}.replace(/_/g,' ');\n`,
    'vector<char>': (v, i) =>
      `        const n_${i}=parseInt(tokens[idx++],10);\n` +
      `        const ${v}=[];\n` +
      `        for(let k=0;k<n_${i};k++)${v}.push(String.fromCharCode(parseInt(tokens[idx++],10)));\n`,
    'vector<int>': (v, i) =>
      `        const n_${i}=parseInt(tokens[idx++],10);\n` +
      `        const ${v}=[];\n` +
      `        for(let k=0;k<n_${i};k++)${v}.push(parseInt(tokens[idx++],10));\n`,
    'vector<string>': (v, i) =>
      `        const n_${i}=parseInt(tokens[idx++],10);\n` +
      `        const ${v}=[];\n` +
      `        for(let k=0;k<n_${i};k++){let __t=tokens[idx++]; ${v}.push(__t==='@@EMPTY@@'?'':__t);}\n`,
    'vector<vector<int>>': (v, i) =>
      `        const rows_${i}=parseInt(tokens[idx++],10),cols_${i}=parseInt(tokens[idx++],10);\n` +
      `        const ${v}=[];\n` +
      `        for(let r=0;r<rows_${i};r++){${v}.push([]);for(let c=0;c<cols_${i};c++)${v}[r].push(parseInt(tokens[idx++],10));}\n`,
    'vector<ListNode*>': (v, i) =>
      `        const num_lists_${i}=parseInt(tokens[idx++],10);\n` +
      `        const ${v}=[];\n` +
      `        for(let L=0; L<num_lists_${i}; L++) {\n` +
      `            const n_L = parseInt(tokens[idx++],10);\n` +
      `            const dummy = new ListNode(0); let cur = dummy;\n` +
      `            for(let k=0; k<n_L; k++) { cur.next = new ListNode(parseInt(tokens[idx++],10)); cur = cur.next; }\n` +
      `            ${v}.push(dummy.next);\n` +
      `        }\n`,
  };

  const JS_RETURN_HANDLERS = {
    'void': (fn, call, params) => {
      const fp = params[0]; const fa = 'param_0';
      let print = `        console.log(1);\n`;
      if (fp && fp.type === 'vector<int>') {
        print = `        console.log(${fa}.join(" "));\n`;
      }
      return `        ${call};\n` + print;
    },
    'bool': (fn, call) => `        const res=${call};\n        console.log(res?"1":"0");\n`,
    'int': (fn, call) => `        const res=${call};\n        console.log(res);\n`,
    'double': (fn, call) => `        const res=${call};\n        console.log(res.toFixed(5));\n`,
    'string': (fn, call) => `        const res=${call};\n        console.log(res);\n`,
    'vector<int>': (fn, call) => `        const res=${call};\n        console.log(res.join(" "));\n`,
    'count:vector<vector<int>>': (fn, call) => `        const res=${call};\n        console.log(res.length);\n`,
    'count:vector<vector<string>>': (fn, call) => `        const res=${call};\n        console.log(res.length);\n`,
    'count:vector<string>': (fn, call) => `        const res=${call};\n        console.log(res.length);\n`,

    // Class Design Object Drivers
    'design:MinStack': (fn, call, params) => `        for(let x of param_0) solver.push(x);\n        console.log(solver.getMin());\n`,
    'design:MyQueue': (fn, call, params) => `        for(let x of param_0) solver.push(x);\n        console.log(solver.peek());\n`,
    'design:MyCircularQueue': (fn, call, params) => `        for(let x of param_0) solver.enQueue(x);\n        console.log(solver.Rear());\n`,
    'design:MedianFinder': (fn, call, params) => `        for(let x of param_0) solver.addNum(x);\n        console.log(solver.findMedian().toFixed(1));\n`,
    'design:Codec': (fn, call, params) => `        const enc = solver.encode(param_0);\n        const dec = solver.decode(enc);\n        console.log(dec.length);\n`,
    'design:CodecTree': (fn, call, params) => `        const enc = solver.serialize(param_0);\n        const dec = solver.deserialize(enc);\n        let cnt=0; const cq=[]; if(dec)cq.push(dec); while(cq.length>0){const nd=cq.shift(); cnt++; if(nd.left)cq.push(nd.left); if(nd.right)cq.push(nd.right);} console.log(cnt);\n`,
  };

  function _buildParams(params, handlers, ctx) {
    let code = '';
    const callArgs = [];
    params.forEach((p, i) => {
      const varName = `param_${i}`;
      callArgs.push(varName);
      const handler = handlers[p.type];
      if (handler) {
        code += handler(varName, i, ctx);
      }
    });
    return { code, callArgs };
  }

  function _buildReturn(retType, handlers, funcName, callArgs, params) {
    const callExpr = `solver.${funcName}(${callArgs.join(', ')})`;
    const handler = handlers[retType];
    if (handler) return handler(funcName, callExpr, params);
    return `            // [unsupported returnType: ${retType}]\n`;
  }

  function generateDriverCode(q, userCode, lang) {
    const params = q.parameters;
    const retType = q.returnType;
    const funcName = q.functionName;
    const className = q.className;

    const getArgs = () => q.constructorArgs ? q.constructorArgs.map(i => `param_${i}`).join(', ') : '';

    if (lang === 'cpp') {
      const ctx = { treeRootVar: null, needsNodeStruct: false };
      const { code: paramReadCode, callArgs } = _buildParams(params, CPP_PARAM_HANDLERS, ctx);
      const printCode = _buildReturn(retType, CPP_RETURN_HANDLERS, funcName, callArgs, params);
      const nodeStruct = ctx.needsNodeStruct ? '\n' + CPP_GRAPH_NODE : '';
      let solverDecl = className
        ? (q.constructorArgs ? `            ${className} solver(${getArgs()});\n` : `            ${className} solver;\n`)
        : `            Solution solver;\n`;

      return (
        CPP_HEADERS + '\n\n' + CPP_LIST_NODE + '\n\n' + CPP_TREE_NODE + '\n' + nodeStruct + '\n' + userCode + '\n\n' +
        `int main() {\n` +
        `    ios_base::sync_with_stdio(false);\n` +
        `    cin.tie(NULL);\n` +
        `    int T;\n` +
        `    if(cin>>T){\n` +
        `        while(T--){\n` +
        paramReadCode +
        solverDecl +
        printCode +
        `            cout<<"---END_TC---"<<endl;\n` +
        `        }\n` +
        `    }\n` +
        `    return 0;\n` +
        `}`
      );
    }

    if (lang === 'java') {
      const ctx = {};
      const { code: paramReadCode, callArgs } = _buildParams(params, JAVA_PARAM_HANDLERS, ctx);
      const callExpr = `solver.${funcName}(${callArgs.join(', ')})`;
      const handler = JAVA_RETURN_HANDLERS[retType];
      const printCode = handler ? handler(funcName, callExpr, params) : `            // [unsupported returnType: ${retType}]\n`;
      let solverDecl = className
        ? (q.constructorArgs ? `                ${className} solver = new ${className}(${getArgs()});\n` : `                ${className} solver = new ${className}();\n`)
        : `                Solution solver = new Solution();\n`;

      return (
        `import java.util.*;\nimport java.io.*;\n\n` + userCode + '\n\n' +
        `public class Main {\n` +
        `    public static void main(String[] args) throws Exception {\n` +
        `        Scanner sc=new Scanner(System.in);\n` +
        `        if(sc.hasNextInt()){\n` +
        `            int T=sc.nextInt();\n` +
        `            while(T-->0){\n` +
        paramReadCode +
        solverDecl +
        printCode +
        `                System.out.println("---END_TC---");\n` +
        `            }\n` +
        `        }\n` +
        `    }\n` +
        `}`
      );
    }

    if (lang === 'python') {
      const ctx = {};
      const { code: paramReadCode, callArgs } = _buildParams(params, PY_PARAM_HANDLERS, ctx);
      const callExpr = `solver.${funcName}(${callArgs.join(', ')})`;
      const handler = PY_RETURN_HANDLERS[retType];
      const printCode = handler ? handler(funcName, callExpr, params) : `            # [unsupported returnType: ${retType}]\n`;
      let solverDecl = className
        ? (q.constructorArgs ? `            solver = ${className}(${getArgs()})\n` : `            solver = ${className}()\n`)
        : `            solver = Solution()\n`;

      return (
        `import sys\nfrom typing import List, Optional\n\n` + userCode + '\n\n' +
        `def main():\n` +
        `    input_data=sys.stdin.read().split()\n` +
        `    if not input_data:return\n` +
        `    iterator=iter(input_data)\n` +
        `    try:\n` +
        `        T=int(next(iterator))\n` +
        `    except StopIteration:return\n` +
        `    for _ in range(T):\n` +
        `        try:\n` +
        paramReadCode +
        solverDecl +
        printCode +
        `            print("---END_TC---")\n` +
        `        except StopIteration:break\n\n` +
        `if __name__=='__main__':main()`
      );
    }

    if (lang === 'js') {
      const ctx = {};
      const { code: paramReadCode, callArgs } = _buildParams(params, JS_PARAM_HANDLERS, ctx);
      const callExpr = `solver.${funcName}(${callArgs.join(', ')})`;
      const handler = JS_RETURN_HANDLERS[retType];
      const printCode = handler ? handler(funcName, callExpr, params) : `        // [unsupported returnType: ${retType}]\n`;
      let solverDecl = className
        ? (q.constructorArgs ? `        const solver = new ${className}(${getArgs()});\n` : `        const solver = new ${className}();\n`)
        : `        const solver = typeof Solution !== 'undefined' ? new Solution() : { ${funcName} };\n`;

      return (
        `const fs=require('fs');\n\n` + userCode + '\n\n' +
        `function main(){\n` +
        `    const input=fs.readFileSync(0,'utf-8');\n` +
        `    const tokens=input.trim().split(/\\s+/);\n` +
        `    if(!tokens.length||tokens[0]==="")return;\n` +
        `    let idx=0;\n` +
        `    const T=parseInt(tokens[idx++],10);\n` +
        `    for(let t=0;t<T;t++){\n` +
        `        if(idx>=tokens.length)break;\n` +
        paramReadCode +
        solverDecl +
        printCode +
        `        console.log("---END_TC---");\n` +
        `    }\n` +
        `}\n\nmain();`
      );
    }

    return userCode;
  }

  function normalizeAndCompare(actual, expected, compareMode = 'ordered') {
    if (actual === undefined || actual === null) return false;
    if (expected === undefined || expected === null) return false;

    const normActual = actual.toString().replace(/\s+/g, ' ').trim();
    const normExpected = expected.toString().replace(/\s+/g, ' ').trim();

    let res = false;

    if (compareMode === 'unordered') {
      const parseAllIntegers = (str) => {
        if (str === undefined || str === null) return [];
        const matches = str.toString().match(/-?\d+/g);
        if (!matches) return [];
        return matches.map(x => parseInt(x, 10));
      };
      const aArr = parseAllIntegers(normActual);
      const eArr = parseAllIntegers(normExpected);
      aArr.sort((a, b) => a - b);
      eArr.sort((a, b) => a - b);
      if (aArr.length === eArr.length) {
        res = aArr.every((val, i) => val === eArr[i]);
      }
    } else if (compareMode === 'any_of') {
      const validExpected = normExpected.split('|').map(s => s.trim());
      res = validExpected.includes(normActual);
    } else if (compareMode === 'float') {
      const aNum = parseFloat(normActual);
      const eNum = parseFloat(normExpected);
      res = !isNaN(aNum) && !isNaN(eNum) && Math.abs(aNum - eNum) < 1e-4;
    } else {
      res = (normActual === normExpected);
    }

    return res;
  }

  function renderDsaResults(statusId, stdout, stderr, compileOutput, time, memory, activeTests, passedInCompareMode) {
    const verdictBanner = document.getElementById('dsa-status-banner');
    const tabsContainer = document.getElementById('dsa-testcase-tabs');
    const contentContainer = document.getElementById('dsa-testcase-content');
    const execTimeEl = document.getElementById('dsa-exec-time');
    const execMemEl = document.getElementById('dsa-exec-memory');

    if (!verdictBanner || !tabsContainer || !contentContainer) {
      return;
    }

    tabsContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    const category = getErrorCategory(statusId, STATUSES[statusId]?.label, stderr || compileOutput);

    let outputLines = stdout ? stdout.split('---END_TC---') : [];
    outputLines = outputLines.map(line => line.trim());
    if (outputLines.length > 0 && outputLines[outputLines.length - 1] === "") {
      outputLines.pop();
    }

    const isDsaPage = window.App?.currentPage === 'dsa-compiler';
    const currentQ = window.App?.currentQuestion;
    let qMeta = currentQ ? window.QUESTION_METADATA_REGISTRY[currentQ.id] : null;
    if (qMeta && currentQ && qMeta.name !== currentQ.name) {
      for (const key in window.QUESTION_METADATA_REGISTRY) {
        if (window.QUESTION_METADATA_REGISTRY[key].name === currentQ.name) {
          qMeta = window.QUESTION_METADATA_REGISTRY[key];
          break;
        }
      }
    }
    const isDsaMode = isDsaPage && window.App?.dsaCompilerMode === 'dsa' && !!qMeta;

    let passedCount = 0;
    const tcResults = activeTests.map((tc, idx) => {
      const actualRaw = isDsaMode ? (outputLines[idx] || '') : (stdout || '');
      const compareMode = passedInCompareMode || ((isDsaMode && qMeta) ? (qMeta.compareMode || 'ordered') : 'ordered');
      const isPassed = statusId === 3 && normalizeAndCompare(actualRaw, tc.expectedRaw, compareMode);
      if (isPassed) passedCount++;

      return {
        index: idx + 1,
        input: tc.input,
        expected: tc.expected,
        expectedRaw: tc.expectedRaw,
        actual: actualRaw,
        isPassed,
        status: isPassed ? 'Passed' : (statusId === 3 ? 'Wrong Answer' : STATUSES[statusId]?.label || 'Error')
      };
    });

    const allPassed = passedCount === activeTests.length && statusId === 3;
    const finalCategory = allPassed ? 'Accepted' : (statusId === 3 ? 'Wrong Answer' : category);

    verdictBanner.className = 'verdict-banner show';
    if (allPassed) {
      verdictBanner.className += ' accepted';
      verdictBanner.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;">' +
        '<i class="fas fa-check-circle"></i>' +
        '<span>Accepted</span>' +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--text-secondary);margin-top:4px;">' + passedCount + ' / ' + activeTests.length + ' test cases passed</div>';
    } else if (finalCategory === 'Wrong Answer') {
      verdictBanner.className += ' wrong';
      verdictBanner.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;">' +
        '<i class="fas fa-times-circle"></i>' +
        '<span>Wrong Answer</span>' +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--text-secondary);margin-top:4px;">' + passedCount + ' / ' + activeTests.length + ' test cases passed</div>';
    } else {
      verdictBanner.className += ' error';
      var errMsg = (stderr || compileOutput || 'An execution error occurred.').substring(0, 200);
      verdictBanner.innerHTML =
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;">' +
        '<i class="fas fa-exclamation-triangle"></i>' +
        '<span>' + finalCategory + '</span>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--text-secondary);margin-top:4px;word-break:break-all;">' + errMsg + '</div>';
    }

    if (execTimeEl) execTimeEl.textContent = time || '--';
    if (execMemEl) execMemEl.textContent = memory || '--';

    tcResults.forEach(function (res, idx) {
      var tabBtn = document.createElement('button');
      tabBtn.className = 'dsa-tab-btn ' + (res.isPassed ? 'passed' : 'failed') + (idx === 0 ? ' active' : '');
      tabBtn.innerHTML = '<i class="fas ' + (res.isPassed ? 'fa-check-circle' : 'fa-times-circle') + '"></i> Case ' + res.index;
      tabBtn.onclick = (function (r) {
        return function () {
          document.querySelectorAll('.dsa-tab-btn').forEach(function (btn) { btn.classList.remove('active'); });
          tabBtn.classList.add('active');
          showDsaTestCaseDetail(r);
        };
      })(res);
      tabsContainer.appendChild(tabBtn);
    });

    if (tcResults.length > 0) {
      showDsaTestCaseDetail(tcResults[0]);
    } else {
      contentContainer.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px 0;">No test cases evaluated.</div>';
    }

    if (window.App && window.App.currentQuestion) {
      updateExecutionHistory(window.App.currentQuestion.id, finalCategory, _isSubmit);
    }

    if (allPassed && _isSubmit) {
      _autoMarkSolved();
    }
  }

  function showDsaTestCaseDetail(res) {
    var contentContainer = document.getElementById('dsa-testcase-content');
    if (!contentContainer) return;
    var isMatch = res.isPassed;
    contentContainer.innerHTML =
      '<div class="dsa-testcase-line">' +
      '<label>Input</label>' +
      '<pre>' + res.input + '</pre>' +
      '</div>' +
      '<div class="dsa-testcase-line">' +
      '<label>Expected Output</label>' +
      '<pre class="match">' + res.expected + '</pre>' +
      '</div>' +
      '<div class="dsa-testcase-line">' +
      '<label>Actual Output</label>' +
      '<pre class="' + (isMatch ? 'match' : 'mismatch') + '">' + (res.actual || '(no output)') + '</pre>' +
      '</div>' +
      '<div class="dsa-testcase-line">' +
      '<label>Status</label>' +
      '<span style="font-weight:600;font-size:12px;color:' + (isMatch ? 'var(--accent-green)' : 'var(--accent-red)') + '">' + res.status + '</span>' +
      '</div>';
  }

  return {
    init,
    run,
    submit,
    updateStatus,
    LANGUAGE_IDS,
    STATUSES,
    resetState,
    renderHistory,
    stopExecution,
  };

})();

window.Compiler = Compiler;