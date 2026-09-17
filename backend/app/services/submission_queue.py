"""
submission_queue.py — Async Submission Job Manager

Architecture:
  POST /api/submissions (submit) -> create_job() -> asyncio.Queue
  Background worker -> queue.get() -> Judge0 -> Firestore -> job COMPLETED
  GET /api/submissions/{job_id} -> lookup job state

Design Decision (IMPORTANT):
  This is an **in-memory** queue backed by asyncio.Queue.
  If the FastAPI process restarts:
    - Queued jobs are LOST (never sent to Judge0).
    - Running jobs may be interrupted mid-execution.
    - Completed submissions already written to Firestore remain SAFE.
  This is an intentional design decision: we need ZERO external infrastructure
  (no Redis, no Celery, no RabbitMQ, no Postgres). Firestore is the permanent
  source of truth for submission history. The in-memory manager only tracks
  active and recently completed jobs.

Worker count:
  Defaults to SUBMISSION_WORKERS=1 (set in config.py / env var).
  Increase for higher concurrency; do NOT make unbounded.

Cleanup:
  Completed/failed jobs are purged after JOB_RETENTION_SECONDS (20 min).
  A periodic asyncio task runs cleanup every CLEANUP_INTERVAL_SECONDS (5 min).
"""

import asyncio
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ── Timing constants ──────────────────────────────────────────────────────────
JOB_RETENTION_SECONDS   = 20 * 60   # keep completed/failed jobs for 20 minutes
CLEANUP_INTERVAL_SECONDS = 5 * 60   # run cleanup task every 5 minutes


# ── Job states ────────────────────────────────────────────────────────────────

class JobStatus(str, Enum):
    QUEUED    = "queued"
    RUNNING   = "running"
    COMPLETED = "completed"
    FAILED    = "failed"


# ── Job dataclass ─────────────────────────────────────────────────────────────

@dataclass
class SubmissionJob:
    """
    Represents one async submission job.

    Only contains information required for processing.
    NEVER stores hidden test inputs or expected outputs —
    those are loaded server-side from test_cases.json by the worker.
    Source code is held transiently to pass to Judge0 and is never
    written to Firestore or returned to the frontend.
    """
    job_id:           str
    uid:              str            # Verified Firebase UID — never client-supplied
    question_id:      int
    language_id:      int
    execution_type:   str            # always "submit" for queued jobs
    source_code:      str            # transient; used by worker to call Judge0
    compiler_options: str = ""
    created_at:       float = field(default_factory=time.monotonic)
    status:           JobStatus = JobStatus.QUEUED

    # Populated after worker finishes (None while QUEUED/RUNNING)
    result: Optional[Dict[str, Any]] = None  # safe SubmissionResponse dict
    error:  Optional[str]            = None


# ── Submission Queue ──────────────────────────────────────────────────────────

class SubmissionQueue:
    """
    Central manager for async submission jobs.

    Responsibilities:
      - Maintain the asyncio.Queue of pending jobs.
      - Store job state in an in-memory dict keyed by job_id.
      - Enforce UID ownership so users can only read their own jobs.
      - Periodically clean up old completed/failed jobs.
    """

    def __init__(self) -> None:
        self._queue:        asyncio.Queue = asyncio.Queue()
        self._jobs:         Dict[str, SubmissionJob] = {}
        self._workers:      List[asyncio.Task] = []
        self._cleanup_task: Optional[asyncio.Task] = None

    # ── Job creation ──────────────────────────────────────────────────────────

    def create_job(
        self,
        uid: str,
        question_id: int,
        language_id: int,
        source_code: str,
        compiler_options: str = "",
    ) -> SubmissionJob:
        """
        Create a QUEUED job and place it on the asyncio queue.
        Rate limiting must happen BEFORE calling this method.
        Returns the job so the route handler can return job_id to the client.
        """
        job_id = str(uuid.uuid4())
        job = SubmissionJob(
            job_id=job_id,
            uid=uid,
            question_id=question_id,
            language_id=language_id,
            execution_type="submit",
            source_code=source_code,
            compiler_options=compiler_options,
        )
        self._jobs[job_id] = job
        self._queue.put_nowait(job)
        logger.info(
            "[SUBMISSION] job=%s uid=%.8s... status=QUEUED question=%s lang=%s",
            job_id, uid, question_id, language_id,
        )
        return job

    def get_job(self, job_id: str, uid: str) -> Optional[SubmissionJob]:
        """
        Look up a job by ID and verify UID ownership.

        Returns:
          SubmissionJob if found and owned by uid.
          None if job not found.
        Raises:
          PermissionError if job exists but belongs to a different uid.
        """
        job = self._jobs.get(job_id)
        if job is None:
            return None
        if job.uid != uid:
            # Do NOT reveal job existence to other users
            raise PermissionError(f"Job {job_id!r} not accessible to this user")
        return job

    # ── Internal state transitions ────────────────────────────────────────────

    def _mark_running(self, job: SubmissionJob) -> None:
        job.status = JobStatus.RUNNING
        logger.info("[SUBMISSION] job=%s status=RUNNING", job.job_id)

    def _mark_completed(self, job: SubmissionJob, result: Dict[str, Any]) -> None:
        job.result = result
        job.status = JobStatus.COMPLETED
        logger.info(
            "[SUBMISSION] job=%s status=COMPLETED verdict=%s",
            job.job_id, result.get("verdict", "?"),
        )

    def _mark_failed(self, job: SubmissionJob, error: str) -> None:
        job.error = error
        job.status = JobStatus.FAILED
        logger.error("[SUBMISSION] job=%s status=FAILED error=%s", job.job_id, error)

    # ── Background worker loop ────────────────────────────────────────────────

    async def _worker_loop(self, worker_id: int) -> None:
        """
        Main worker coroutine.  Runs indefinitely until cancelled (on shutdown).

        Dequeues one job at a time from the asyncio.Queue, executes it,
        writes results to Firestore, and marks it COMPLETED or FAILED.

        IMPORTANT: All synchronous Firestore Admin SDK calls are dispatched
        via asyncio.to_thread() so they do NOT block the event loop.
        """
        logger.info("[SUBMISSION] Worker %d started", worker_id)
        while True:
            job: SubmissionJob = await self._queue.get()
            try:
                await self._process_job(job)
            except asyncio.CancelledError:
                # Server is shutting down while processing a job.
                # Mark it FAILED so the polling client gets a definitive answer.
                if job.status == JobStatus.RUNNING:
                    self._mark_failed(job, "Worker was shut down during execution.")
                self._queue.task_done()
                raise  # re-raise so the task actually exits
            except Exception as exc:
                logger.exception(
                    "[SUBMISSION] Unhandled worker exception for job=%s", job.job_id
                )
                self._mark_failed(job, f"Internal worker error: {exc}")
            finally:
                self._queue.task_done()

    async def _process_job(self, job: SubmissionJob) -> None:
        """
        Execute one submit job end-to-end:
          1. Mark RUNNING
          2. Load test data (sample + hidden) from test_cases.json
          3. Build combined stdin
          4. Execute Judge0 (existing judge0_service.execute)
          5. Parse per-test-case outputs
          6. Calculate final verdict
          7. Write Firestore history (non-fatal)
          8. Update progress if Accepted (non-fatal)
          9. Mark COMPLETED with safe result dict
        """
        import re
        from app.services import judge0_service

        self._mark_running(job)
        logger.info(
            "[SUBMISSION] job=%s question=%s language=%s",
            job.job_id, job.question_id, job.language_id,
        )

        # ── Load test data ────────────────────────────────────────────────────
        # _get_question_test_data is synchronous (reads cached JSON);
        # run it in a thread to be safe and keep event loop free.
        q_data = await asyncio.to_thread(
            _get_question_test_data_sync, job.question_id
        )
        if q_data is None:
            self._mark_failed(
                job, f"Question {job.question_id} not found in test_cases.json"
            )
            return

        sample_tests: list = q_data.get("sampleTests", [])
        hidden_tests: list = q_data.get("hiddenTests", [])
        compare_mode: str  = q_data.get("compareMode", "ordered")
        n_sample           = len(sample_tests)
        active_tests       = sample_tests + hidden_tests  # NEVER sent to browser

        # ── Build combined stdin ──────────────────────────────────────────────
        combined_stdin = _build_stdin_sync(active_tests)

        # ── Execute Judge0 ────────────────────────────────────────────────────
        # judge0_service.execute is already async (uses httpx).
        try:
            result = await judge0_service.execute(
                source_code=job.source_code,
                language_id=job.language_id,
                stdin=combined_stdin,
                compiler_options=job.compiler_options,
            )
        except TimeoutError as exc:
            self._mark_failed(job, f"Judge0 timeout: {exc}")
            return
        except Exception as exc:
            self._mark_failed(job, f"Judge0 error: {exc}")
            return

        status_id: int = result["status_id"]
        stdout: str    = result["stdout"] or ""

        # ── Parse per-test-case outputs ───────────────────────────────────────
        output_lines: list = []
        if stdout:
            parts = stdout.split("---END_TC---")
            output_lines = [p.strip() for p in parts if p.strip()]

        passed_count = 0
        tc_results   = []

        for i, tc in enumerate(active_tests):
            actual_raw = output_lines[i] if i < len(output_lines) else ""
            is_hidden  = i >= n_sample

            passed = (
                status_id == 3
                and _compare_sync(actual_raw, tc.get("expectedRaw", ""), compare_mode)
            )
            if passed:
                passed_count += 1

            # Build SAFE tc dict — hidden test stdin/expectedRaw are NEVER included
            item: Dict[str, Any] = {
                "index":     i + 1,
                "passed":    passed,
                "actual":    actual_raw,
                "is_hidden": is_hidden,
            }
            if not is_hidden:
                item["input"]    = tc.get("input", "")
                item["expected"] = tc.get("expected", "")
            tc_results.append(item)

        # ── Determine final verdict ───────────────────────────────────────────
        all_passed = (passed_count == len(active_tests)) and (status_id == 3)
        if all_passed:
            final_verdict = "Accepted"
        elif status_id == 3:
            final_verdict = "Wrong Answer"
        else:
            final_verdict = result["verdict"]

        logger.info(
            "[SUBMISSION] job=%s verdict=%s passed=%d/%d",
            job.job_id, final_verdict, passed_count, len(active_tests),
        )

        _compile_err = result.get("compile_output") or result.get("stderr") or None

        # ── Write Firestore history (non-fatal) ───────────────────────────────
        # asyncio.to_thread dispatches the synchronous Firestore call to a
        # thread pool so the event loop remains unblocked.
        try:
            await asyncio.to_thread(
                _record_submission_sync,
                job.uid,
                job.question_id,
                final_verdict,
                status_id,
                job.language_id,
                passed_count,
                len(active_tests),
                _fmt_time(result["time"]),
                _fmt_memory(result["memory"]),
                _compile_err,
            )
        except Exception:
            logger.exception(
                "[SUBMISSION] Firestore history write failed for job=%s uid=%.8s...",
                job.job_id, job.uid,
            )
            # Non-fatal: execution result is still returned to the user

        # ── Update progress if Accepted (non-fatal) ───────────────────────────
        if all_passed:
            try:
                await asyncio.to_thread(
                    _update_progress_sync,
                    job.uid,
                    job.question_id,
                )
            except Exception:
                logger.exception(
                    "[SUBMISSION] Progress update failed for job=%s uid=%.8s...",
                    job.job_id, job.uid,
                )

        # ── Build safe result (no hidden test data) ───────────────────────────
        safe_result: Dict[str, Any] = {
            "verdict":        final_verdict,
            "status_id":      status_id,
            "runtime":        _fmt_time(result["time"]),
            "memory":         _fmt_memory(result["memory"]),
            "passed_count":   passed_count,
            "total_count":    len(active_tests),
            "compile_output": result.get("compile_output") or None,
            "stderr":         result.get("stderr") or None,
            "test_cases":     tc_results,  # hidden tc items have no input/expected
        }

        self._mark_completed(job, safe_result)

    # ── Worker lifecycle ──────────────────────────────────────────────────────

    def start_workers(self, count: int = 1) -> None:
        """
        Start `count` asyncio background worker tasks.
        Called from FastAPI lifespan on startup.
        """
        for i in range(count):
            task = asyncio.create_task(
                self._worker_loop(worker_id=i),
                name=f"submission-worker-{i}",
            )
            self._workers.append(task)
        self._cleanup_task = asyncio.create_task(
            self._periodic_cleanup(),
            name="submission-job-cleanup",
        )
        logger.info("[SUBMISSION] Started %d worker(s) + cleanup task", count)

    def stop_workers(self) -> None:
        """
        Cancel all worker tasks.
        Called from FastAPI lifespan on shutdown.
        """
        for task in self._workers:
            task.cancel()
        self._workers.clear()
        if self._cleanup_task:
            self._cleanup_task.cancel()
            self._cleanup_task = None
        logger.info("[SUBMISSION] All workers stopped")

    # ── Cleanup ───────────────────────────────────────────────────────────────

    async def _periodic_cleanup(self) -> None:
        """Periodic coroutine: prune old completed/failed jobs from _jobs dict."""
        while True:
            await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
            self._cleanup_now()

    def _cleanup_now(self) -> None:
        """Immediately remove expired completed/failed jobs."""
        cutoff = time.monotonic() - JOB_RETENTION_SECONDS
        expired = [
            jid
            for jid, job in self._jobs.items()
            if job.status in (JobStatus.COMPLETED, JobStatus.FAILED)
            and job.created_at < cutoff
        ]
        for jid in expired:
            del self._jobs[jid]
        if expired:
            logger.info("[SUBMISSION] Cleaned up %d expired job(s)", len(expired))

    # ── Debug helpers ─────────────────────────────────────────────────────────

    @property
    def queue_size(self) -> int:
        return self._queue.qsize()

    @property
    def job_count(self) -> int:
        return len(self._jobs)


# ── Module-level singleton ────────────────────────────────────────────────────

# One global instance per FastAPI process (single-worker uvicorn deployment).
submission_queue = SubmissionQueue()


# ── Pure helper functions (module-level for testability) ─────────────────────

def _get_question_test_data_sync(question_id: int):
    """
    Synchronous wrapper around the route-level test-data loader.
    Safe to call from asyncio.to_thread().
    """
    from app.routes.submissions import _get_question_test_data
    return _get_question_test_data(question_id)


def _build_stdin_sync(test_cases: list) -> str:
    """Build the combined stdin string in the same format as the route handler."""
    T = len(test_cases)
    parts = [str(T)]
    for tc in test_cases:
        tc_stdin = tc.get("stdin", "")
        if not tc_stdin.endswith("\n"):
            tc_stdin += "\n"
        parts.append(tc_stdin)
    return "\n".join(parts)


def _compare_sync(actual: str, expected_raw: str, compare_mode: str) -> bool:
    """Mirror of the route handler's _compare() — self-contained for the worker."""
    import re

    def normalize(text: str) -> str:
        return re.sub(r"\s+", " ", text.strip())

    if actual is None or expected_raw is None:
        return False

    norm_actual   = normalize(actual)
    norm_expected = normalize(expected_raw)

    if compare_mode == "unordered":
        a_ints = sorted(int(x) for x in re.findall(r"-?\d+", norm_actual))
        e_ints = sorted(int(x) for x in re.findall(r"-?\d+", norm_expected))
        return a_ints == e_ints
    elif compare_mode == "any_of":
        valid = [s.strip() for s in norm_expected.split("|")]
        return norm_actual in valid
    elif compare_mode == "float":
        try:
            return abs(float(norm_actual) - float(norm_expected)) < 1e-4
        except ValueError:
            return False
    else:  # "ordered" (default)
        return norm_actual == norm_expected


def _fmt_time(t) -> str:
    if t is None:
        return "--"
    try:
        return f"{float(t):.3f}s"
    except (TypeError, ValueError):
        return str(t)


def _fmt_memory(m) -> str:
    if m is None:
        return "--"
    try:
        return f"{float(m) / 1024:.1f} MB"
    except (TypeError, ValueError):
        return str(m)


def _record_submission_sync(
    uid: str,
    question_id: int,
    verdict: str,
    status_id: int,
    language_id: int,
    passed_count: int,
    total_count: int,
    runtime: str,
    memory: str,
    compile_error: Optional[str],
) -> None:
    """
    Write one submission history document to Firestore.
    Synchronous — call via asyncio.to_thread() from the worker.
    Mirrors firestore_service.record_submission() but avoids awaiting it
    so the worker can run it in a thread.
    """
    from firebase_admin import firestore
    from google.cloud.firestore_v1 import SERVER_TIMESTAMP

    _LANGUAGE_NAMES: Dict[int, str] = {
        50: "c", 62: "java", 63: "javascript", 71: "python", 76: "cpp"
    }

    doc = {
        "questionId":    question_id,
        "executionType": "submit",
        "verdict":       verdict,
        "statusId":      status_id,
        "language":      _LANGUAGE_NAMES.get(language_id, "unknown"),
        "languageId":    language_id,
        "passedCount":   passed_count,
        "totalCount":    total_count,
        "runtime":       runtime,
        "memory":        memory,
        "submittedAt":   SERVER_TIMESTAMP,
        "compileError":  compile_error or None,
    }
    db = firestore.client()
    db.collection("users").document(uid).collection("submissions").add(doc)


def _update_progress_sync(uid: str, question_id: int) -> None:
    """
    Update Firestore progress for an Accepted submission.
    Synchronous — call via asyncio.to_thread() from the worker.
    """
    from firebase_admin import firestore
    from google.cloud.firestore_v1 import SERVER_TIMESTAMP

    qid_str = str(question_id)
    updates = {
        "solved":       True,
        "lastSolved":   SERVER_TIMESTAMP,
        "lastModified": SERVER_TIMESTAMP,
    }
    db = firestore.client()
    db.collection("users").document(uid).collection("progress").document(qid_str).set(
        updates, merge=True
    )
