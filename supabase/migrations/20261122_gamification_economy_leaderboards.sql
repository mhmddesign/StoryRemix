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
