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
