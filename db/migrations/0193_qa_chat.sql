-- =============================================================================
-- 0193_qa_chat.sql
-- BR-59u: Questions & Answers (Q&A Chat)
--
-- Farmers and admins can ask questions and answer discussions attached to
-- knowledge content (articles, videos, trainings, groups) and/or communities.
--
-- Supports moderation (blocking and soft-deleting) with audit logging.
-- =============================================================================

-- +migrate Up

CREATE TABLE qa_questions (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id        uuid REFERENCES communities(id) ON DELETE SET NULL,
    content_type        text CHECK (content_type IS NULL OR content_type IN ('articles', 'videos', 'trainings', 'groups')),
    content_id          uuid,
    title               text NOT NULL,
    content             text NOT NULL,
    author_user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_blocked          boolean NOT NULL DEFAULT false,
    blocked_by          uuid REFERENCES users(id) ON DELETE SET NULL,
    blocked_at          timestamptz,
    block_reason        text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);

CREATE INDEX idx_qa_questions_community ON qa_questions(community_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_qa_questions_content ON qa_questions(content_type, content_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_qa_questions_author ON qa_questions(author_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_qa_questions_created ON qa_questions(created_at DESC) WHERE deleted_at IS NULL;

CREATE TABLE qa_answers (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id         uuid NOT NULL REFERENCES qa_questions(id) ON DELETE CASCADE,
    content             text NOT NULL,
    author_user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_blocked          boolean NOT NULL DEFAULT false,
    blocked_by          uuid REFERENCES users(id) ON DELETE SET NULL,
    blocked_at          timestamptz,
    block_reason        text,
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now(),
    deleted_at          timestamptz
);

CREATE INDEX idx_qa_answers_question ON qa_answers(question_id, created_at ASC) WHERE deleted_at IS NULL;
CREATE INDEX idx_qa_answers_author ON qa_answers(author_user_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE qa_questions IS 'Antigravity Brief 03 / BR-59u: Community and Knowledge Q&A questions.';
COMMENT ON TABLE qa_answers IS 'Antigravity Brief 03 / BR-59u: Community and Knowledge Q&A answers.';

-- +migrate Down

DROP TABLE IF EXISTS qa_answers;
DROP TABLE IF EXISTS qa_questions;
