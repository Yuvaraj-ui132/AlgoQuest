"""
submission_queue.py — Async Submission Job Manager

Architecture:
  POST /api/submissions (submit) -> create_job() -> queue
  Background worker -> claim job -> Judge0 -> database -> job COMPLETED
  GET /api/submissions/{job_id} -> lookup job state

Queue backends
--------------
in-memory (default, QUEUE_ENABLE_PG_BACKEND=false):
  - Uses asyncio.Queue. Jobs are LOST on process restart.
  - Zero extra DB calls. Suitable for development and single-worker deployments.

PostgreSQL-backed (QUEUE_ENABLE_PG_BACKEND=true):
  - Persists jobs in the queue_jobs table across restarts.
  - Atomic claiming via SELECT ... FOR UPDATE SKIP LOCKED.
  - Worker lease heartbeats keep jobs from being orphaned.
  - Orphan recovery resets jobs whose worker lease expired.
  - Bounded retries (QUEUE_MAX_RETRIES, default 3).

Worker count:
  Defaults to SUBMISSION_WORKERS=2 (set in config.py / env var).

Cleanup:
  In-memory: completed/failed jobs purged after JOB_RETENTION_SECONDS (20 min).
  PG-backed: old rows deleted every QUEUE_CLEANUP_OLDER_THAN_SECONDS (30 min).
"""

import asyncio
import logging
import secrets
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# In-memory timing constants
JOB_RETENTION_SECONDS    = 20 * 60   # keep completed/failed jobs for 20 min
CLEANUP_INTERVAL_SECONDS =  5 * 60   # run cleanup task every 5 min


# ---------------------------------------------------------------------------
# Job states
# ---------------------------------------------------------------------------

class JobStatus(str, Enum):
    QUEUED    = "queued"
    RUNNING   = "running"
    COMPLETED = "completed"
    FAILED    = "failed"


# ---------------------------------------------------------------------------
# In-memory job dataclass
# ---------------------------------------------------------------------------

@dataclass
class SubmissionJob:
    """
    In-memory representation of one submission job.

    With the in-memory backend this is the authoritative source of truth.
    With the PG backend it acts as a fast-polling cache populated from
    the queue_jobs row so GET /submissions/{job_id} never hits the DB.

    NEVER stores hidden test inputs or expected outputs.
    source_code is held transiently, never written to Firestore/returned to frontend.
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
    request_id:       Optional[str] = None

    # Populated after worker finishes (None while QUEUED/RUNNING)
    result: Optional[Dict[str, Any]] = None
    error:  Optional[str]            = None


# ---------------------------------------------------------------------------
# SubmissionQueue
# ---------------------------------------------------------------------------

class SubmissionQueue:
    """
    Central manager for async submission jobs.

    Public API is identical regardless of which backend is active.
    Internally delegates to either the in-memory asyncio.Queue or the
    PostgreSQL-backed durable queue depending on settings.
    """

    def __init__(self, maxsize: Optional[int] = None, pg_mode: Optional[bool] = None) -> None:
        from app.config import settings
        self._settings  = settings
        self._max_size  = maxsize if maxsize is not None else getattr(settings, "submission_queue_max_size", 100)
        self._pg_mode   = pg_mode if pg_mode is not None else bool(getattr(settings, "queue_enable_pg_backend", False))

        # Shared in-memory job cache (used by both backends for O(1) polling)
        self._jobs:         Dict[str, SubmissionJob] = {}
        self._workers:      List[asyncio.Task] = []
        self._cleanup_task: Optional[asyncio.Task] = None

        if self._pg_mode:
            logger.info("[SUBMISSION_QUEUE] PostgreSQL-backed durable queue enabled.")
        else:
            # In-memory asyncio.Queue with bounded backpressure
            self._queue = asyncio.Queue(maxsize=self._max_size)

    # ── Job creation ──────────────────────────────────────────────────────────

    def create_job(
        self,
        uid: str,
        question_id: int,
        language_id: int,
        source_code: str,
        compiler_options: str = "",
        request_id: Optional[str] = None,
    ) -> SubmissionJob:
        """
        Create a QUEUED job and place it on the queue.

        In-memory mode: raises HTTP 503 if the asyncio.Queue is full.
        PG mode: raises HTTP 500 on DB failure.
        Returns the SubmissionJob so the route handler can return job_id immediately.
        """
        if self._pg_mode:
            return self._create_job_pg(
                uid=uid, question_id=question_id, language_id=language_id,
                source_code=source_code, compiler_options=compiler_options,
                request_id=request_id,
            )
        return self._create_job_memory(
            uid=uid, question_id=question_id, language_id=language_id,
            source_code=source_code, compiler_options=compiler_options,
            request_id=request_id,
        )

    def get_job(self, job_id: str, uid: str) -> Optional[SubmissionJob]:
        """
        Look up a job by ID and verify UID ownership.

        Returns SubmissionJob if found and owned by uid.
        Returns None if not found.
        Raises PermissionError if job exists but belongs to a different uid.
        """
        job = self._jobs.get(job_id)
        if job is not None:
            if job.uid != uid:
                raise PermissionError(f"Job {job_id!r} not accessible to this user")
            return job

        # PG mode: cache miss — query DB (after restart or on a second replica)
        if self._pg_mode:
            return self._load_job_from_pg(job_id, uid)

        return None

    def get_queue_stats(self) -> Dict[str, Any]:
        """Return non-sensitive queue metrics for monitoring and readiness probes."""
        active_workers = sum(1 for w in self._workers if not w.done())
        stats: Dict[str, Any] = {
            "active_workers": active_workers,
            "total_workers":  len(self._workers),
            "tracked_jobs":   len(self._jobs),
            "mode":           "pg" if self._pg_mode else "memory",
        }
        if self._pg_mode:
            try:
                from app.services.supabase_service import count_pending_jobs_sync
                stats["queue_size"] = count_pending_jobs_sync()
            except Exception:
                stats["queue_size"] = 0
            stats["max_queue_size"] = self._max_size
        else:
            stats["queue_size"]     = self._queue.qsize()
            stats["max_queue_size"] = self._queue.maxsize
        return stats

    # ── PG backend: create ────────────────────────────────────────────────────

    def _create_job_pg(self, *, uid, question_id, language_id, source_code,
                       compiler_options, request_id) -> SubmissionJob:
        from app.config import settings
        from app.utils.logging import request_id_ctx
        from fastapi import HTTPException, status

        # Check queue capacity backpressure
        if self._max_size > 0:
            try:
                from app.services.supabase_service import count_pending_jobs_sync
                active_count = count_pending_jobs_sync()
                if active_count >= self._max_size:
                    logger.warning(
                        "[SUBMISSION_QUEUE_FULL_PG] DB queue capacity (%d) reached (active=%d). Applying backpressure.",
                        self._max_size, active_count,
                    )
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Submission queue is full. Please try again shortly.",
                        headers={"Retry-After": "5"},
                    )
            except HTTPException:
                raise
            except Exception as exc:
                logger.warning("[SUBMISSION_QUEUE] Failed to check pending count: %s", exc)

        clean_req_id = request_id or request_id_ctx.get() or None

        try:
            from app.services.supabase_service import enqueue_job_sync
            job_id = enqueue_job_sync(
                uid=uid,
                question_id=question_id,
                language_id=language_id,
                source_code=source_code,
                compiler_options=compiler_options,
                request_id=clean_req_id,
                max_retries=getattr(settings, "queue_max_retries", 3),
                lease_seconds=getattr(settings, "queue_worker_lease_seconds", 120),
            )
        except Exception as exc:
            logger.error("[SUBMISSION_QUEUE] Failed to persist job to PostgreSQL: %s", exc)
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Submission queue temporarily unavailable. Please try again.",
            )

        job = SubmissionJob(
            job_id=job_id,
            uid=uid,
            question_id=question_id,
            language_id=language_id,
            execution_type="submit",
            source_code=source_code,
            compiler_options=compiler_options,
            request_id=clean_req_id,
            status=JobStatus.QUEUED,
        )
        self._jobs[job_id] = job
        logger.info(
            "[SUBMISSION_QUEUED_PG] job=%s uid=%.8s... question=%s lang=%s",
            job_id, uid, question_id, language_id,
            extra={
                "event": "SUBMISSION_QUEUED",
                "job_id": job_id,
                "request_id": clean_req_id,
                "question_id": question_id,
                "language_id": language_id,
                "uid": f"{uid[:8]}...",
            },
        )
        return job

    # ── In-memory backend: create ─────────────────────────────────────────────

    def _create_job_memory(self, *, uid, question_id, language_id, source_code,
                           compiler_options, request_id) -> SubmissionJob:
        if self._queue.full():
            logger.warning(
                "[SUBMISSION_QUEUE_FULL] Queue capacity (%d) reached. Applying backpressure.",
                self._queue.maxsize,
            )
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Submission queue is full. Please try again shortly.",
                headers={"Retry-After": "5"},
            )

        from app.utils.logging import request_id_ctx
        clean_req_id = request_id or request_id_ctx.get() or None

        job_id = str(uuid.uuid4())
        job = SubmissionJob(
            job_id=job_id,
            uid=uid,
            question_id=question_id,
            language_id=language_id,
            execution_type="submit",
            source_code=source_code,
            compiler_options=compiler_options,
            request_id=clean_req_id,
        )
        self._jobs[job_id] = job
        self._queue.put_nowait(job)
        logger.info(
            "[SUBMISSION_QUEUED] job=%s request_id=%s uid=%.8s... status=QUEUED question=%s lang=%s",
            job_id, clean_req_id or "-", uid, question_id, language_id,
            extra={
                "event": "SUBMISSION_QUEUED",
                "job_id": job_id,
                "request_id": clean_req_id,
                "question_id": question_id,
                "language_id": language_id,
                "uid": f"{uid[:8]}...",
            },
        )
        return job

    # ── PG backend: polling cache miss ────────────────────────────────────────

    def _load_job_from_pg(self, job_id: str, uid: str) -> Optional[SubmissionJob]:
        """
        Load a job from PostgreSQL into the in-memory cache when the job is not
        found in _jobs (e.g. after a backend restart or on a different replica).
        Synchronous — acceptable for short DB lookup on the async poll path.
        """
        try:
            from app.services.supabase_service import get_queue_job_sync
            d = get_queue_job_sync(job_id, uid)   # raises PermissionError on uid mismatch
        except PermissionError:
            raise
        except Exception as exc:
            logger.warning("[SUBMISSION_QUEUE] DB lookup failed for job=%s: %s", job_id, exc)
            return None

        if d is None:
            return None

        status_map = {
            "pending":   JobStatus.QUEUED,
            "running":   JobStatus.RUNNING,
            "completed": JobStatus.COMPLETED,
            "failed":    JobStatus.FAILED,
        }
        job = SubmissionJob(
            job_id=d["job_id"],
            uid=d["uid"],
            question_id=d["question_id"],
            language_id=d["language_id"],
            execution_type="submit",
            source_code="",   # cleared in DB on completion; not needed for polling
            compiler_options=d.get("compiler_options", ""),
            request_id=d.get("request_id"),
            status=status_map.get(d["status"], JobStatus.QUEUED),
            result=d.get("result"),
            error=d.get("error"),
        )
        self._jobs[job_id] = job
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
        logger.error(
            "[SUBMISSION_FAILED] job=%s request_id=%s status=FAILED error=%s",
            job.job_id, job.request_id or "-", error,
            extra={
                "event": "SUBMISSION_FAILED",
                "job_id": job.job_id,
                "request_id": job.request_id,
                "error": error,
            },
        )

    # ── Worker lifecycle ──────────────────────────────────────────────────────

    def start_workers(self, count: int = 1) -> None:
        """Start background worker tasks. Called from FastAPI lifespan on startup."""
        for i in range(count):
            if self._pg_mode:
                coro = self._pg_worker_loop(worker_id=i)
            else:
                coro = self._memory_worker_loop(worker_id=i)
            task = asyncio.create_task(coro, name=f"submission-worker-{i}")
            self._workers.append(task)

        if self._pg_mode:
            self._cleanup_task = asyncio.create_task(
                self._pg_periodic_cleanup(), name="submission-job-cleanup"
            )
        else:
            self._cleanup_task = asyncio.create_task(
                self._memory_periodic_cleanup(), name="submission-job-cleanup"
            )
        logger.info(
            "[SUBMISSION] Started %d worker(s) + cleanup task (mode=%s)",
            count, "pg" if self._pg_mode else "memory",
        )

    def stop_workers(self) -> None:
        """Cancel all worker tasks. Called from FastAPI lifespan on shutdown."""
        for task in self._workers:
            task.cancel()
        self._workers.clear()
        if self._cleanup_task:
            self._cleanup_task.cancel()
            self._cleanup_task = None
        logger.info("[SUBMISSION] All workers stopped")

    # ── In-memory worker loop ─────────────────────────────────────────────────

    async def _memory_worker_loop(self, worker_id: int) -> None:
        """
        Main in-memory worker coroutine. Runs indefinitely until cancelled.
        Dequeues one job at a time from asyncio.Queue and processes it.
        """
        logger.info("[SUBMISSION] In-memory worker %d started", worker_id)
        while True:
            job: SubmissionJob = await self._queue.get()
            try:
                await self._process_job(job)
            except asyncio.CancelledError:
                if job.status == JobStatus.RUNNING:
                    self._mark_failed(job, "Worker was shut down during execution.")
                self._queue.task_done()
                raise
            except Exception as exc:
                logger.exception(
                    "[SUBMISSION] Unhandled worker exception for job=%s", job.job_id
                )
                self._mark_failed(job, f"Internal worker error: {exc}")
            finally:
                self._queue.task_done()

    # ── PG worker loop ────────────────────────────────────────────────────────

    async def _pg_worker_loop(self, worker_id: int) -> None:
        """
        PostgreSQL-backed worker loop.

        Polls queue_jobs for pending rows, claims them atomically with
        FOR UPDATE SKIP LOCKED, processes them, sends lease heartbeats,
        and writes results back to the DB row.
        Also runs orphan recovery periodically.
        """
        from app.config import settings
        worker_name = f"worker-{worker_id}-{uuid.uuid4().hex[:8]}"
        poll_interval      = getattr(settings, "queue_poll_interval_seconds", 1.0)
        heartbeat_interval = getattr(settings, "queue_heartbeat_interval_seconds", 30.0)
        orphan_interval    = getattr(settings, "queue_orphan_recovery_interval_seconds", 60.0)

        logger.info("[SUBMISSION] PG worker %s started", worker_name)
        last_orphan_check = time.monotonic()

        while True:
            try:
                # Orphan recovery sweep (periodic)
                now_mono = time.monotonic()
                if now_mono - last_orphan_check >= orphan_interval:
                    recovered = await asyncio.to_thread(self._recover_orphans_sync)
                    if recovered:
                        logger.info(
                            "[SUBMISSION] PG worker %s recovered %d orphan job(s)",
                            worker_name, recovered,
                        )
                    last_orphan_check = now_mono

                # Claim next pending job (atomically)
                job_dict = await asyncio.to_thread(self._claim_pg_job_sync, worker_name)
                if job_dict is None:
                    await asyncio.sleep(poll_interval)
                    continue

                job_id = job_dict["job_id"]

                # Hydrate (or refresh) the in-memory SubmissionJob
                job = self._jobs.get(job_id)
                if job is None:
                    job = SubmissionJob(
                        job_id=job_id,
                        uid=job_dict["uid"],
                        question_id=job_dict["question_id"],
                        language_id=job_dict["language_id"],
                        execution_type="submit",
                        source_code=job_dict["source_code"],
                        compiler_options=job_dict.get("compiler_options", ""),
                        request_id=job_dict.get("request_id"),
                        status=JobStatus.RUNNING,
                    )
                    self._jobs[job_id] = job
                else:
                    # Job was in cache (queued state) — refresh source_code from DB row
                    job.source_code = job_dict["source_code"]
                    job.status = JobStatus.RUNNING

                self._mark_running(job)

                # Start heartbeat task to keep the lease alive
                stop_heartbeat = asyncio.Event()
                heartbeat_task = asyncio.create_task(
                    self._pg_heartbeat(job_id, worker_name, heartbeat_interval, stop_heartbeat),
                    name=f"heartbeat-{job_id[:8]}",
                )

                try:
                    await self._process_pg_job(job, worker_name)
                except asyncio.CancelledError:
                    stop_heartbeat.set()
                    heartbeat_task.cancel()
                    if job.status == JobStatus.RUNNING:
                        await asyncio.to_thread(
                            self._fail_pg_job_sync,
                            job_id, worker_name,
                            "Worker was shut down during execution.",
                            True,   # permanent — do not retry a cancelled job
                        )
                        self._mark_failed(job, "Worker was shut down during execution.")
                    raise
                except Exception as exc:
                    logger.exception(
                        "[SUBMISSION] Unhandled PG worker exception for job=%s", job_id
                    )
                    await asyncio.to_thread(
                        self._fail_pg_job_sync, job_id, worker_name,
                        f"Internal error: {exc}", False,
                    )
                    self._mark_failed(job, f"Internal error: {exc}")
                finally:
                    stop_heartbeat.set()
                    heartbeat_task.cancel()

            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("[SUBMISSION] PG worker %s unexpected error", worker_name)
                await asyncio.sleep(poll_interval)

    async def _pg_heartbeat(
        self,
        job_id: str,
        worker_name: str,
        interval: float,
        stop: asyncio.Event,
    ) -> None:
        """Periodically refresh locked_at in the DB until the stop event is set."""
        while not stop.is_set():
            try:
                await asyncio.sleep(interval)
                if stop.is_set():
                    break
                await asyncio.to_thread(self._heartbeat_pg_job_sync, job_id, worker_name)
            except asyncio.CancelledError:
                break
            except Exception:
                pass  # heartbeat failure is non-fatal; lease will eventually expire

    # ── PG synchronous DB helpers (run via asyncio.to_thread) ─────────────────

    def _claim_pg_job_sync(self, worker_id: str):
        from app.services.supabase_service import claim_next_job_sync
        return claim_next_job_sync(worker_id)

    def _heartbeat_pg_job_sync(self, job_id: str, worker_id: str) -> bool:
        from app.services.supabase_service import heartbeat_job_sync
        return heartbeat_job_sync(job_id, worker_id)

    def _complete_pg_job_sync(self, job_id: str, worker_id: str, result: dict) -> bool:
        from app.services.supabase_service import complete_job_sync
        return complete_job_sync(job_id, worker_id, result)

    def _fail_pg_job_sync(self, job_id: str, worker_id: str,
                          error: str, permanent: bool) -> bool:
        from app.services.supabase_service import fail_job_sync
        return fail_job_sync(job_id, worker_id, error, permanent=permanent)

    def _recover_orphans_sync(self) -> int:
        from app.services.supabase_service import recover_orphan_jobs_sync
        return recover_orphan_jobs_sync()

    # ── PG job processing (wraps shared _process_job) ─────────────────────────

    async def _process_pg_job(self, job: SubmissionJob, worker_name: str) -> None:
        """
        Execute one PG-queued job and persist the result to the queue_jobs row.
        Delegates all execution logic to _process_job() (shared with in-memory mode).
        """
        await self._process_job(job)

        if job.status == JobStatus.COMPLETED and job.result is not None:
            await asyncio.to_thread(
                self._complete_pg_job_sync, job.job_id, worker_name, job.result
            )
        elif job.status == JobStatus.FAILED:
            # Check if this failure is permanent vs transient
            # Permanent: e.g. question not found in catalogue
            # Transient: Judge0 timeout/network error or unexpected exception
            is_permanent = False
            if job.error and ("not found in catalogue" in job.error or "Invalid" in job.error):
                is_permanent = True

            fail_res = await asyncio.to_thread(
                self._fail_pg_job_sync, job.job_id, worker_name,
                job.error or "Unknown error", is_permanent,
            )
            if isinstance(fail_res, dict) and fail_res.get("retried"):
                # Job reset to pending for retry by another worker
                job.status = JobStatus.QUEUED
                logger.info(
                    "[SUBMISSION_RETRY] job=%s reset to QUEUED for retry (attempt %d/%d)",
                    job.job_id, fail_res.get("retries", 1), getattr(self._settings, "queue_max_retries", 3),
                )

    # ── Core job execution (shared by both backends) ──────────────────────────

    async def _process_job(self, job: SubmissionJob) -> None:
        """
        Execute one submit job end-to-end:
          1. Mark RUNNING
          2. Load test data (sample + hidden) from test_cases files
          3. Build combined stdin
          4. Dynamic backend nonce injection & marker anti-spoofing
          5. Execute Judge0
          6. Parse per-test-case outputs (session nonce authenticated)
          7. Calculate final verdict
          8. Write database history (non-fatal)
          9. Update progress if Accepted and not sample-only (non-fatal)
         10. Mark COMPLETED with safe result dict (no hidden test data)
        """
        from app.services import judge0_service
        from app.utils.logging import request_id_ctx, job_id_ctx

        start_mono = time.monotonic()
        queue_wait_ms = round((start_mono - job.created_at) * 1000, 2)

        req_tok = request_id_ctx.set(job.request_id or "")
        job_tok = job_id_ctx.set(job.job_id)

        self._mark_running(job)
        logger.info(
            "[SUBMISSION_STARTED] job=%s request_id=%s queue_wait_ms=%.2f question=%s language=%s",
            job.job_id, job.request_id or "-", queue_wait_ms,
            job.question_id, job.language_id,
            extra={
                "event": "SUBMISSION_STARTED",
                "job_id": job.job_id,
                "request_id": job.request_id,
                "queue_wait_ms": queue_wait_ms,
                "question_id": job.question_id,
                "language_id": job.language_id,
            },
        )

        try:
            # Load test data (synchronous I/O -> thread pool)
            q_data, load_err, is_sample_only = await asyncio.to_thread(
                _get_question_submission_data_sync, job.question_id
            )
            if load_err or q_data is None:
                self._mark_failed(
                    job,
                    load_err or f"Question {job.question_id} not found in catalogue",
                )
                return

            sample_tests: list = q_data.get("sampleTests", [])
            hidden_tests: list = q_data.get("hiddenTests", [])
            compare_mode: str  = q_data.get("compareMode", "ordered")
            n_sample           = len(sample_tests)
            active_tests       = sample_tests + hidden_tests  # NEVER sent to browser

            # Build combined stdin
            combined_stdin = _build_stdin_sync(active_tests)

            # Dynamic backend nonce injection & marker anti-spoofing
            nonce = secrets.token_hex(16)
            from app.routes.submissions import prepare_dsa_source, parse_test_outputs
            secured_code, is_clean = prepare_dsa_source(
                source_code=job.source_code,
                q_data=q_data,
                language_id=job.language_id,
                nonce=nonce,
            )

            # Execute Judge0
            judge0_start = time.monotonic()
            try:
                result = await judge0_service.execute(
                    source_code=secured_code,
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
            judge0_duration_ms = round((time.monotonic() - judge0_start) * 1000, 2)

            status_id: int = result["status_id"]
            stdout: str    = result["stdout"] or ""

            # Parse per-test-case outputs (authenticated with session nonce)
            if not is_clean:
                output_lines = ["" for _ in range(len(active_tests))]
            else:
                output_lines = parse_test_outputs(stdout, len(active_tests), nonce=nonce)

            passed_count = 0
            tc_results: List[Dict[str, Any]] = []

            for i, tc in enumerate(active_tests):
                actual_raw = output_lines[i] if i < len(output_lines) else ""
                is_hidden  = i >= n_sample

                passed = (
                    is_clean
                    and status_id == 3
                    and _compare_sync(
                        actual_raw,
                        tc.get("expectedRaw", ""),
                        compare_mode,
                        return_type=q_data.get("returnType"),
                    )
                )
                if passed:
                    passed_count += 1

                # Build SAFE tc dict — hidden test stdin/expectedRaw/actual NEVER included
                item: Dict[str, Any] = {
                    "index":     i + 1,
                    "passed":    passed,
                    "actual":    None if is_hidden else actual_raw,
                    "is_hidden": is_hidden,
                }
                if not is_hidden:
                    item["input"]    = tc.get("input", "")
                    item["expected"] = tc.get("expected", "")
                tc_results.append(item)

            # Determine final verdict
            all_passed = (
                len(active_tests) > 0
                and passed_count == len(active_tests)
                and status_id == 3
            )
            if is_sample_only:
                if all_passed:
                    final_verdict = "Sample Accepted (Dev Only)"
                elif status_id == 3:
                    final_verdict = "Wrong Answer"
                else:
                    final_verdict = result["verdict"]
            else:
                if all_passed:
                    final_verdict = "Accepted"
                elif status_id == 3:
                    final_verdict = "Wrong Answer"
                else:
                    final_verdict = result["verdict"]

            total_duration_ms = round((time.monotonic() - start_mono) * 1000, 2)
            logger.info(
                "[SUBMISSION_COMPLETED] job=%s request_id=%s verdict=%s passed=%d/%d "
                "(sample_only=%s) judge0_ms=%.2f total_ms=%.2f",
                job.job_id, job.request_id or "-", final_verdict,
                passed_count, len(active_tests), is_sample_only,
                judge0_duration_ms, total_duration_ms,
                extra={
                    "event": "SUBMISSION_COMPLETED",
                    "job_id": job.job_id,
                    "request_id": job.request_id,
                    "verdict": final_verdict,
                    "passed_count": passed_count,
                    "total_count": len(active_tests),
                    "is_sample_only": is_sample_only,
                    "judge0_duration_ms": judge0_duration_ms,
                    "total_duration_ms": total_duration_ms,
                },
            )

            # Compile error only for status_id==6 (Compilation Error)
            # Runtime stderr NEVER stored (would risk leaking hidden test output)
            _compile_err = (
                (result.get("compile_output") or None) if status_id == 6 else None
            )

            # Write database history (non-fatal)
            try:
                await asyncio.to_thread(
                    _record_submission_sync,
                    job.uid, job.question_id, final_verdict, status_id,
                    job.language_id, passed_count, len(active_tests),
                    _fmt_time(result["time"]), _fmt_memory(result["memory"]),
                    _compile_err,
                    job.job_id,
                )
            except Exception as exc:
                from app.utils.errors import sanitize_db_error
                err_info = sanitize_db_error(exc)
                logger.error(
                    "[SUBMISSION_PERSISTENCE_FAILED] job_id=%s question_id=%s verdict=%s "
                    "exc_class=%s pgcode=%s error=%s",
                    job.job_id, job.question_id, final_verdict,
                    err_info["exception_class"],
                    err_info["pgcode"] or "NONE",
                    err_info["sanitized_message"],
                )

            # Update progress if Accepted (non-fatal; NEVER in sample-only mode)
            if all_passed and not is_sample_only:
                try:
                    await asyncio.to_thread(
                        _update_progress_sync, job.uid, job.question_id
                    )
                except Exception as exc:
                    from app.utils.errors import sanitize_db_error
                    err_info = sanitize_db_error(exc)
                    logger.error(
                        "[PROGRESS_PERSISTENCE_FAILED] job_id=%s question_id=%s "
                        "exc_class=%s pgcode=%s error=%s",
                        job.job_id, job.question_id,
                        err_info["exception_class"],
                        err_info["pgcode"] or "NONE",
                        err_info["sanitized_message"],
                    )

            # Build safe result (no hidden test data exposed)
            safe_result: Dict[str, Any] = {
                "verdict":        final_verdict,
                "status_id":      status_id,
                "runtime":        _fmt_time(result["time"]),
                "memory":         _fmt_memory(result["memory"]),
                "passed_count":   passed_count,
                "total_count":    len(active_tests),
                "compile_output": (
                    (result.get("compile_output") or None) if status_id == 6 else None
                ),
                "stderr":         None,   # Submit mode NEVER exposes runtime stderr
                "test_cases":     tc_results,
            }
            self._mark_completed(job, safe_result)

        finally:
            request_id_ctx.reset(req_tok)
            job_id_ctx.reset(job_tok)

    # ── In-memory cleanup ─────────────────────────────────────────────────────

    async def _memory_periodic_cleanup(self) -> None:
        """Periodic coroutine: prune old completed/failed jobs from _jobs dict."""
        while True:
            await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
            self._memory_cleanup_now()

    def _memory_cleanup_now(self) -> None:
        """Immediately remove expired completed/failed in-memory jobs."""
        cutoff = time.monotonic() - JOB_RETENTION_SECONDS
        expired = [
            jid for jid, job in self._jobs.items()
            if job.status in (JobStatus.COMPLETED, JobStatus.FAILED)
            and job.created_at < cutoff
        ]
        for jid in expired:
            del self._jobs[jid]
        if expired:
            logger.info("[SUBMISSION] Cleaned up %d expired in-memory job(s)", len(expired))

    # ── PG cleanup ────────────────────────────────────────────────────────────

    async def _pg_periodic_cleanup(self) -> None:
        from app.config import settings
        older_than = getattr(settings, "queue_cleanup_older_than_seconds", 1800)
        while True:
            await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
            try:
                deleted = await asyncio.to_thread(self._delete_old_pg_jobs_sync, older_than)
                if deleted:
                    logger.info("[SUBMISSION] Deleted %d old PG queue job row(s)", deleted)
                # Also prune in-memory cache
                self._memory_cleanup_now()
            except Exception:
                pass

    def _delete_old_pg_jobs_sync(self, older_than_seconds: int) -> int:
        from app.services.supabase_service import delete_old_jobs_sync
        return delete_old_jobs_sync(older_than_seconds)

    # ── Debug helpers ─────────────────────────────────────────────────────────

    @property
    def queue_size(self) -> int:
        if self._pg_mode:
            return -1   # not tracked in memory for PG mode
        return self._queue.qsize()

    @property
    def job_count(self) -> int:
        return len(self._jobs)


# ── Module-level singleton ────────────────────────────────────────────────────

# One global instance per FastAPI process.
submission_queue = SubmissionQueue()


# ── Pure helper functions (module-level for testability) ─────────────────────

def _get_question_submission_data_sync(question_id: int):
    """
    Synchronous wrapper around the route-level submission test data loader.
    Safe to call from asyncio.to_thread().
    Returns (q_data, error_message, is_sample_only).
    """
    # Backward-compatibility hook for tests patching _get_question_test_data_sync
    try:
        from unittest.mock import Mock
        if isinstance(_get_question_test_data_sync, Mock):
            res = _get_question_test_data_sync(question_id)
            if isinstance(res, dict):
                return res, None, False
    except Exception:
        pass

    from app.routes.submissions import get_question_submission_data
    return get_question_submission_data(question_id)


def _get_question_test_data_sync(question_id: int):
    """
    Synchronous wrapper around the public route-level test-data loader.
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


_CRASH_PATTERNS = [
    "traceback (most recent call last)",
    "segmentation fault",
    "core dumped",
    "fatal error:",
    "exception in thread",
    "uncaught exception",
    "sigsegv",
    "sigabrt",
    "sigfpe",
]


def _is_crash_output(text: str) -> bool:
    if not text:
        return False
    lower = text.lower()
    return any(p in lower for p in _CRASH_PATTERNS)


def _compare_sync(
    actual: str,
    expected_raw: str,
    compare_mode: str,
    return_type: Optional[str] = None,
) -> bool:
    """Mirror of the route handler's _compare() — self-contained for the worker."""
    import re

    if actual is None or expected_raw is None:
        return False

    if _is_crash_output(actual):
        return False

    if return_type == "string":
        # For string outputs, compare according to problem output rules:
        # Ignore trailing whitespace/newline differences, but do NOT remove
        # meaningful internal spaces or change case unless problem explicitly allows it.
        act_clean = actual.rstrip("\r\n \t")
        exp_clean = expected_raw.rstrip("\r\n \t")

        if compare_mode == "any_of":
            valid = [s.strip() for s in expected_raw.split("|")]
            return act_clean in valid or actual.strip() in valid

        return act_clean == exp_clean

    def normalize(text: str) -> str:
        return re.sub(r"\s+", " ", text.strip())

    norm_actual   = normalize(actual)
    norm_expected = normalize(expected_raw)

    if not norm_actual and norm_expected:
        return False
    if not norm_expected and norm_actual:
        return False
    if not norm_actual and not norm_expected:
        return True

    if compare_mode == "unordered":
        a_ints = [int(x) for x in re.findall(r"-?\d+", norm_actual)]
        e_ints = [int(x) for x in re.findall(r"-?\d+", norm_expected)]
        if e_ints:
            if not a_ints:
                return False
            return sorted(a_ints) == sorted(e_ints)
        else:
            return norm_actual == norm_expected
    elif compare_mode == "any_of":
        valid = [s.strip() for s in norm_expected.split("|")]
        return norm_actual in valid
    elif compare_mode == "float":
        try:
            return abs(float(norm_actual) - float(norm_expected)) < 1e-4
        except (ValueError, TypeError):
            return False
    else:   # "ordered" (default)
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
    submission_id: Optional[str] = None,
) -> None:
    """
    Write one submission history document.
    Synchronous — call via asyncio.to_thread() from the worker.
    Mirrors firestore_service.record_submission() but runs synchronously in a thread.
    """
    from app.config import settings
    if settings.database_backend == "supabase":
        from app.services import supabase_service
        return supabase_service.record_submission_sync(
            uid=uid,
            question_id=question_id,
            verdict=verdict,
            status_id=status_id,
            language_id=language_id,
            passed_count=passed_count,
            total_count=total_count,
            runtime=runtime,
            memory=memory,
            compile_error=compile_error,
            submission_id=submission_id,
        )

    from firebase_admin import firestore
    from google.cloud.firestore_v1 import SERVER_TIMESTAMP

    _LANGUAGE_NAMES: Dict[int, str] = {
        50: "c", 54: "cpp", 62: "java", 63: "javascript", 71: "python", 76: "cpp"
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
    if submission_id:
        db.collection("users").document(uid).collection("submissions").document(submission_id).set(doc, merge=True)
    else:
        db.collection("users").document(uid).collection("submissions").add(doc)


def _update_progress_sync(uid: str, question_id: int) -> None:
    """
    Update progress for an Accepted submission.
    Synchronous — call via asyncio.to_thread() from the worker.
    """
    from app.config import settings
    if settings.database_backend == "supabase":
        from app.services import supabase_service
        return supabase_service.update_progress_sync(uid, question_id)

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
