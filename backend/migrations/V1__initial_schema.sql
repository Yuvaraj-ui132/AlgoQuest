-- =============================================================================
-- ALGOQUEST DATABASE MIGRATION V1
-- Target Database: Supabase PostgreSQL 15+
-- Description: Production-grade schema with strict DDL/DML role separation,
--              explicit sequence grants, and RLS lockdown.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ROLE DEFINITIONS & PRIVILEGE BOUNDARIES
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. algoquest_migration: Schema owner role executing DDL migrations.
-- 2. algoquest_app:       Least-privilege runtime application pool role (DML only).
-- 3. anon, authenticated: Public PostgREST client roles (blocked from direct access).

DO $$
BEGIN
    -- Create application runtime role if it doesn't already exist
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'algoquest_app') THEN
        CREATE ROLE algoquest_app WITH LOGIN PASSWORD 'CHANGE_IN_PRODUCTION';
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLES & CONSTRAINTS SPECIFICATION
-- ─────────────────────────────────────────────────────────────────────────────

-- 2.1 USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(128) PRIMARY KEY, -- Firebase Auth UID
    email VARCHAR(255) NULL,
    name VARCHAR(150) NULL,
    photo_url VARCHAR(2048) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    migrated BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2.2 USER PROGRESS
CREATE TABLE IF NOT EXISTS user_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL CHECK (question_id > 0),
    solved BOOLEAN NOT NULL DEFAULT FALSE,
    rev1 BOOLEAN NOT NULL DEFAULT FALSE,
    rev2 BOOLEAN NOT NULL DEFAULT FALSE,
    last_solved_at TIMESTAMPTZ NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_progress_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_question ON user_progress(question_id);

-- 2.3 USER BOOKMARKS
CREATE TABLE IF NOT EXISTS user_bookmarks (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL CHECK (question_id > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_bookmarks_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user ON user_bookmarks(user_id);

-- 2.4 USER NOTES
CREATE TABLE IF NOT EXISTS user_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL CHECK (question_id > 0),
    content TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_notes_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notes_user ON user_notes(user_id);

-- 2.5 USER DSA EDITOR DRAFTS
CREATE TABLE IF NOT EXISTS user_editor_drafts (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL CHECK (question_id > 0),
    language VARCHAR(32) NOT NULL,
    code TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_editor_drafts_user_question UNIQUE (user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_user_editor_drafts_user ON user_editor_drafts(user_id);

-- 2.6 USER GENERAL COMPILER DRAFTS
CREATE TABLE IF NOT EXISTS user_compiler_drafts (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    language VARCHAR(32) NOT NULL,
    code TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_compiler_drafts_user_lang UNIQUE (user_id, language)
);

CREATE INDEX IF NOT EXISTS idx_user_compiler_drafts_user ON user_compiler_drafts(user_id);

-- 2.7 SUBMISSION HISTORY AUDIT LOG
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    question_id INTEGER NOT NULL CHECK (question_id > 0),
    execution_type VARCHAR(32) NOT NULL DEFAULT 'submit',
    verdict VARCHAR(64) NOT NULL,
    status_id INTEGER NOT NULL,
    language VARCHAR(32) NOT NULL,
    language_id INTEGER NOT NULL,
    passed_count INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    runtime VARCHAR(32) NOT NULL DEFAULT '--',
    memory VARCHAR(32) NOT NULL DEFAULT '--',
    compile_error TEXT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    legacy_firestore_id VARCHAR(64) NULL
);

-- Compound index for deterministic keyset pagination
CREATE INDEX IF NOT EXISTS idx_submissions_user_submitted 
    ON submissions(user_id, submitted_at DESC, id DESC);

-- Unique index to prevent duplicate backfills from Firestore
CREATE UNIQUE INDEX IF NOT EXISTS idx_submissions_user_legacy_id 
    ON submissions(user_id, legacy_firestore_id) 
    WHERE legacy_firestore_id IS NOT NULL;

-- 2.8 MIGRATION RUN METADATA TABLE
CREATE TABLE IF NOT EXISTS _migration_metadata (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    records_exported INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    checksum VARCHAR(64) NULL,
    error_log TEXT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DML GRANTS & SEQUENCE ACCESS FOR algoquest_app
-- ─────────────────────────────────────────────────────────────────────────────
-- Grant schema usage
GRANT USAGE ON SCHEMA public TO algoquest_app;

-- Grant table DML operations (NO DDL permissions)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO algoquest_app;

-- Grant sequence operations required for BIGSERIAL auto-increments
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO algoquest_app;

-- Configure default privileges for any future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO algoquest_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
    GRANT USAGE, SELECT ON SEQUENCES TO algoquest_app;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. PUBLIC CLIENT LOCKDOWN (anon & authenticated)
-- ─────────────────────────────────────────────────────────────────────────────
-- Revoke all table, sequence, and routine privileges from public PostgREST roles
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
        REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;
    END IF;
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
        REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM authenticated;
    END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
-- Enable RLS on all application tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_editor_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_compiler_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE _migration_metadata ENABLE ROW LEVEL SECURITY;

-- Explicit permissive policies for algoquest_app without needing BYPASSRLS
DROP POLICY IF EXISTS algoquest_app_users_policy ON users;
CREATE POLICY algoquest_app_users_policy ON users 
    FOR ALL TO algoquest_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS algoquest_app_progress_policy ON user_progress;
CREATE POLICY algoquest_app_progress_policy ON user_progress 
    FOR ALL TO algoquest_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS algoquest_app_bookmarks_policy ON user_bookmarks;
CREATE POLICY algoquest_app_bookmarks_policy ON user_bookmarks 
    FOR ALL TO algoquest_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS algoquest_app_notes_policy ON user_notes;
CREATE POLICY algoquest_app_notes_policy ON user_notes 
    FOR ALL TO algoquest_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS algoquest_app_editor_policy ON user_editor_drafts;
CREATE POLICY algoquest_app_editor_policy ON user_editor_drafts 
    FOR ALL TO algoquest_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS algoquest_app_compiler_policy ON user_compiler_drafts;
CREATE POLICY algoquest_app_compiler_policy ON user_compiler_drafts 
    FOR ALL TO algoquest_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS algoquest_app_submissions_policy ON submissions;
CREATE POLICY algoquest_app_submissions_policy ON submissions 
    FOR ALL TO algoquest_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS algoquest_app_metadata_policy ON _migration_metadata;
CREATE POLICY algoquest_app_metadata_policy ON _migration_metadata 
    FOR ALL TO algoquest_app USING (true) WITH CHECK (true);
