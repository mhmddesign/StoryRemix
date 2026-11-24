-- ==============================================================================
-- STORYREMIX 2.0 TRANSFORMATION MIGRATION
-- UX Redesign, Public Demo Community, Referral Growth Engine, Virtual Economy &
-- Paragraph-Level Gifting Infrastructure
-- ==============================================================================

-- 1. ADD CLASSIFICATION & ONBOARDING COLUMNS
-- Idempotent Demo vs Real Separation
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS onboarding_step INT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS literary_interests TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL;

ALTER TABLE public.stories
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.story_segments
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.story_rounds
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.contributions
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.comments
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.story_likes
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;

ALTER TABLE public.votes
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false NOT NULL;

-- 2. HARDENED ATOMIC STORY CREATION RPC WITH ENUM CASTING & UNIQUE SLUGS
-- Cleanly drop all previous overloaded signatures of create_story_transaction
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'create_story_transaction'
          AND pronamespace = 'public'::regnamespace
    ) LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_story_transaction(
    p_title TEXT,
    p_slug TEXT,
    p_description TEXT,
    p_genre TEXT,
    p_tags TEXT[],
    p_language TEXT,
    p_visibility TEXT,
    p_max_paragraphs INT,
    p_default_vote_threshold INT,
    p_default_round_duration INT,
    p_cover_image_url TEXT,
    p_cover_alt_text TEXT,
    p_opening_text TEXT,
    p_revenue_policy_type TEXT DEFAULT 'equal_collaborators',
    p_creator_reserved_percentage INT DEFAULT 30,
    p_opening_paragraph_weight INT DEFAULT 2,
    p_continuation_paragraph_weight INT DEFAULT 1,
    p_final_paragraph_weight INT DEFAULT 2,
    p_is_demo BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile_exists BOOLEAN;
    v_user_email TEXT;
    v_user_meta JSONB;
    v_username TEXT;
    v_display_name TEXT;
    v_lang TEXT;
    v_story_id UUID;
    v_deadline TIMESTAMPTZ;
    v_story_result JSONB;
    v_slug TEXT;
    v_visibility story_visibility;
    v_policy_type revenue_policy_type;
BEGIN
    -- Ensure caller is authenticated (unless explicit demo seed execution)
    v_user_id := auth.uid();
    IF v_user_id IS NULL AND NOT p_is_demo THEN
        RAISE EXCEPTION 'Authentication required to create a story';
    END IF;

    -- Self-heal profile inside transaction if missing
    IF v_user_id IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = v_user_id) INTO v_profile_exists;
        IF NOT v_profile_exists THEN
            SELECT email, raw_user_meta_data INTO v_user_email, v_user_meta FROM auth.users WHERE id = v_user_id;

            v_username := COALESCE(
                NULLIF(LOWER(REGEXP_REPLACE(v_user_meta->>'username', '[^a-zA-Z0-9_]', '', 'g')), ''),
                NULLIF(LOWER(REGEXP_REPLACE(SPLIT_PART(v_user_email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')), ''),
                'writer_' || SUBSTRING(v_user_id::text, 1, 6)
            );
            IF LENGTH(v_username) < 3 THEN
                v_username := 'writer_' || SUBSTRING(v_user_id::text, 1, 6);
            END IF;

            IF EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) THEN
                v_username := SUBSTRING(v_username, 1, 14) || '_' || SUBSTRING(md5(v_user_id::text), 1, 5);
            END IF;

            v_display_name := COALESCE(v_user_meta->>'display_name', v_user_meta->>'full_name', v_username);
            v_lang := COALESCE(v_user_meta->>'preferred_language', p_language, 'en');

            INSERT INTO public.profiles (id, username, display_name, preferred_language, role, privacy_settings, is_demo)
            VALUES (
                v_user_id,
                v_username,
                v_display_name,
                v_lang,
                'user',
                '{"show_reading_activity": true, "allow_email_notifications": true}'::jsonb,
                p_is_demo
            )
            ON CONFLICT (id) DO NOTHING;

            INSERT INTO public.user_gamification (user_id, lifetime_xp, current_level, creative_path)
            VALUES (v_user_id, 0, 1, 'storyteller')
            ON CONFLICT (user_id) DO NOTHING;
        END IF;
    END IF;

    -- Safe cast for enum types with guaranteed defaults
    BEGIN
        v_visibility := p_visibility::story_visibility;
    EXCEPTION WHEN OTHERS THEN
        v_visibility := 'public'::story_visibility;
    END;

    BEGIN
        v_policy_type := p_revenue_policy_type::revenue_policy_type;
    EXCEPTION WHEN OTHERS THEN
        v_policy_type := 'equal_collaborators'::revenue_policy_type;
    END;

    -- Handle slug uniqueness
    v_slug := p_slug;
    IF EXISTS (SELECT 1 FROM public.stories WHERE slug = v_slug) THEN
        v_slug := v_slug || '-' || SUBSTRING(md5(gen_random_uuid()::text), 1, 5);
    END IF;

    -- 1. Insert Story
    INSERT INTO public.stories (
        owner_id,
        title,
        slug,
        description,
        genre,
        tags,
        language,
        visibility,
        max_paragraphs,
        current_paragraph_count,
        default_vote_threshold,
        default_round_duration,
        cover_image_url,
        cover_alt_text,
        status,
        is_demo
    )
    VALUES (
        v_user_id,
        p_title,
        v_slug,
        p_description,
        p_genre,
        p_tags,
        p_language,
        v_visibility,
        p_max_paragraphs,
        1,
        p_default_vote_threshold,
        p_default_round_duration,
        p_cover_image_url,
        p_cover_alt_text,
        'active',
        p_is_demo
    )
    RETURNING id INTO v_story_id;

    -- 2. Insert Opening Segment (Paragraph 1)
    INSERT INTO public.story_segments (
        story_id,
        paragraph_index,
        author_id,
        body,
        vote_count_at_lock,
        is_demo
    )
    VALUES (
        v_story_id,
        1,
        v_user_id,
        TRIM(p_opening_text),
        0,
        p_is_demo
    );

    -- 3. Open Round 1 for Paragraph 2
    v_deadline := CURRENT_TIMESTAMP + (p_default_round_duration || ' seconds')::INTERVAL;
    INSERT INTO public.story_rounds (
        story_id,
        round_number,
        paragraph_position,
        vote_threshold,
        opened_at,
        deadline_at,
        status,
        is_demo
    )
    VALUES (
        v_story_id,
        1,
        2,
        p_default_vote_threshold,
        CURRENT_TIMESTAMP,
        v_deadline,
        'open',
        p_is_demo
    );

    -- 4. Insert Revenue Sharing Policy
    INSERT INTO public.author_revenue_policies (
        story_id,
        policy_type,
        creator_reserved_percentage,
        opening_paragraph_weight,
        continuation_paragraph_weight,
        final_paragraph_weight,
        version
    )
    VALUES (
        v_story_id,
        v_policy_type,
        p_creator_reserved_percentage,
        p_opening_paragraph_weight,
        p_continuation_paragraph_weight,
        p_final_paragraph_weight,
        1
    );

    -- Return JSON object
    SELECT jsonb_build_object(
        'id', s.id,
        'slug', s.slug,
        'title', s.title,
        'owner_id', s.owner_id
    ) INTO v_story_result
    FROM public.stories s
    WHERE s.id = v_story_id;

    RETURN v_story_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_story_transaction(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, INT, INT, INT, TEXT, TEXT, TEXT, TEXT, INT, INT, INT, INT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_story_transaction(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT, TEXT, INT, INT, INT, TEXT, TEXT, TEXT, TEXT, INT, INT, INT, INT, BOOLEAN) TO anon;

-- 3. RLS PERMISSIONS FOR STORY OWNERS (FALLBACK HARDENING)
DROP POLICY IF EXISTS "Story owners can initialize opening segment" ON public.story_segments;
CREATE POLICY "Story owners can initialize opening segment"
    ON public.story_segments FOR INSERT
    TO authenticated
    WITH CHECK (
        paragraph_index = 1
        AND (select auth.uid()) = author_id
        AND EXISTS (
            SELECT 1 FROM public.stories s
            WHERE s.id = story_segments.story_id
            AND s.owner_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Story owners can initialize round 1" ON public.story_rounds;
CREATE POLICY "Story owners can initialize round 1"
    ON public.story_rounds FOR INSERT
    TO authenticated
    WITH CHECK (
        round_number = 1
        AND EXISTS (
            SELECT 1 FROM public.stories s
            WHERE s.id = story_rounds.story_id
            AND s.owner_id = (select auth.uid())
        )
    );

-- 4. DUAL-CURRENCY VIRTUAL WALLET & TRANSACTION LEDGER
CREATE TABLE IF NOT EXISTS public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    earned_points INT NOT NULL DEFAULT 0 CHECK (earned_points >= 0),
    purchased_credits INT NOT NULL DEFAULT 0 CHECK (purchased_credits >= 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(user_id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('earned_points', 'purchased_credits')),
    amount INT NOT NULL, -- Positive for credits/awards, negative for debits/purchases
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'welcome_bonus',
        'onboarding_reward',
        'referral_bonus',
        'referred_welcome',
        'contribution_reward',
        'round_win_reward',
        'gift_purchase',
        'gift_received',
        'super_like_sent',
        'super_like_received',
        'credit_purchase',
        'admin_adjustment'
    )),
    reference_id TEXT, -- Idempotency key or entity reference
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_ref ON public.wallet_transactions(reference_id);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet"
    ON public.wallets FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Users can view own wallet transactions"
    ON public.wallet_transactions FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = wallet_id);

-- 5. REFERRAL AND INVITATION SYSTEM
CREATE TABLE IF NOT EXISTS public.referral_codes (
    code TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    clicks_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.referral_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    referral_code TEXT NOT NULL REFERENCES public.referral_codes(code) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'qualified', 'rewarded', 'flagged')),
    qualifying_action TEXT,
    reward_points INT NOT NULL DEFAULT 100,
    rewarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referral_events_referrer ON public.referral_events(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_events_code ON public.referral_events(referral_code);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can lookup referral codes" ON public.referral_codes;
CREATE POLICY "Public can lookup referral codes"
    ON public.referral_codes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can view own referrals" ON public.referral_events;
CREATE POLICY "Users can view own referrals"
    ON public.referral_events FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = referrer_id OR (select auth.uid()) = referred_user_id);

-- 6. EXTENDED GIFT STORE & PARAGRAPH-LEVEL GIFTING
ALTER TABLE public.gift_catalog
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'earned_points' CHECK (currency IN ('earned_points', 'purchased_credits')),
    ADD COLUMN IF NOT EXISTS price_points INT DEFAULT 50 CHECK (price_points >= 0),
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'appreciation',
    ADD COLUMN IF NOT EXISTS is_super_like BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS icon_svg TEXT,
    ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'standard';

ALTER TABLE public.gift_transactions
    ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'story' CHECK (target_type IN ('paragraph', 'story', 'profile')),
    ADD COLUMN IF NOT EXISTS recipient_id UUID REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'earned_points' CHECK (currency IN ('earned_points', 'purchased_credits')),
    ADD COLUMN IF NOT EXISTS points_amount INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_super_like BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS message TEXT,
    ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_gift_transactions_segment ON public.gift_transactions(segment_id);
CREATE INDEX IF NOT EXISTS idx_gift_transactions_recipient ON public.gift_transactions(recipient_id);

DROP POLICY IF EXISTS "Gift transactions viewable by everyone" ON public.gift_transactions;
CREATE POLICY "Gift transactions viewable by everyone"
    ON public.gift_transactions FOR SELECT
    USING (true);

-- 7. REAL-MONEY PURCHASES & CHECKOUT INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS public.payment_packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    credits_amount INT NOT NULL CHECK (credits_amount > 0),
    price_cents INT NOT NULL CHECK (price_cents > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    badge TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    provider TEXT NOT NULL CHECK (provider IN ('sandbox', 'stripe', 'lemonsqueezy', 'cmi')),
    session_id TEXT UNIQUE,
    package_id TEXT NOT NULL REFERENCES public.payment_packages(id),
    credits_amount INT NOT NULL CHECK (credits_amount > 0),
    amount_cents INT NOT NULL CHECK (amount_cents > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON public.payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_session ON public.payment_orders(session_id);

ALTER TABLE public.payment_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Payment packages viewable by anyone" ON public.payment_packages;
CREATE POLICY "Payment packages viewable by anyone"
    ON public.payment_packages FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Users can view own payment orders" ON public.payment_orders;
CREATE POLICY "Users can view own payment orders"
    ON public.payment_orders FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = user_id);

-- 8. ATOMIC WALLET & GIFTING STORED PROCEDURES
-- A. Ensure wallet exists and credit/debit atomically
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'execute_wallet_transaction'
          AND pronamespace = 'public'::regnamespace
    ) LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.execute_wallet_transaction(
    p_user_id UUID,
    p_currency TEXT,
    p_amount INT,
    p_tx_type TEXT,
    p_ref_id TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_pts INT := 0;
    v_current_crd INT := 0;
    v_new_pts INT;
    v_new_crd INT;
BEGIN
    -- Ensure wallet exists
    INSERT INTO public.wallets (user_id, earned_points, purchased_credits)
    VALUES (p_user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- Lock wallet row for atomic update
    SELECT earned_points, purchased_credits INTO v_current_pts, v_current_crd
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Validate balance if debit
    IF p_currency = 'earned_points' THEN
        v_new_pts := v_current_pts + p_amount;
        IF v_new_pts < 0 THEN
            RAISE EXCEPTION 'Insufficient earned points balance (has %, requires %)', v_current_pts, -p_amount;
        END IF;
        UPDATE public.wallets
        SET earned_points = v_new_pts, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
    ELSIF p_currency = 'purchased_credits' THEN
        v_new_crd := v_current_crd + p_amount;
        IF v_new_crd < 0 THEN
            RAISE EXCEPTION 'Insufficient purchased credits balance (has %, requires %)', v_current_crd, -p_amount;
        END IF;
        UPDATE public.wallets
        SET purchased_credits = v_new_crd, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = p_user_id;
    ELSE
        RAISE EXCEPTION 'Invalid currency type: %', p_currency;
    END IF;

    -- Record in transaction ledger
    INSERT INTO public.wallet_transactions (
        wallet_id,
        currency,
        amount,
        transaction_type,
        reference_id,
        description,
        metadata
    )
    VALUES (
        p_user_id,
        p_currency,
        p_amount,
        p_tx_type,
        p_ref_id,
        p_description,
        p_metadata
    );

    RETURN jsonb_build_object(
        'success', true,
        'earned_points', COALESCE(v_new_pts, v_current_pts),
        'purchased_credits', COALESCE(v_new_crd, v_current_crd)
    );
END;
$$;

-- B. Send appreciation gift / Super Like atomically
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT oid::regprocedure AS func_signature
        FROM pg_proc
        WHERE proname = 'send_appreciation_gift'
          AND pronamespace = 'public'::regnamespace
    ) LOOP
        EXECUTE 'DROP FUNCTION ' || r.func_signature || ' CASCADE';
    END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_appreciation_gift(
    p_sender_id UUID,
    p_recipient_id UUID,
    p_gift_id UUID,
    p_target_type TEXT,
    p_story_id UUID,
    p_segment_id UUID DEFAULT NULL,
    p_message TEXT DEFAULT NULL,
    p_is_demo BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_gift RECORD;
    v_tx_id UUID;
    v_recipient UUID;
    v_story_owner UUID;
    v_author UUID;
BEGIN
    -- Fetch gift catalog details
    SELECT * INTO v_gift FROM public.gift_catalog WHERE id = p_gift_id AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Gift not found or inactive';
    END IF;

    -- Determine recipient accurately (paragraph author if segment_id, story owner if story)
    IF p_target_type = 'paragraph' AND p_segment_id IS NOT NULL THEN
        SELECT author_id INTO v_author FROM public.story_segments WHERE id = p_segment_id;
        v_recipient := COALESCE(p_recipient_id, v_author);
    ELSIF p_target_type = 'story' AND p_story_id IS NOT NULL THEN
        SELECT owner_id INTO v_story_owner FROM public.stories WHERE id = p_story_id;
        v_recipient := COALESCE(p_recipient_id, v_story_owner);
    ELSE
        v_recipient := p_recipient_id;
    END IF;

    IF v_recipient IS NULL THEN
        RAISE EXCEPTION 'Unable to resolve gift recipient';
    END IF;

    IF v_recipient = p_sender_id AND NOT p_is_demo THEN
        RAISE EXCEPTION 'Self-gifting is not allowed';
    END IF;

    -- Debit sender wallet (unless demo seed)
    IF NOT p_is_demo AND p_sender_id IS NOT NULL THEN
        PERFORM public.execute_wallet_transaction(
            p_sender_id,
            COALESCE(v_gift.currency, 'earned_points'),
            -COALESCE(v_gift.price_points, 50),
            CASE WHEN v_gift.is_super_like THEN 'super_like_sent' ELSE 'gift_purchase' END,
            'gift_send:' || gen_random_uuid()::text,
            'Sent ' || v_gift.name || ' appreciation',
            jsonb_build_object('gift_id', v_gift.id, 'target_type', p_target_type, 'story_id', p_story_id, 'segment_id', p_segment_id)
        );
    END IF;

    -- Credit recipient earned points (70% reward share)
    IF v_recipient IS NOT NULL THEN
        PERFORM public.execute_wallet_transaction(
            v_recipient,
            'earned_points',
            ROUND(COALESCE(v_gift.price_points, 50) * 0.70)::INT,
            CASE WHEN v_gift.is_super_like THEN 'super_like_received' ELSE 'gift_received' END,
            'gift_recv:' || gen_random_uuid()::text,
            'Received ' || v_gift.name || ' appreciation',
            jsonb_build_object('gift_id', v_gift.id, 'sender_id', p_sender_id, 'target_type', p_target_type, 'story_id', p_story_id, 'segment_id', p_segment_id)
        );
    END IF;

    -- Record in gift_transactions
    INSERT INTO public.gift_transactions (
        gift_id,
        story_id,
        segment_id,
        sender_id,
        recipient_id,
        target_type,
        currency,
        points_amount,
        amount_cents,
        creator_pool_cents,
        platform_fee_cents,
        status,
        is_super_like,
        message,
        is_demo
    )
    VALUES (
        v_gift.id,
        p_story_id,
        p_segment_id,
        p_sender_id,
        v_recipient,
        p_target_type,
        COALESCE(v_gift.currency, 'earned_points'),
        COALESCE(v_gift.price_points, 50),
        COALESCE(v_gift.price_cents, 100),
        ROUND(COALESCE(v_gift.price_cents, 100) * 0.70)::INT,
        ROUND(COALESCE(v_gift.price_cents, 100) * 0.30)::INT,
        'completed'::gift_transaction_status,
        COALESCE(v_gift.is_super_like, false),
        p_message,
        p_is_demo
    )
    RETURNING id INTO v_tx_id;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_tx_id,
        'gift_name', v_gift.name,
        'recipient_id', v_recipient
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.execute_wallet_transaction(UUID, TEXT, INT, TEXT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_appreciation_gift(UUID, UUID, UUID, TEXT, UUID, UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_appreciation_gift(UUID, UUID, UUID, TEXT, UUID, UUID, TEXT, BOOLEAN) TO anon;

-- 9. PERMISSIONS HARDENING & GRANTS
GRANT SELECT ON public.wallets TO authenticated;
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT SELECT ON public.referral_codes TO anon, authenticated;
GRANT SELECT ON public.referral_events TO authenticated;
GRANT SELECT ON public.gift_catalog TO anon, authenticated;
GRANT SELECT ON public.gift_transactions TO anon, authenticated;
GRANT SELECT ON public.payment_packages TO anon, authenticated;
GRANT SELECT ON public.payment_orders TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
