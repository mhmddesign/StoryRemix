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
