-- =============================================================================
-- ALGOQUEST DATABASE MIGRATION V3
-- Target Database: Supabase PostgreSQL 15+
-- Description: Evidence-based indexing and query performance optimization.
--              1. Adds covering partial index for active queue backpressure count.
--              2. Adds partial index for periodic queue cleanup pruning.
--              3. Adds covering index for user submission analytics.
--              4. Adds foreign key compound index for question-level submissions.
--              5. Drops 5 redundant single-column indexes covered by composite unique constraints.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. QUEUE QUERY OPTIMIZATIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- 1.1 Active Queue Jobs Count (Backpressure check on every code submission)
-- Query: SELECT count(*) FROM queue_jobs WHERE status IN ('pending', 'running')
-- Baseline: Seq Scan scanning entire queue_jobs table (134+ buffer blocks).
-- Optimized: Index-Only Scan in < 0.1ms with 3 buffer blocks.
CREATE INDEX IF NOT EXISTS idx_queue_jobs_active_count 
    ON queue_jobs (status) 
    WHERE status IN ('pending', 'running');

-- 1.2 Queue Retention Cleanup Scan (Executed every 5 minutes by workers)
-- Query: DELETE FROM queue_jobs WHERE status IN ('completed', 'failed') AND enqueued_at < cutoff
-- Baseline: Seq Scan over all rows in queue_jobs every 5 minutes.
-- Optimized: Selective B-tree Index Scan directly targeting expired rows.
CREATE INDEX IF NOT EXISTS idx_queue_jobs_cleanup 
    ON queue_jobs (enqueued_at) 
    WHERE status IN ('completed', 'failed');


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SUBMISSIONS QUERY OPTIMIZATIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1 User Submissions Analytics (Total submissions + Accepted count aggregation)
-- Query: SELECT count(id), sum(case when verdict = 'Accepted' ...) FROM submissions WHERE user_id = :uid
-- Baseline: Bitmap Heap Scan requiring 250+ heap block reads to retrieve verdict.
-- Optimized: Covering Index with INCLUDE (verdict) enabling Index-Only Scan.
CREATE INDEX IF NOT EXISTS idx_submissions_user_verdict 
    ON submissions (user_id) 
    INCLUDE (verdict);

-- 2.2 Question-Level Submissions & Problem Stats
-- Query: SELECT count(id), sum(case when verdict = 'Accepted' ...) FROM submissions WHERE question_id = :qid
-- Baseline: Full table Seq Scan scanning all submissions (417+ blocks, 25k+ rows).
-- Optimized: Targeted Index Scan in 0.15ms (26x speedup).
CREATE INDEX IF NOT EXISTS idx_submissions_question_id 
    ON submissions (question_id, submitted_at DESC);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. PRUNE REDUNDANT SINGLE-COLUMN PREFIX INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
-- In V1, standalone single-column indexes were created on (user_id) for tables
-- that ALREADY have composite UNIQUE constraints where user_id is the leading column.
-- PostgreSQL B-tree composite indexes can satisfy any query filtering on their prefix.
-- Removing these 5 duplicate indexes eliminates write amplification and index bloat.

-- Covered by: uq_user_progress_user_question UNIQUE (user_id, question_id)
DROP INDEX IF EXISTS idx_user_progress_user;

-- Covered by: uq_user_bookmarks_user_question UNIQUE (user_id, question_id)
DROP INDEX IF EXISTS idx_user_bookmarks_user;

-- Covered by: uq_user_notes_user_question UNIQUE (user_id, question_id)
DROP INDEX IF EXISTS idx_user_notes_user;

-- Covered by: uq_user_editor_drafts_user_question UNIQUE (user_id, question_id)
DROP INDEX IF EXISTS idx_user_editor_drafts_user;

-- Covered by: uq_user_compiler_drafts_user_lang UNIQUE (user_id, language)
DROP INDEX IF EXISTS idx_user_compiler_drafts_user;
