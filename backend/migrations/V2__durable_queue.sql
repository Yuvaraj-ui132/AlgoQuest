-- =============================================================================
-- ALGOQUEST DATABASE MIGRATION V2
-- Target Database: Supabase PostgreSQL 15+
-- Description: PostgreSQL-backed durable submission queue.
--              Jobs survive backend restarts. Workers claim jobs atomically
--              using SELECT ... FOR UPDATE SKIP LOCKED.
-- =============================================================================

-- 2.9 DURABLE SUBMISSION QUEUE
--
-- Each row represents one async submission job.
-- Job lifecycle:  pending -> running -> completed | failed
-- Orphan recovery: a worker whose lease has expired can be reclaimed.
-- Bounded retries: jobs exceeding max_retries are dead-lettered to "failed".
--
-- NOTE: source_code is stored transiently and cleared after the job finishes.
--       It is NEVER returned to the frontend and NEVER logged.

CREATE TABLE IF NOT EXISTS queue_jobs (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uid              VARCHAR(128) NOT NULL,
    question_id      INTEGER      NOT NULL CHECK (question_id > 0),
    language_id      INTEGER      NOT NULL,
    source_code      TEXT         NOT NULL DEFAULT '',
    compiler_options TEXT         NOT NULL DEFAULT '',
    request_id       VARCHAR(64)  NULL,
    status           VARCHAR(16)  NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    retries          INTEGER      NOT NULL DEFAULT 0,
    max_retries      INTEGER      NOT NULL DEFAULT 3,
    worker_id        VARCHAR(64)  NULL,
    locked_at        TIMESTAMPTZ  NULL,
    lease_seconds    INTEGER      NOT NULL DEFAULT 120,
    result_json      TEXT         NULL,
    error_message    TEXT         NULL,
    enqueued_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    started_at       TIMESTAMPTZ  NULL,
    completed_at     TIMESTAMPTZ  NULL
);

-- Efficient SKIP LOCKED claim: pending jobs, FIFO
CREATE INDEX IF NOT EXISTS idx_queue_jobs_claim
    ON queue_jobs (status, enqueued_at ASC)
    WHERE status = 'pending';

-- Orphan recovery: running jobs with expired leases
CREATE INDEX IF NOT EXISTS idx_queue_jobs_orphan
    ON queue_jobs (status, locked_at)
    WHERE status = 'running';

-- UID-scoped polling index
CREATE INDEX IF NOT EXISTS idx_queue_jobs_uid
    ON queue_jobs (uid, enqueued_at DESC);

-- DML grants for application role
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'algoquest_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON queue_jobs TO algoquest_app;
    END IF;
END $$;

-- RLS
ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'algoquest_app') THEN
        DROP POLICY IF EXISTS algoquest_app_queue_jobs_policy ON queue_jobs;
        CREATE POLICY algoquest_app_queue_jobs_policy ON queue_jobs
            FOR ALL TO algoquest_app USING (true) WITH CHECK (true);
    END IF;
END $$;
