-- ==============================================================================
-- StoryRemix: Least-Privilege Grants & Storage Configuration
-- Migration: 20261123_least_privilege_and_storage.sql
--
-- 1. Storage Buckets: Ensures 'avatars' and 'story-covers' are registered & public.
-- 2. Storage Policies: Configures granular RLS for avatar and cover uploads.
-- 3. Security Hardening: Replaces broad GRANT ALL with explicit least-privilege permissions.
-- 4. Schema Refresh: Signals PostgREST cache reload.
-- ==============================================================================

-- 1. Ensure Storage Buckets Exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    2097152, -- 2MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'story-covers',
    'story-covers',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 2. Storage RLS Policies (Idempotent with DROP POLICY IF EXISTS)
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
CREATE POLICY "Public can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users can upload own avatar" ON storage.objects;
CREATE POLICY "Authenticated users can upload own avatar" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'avatars' AND
        (auth.uid())::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Public can view story covers" ON storage.objects;
CREATE POLICY "Public can view story covers" ON storage.objects
    FOR SELECT USING (bucket_id = 'story-covers');

DROP POLICY IF EXISTS "Authenticated users can upload story covers" ON storage.objects;
CREATE POLICY "Authenticated users can upload story covers" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'story-covers');

DROP POLICY IF EXISTS "Owners can update or delete own cover uploads" ON storage.objects;
CREATE POLICY "Owners can update or delete own cover uploads" ON storage.objects
    FOR UPDATE TO authenticated USING (
        bucket_id = 'story-covers' AND (auth.uid())::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Owners can delete own cover uploads" ON storage.objects;
CREATE POLICY "Owners can delete own cover uploads" ON storage.objects
    FOR DELETE TO authenticated USING (
        bucket_id = 'story-covers' AND (auth.uid())::text = (storage.foldername(name))[1]
    );

-- 3. Least-Privilege Permissions Hardening
-- Revoke excessively broad permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Grant selective read-only permissions to anonymous visitors
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT ON public.stories TO anon;
GRANT SELECT ON public.story_rounds TO anon;
GRANT SELECT ON public.story_segments TO anon;
GRANT SELECT ON public.contributions TO anon;
GRANT SELECT ON public.votes TO anon;
GRANT SELECT ON public.story_likes TO anon;
GRANT SELECT ON public.comments TO anon;
GRANT SELECT ON public.story_reactions TO anon;
GRANT SELECT ON public.level_definitions TO anon;
GRANT SELECT ON public.user_gamification TO anon;
GRANT SELECT ON public.achievement_definitions TO anon;
GRANT SELECT ON public.user_achievements TO anon;
GRANT SELECT ON public.challenge_definitions TO anon;
GRANT SELECT ON public.gift_catalog TO anon;
GRANT SELECT ON public.author_revenue_policies TO anon;
GRANT SELECT ON public.leaderboard_snapshots TO anon;
GRANT SELECT ON public.leaderboard_entries TO anon;
GRANT SELECT ON public.prize_competitions TO anon;
GRANT SELECT ON public.prize_awards TO anon;
GRANT SELECT ON public.story_cover_proposals TO anon;
GRANT SELECT ON public.story_cover_votes TO anon;
GRANT SELECT ON public.story_cover_history TO anon;
GRANT SELECT ON public.donations TO anon;
GRANT SELECT ON public.donation_allocations TO anon;

-- Grant CRUD to authenticated users (strictly constrained by table RLS policies)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Allow sequence usage for auto-incrementing / serial columns
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 4. Reload PostgREST Schema Cache
NOTIFY pgrst, 'reload schema';
