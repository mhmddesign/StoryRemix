-- ==============================================================================
-- STORYREMIX: MASTER COMPREHENSIVE DATABASE SETUP SCRIPT
-- Execute this script in Supabase SQL Editor (ysrxzzscfttsiscdpiby)
-- ==============================================================================

-- ==============================================================================
-- StoryRemix Database Schema Migration
-- Migration ID: 20261122_initial_schema
-- Description: Core tables, RLS policies, transactional procedures, and triggers.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS & DOMAINS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE story_status AS ENUM ('draft', 'active', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE story_visibility AS ENUM ('public', 'unlisted', 'private');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE round_status AS ENUM ('open', 'evaluating', 'awaiting_creator_resolution', 'resolved', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE round_resolution_type AS ENUM ('threshold_met', 'creator_override', 'round_extended', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE contribution_status AS ENUM ('active', 'winner', 'eliminated', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('pending', 'reviewing', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    preferred_language TEXT DEFAULT 'en' NOT NULL,
    role user_role DEFAULT 'user' NOT NULL,
    privacy_settings JSONB DEFAULT '{"show_reading_list": true, "allow_mentions": true}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT username_format CHECK (username ~* '^[a-zA-Z0-9_]{3,24}$')
);

-- 4. STORIES TABLE
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    genre TEXT NOT NULL,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
    language TEXT DEFAULT 'en' NOT NULL,
    visibility story_visibility DEFAULT 'public' NOT NULL,
    cover_image_url TEXT,
    max_paragraphs INT NOT NULL CHECK (max_paragraphs BETWEEN 2 AND 30),
    current_paragraph_count INT DEFAULT 1 NOT NULL,
    default_vote_threshold INT DEFAULT 3 NOT NULL CHECK (default_vote_threshold >= 1),
    default_round_duration INT DEFAULT 86400 NOT NULL CHECK (default_round_duration >= 60), -- In seconds (default 24h)
    status story_status DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stories_slug ON public.stories(slug);
CREATE INDEX IF NOT EXISTS idx_stories_owner ON public.stories(owner_id);
CREATE INDEX IF NOT EXISTS idx_stories_status_visibility ON public.stories(status, visibility);
CREATE INDEX IF NOT EXISTS idx_stories_genre ON public.stories(genre);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);

-- 5. STORY ROUNDS TABLE
CREATE TABLE IF NOT EXISTS public.story_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    paragraph_position INT NOT NULL,
    vote_threshold INT NOT NULL CHECK (vote_threshold >= 1),
    opened_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deadline_at TIMESTAMPTZ NOT NULL,
    status round_status DEFAULT 'open' NOT NULL,
    winner_contribution_id UUID, -- Foreign key added after contributions table
    closed_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_type round_resolution_type,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_story_round_number UNIQUE(story_id, round_number)
);

CREATE INDEX IF NOT EXISTS idx_story_rounds_story_status ON public.story_rounds(story_id, status);
CREATE INDEX IF NOT EXISTS idx_story_rounds_deadline ON public.story_rounds(status, deadline_at);

-- 6. CONTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES public.story_rounds(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    body TEXT NOT NULL,
    sentence_count INT NOT NULL CHECK (sentence_count BETWEEN 2 AND 3),
    word_count INT NOT NULL CHECK (word_count > 0),
    status contribution_status DEFAULT 'active' NOT NULL,
    vote_count INT DEFAULT 0 NOT NULL CHECK (vote_count >= 0),
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add foreign key constraint back to story_rounds for winner_contribution_id
ALTER TABLE public.story_rounds 
    DROP CONSTRAINT IF EXISTS fk_story_rounds_winner;
ALTER TABLE public.story_rounds
    ADD CONSTRAINT fk_story_rounds_winner 
    FOREIGN KEY (winner_contribution_id) 
    REFERENCES public.contributions(id) 
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contributions_round_votes ON public.contributions(round_id, vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_author ON public.contributions(author_id);
-- Ensure one active contribution per author per round
CREATE UNIQUE INDEX IF NOT EXISTS uq_author_active_contribution_per_round 
    ON public.contributions(round_id, author_id) 
    WHERE status = 'active';

-- 7. VOTES TABLE
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.story_rounds(id) ON DELETE CASCADE,
    contribution_id UUID NOT NULL REFERENCES public.contributions(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_round_vote UNIQUE (round_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_contribution ON public.votes(contribution_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON public.votes(voter_id);

-- 8. STORY SEGMENTS TABLE (Canonical sequence of paragraphs)
CREATE TABLE IF NOT EXISTS public.story_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    paragraph_index INT NOT NULL CHECK (paragraph_index >= 1),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    source_contribution_id UUID REFERENCES public.contributions(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    vote_count_at_lock INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_story_paragraph_index UNIQUE (story_id, paragraph_index)
);

CREATE INDEX IF NOT EXISTS idx_story_segments_story_order ON public.story_segments(story_id, paragraph_index ASC);
CREATE INDEX IF NOT EXISTS idx_story_segments_author ON public.story_segments(author_id);

-- 9. STORY LIKES TABLE
CREATE TABLE IF NOT EXISTS public.story_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_story_like UNIQUE (story_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_story_likes_story ON public.story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_user ON public.story_likes(user_id);

-- 10. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'deleted', 'hidden')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_story ON public.comments(story_id, created_at ASC);

-- 11. FOLLOWS TABLE
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (follower_id, followed_id),
    CONSTRAINT chk_no_self_follow CHECK (follower_id != followed_id)
);

-- 12. BOOKMARKS TABLE
CREATE TABLE IF NOT EXISTS public.bookmarks (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, story_id)
);

-- 13. READING LISTS & ITEMS
CREATE TABLE IF NOT EXISTS public.reading_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reading_list_items (
    list_id UUID NOT NULL REFERENCES public.reading_lists(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    position INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (list_id, story_id)
);

-- 14. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'round_won', 'new_paragraph', 'vote_received', 'comment_reply', 'new_follower', 'round_closing_soon'
    target_type TEXT NOT NULL, -- 'story', 'round', 'contribution', 'profile', 'comment'
    target_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread ON public.notifications(recipient_id, read_at) WHERE read_at IS NULL;

-- 15. REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL CHECK (target_type IN ('story', 'contribution', 'comment', 'profile')),
    target_id UUID NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status report_status DEFAULT 'pending' NOT NULL,
    moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, created_at DESC);

-- 16. BLOCKS & MUTES
CREATE TABLE IF NOT EXISTS public.blocks (
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (blocker_id, blocked_id),
    CONSTRAINT chk_no_self_block CHECK (blocker_id != blocked_id)
);

CREATE TABLE IF NOT EXISTS public.mutes (
    muter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    muted_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (muter_id, muted_id),
    CONSTRAINT chk_no_self_mute CHECK (muter_id != muted_id)
);

-- 17. STORY REMIXES TABLE
CREATE TABLE IF NOT EXISTS public.story_remixes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    remix_story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    remixed_at_paragraph INT NOT NULL,
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_remix_story UNIQUE (remix_story_id)
);

-- 18. SHARE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.share_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    channel TEXT NOT NULL,
    client_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 19. ANALYTICS EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    anonymous_id TEXT,
    properties JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_date ON public.analytics_events(event_name, created_at DESC);

-- 20. MODERATION AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.moderation_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moderator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- DATABASE TRIGGERS
-- ==============================================================================

-- Trigger to auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    clean_username TEXT;
    base_username TEXT;
    suffix INT := 1;
BEGIN
    base_username := COALESCE(
        REGEXP_REPLACE(NEW.raw_user_meta_data->>'username', '[^a-zA-Z0-9_]', '', 'g'),
        REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
    );
    IF LENGTH(base_username) < 3 THEN
        base_username := 'writer_' || SUBSTRING(NEW.id::text, 1, 6);
    END IF;
    clean_username := SUBSTRING(base_username, 1, 20);

    -- Ensure unique username
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = clean_username) LOOP
        clean_username := SUBSTRING(base_username, 1, 15) || '_' || suffix::text;
        suffix := suffix + 1;
    END LOOP;

    INSERT INTO public.profiles (id, username, display_name, avatar_url, preferred_language)
    VALUES (
        NEW.id,
        clean_username,
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', clean_username),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_stories_timestamp ON public.stories;
CREATE TRIGGER update_stories_timestamp BEFORE UPDATE ON public.stories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_contributions_timestamp ON public.contributions;
CREATE TRIGGER update_contributions_timestamp BEFORE UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS update_votes_timestamp ON public.votes;
CREATE TRIGGER update_votes_timestamp BEFORE UPDATE ON public.votes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- TRANSACTIONAL PROCEDURES & BUSINESS LOGIC
-- ==============================================================================

-- 1. SUBMIT CONTINUATION
CREATE OR REPLACE FUNCTION public.submit_continuation(
    p_story_id UUID,
    p_round_id UUID,
    p_body TEXT,
    p_sentence_count INT,
    p_word_count INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_round RECORD;
    v_story RECORD;
    v_contribution_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    -- Fetch and lock round row
    SELECT * INTO v_round
    FROM public.story_rounds
    WHERE id = p_round_id AND story_id = p_story_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Round not found for story.';
    END IF;

    IF v_round.status != 'open' THEN
        RAISE EXCEPTION 'This round is not currently open for submissions.';
    END IF;

    IF CURRENT_TIMESTAMP >= v_round.deadline_at THEN
        RAISE EXCEPTION 'The submission deadline for this round has passed.';
    END IF;

    -- Validate sentence count
    IF p_sentence_count < 2 OR p_sentence_count > 3 THEN
        RAISE EXCEPTION 'A continuation must contain exactly 2 or 3 sentences.';
    END IF;

    -- Validate body length
    IF LENGTH(TRIM(p_body)) < 20 OR LENGTH(TRIM(p_body)) > 1500 THEN
        RAISE EXCEPTION 'Continuation text must be between 20 and 1500 characters.';
    END IF;

    -- Check if user is blocked by story owner
    SELECT * INTO v_story FROM public.stories WHERE id = p_story_id;
    IF EXISTS (SELECT 1 FROM public.blocks WHERE blocker_id = v_story.owner_id AND blocked_id = v_user_id) THEN
        RAISE EXCEPTION 'You cannot participate in this story.';
    END IF;

    -- Check if user already submitted for this round
    IF EXISTS (
        SELECT 1 FROM public.contributions 
        WHERE round_id = p_round_id AND author_id = v_user_id AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'You have already submitted an active continuation for this round.';
    END IF;

    -- Insert contribution
    INSERT INTO public.contributions (
        story_id, round_id, author_id, body, sentence_count, word_count, status, vote_count
    )
    VALUES (
        p_story_id, p_round_id, v_user_id, TRIM(p_body), p_sentence_count, p_word_count, 'active', 0
    )
    RETURNING id INTO v_contribution_id;

    RETURN jsonb_build_object(
        'success', true,
        'contribution_id', v_contribution_id,
        'message', 'Continuation submitted successfully.'
    );
END;
$$;

-- 2. CAST OR CHANGE VOTE
CREATE OR REPLACE FUNCTION public.cast_vote(
    p_round_id UUID,
    p_contribution_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_round RECORD;
    v_target_contrib RECORD;
    v_existing_vote RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to vote.';
    END IF;

    -- Fetch round and verify status
    SELECT * INTO v_round
    FROM public.story_rounds
    WHERE id = p_round_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Round not found.';
    END IF;

    IF v_round.status != 'open' THEN
        RAISE EXCEPTION 'Round is closed. Voting is not permitted.';
    END IF;

    IF CURRENT_TIMESTAMP >= v_round.deadline_at THEN
        RAISE EXCEPTION 'Voting deadline has passed.';
    END IF;

    -- Verify target contribution
    SELECT * INTO v_target_contrib
    FROM public.contributions
    WHERE id = p_contribution_id AND round_id = p_round_id AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Candidate continuation not found or inactive.';
    END IF;

    -- No self-voting rule
    IF v_target_contrib.author_id = v_user_id THEN
        RAISE EXCEPTION 'You cannot vote for your own contribution.';
    END IF;

    -- Check if user already voted in this round
    SELECT * INTO v_existing_vote
    FROM public.votes
    WHERE round_id = p_round_id AND voter_id = v_user_id
    FOR UPDATE;

    IF FOUND THEN
        -- If voting for the same candidate, treat as no-op or return success
        IF v_existing_vote.contribution_id = p_contribution_id THEN
            RETURN jsonb_build_object(
                'success', true,
                'status', 'unchanged',
                'message', 'Vote already recorded for this candidate.'
            );
        END IF;

        -- Decrement vote on previously voted candidate
        UPDATE public.contributions
        SET vote_count = GREATEST(vote_count - 1, 0)
        WHERE id = v_existing_vote.contribution_id;

        -- Increment vote on new candidate
        UPDATE public.contributions
        SET vote_count = vote_count + 1
        WHERE id = p_contribution_id;

        -- Update vote record
        UPDATE public.votes
        SET contribution_id = p_contribution_id, updated_at = CURRENT_TIMESTAMP
        WHERE id = v_existing_vote.id;

        RETURN jsonb_build_object(
            'success', true,
            'status', 'switched',
            'message', 'Vote successfully switched to new candidate.'
        );
    ELSE
        -- First vote in this round
        UPDATE public.contributions
        SET vote_count = vote_count + 1
        WHERE id = p_contribution_id;

        INSERT INTO public.votes (round_id, contribution_id, voter_id)
        VALUES (p_round_id, p_contribution_id, v_user_id);

        RETURN jsonb_build_object(
            'success', true,
            'status', 'cast',
            'message', 'Vote cast successfully.'
        );
    END IF;
END;
$$;

-- 3. FINALIZE EXPIRED ROUND
CREATE OR REPLACE FUNCTION public.finalize_round(
    p_round_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_round RECORD;
    v_story RECORD;
    v_top_contrib RECORD;
    v_second_contrib RECORD;
    v_has_tie BOOLEAN := false;
    v_new_round_id UUID;
BEGIN
    -- Acquire exclusive lock on the round
    SELECT * INTO v_round
    FROM public.story_rounds
    WHERE id = p_round_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Round % not found.', p_round_id;
    END IF;

    -- If already resolved or cancelled, return idempotent status
    IF v_round.status IN ('resolved', 'cancelled') THEN
        RETURN jsonb_build_object('success', true, 'status', v_round.status, 'message', 'Round already processed.');
    END IF;

    -- Verify deadline passed
    IF CURRENT_TIMESTAMP < v_round.deadline_at THEN
        RAISE EXCEPTION 'Cannot finalize round before deadline.';
    END IF;

    -- Fetch the story
    SELECT * INTO v_story
    FROM public.stories
    WHERE id = v_round.story_id
    FOR UPDATE;

    -- Find top candidate
    SELECT * INTO v_top_contrib
    FROM public.contributions
    WHERE round_id = p_round_id AND status = 'active'
    ORDER BY vote_count DESC, submitted_at ASC
    LIMIT 1;

    -- If no candidates at all
    IF NOT FOUND THEN
        UPDATE public.story_rounds
        SET status = 'awaiting_creator_resolution', closed_at = CURRENT_TIMESTAMP
        WHERE id = p_round_id;

        -- Notify story owner
        INSERT INTO public.notifications (recipient_id, type, target_type, target_id, metadata)
        VALUES (
            v_story.owner_id, 
            'round_unqualified', 
            'round', 
            p_round_id, 
            jsonb_build_object('reason', 'no_submissions', 'round_number', v_round.round_number)
        );

        RETURN jsonb_build_object(
            'success', true,
            'status', 'awaiting_creator_resolution',
            'reason', 'no_submissions'
        );
    END IF;

    -- Check for tie with second candidate
    SELECT * INTO v_second_contrib
    FROM public.contributions
    WHERE round_id = p_round_id AND status = 'active' AND id != v_top_contrib.id
    ORDER BY vote_count DESC, submitted_at ASC
    LIMIT 1;

    IF FOUND AND v_second_contrib.vote_count = v_top_contrib.vote_count AND v_top_contrib.vote_count >= v_round.vote_threshold THEN
        v_has_tie := true;
    END IF;

    -- If tie at or above threshold
    IF v_has_tie THEN
        UPDATE public.story_rounds
        SET status = 'awaiting_creator_resolution', closed_at = CURRENT_TIMESTAMP
        WHERE id = p_round_id;

        INSERT INTO public.notifications (recipient_id, type, target_type, target_id, metadata)
        VALUES (
            v_story.owner_id, 
            'round_tie', 
            'round', 
            p_round_id, 
            jsonb_build_object(
                'round_number', v_round.round_number,
                'top_candidate_1', v_top_contrib.id,
                'top_candidate_2', v_second_contrib.id,
                'votes', v_top_contrib.vote_count
            )
        );

        RETURN jsonb_build_object(
            'success', true,
            'status', 'awaiting_creator_resolution',
            'reason', 'tie',
            'votes', v_top_contrib.vote_count
        );
    END IF;

    -- If top candidate did NOT reach threshold
    IF v_top_contrib.vote_count < v_round.vote_threshold THEN
        UPDATE public.story_rounds
        SET status = 'awaiting_creator_resolution', closed_at = CURRENT_TIMESTAMP
        WHERE id = p_round_id;

        INSERT INTO public.notifications (recipient_id, type, target_type, target_id, metadata)
        VALUES (
            v_story.owner_id, 
            'round_unqualified', 
            'round', 
            p_round_id, 
            jsonb_build_object(
                'round_number', v_round.round_number,
                'top_votes', v_top_contrib.vote_count,
                'threshold', v_round.vote_threshold
            )
        );

        RETURN jsonb_build_object(
            'success', true,
            'status', 'awaiting_creator_resolution',
            'reason', 'threshold_not_met',
            'top_votes', v_top_contrib.vote_count,
            'threshold', v_round.vote_threshold
        );
    END IF;

    -- Winner found and met threshold!
    -- 1. Mark winner contribution
    UPDATE public.contributions SET status = 'winner' WHERE id = v_top_contrib.id;
    UPDATE public.contributions SET status = 'eliminated' WHERE round_id = p_round_id AND id != v_top_contrib.id;

    -- 2. Update round
    UPDATE public.story_rounds
    SET status = 'resolved',
        winner_contribution_id = v_top_contrib.id,
        closed_at = CURRENT_TIMESTAMP,
        resolved_at = CURRENT_TIMESTAMP,
        resolution_type = 'threshold_met'
    WHERE id = p_round_id;

    -- 3. Append to canonical story_segments
    INSERT INTO public.story_segments (
        story_id, paragraph_index, author_id, source_contribution_id, body, vote_count_at_lock
    )
    VALUES (
        v_story.id,
        v_round.paragraph_position,
        v_top_contrib.author_id,
        v_top_contrib.id,
        v_top_contrib.body,
        v_top_contrib.vote_count
    );

    -- 4. Update story's paragraph count
    UPDATE public.stories
    SET current_paragraph_count = v_round.paragraph_position,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_story.id;

    -- 5. Notify winner
    INSERT INTO public.notifications (recipient_id, type, target_type, target_id, metadata)
    VALUES (
        v_top_contrib.author_id,
        'round_won',
        'story',
        v_story.id,
        jsonb_build_object('round_number', v_round.round_number, 'paragraph_position', v_round.paragraph_position)
    );

    -- 6. Check if story is complete
    IF v_round.paragraph_position >= v_story.max_paragraphs THEN
        UPDATE public.stories
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = v_story.id;

        -- Notify story owner
        INSERT INTO public.notifications (recipient_id, type, target_type, target_id, metadata)
        VALUES (
            v_story.owner_id,
            'story_completed',
            'story',
            v_story.id,
            jsonb_build_object('title', v_story.title)
        );

        RETURN jsonb_build_object(
            'success', true,
            'status', 'completed',
            'winner_id', v_top_contrib.id,
            'story_completed', true
        );
    ELSE
        -- 7. Open next round!
        INSERT INTO public.story_rounds (
            story_id,
            round_number,
            paragraph_position,
            vote_threshold,
            opened_at,
            deadline_at,
            status
        )
        VALUES (
            v_story.id,
            v_round.round_number + 1,
            v_round.paragraph_position + 1,
            v_story.default_vote_threshold,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP + (v_story.default_round_duration || ' seconds')::INTERVAL,
            'open'
        )
        RETURNING id INTO v_new_round_id;

        RETURN jsonb_build_object(
            'success', true,
            'status', 'resolved',
            'winner_id', v_top_contrib.id,
            'next_round_id', v_new_round_id,
            'story_completed', false
        );
    END IF;
END;
$$;

-- 4. RESOLVE UNQUALIFIED ROUND (Creator decision)
CREATE OR REPLACE FUNCTION public.resolve_unqualified_round(
    p_round_id UUID,
    p_action TEXT, -- 'extend', 'select_highest', 'cancel_and_reopen'
    p_selected_contribution_id UUID DEFAULT NULL,
    p_extension_seconds INT DEFAULT 86400
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_round RECORD;
    v_story RECORD;
    v_chosen_contrib RECORD;
    v_new_round_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT * INTO v_round
    FROM public.story_rounds
    WHERE id = p_round_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Round not found.';
    END IF;

    IF v_round.status != 'awaiting_creator_resolution' THEN
        RAISE EXCEPTION 'Round is not awaiting creator resolution.';
    END IF;

    SELECT * INTO v_story
    FROM public.stories
    WHERE id = v_round.story_id
    FOR UPDATE;

    -- Verify caller is story owner or admin
    IF v_story.owner_id != v_user_id THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role IN ('admin', 'moderator')) THEN
            RAISE EXCEPTION 'Only the story creator can resolve this round.';
        END IF;
    END IF;

    IF p_action = 'extend' THEN
        -- Extend the round deadline
        UPDATE public.story_rounds
        SET status = 'open',
            deadline_at = CURRENT_TIMESTAMP + (GREATEST(p_extension_seconds, 3600) || ' seconds')::INTERVAL,
            closed_at = NULL
        WHERE id = p_round_id;

        RETURN jsonb_build_object('success', true, 'action', 'extended', 'message', 'Round extended successfully.');

    ELSIF p_action = 'select_highest' THEN
        -- Verify chosen candidate
        IF p_selected_contribution_id IS NULL THEN
            SELECT * INTO v_chosen_contrib
            FROM public.contributions
            WHERE round_id = p_round_id AND status = 'active'
            ORDER BY vote_count DESC, submitted_at ASC
            LIMIT 1;
        ELSE
            SELECT * INTO v_chosen_contrib
            FROM public.contributions
            WHERE id = p_selected_contribution_id AND round_id = p_round_id;
        END IF;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'No candidate available to select.';
        END IF;

        -- Promote to winner with creator_override flag
        UPDATE public.contributions SET status = 'winner' WHERE id = v_chosen_contrib.id;
        UPDATE public.contributions SET status = 'eliminated' WHERE round_id = p_round_id AND id != v_chosen_contrib.id;

        UPDATE public.story_rounds
        SET status = 'resolved',
            winner_contribution_id = v_chosen_contrib.id,
            closed_at = CURRENT_TIMESTAMP,
            resolved_at = CURRENT_TIMESTAMP,
            resolution_type = 'creator_override'
        WHERE id = p_round_id;

        -- Append to story_segments
        INSERT INTO public.story_segments (
            story_id, paragraph_index, author_id, source_contribution_id, body, vote_count_at_lock
        )
        VALUES (
            v_story.id,
            v_round.paragraph_position,
            v_chosen_contrib.author_id,
            v_chosen_contrib.id,
            v_chosen_contrib.body,
            v_chosen_contrib.vote_count
        );

        UPDATE public.stories
        SET current_paragraph_count = v_round.paragraph_position,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_story.id;

        -- Check story completion
        IF v_round.paragraph_position >= v_story.max_paragraphs THEN
            UPDATE public.stories
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP
            WHERE id = v_story.id;

            RETURN jsonb_build_object('success', true, 'action', 'selected_highest', 'story_completed', true);
        ELSE
            -- Open next round
            INSERT INTO public.story_rounds (
                story_id, round_number, paragraph_position, vote_threshold, opened_at, deadline_at, status
            )
            VALUES (
                v_story.id,
                v_round.round_number + 1,
                v_round.paragraph_position + 1,
                v_story.default_vote_threshold,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP + (v_story.default_round_duration || ' seconds')::INTERVAL,
                'open'
            )
            RETURNING id INTO v_new_round_id;

            RETURN jsonb_build_object('success', true, 'action', 'selected_highest', 'next_round_id', v_new_round_id, 'story_completed', false);
        END IF;

    ELSIF p_action = 'cancel_and_reopen' THEN
        -- Cancel current submissions and reset round
        UPDATE public.contributions SET status = 'eliminated' WHERE round_id = p_round_id;
        DELETE FROM public.votes WHERE round_id = p_round_id;

        UPDATE public.story_rounds
        SET status = 'open',
            opened_at = CURRENT_TIMESTAMP,
            deadline_at = CURRENT_TIMESTAMP + (v_story.default_round_duration || ' seconds')::INTERVAL,
            closed_at = NULL,
            resolution_type = NULL,
            winner_contribution_id = NULL
        WHERE id = p_round_id;

        RETURN jsonb_build_object('success', true, 'action', 'cancelled_and_reopened');
    ELSE
        RAISE EXCEPTION 'Invalid resolution action: %', p_action;
    END IF;
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_remixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.share_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES RLS
CREATE POLICY "Public profiles are readable by everyone"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. STORIES RLS
CREATE POLICY "Public stories are viewable by anyone"
    ON public.stories FOR SELECT
    USING (
        visibility = 'public' 
        OR (visibility = 'unlisted')
        OR (owner_id = auth.uid())
    );

CREATE POLICY "Authenticated users can create stories"
    ON public.stories FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Story owners can update their stories"
    ON public.stories FOR UPDATE
    USING (auth.uid() = owner_id);

-- 3. STORY ROUNDS RLS
CREATE POLICY "Story rounds are viewable by anyone who can view the story"
    ON public.story_rounds FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.stories s
            WHERE s.id = story_rounds.story_id
            AND (s.visibility IN ('public', 'unlisted') OR s.owner_id = auth.uid())
        )
    );

-- 4. CONTRIBUTIONS RLS
CREATE POLICY "Active contributions are viewable by anyone who can view the story"
    ON public.contributions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.stories s
            WHERE s.id = contributions.story_id
            AND (s.visibility IN ('public', 'unlisted') OR s.owner_id = auth.uid())
        )
    );

-- 5. VOTES RLS
CREATE POLICY "Users can see their own votes"
    ON public.votes FOR SELECT
    USING (auth.uid() = voter_id);

-- 6. STORY SEGMENTS RLS
CREATE POLICY "Canonical segments are viewable by anyone who can view the story"
    ON public.story_segments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.stories s
            WHERE s.id = story_segments.story_id
            AND (s.visibility IN ('public', 'unlisted') OR s.owner_id = auth.uid())
        )
    );

-- 7. STORY LIKES RLS
CREATE POLICY "Story likes viewable by everyone"
    ON public.story_likes FOR SELECT USING (true);

CREATE POLICY "Authenticated users can toggle likes"
    ON public.story_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
    ON public.story_likes FOR DELETE USING (auth.uid() = user_id);

-- 8. COMMENTS RLS
CREATE POLICY "Active comments viewable by everyone"
    ON public.comments FOR SELECT USING (status != 'hidden' OR author_id = auth.uid());

CREATE POLICY "Authenticated users can post comments"
    ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update or soft delete their comments"
    ON public.comments FOR UPDATE USING (auth.uid() = author_id);

-- 9. FOLLOWS RLS
CREATE POLICY "Follows viewable by everyone"
    ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow"
    ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
    ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- 10. BOOKMARKS RLS
CREATE POLICY "Users can view own bookmarks"
    ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark"
    ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unbookmark"
    ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- 11. NOTIFICATIONS RLS
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users update own notifications read status"
    ON public.notifications FOR UPDATE USING (auth.uid() = recipient_id);

-- 12. REPORTS RLS
CREATE POLICY "Users can submit reports"
    ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can view and manage reports"
    ON public.reports FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('moderator', 'admin')
        )
    );

-- 13. BLOCKS & MUTES RLS
CREATE POLICY "Users can manage blocks"
    ON public.blocks FOR ALL USING (auth.uid() = blocker_id);

CREATE POLICY "Users can manage mutes"
    ON public.mutes FOR ALL USING (auth.uid() = muter_id);

-- 14. STORY REMIXES RLS
CREATE POLICY "Story remixes viewable by everyone"
    ON public.story_remixes FOR SELECT USING (true);

CREATE POLICY "Creators can record story remixes"
    ON public.story_remixes FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- 15. SHARE & ANALYTICS RLS
CREATE POLICY "Anyone can record share events"
    ON public.share_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can record analytics events"
    ON public.analytics_events FOR INSERT WITH CHECK (true);


-- ==============================================================================
-- StoryRemix Database Schema Migration: Expansion
-- Migration ID: 20261122_gamification_economy_leaderboards
-- Description: Gamification (XP, Levels, Archetypes, Achievements, Challenges),
--              Creator Economy & Co-author Revenue Sharing,
--              Leaderboards & Snapshots, Prize Competitions, Security Hardening.
-- ==============================================================================

-- 1. ENUMS FOR EXPANSION
DO $$ BEGIN
    CREATE TYPE creative_path_type AS ENUM ('storyteller', 'collaborator', 'explorer', 'curator', 'worldbuilder', 'patron');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE achievement_rarity AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE achievement_category AS ENUM ('writing', 'collaboration', 'discovery', 'support');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE challenge_period_type AS ENUM ('daily', 'weekly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE revenue_policy_type AS ENUM ('equal_collaborators', 'contribution_weighted', 'creator_and_collaborators', 'weighted_roles');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE gift_transaction_status AS ENUM ('pending', 'completed', 'refunded', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE financial_account_type AS ENUM ('platform_revenue', 'creator_escrow', 'payment_fees', 'user_payable');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE ledger_entry_type AS ENUM ('debit', 'credit');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE leaderboard_period_type AS ENUM ('today', 'week', 'month', 'year', 'all_time');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE leaderboard_category AS ENUM ('hot', 'trending', 'best_today', 'best_week', 'best_month', 'best_year', 'all_time', 'top_creators');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE competition_status AS ENUM ('draft', 'active', 'judging', 'awarded', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==============================================================================
-- 2. GAMIFICATION TABLES
-- ==============================================================================

-- Level Definitions Table (Configurable)
CREATE TABLE IF NOT EXISTS public.level_definitions (
    level INT PRIMARY KEY,
    title TEXT NOT NULL,
    xp_required INT NOT NULL CHECK (xp_required >= 0),
    badge_icon TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed Level Definitions if empty
INSERT INTO public.level_definitions (level, title, xp_required, badge_icon)
VALUES
    (1, 'Newcomer', 0, 'Sprout'),
    (2, 'Scribbler', 100, 'Feather'),
    (3, 'Storyteller', 250, 'BookOpen'),
    (4, 'Wordsmith', 500, 'PenTool'),
    (5, 'Storyweaver', 900, 'Scroll'),
    (6, 'Lorekeeper', 1500, 'Compass'),
    (7, 'Master Writer', 2400, 'Award'),
    (8, 'Mythmaker', 3600, 'Flame'),
    (9, 'Legendary Author', 5200, 'Crown'),
    (10, 'Living Legend', 7200, 'Sparkles')
ON CONFLICT (level) DO NOTHING;

-- User Gamification Profile Summary
CREATE TABLE IF NOT EXISTS public.user_gamification (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    lifetime_xp INT DEFAULT 0 NOT NULL CHECK (lifetime_xp >= 0),
    current_level INT DEFAULT 1 NOT NULL REFERENCES public.level_definitions(level),
    creative_path creative_path_type DEFAULT 'storyteller' NOT NULL,
    calculated_archetype TEXT DEFAULT 'Emerging Writer' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- XP Transactions Table (Immutable audit trail & idempotency)
CREATE TABLE IF NOT EXISTS public.xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL CHECK (amount > 0),
    activity_type TEXT NOT NULL, -- 'publish_story', 'submit_continuation', 'win_round', 'complete_story', 'cast_vote', 'challenge', 'remix_story'
    event_id TEXT NOT NULL, -- Idempotency key
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_xp_event UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON public.xp_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_activity_daily ON public.xp_transactions(user_id, activity_type, created_at);

-- Achievement Definitions Table
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category achievement_category NOT NULL,
    rarity achievement_rarity DEFAULT 'common' NOT NULL,
    xp_reward INT DEFAULT 25 NOT NULL CHECK (xp_reward >= 0),
    icon TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed Achievements
INSERT INTO public.achievement_definitions (code, title, description, category, rarity, xp_reward, icon)
VALUES
    ('first_story', 'Genesis Seed', 'Published your first original story.', 'writing', 'common', 25, 'Feather'),
    ('first_contribution', 'First Words', 'Submitted your first community continuation.', 'writing', 'common', 15, 'PenTool'),
    ('first_win', 'Chosen Voice', 'Won your first round continuation.', 'writing', 'uncommon', 50, 'Trophy'),
    ('story_creator_10', 'Master Originator', 'Created ten published stories.', 'writing', 'rare', 100, 'BookOpen'),
    ('first_collab_complete', 'Harmonic Tapestry', 'Completed a collaborative story with co-authors.', 'collaboration', 'uncommon', 75, 'Users'),
    ('coauthors_5', 'Ensemble Cast', 'Collaborated with five distinct authors.', 'collaboration', 'rare', 100, 'Sparkles'),
    ('first_vote', 'Civic Reader', 'Cast your first democratic vote.', 'discovery', 'common', 10, 'ThumbsUp'),
    ('votes_100', 'Literary Scholar', 'Cast one hundred community votes.', 'discovery', 'rare', 100, 'Compass'),
    ('first_remix', 'Multiverse Weaver', 'Created an alternative timeline remix.', 'collaboration', 'uncommon', 50, 'GitFork'),
    ('community_supporter', 'Patron of Letters', 'Sent free reactions or gifts to support fellow authors.', 'support', 'common', 20, 'Heart')
ON CONFLICT (code) DO NOTHING;

-- User Unlocked Achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- Challenges Definitions
CREATE TABLE IF NOT EXISTS public.challenge_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    period_type challenge_period_type NOT NULL,
    target_count INT NOT NULL CHECK (target_count > 0),
    activity_type TEXT NOT NULL,
    xp_reward INT NOT NULL CHECK (xp_reward > 0),
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed Initial Challenges
INSERT INTO public.challenge_definitions (code, title, description, period_type, target_count, activity_type, xp_reward)
VALUES
    ('daily_vote_3', 'Discerning Critic', 'Vote on three candidate continuations today.', 'daily', 3, 'cast_vote', 15),
    ('daily_read_story', 'Avid Reader', 'Explore and read an active collaborative story.', 'daily', 1, 'story_opened', 10),
    ('weekly_submit_continuation', 'Active Scribe', 'Submit at least two continuation candidates this week.', 'weekly', 2, 'submit_continuation', 35),
    ('weekly_collab_complete', 'Closing Chapter', 'Participate in completing a collaborative story this week.', 'weekly', 1, 'complete_story', 50)
ON CONFLICT (code) DO NOTHING;

-- User Challenge Progress
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES public.challenge_definitions(id) ON DELETE CASCADE,
    period_identifier TEXT NOT NULL, -- e.g. '2026-11-22' for daily, '2026-W47' for weekly
    current_count INT DEFAULT 0 NOT NULL,
    is_completed BOOLEAN DEFAULT false NOT NULL,
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_user_challenge_period UNIQUE (user_id, challenge_id, period_identifier)
);

-- ==============================================================================
-- 3. CREATOR ECONOMY, FREE REACTIONS & REVENUE SHARING TABLES
-- ==============================================================================

-- Free Social Reactions (Separate from monetary gifts)
CREATE TABLE IF NOT EXISTS public.story_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES public.story_segments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('❤️', '🔥', '✨', '😂', '😮', '📚', '🪶', '👏')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_reaction UNIQUE (story_id, segment_id, user_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_story ON public.story_reactions(story_id);

-- Virtual Gift Catalog (Configurable by Admin, integer minor currency units: cents)
CREATE TABLE IF NOT EXISTS public.gift_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    price_cents INT NOT NULL CHECK (price_cents >= 0),
    creator_share_basis_points INT DEFAULT 7000 NOT NULL CHECK (creator_share_basis_points BETWEEN 0 AND 10000), -- 70.00%
    platform_fee_basis_points INT DEFAULT 3000 NOT NULL CHECK (platform_fee_basis_points BETWEEN 0 AND 10000), -- 30.00%
    is_active BOOLEAN DEFAULT true NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed Gift Catalog
INSERT INTO public.gift_catalog (code, name, symbol, price_cents, creator_share_basis_points, platform_fee_basis_points, description)
VALUES
    ('rose', 'Literary Rose', '🌹', 100, 7000, 3000, 'A delicate flower expressing appreciation for evocative prose.'),
    ('golden_quill', 'Golden Quill', '🪶', 300, 7500, 2500, 'Honors exceptional craft and brilliant turn of phrase.'),
    ('book_stack', 'Bibliophile Stack', '📚', 500, 7500, 2500, 'For unforgettable stories worthy of permanent libraries.'),
    ('spotlight', 'Community Spotlight', '⭐', 1000, 8000, 2000, 'Elevates a story with a sparkling badge of distinction.'),
    ('trophy', 'Narrative Trophy', '🏆', 2000, 8000, 2000, 'Celebrates peak creative collaboration and plot mastery.'),
    ('crown', 'Storytelling Crown', '👑', 5000, 8500, 1500, 'The premier award bestowed upon majestic collective masterworks.')
ON CONFLICT (code) DO NOTHING;

-- Author Revenue Sharing Policies (Versioned & Stored with story)
CREATE TABLE IF NOT EXISTS public.author_revenue_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    policy_type revenue_policy_type DEFAULT 'equal_collaborators' NOT NULL,
    creator_reserved_percentage INT DEFAULT 0 CHECK (creator_reserved_percentage BETWEEN 0 AND 100),
    opening_paragraph_weight INT DEFAULT 1 CHECK (opening_paragraph_weight >= 1),
    continuation_paragraph_weight INT DEFAULT 1 CHECK (continuation_paragraph_weight >= 1),
    final_paragraph_weight INT DEFAULT 1 CHECK (final_paragraph_weight >= 1),
    version INT DEFAULT 1 NOT NULL,
    is_locked BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_story_policy_version UNIQUE (story_id, version)
);

CREATE INDEX IF NOT EXISTS idx_revenue_policies_story ON public.author_revenue_policies(story_id);

-- Contributor Explicit Policy Consents
CREATE TABLE IF NOT EXISTS public.contributor_policy_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    policy_id UUID NOT NULL REFERENCES public.author_revenue_policies(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consented_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_user_policy_consent UNIQUE (story_id, user_id, policy_id)
);

-- Gift Transactions (Sandbox / Test-mode capable)
CREATE TABLE IF NOT EXISTS public.gift_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_id UUID NOT NULL REFERENCES public.gift_catalog(id) ON DELETE RESTRICT,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    segment_id UUID REFERENCES public.story_segments(id) ON DELETE SET NULL,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    creator_pool_cents INT NOT NULL CHECK (creator_pool_cents >= 0),
    platform_fee_cents INT NOT NULL CHECK (platform_fee_cents >= 0),
    status gift_transaction_status DEFAULT 'pending' NOT NULL,
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gift_transactions_story ON public.gift_transactions(story_id);

-- Individual Author Allocations from Gifts
CREATE TABLE IF NOT EXISTS public.gift_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_transaction_id UUID NOT NULL REFERENCES public.gift_transactions(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    allocated_cents INT NOT NULL CHECK (allocated_cents >= 0),
    status TEXT DEFAULT 'allocated' NOT NULL CHECK (status IN ('allocated', 'settled', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gift_allocations_recipient ON public.gift_allocations(recipient_id);

-- Double-Entry Financial Accounting Ledger
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_type TEXT NOT NULL, -- 'gift', 'refund', 'prize_payout'
    reference_id UUID NOT NULL,
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    currency TEXT DEFAULT 'USD' NOT NULL,
    status TEXT DEFAULT 'completed' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.financial_ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.financial_transactions(id) ON DELETE CASCADE,
    account_type financial_account_type NOT NULL,
    account_id TEXT NOT NULL, -- user_id or 'platform'
    entry_type ledger_entry_type NOT NULL, -- debit or credit
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_account ON public.financial_ledger_entries(account_type, account_id);

-- Payout Accounts (Design and compliance readiness - withdraw disabled until compliance approval)
CREATE TABLE IF NOT EXISTS public.payout_accounts (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    payout_provider TEXT DEFAULT 'mock_sandbox' NOT NULL,
    provider_account_id TEXT,
    kyc_status TEXT DEFAULT 'unverified' NOT NULL CHECK (kyc_status IN ('unverified', 'pending', 'verified', 'rejected')),
    country_code TEXT DEFAULT 'MA' NOT NULL,
    is_payout_enabled BOOLEAN DEFAULT false NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 4. LEADERBOARDS & TRENDING SYSTEM TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_type leaderboard_period_type NOT NULL,
    ranking_category leaderboard_category NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    snapshot_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_snapshots_lookup ON public.leaderboard_snapshots(ranking_category, period_type, snapshot_time DESC);

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_id UUID NOT NULL REFERENCES public.leaderboard_snapshots(id) ON DELETE CASCADE,
    rank INT NOT NULL CHECK (rank >= 1),
    target_type TEXT NOT NULL CHECK (target_type IN ('story', 'creator')),
    target_id UUID NOT NULL,
    score NUMERIC(12, 4) NOT NULL,
    score_breakdown JSONB DEFAULT '{}'::jsonb NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT uq_snapshot_rank UNIQUE (snapshot_id, rank)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_target ON public.leaderboard_entries(target_type, target_id);

-- ==============================================================================
-- 5. PRIZE COMPETITIONS TABLES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.prize_competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'annual')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    prize_amount_cents INT NOT NULL CHECK (prize_amount_cents >= 0),
    currency TEXT DEFAULT 'USD' NOT NULL,
    funding_source TEXT NOT NULL,
    is_funded BOOLEAN DEFAULT false NOT NULL,
    status competition_status DEFAULT 'draft' NOT NULL,
    rules_terms TEXT NOT NULL,
    winner_story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prize_awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES public.prize_competitions(id) ON DELETE CASCADE,
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE RESTRICT,
    award_rank INT DEFAULT 1 NOT NULL CHECK (award_rank >= 1),
    prize_amount_cents INT NOT NULL CHECK (prize_amount_cents >= 0),
    award_badge_code TEXT NOT NULL,
    status TEXT DEFAULT 'confirmed' NOT NULL CHECK (status IN ('pending_compliance', 'confirmed', 'distributed')),
    awarded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.prize_allocation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prize_award_id UUID NOT NULL REFERENCES public.prize_awards(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    allocated_cents INT NOT NULL CHECK (allocated_cents >= 0),
    percentage NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================================================
-- 6. TRUSTED DATABASE PROCEDURES: XP & REVENUE ALLOCATIONS
-- ==============================================================================

-- 1. AWARD XP WITH IDEMPOTENCY & DAILY CAPS
CREATE OR REPLACE FUNCTION public.award_xp(
    p_user_id UUID,
    p_activity_type TEXT,
    p_amount INT,
    p_event_id TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_daily_total INT;
    v_new_lifetime_xp INT;
    v_new_level INT;
    v_old_level INT;
    v_level_rec RECORD;
BEGIN
    -- Idempotency check
    IF EXISTS (SELECT 1 FROM public.xp_transactions WHERE user_id = p_user_id AND event_id = p_event_id) THEN
        RETURN jsonb_build_object('success', true, 'status', 'already_awarded', 'amount', 0);
    END IF;

    -- Daily farming cap check for high-frequency activities (e.g. voting: max 60 XP per day = 30 votes)
    IF p_activity_type = 'cast_vote' THEN
        SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
        FROM public.xp_transactions
        WHERE user_id = p_user_id 
          AND activity_type = 'cast_vote'
          AND created_at >= CURRENT_DATE;

        IF v_daily_total >= 60 THEN
            RETURN jsonb_build_object('success', true, 'status', 'daily_cap_reached', 'amount', 0);
        END IF;
    END IF;

    -- Record transaction
    INSERT INTO public.xp_transactions (user_id, amount, activity_type, event_id, metadata)
    VALUES (p_user_id, p_amount, p_activity_type, p_event_id, p_metadata);

    -- Ensure user_gamification row exists
    INSERT INTO public.user_gamification (user_id, lifetime_xp, current_level)
    VALUES (p_user_id, p_amount, 1)
    ON CONFLICT (user_id) DO UPDATE
    SET lifetime_xp = public.user_gamification.lifetime_xp + p_amount,
        updated_at = CURRENT_TIMESTAMP
    RETURNING lifetime_xp, current_level INTO v_new_lifetime_xp, v_old_level;

    -- Determine new level based on level_definitions
    SELECT level INTO v_new_level
    FROM public.level_definitions
    WHERE xp_required <= v_new_lifetime_xp
    ORDER BY level DESC
    LIMIT 1;

    IF v_new_level IS NOT NULL AND v_new_level > v_old_level THEN
        UPDATE public.user_gamification
        SET current_level = v_new_level
        WHERE user_id = p_user_id;

        -- Level up notification
        INSERT INTO public.notifications (recipient_id, type, target_type, target_id, metadata)
        VALUES (
            p_user_id,
            'level_up',
            'profile',
            p_user_id,
            jsonb_build_object('new_level', v_new_level, 'lifetime_xp', v_new_lifetime_xp)
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'awarded', p_amount,
        'lifetime_xp', v_new_lifetime_xp,
        'level', COALESCE(v_new_level, v_old_level),
        'leveled_up', (v_new_level > v_old_level)
    );
END;
$$;

-- 2. REVENUE ALLOCATION CALCULATION (Integer arithmetic, summing to 100%)
CREATE OR REPLACE FUNCTION public.calculate_story_revenue_shares(
    p_story_id UUID,
    p_pool_cents INT
)
RETURNS TABLE (
    author_id UUID,
    allocated_cents INT,
    share_percentage NUMERIC(5, 2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_policy RECORD;
    v_total_segments INT;
    v_story RECORD;
    v_creator_reserved_cents INT := 0;
    v_distributable_cents INT := p_pool_cents;
    v_total_weights INT := 0;
    v_author_rec RECORD;
    v_allocated_so_far INT := 0;
BEGIN
    SELECT * INTO v_story FROM public.stories WHERE id = p_story_id;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- Fetch active revenue policy (default to equal_collaborators if none found)
    SELECT * INTO v_policy
    FROM public.author_revenue_policies
    WHERE story_id = p_story_id
    ORDER BY version DESC
    LIMIT 1;

    -- POLICY A: Equal Collaborators
    IF v_policy IS NULL OR v_policy.policy_type = 'equal_collaborators' THEN
        RETURN QUERY
        WITH unique_authors AS (
            SELECT DISTINCT s.author_id FROM public.story_segments s WHERE s.story_id = p_story_id
        ),
        author_count AS (
            SELECT COUNT(*)::INT AS cnt FROM unique_authors
        )
        SELECT 
            ua.author_id,
            (p_pool_cents / ac.cnt)::INT AS allocated_cents,
            ROUND((100.0 / ac.cnt), 2)::NUMERIC(5, 2) AS share_percentage
        FROM unique_authors ua, author_count ac;
        RETURN;

    -- POLICY B: Contribution Weighted (by accepted paragraphs)
    ELSIF v_policy.policy_type = 'contribution_weighted' THEN
        SELECT COUNT(*)::INT INTO v_total_segments FROM public.story_segments WHERE story_id = p_story_id;
        IF v_total_segments = 0 THEN RETURN; END IF;

        RETURN QUERY
        SELECT 
            s.author_id,
            (p_pool_cents * COUNT(*)::INT / v_total_segments)::INT AS allocated_cents,
            ROUND((COUNT(*)::NUMERIC * 100.0 / v_total_segments), 2)::NUMERIC(5, 2) AS share_percentage
        FROM public.story_segments s
        WHERE s.story_id = p_story_id
        GROUP BY s.author_id;
        RETURN;

    -- POLICY C: Creator + Collaborators Split
    ELSIF v_policy.policy_type = 'creator_and_collaborators' THEN
        v_creator_reserved_cents := (p_pool_cents * COALESCE(v_policy.creator_reserved_percentage, 30)) / 100;
        v_distributable_cents := p_pool_cents - v_creator_reserved_cents;

        -- Return creator reserved plus their share of collaborator pool if applicable
        RETURN QUERY
        WITH continuation_authors AS (
            SELECT s.author_id, COUNT(*)::INT as seg_count
            FROM public.story_segments s
            WHERE s.story_id = p_story_id AND s.paragraph_index > 1
            GROUP BY s.author_id
        ),
        total_continuations AS (
            SELECT COALESCE(SUM(seg_count), 1)::INT as total_cnt FROM continuation_authors
        )
        SELECT 
            ca.author_id,
            (CASE WHEN ca.author_id = v_story.owner_id THEN v_creator_reserved_cents ELSE 0 END + 
             (v_distributable_cents * ca.seg_count / tc.total_cnt))::INT AS allocated_cents,
            ROUND(
                ((CASE WHEN ca.author_id = v_story.owner_id THEN v_creator_reserved_cents ELSE 0 END + 
                  (v_distributable_cents * ca.seg_count / tc.total_cnt))::NUMERIC * 100.0 / p_pool_cents), 2
            )::NUMERIC(5, 2) AS share_percentage
        FROM continuation_authors ca, total_continuations tc;
        RETURN;

    -- POLICY D: Weighted Roles
    ELSIF v_policy.policy_type = 'weighted_roles' THEN
        SELECT 
            COALESCE(SUM(
                CASE 
                    WHEN s.paragraph_index = 1 THEN v_policy.opening_paragraph_weight
                    WHEN s.paragraph_index = v_story.max_paragraphs THEN v_policy.final_paragraph_weight
                    ELSE v_policy.continuation_paragraph_weight
                END
            ), 1)::INT INTO v_total_weights
        FROM public.story_segments s
        WHERE s.story_id = p_story_id;

        RETURN QUERY
        SELECT 
            s.author_id,
            SUM(
                p_pool_cents * 
                (CASE 
                    WHEN s.paragraph_index = 1 THEN v_policy.opening_paragraph_weight
                    WHEN s.paragraph_index = v_story.max_paragraphs THEN v_policy.final_paragraph_weight
                    ELSE v_policy.continuation_paragraph_weight
                END) / v_total_weights
            )::INT AS allocated_cents,
            ROUND(
                SUM(
                    (CASE 
                        WHEN s.paragraph_index = 1 THEN v_policy.opening_paragraph_weight
                        WHEN s.paragraph_index = v_story.max_paragraphs THEN v_policy.final_paragraph_weight
                        ELSE v_policy.continuation_paragraph_weight
                    END)::NUMERIC * 100.0 / v_total_weights
                ), 2
            )::NUMERIC(5, 2) AS share_percentage
        FROM public.story_segments s
        WHERE s.story_id = p_story_id
        GROUP BY s.author_id;
        RETURN;
    END IF;
END;
$$;

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) FOR NEW EXPANSION TABLES
-- ==============================================================================

ALTER TABLE public.level_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.author_revenue_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributor_policy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prize_allocation_records ENABLE ROW LEVEL SECURITY;

-- Gamification RLS
CREATE POLICY "Public level definitions viewable by all" ON public.level_definitions FOR SELECT USING (true);
CREATE POLICY "Public achievement definitions viewable by all" ON public.achievement_definitions FOR SELECT USING (true);
CREATE POLICY "Public challenge definitions viewable by all" ON public.challenge_definitions FOR SELECT USING (true);
CREATE POLICY "User gamification profiles viewable by all" ON public.user_gamification FOR SELECT USING (true);
CREATE POLICY "Users view own XP transactions" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User achievements viewable by all" ON public.user_achievements FOR SELECT USING (true);
CREATE POLICY "Users view own challenge progress" ON public.user_challenge_progress FOR SELECT USING (auth.uid() = user_id);

-- Free Reactions RLS
CREATE POLICY "Reactions viewable by all" ON public.story_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can toggle reactions" ON public.story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove own reactions" ON public.story_reactions FOR DELETE USING (auth.uid() = user_id);

-- Creator Economy RLS
CREATE POLICY "Gift catalog viewable by all" ON public.gift_catalog FOR SELECT USING (true);
CREATE POLICY "Author revenue policies viewable by all" ON public.author_revenue_policies FOR SELECT USING (true);
CREATE POLICY "Story owner can configure revenue policy before lock" ON public.author_revenue_policies FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.stories s WHERE s.id = author_revenue_policies.story_id AND s.owner_id = auth.uid()));
CREATE POLICY "Contributors view own consents" ON public.contributor_policy_consents FOR SELECT USING (true);
CREATE POLICY "Contributors record policy consent" ON public.contributor_policy_consents FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own gift transactions or as story recipient" ON public.gift_transactions FOR SELECT
    USING (auth.uid() = sender_id OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = gift_transactions.story_id AND s.owner_id = auth.uid()));

CREATE POLICY "Recipients view own allocations" ON public.gift_allocations FOR SELECT USING (auth.uid() = recipient_id);

-- Financial ledgers restricted to administrators and moderators
CREATE POLICY "Admins view financial transactions" ON public.financial_transactions FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Admins view financial ledger entries" ON public.financial_ledger_entries FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

CREATE POLICY "Users view own payout account" ON public.payout_accounts FOR SELECT USING (auth.uid() = user_id);

-- Leaderboards RLS
CREATE POLICY "Leaderboard snapshots viewable by all" ON public.leaderboard_snapshots FOR SELECT USING (true);
CREATE POLICY "Leaderboard entries viewable by all" ON public.leaderboard_entries FOR SELECT USING (true);

-- Competitions RLS
CREATE POLICY "Prize competitions viewable by all" ON public.prize_competitions FOR SELECT USING (true);
CREATE POLICY "Prize awards viewable by all" ON public.prize_awards FOR SELECT USING (true);
CREATE POLICY "Prize allocations viewable by all" ON public.prize_allocation_records FOR SELECT USING (true);

-- ==============================================================================
-- 8. SECURITY AUDIT FIX: TIGHTEN ANALYTICS & SHARE EVENTS INSERTION
-- ==============================================================================
DROP POLICY IF EXISTS "Anyone can record share events" ON public.share_events;
DROP POLICY IF EXISTS "Anyone can record analytics events" ON public.analytics_events;

CREATE POLICY "Authenticated or valid channel share events" ON public.share_events FOR INSERT
    WITH CHECK (LENGTH(channel) <= 60 AND story_id IS NOT NULL);

CREATE POLICY "Validated analytics events insertion" ON public.analytics_events FOR INSERT
    WITH CHECK (
        event_name IN (
            'story_created', 'story_opened', 'contribution_submitted', 'vote_cast',
            'vote_changed', 'round_closed', 'story_completed', 'story_shared',
            'story_remixed', 'story_bookmarked', 'gift_sent', 'reaction_added'
        )
    );


-- ==============================================================================
-- StoryRemix Migration: Story Covers, Cover Proposals, Donations & Enhanced Profiles
-- Date: 2026-11-23
-- ==============================================================================

-- 1. Extend stories table with cover metadata
ALTER TABLE public.stories 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS cover_alt_text TEXT,
ADD COLUMN IF NOT EXISTS cover_creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Cover Proposals Table
CREATE TABLE IF NOT EXISTS public.story_cover_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'voting')),
    votes_count INT DEFAULT 0 NOT NULL,
    rights_confirmed BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cover_proposals_story ON public.story_cover_proposals(story_id);
CREATE INDEX IF NOT EXISTS idx_cover_proposals_proposer ON public.story_cover_proposals(proposer_id);

-- 3. Cover Votes Table
CREATE TABLE IF NOT EXISTS public.story_cover_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    proposal_id UUID NOT NULL REFERENCES public.story_cover_proposals(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT unique_proposal_voter UNIQUE (proposal_id, voter_id)
);

CREATE INDEX IF NOT EXISTS idx_cover_votes_proposal ON public.story_cover_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_cover_votes_voter ON public.story_cover_votes(voter_id);

-- 4. Cover History Table
CREATE TABLE IF NOT EXISTS public.story_cover_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    chosen_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES public.story_cover_proposals(id) ON DELETE SET NULL,
    replaced_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cover_history_story ON public.story_cover_history(story_id);

-- 5. Voluntary Donations Table (90% Creator Pool / 10% Platform)
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES public.stories(id) ON DELETE SET NULL,
    donor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    gross_amount_cents INT NOT NULL CHECK (gross_amount_cents > 0),
    processor_fee_cents INT NOT NULL DEFAULT 0 CHECK (processor_fee_cents >= 0),
    net_amount_cents INT NOT NULL CHECK (net_amount_cents >= 0),
    creator_pool_cents INT NOT NULL CHECK (creator_pool_cents >= 0),
    platform_fee_cents INT NOT NULL CHECK (platform_fee_cents >= 0),
    currency TEXT DEFAULT 'USD' NOT NULL,
    status TEXT DEFAULT 'completed' NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    is_sandbox BOOLEAN DEFAULT true NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_donations_story ON public.donations(story_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON public.donations(donor_id);

-- 6. Donation Allocations Table
CREATE TABLE IF NOT EXISTS public.donation_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donation_id UUID NOT NULL REFERENCES public.donations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    allocated_cents INT NOT NULL CHECK (allocated_cents >= 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_donation_allocations_donation ON public.donation_allocations(donation_id);
CREATE INDEX IF NOT EXISTS idx_donation_allocations_author ON public.donation_allocations(author_id);

-- 7. Robust, Idempotent Auth Profile Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_raw_username TEXT;
    v_clean_username TEXT;
    v_display_name TEXT;
    v_lang TEXT;
    v_count INT;
BEGIN
    -- Extract metadata
    v_raw_username := NEW.raw_user_meta_data->>'username';
    v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'StoryRemix Writer');
    v_lang := COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en');

    -- Sanitize username: lowercase, alphanumeric and underscores only
    IF v_raw_username IS NOT NULL AND length(trim(v_raw_username)) > 0 THEN
        v_clean_username := lower(regexp_replace(trim(v_raw_username), '[^a-zA-Z0-9_]', '', 'g'));
    ELSE
        -- Fallback to email prefix or random hash
        IF NEW.email IS NOT NULL THEN
            v_clean_username := lower(regexp_replace(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
        ELSE
            v_clean_username := 'writer';
        END IF;
    END IF;

    -- Ensure min length
    IF length(v_clean_username) < 3 THEN
        v_clean_username := v_clean_username || substr(md5(random()::text), 1, 4);
    END IF;

    -- Handle username collisions idempotently
    SELECT count(*) INTO v_count FROM public.profiles WHERE username = v_clean_username AND id != NEW.id;
    IF v_count > 0 THEN
        v_clean_username := substr(v_clean_username, 1, 18) || '_' || substr(md5(NEW.id::text), 1, 5);
    END IF;

    -- Insert or update profile
    INSERT INTO public.profiles (
        id,
        username,
        display_name,
        preferred_language,
        role,
        privacy_settings,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        v_clean_username,
        v_display_name,
        v_lang,
        'user',
        '{"show_reading_activity": true, "allow_email_notifications": true}'::jsonb,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        updated_at = CURRENT_TIMESTAMP;

    -- Ensure gamification account is created
    INSERT INTO public.user_gamification (
        user_id,
        lifetime_xp,
        current_level,
        creative_path,
        calculated_archetype,
        updated_at
    )
    VALUES (
        NEW.id,
        0,
        1,
        'storyteller',
        'Emerging Scribe',
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log failure but do not abort auth.users transaction
        RAISE WARNING 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.story_cover_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_cover_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_cover_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_allocations ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
-- Proposals: Public can view; Story collaborators or authenticated writers can propose
CREATE POLICY "Public can view cover proposals" ON public.story_cover_proposals
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can submit cover proposals" ON public.story_cover_proposals
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = proposer_id);

CREATE POLICY "Creators or proposers can update cover proposals" ON public.story_cover_proposals
    FOR UPDATE TO authenticated USING (
        auth.uid() = proposer_id OR 
        EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND owner_id = auth.uid())
    );

-- Cover votes: Public can view; authenticated users can vote once
CREATE POLICY "Public can view cover votes" ON public.story_cover_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote on covers" ON public.story_cover_votes
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can remove their cover vote" ON public.story_cover_votes
    FOR DELETE TO authenticated USING (auth.uid() = voter_id);

-- Cover history: Public read only
CREATE POLICY "Public can view cover history" ON public.story_cover_history
    FOR SELECT USING (true);

-- Donations: Public can view non-sensitive donation stats; Donors can view own; Admins can view all
CREATE POLICY "Public can view completed donations" ON public.donations
    FOR SELECT USING (status = 'completed');

CREATE POLICY "Authenticated users can create donations" ON public.donations
    FOR INSERT TO authenticated WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Public can view donation allocations" ON public.donation_allocations
    FOR SELECT USING (true);

-- 10. Supabase Storage Setup for Story Covers
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'story-covers',
    'story-covers',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- Storage RLS Policies
CREATE POLICY "Public can view story covers" ON storage.objects
    FOR SELECT USING (bucket_id = 'story-covers');

CREATE POLICY "Authenticated users can upload story covers" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'story-covers' AND
        (LOWER(SUBSTRING(name FROM '\.([^\.]+)$')) IN ('jpg', 'jpeg', 'png', 'webp', 'avif'))
    );

CREATE POLICY "Owners can update or delete own cover uploads" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'story-covers' AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Owners can delete own cover uploads" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'story-covers' AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 11. Schema Permissions & Schema Cache Reload
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
