-- ==============================================================================
-- StoryRemix: Atomic Story Creation & Profile Self-Healing
-- Migration: 20261123_atomic_story_and_profile_repair.sql
--
-- 1. Backfills public.profiles and public.user_gamification for any existing auth.users.
-- 2. Re-attaches and hardens handle_new_user() trigger on auth.users.
-- 3. Provides atomic create_story_transaction() RPC to eliminate partial insertions
--    and guarantee referential integrity without foreign key violations.
-- ==============================================================================

-- 1. Backfill missing profiles for existing auth.users
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
SELECT
    u.id,
    COALESCE(
        NULLIF(LOWER(REGEXP_REPLACE(u.raw_user_meta_data->>'username', '[^a-zA-Z0-9_]', '', 'g')), ''),
        NULLIF(LOWER(REGEXP_REPLACE(SPLIT_PART(u.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')), ''),
        'writer_' || SUBSTRING(u.id::text, 1, 6)
    ),
    COALESCE(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', 'StoryRemix Writer'),
    COALESCE(u.raw_user_meta_data->>'preferred_language', 'en'),
    'user',
    '{"show_reading_activity": true, "allow_email_notifications": true}'::jsonb,
    COALESCE(u.created_at, CURRENT_TIMESTAMP),
    CURRENT_TIMESTAMP
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Initialize gamification for any backfilled users
INSERT INTO public.user_gamification (
    user_id,
    lifetime_xp,
    current_level,
    creative_path,
    calculated_archetype,
    updated_at
)
SELECT
    u.id,
    0,
    1,
    'storyteller',
    'Emerging Scribe',
    CURRENT_TIMESTAMP
FROM auth.users u
LEFT JOIN public.user_gamification g ON g.user_id = u.id
WHERE g.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 2. Hardened handle_new_user() Trigger Function
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
    v_raw_username := NEW.raw_user_meta_data->>'username';
    v_display_name := COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'StoryRemix Writer');
    v_lang := COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en');

    IF v_raw_username IS NOT NULL AND LENGTH(TRIM(v_raw_username)) > 0 THEN
        v_clean_username := LOWER(REGEXP_REPLACE(TRIM(v_raw_username), '[^a-zA-Z0-9_]', '', 'g'));
    ELSE
        IF NEW.email IS NOT NULL THEN
            v_clean_username := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
        ELSE
            v_clean_username := 'writer';
        END IF;
    END IF;

    IF LENGTH(v_clean_username) < 3 THEN
        v_clean_username := 'writer_' || SUBSTRING(NEW.id::text, 1, 6);
    END IF;

    v_clean_username := SUBSTRING(v_clean_username, 1, 20);

    SELECT COUNT(*) INTO v_count FROM public.profiles WHERE username = v_clean_username AND id != NEW.id;
    IF v_count > 0 THEN
        v_clean_username := SUBSTRING(v_clean_username, 1, 14) || '_' || SUBSTRING(md5(NEW.id::text), 1, 5);
    END IF;

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
        preferred_language = EXCLUDED.preferred_language,
        updated_at = CURRENT_TIMESTAMP;

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
        RAISE WARNING 'handle_new_user exception for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Atomic create_story_transaction RPC
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
    p_final_paragraph_weight INT DEFAULT 2
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
BEGIN
    -- Ensure caller is authenticated
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to create a story';
    END IF;

    -- Self-heal profile inside transaction if missing
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

        INSERT INTO public.profiles (id, username, display_name, preferred_language, role, privacy_settings)
        VALUES (
            v_user_id,
            v_username,
            v_display_name,
            v_lang,
            'user',
            '{"show_reading_activity": true, "allow_email_notifications": true}'::jsonb
        )
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.user_gamification (user_id, lifetime_xp, current_level, creative_path)
        VALUES (v_user_id, 0, 1, 'storyteller')
        ON CONFLICT (user_id) DO NOTHING;
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
        status
    )
    VALUES (
        v_user_id,
        p_title,
        p_slug,
        p_description,
        p_genre,
        p_tags,
        p_language,
        p_visibility,
        p_max_paragraphs,
        1,
        p_default_vote_threshold,
        p_default_round_duration,
        p_cover_image_url,
        p_cover_alt_text,
        'active'
    )
    RETURNING id INTO v_story_id;

    -- 2. Insert Opening Segment (Paragraph 1)
    INSERT INTO public.story_segments (
        story_id,
        paragraph_index,
        author_id,
        body,
        vote_count_at_lock
    )
    VALUES (
        v_story_id,
        1,
        v_user_id,
        TRIM(p_opening_text),
        0
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
        status
    )
    VALUES (
        v_story_id,
        1,
        2,
        p_default_vote_threshold,
        CURRENT_TIMESTAMP,
        v_deadline,
        'open'
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
        p_revenue_policy_type,
        p_creator_reserved_percentage,
        p_opening_paragraph_weight,
        p_continuation_paragraph_weight,
        p_final_paragraph_weight,
        1
    );

    -- Build return JSON
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

GRANT EXECUTE ON FUNCTION public.create_story_transaction TO authenticated;

NOTIFY pgrst, 'reload schema';
