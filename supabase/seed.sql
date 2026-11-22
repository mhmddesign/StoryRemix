-- ==============================================================================
-- StoryRemix Database Seed Script (Development & Demo Data)
-- ==============================================================================

-- Create demo user profiles (UUIDs for testing)
INSERT INTO public.profiles (id, username, display_name, bio, preferred_language, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'elena_vance', 'Elena Vance', 'Curator of cosmic mysteries and clockwork realms.', 'en', 'user'),
    ('00000000-0000-0000-0000-000000000002', 'tariq_nour', 'Tariq Al-Nour', 'Writing speculative fiction across deserts and distant stars.', 'ar', 'user'),
    ('00000000-0000-0000-0000-000000000003', 'claire_dubois', 'Claire Dubois', 'Auteure de fables urbaines et d''énigmes nocturnes.', 'fr', 'user'),
    ('00000000-0000-0000-0000-000000000099', 'admin_curator', 'Chief Curator', 'Platform administrator and literary guardian.', 'en', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Story 1: Active In Progress (Fantasy / Steampunk)
INSERT INTO public.stories (
    id, owner_id, title, slug, description, genre, tags, language, visibility, max_paragraphs, current_paragraph_count, default_vote_threshold, default_round_duration, status
)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000001',
    'The Clockmaker of Prague',
    'the-clockmaker-of-prague-demo',
    'Beneath the Old Town astronomical clock, an apprentice discovers gears that measure memories instead of seconds.',
    'Fantasy',
    ARRAY['steampunk', 'mystery', 'clockwork'],
    'en',
    'public',
    6,
    2,
    2,
    86400,
    'active'
)
ON CONFLICT (id) DO NOTHING;

-- Paragraph 1 (Genesis by Elena)
INSERT INTO public.story_segments (story_id, paragraph_index, author_id, body, vote_count_at_lock)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    1,
    '00000000-0000-0000-0000-000000000001',
    'The bronze astrolabe hummed with a vibration too subtle for human ears, though the street pigeons scattered whenever its third wheel engaged. Master Karel had vanished three nights ago, leaving behind only a copper key and a ledger filled with dates in the twenty-second century. Standing before the open dial, Mira knew that touching the mainspring would either restore her mentor or unravel Prague completely.',
    0
)
ON CONFLICT (story_id, paragraph_index) DO NOTHING;

-- Paragraph 2 (Community Winner by Tariq)
INSERT INTO public.story_segments (story_id, paragraph_index, author_id, body, vote_count_at_lock)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    2,
    '00000000-0000-0000-0000-000000000002',
    'With breath held tight, she turned the key until a soft chime echoed through the floorboards. Across the cobblestone square, the shadow of the cathedral steeple shifted backward against the stars.',
    5
)
ON CONFLICT (story_id, paragraph_index) DO NOTHING;

-- Active Round 2 for Paragraph 3
INSERT INTO public.story_rounds (
    id, story_id, round_number, paragraph_position, vote_threshold, opened_at, deadline_at, status
)
VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    2,
    3,
    2,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '18 hours',
    'open'
)
ON CONFLICT (story_id, round_number) DO NOTHING;

-- Candidate continuation 1 (by Claire)
INSERT INTO public.contributions (
    id, story_id, round_id, author_id, body, sentence_count, word_count, status, vote_count
)
VALUES (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000003',
    '« Regarde le beffroi », chuchota une voix inconnue venue du palier sombre. Mira sursauta en découvrant une silhouette vêtue de velours émeraude qui tenait un sablier inversé.',
    2,
    25,
    'active',
    3
)
ON CONFLICT (id) DO NOTHING;

-- Candidate continuation 2 (by Elena)
INSERT INTO public.contributions (
    id, story_id, round_id, author_id, body, sentence_count, word_count, status, vote_count
)
VALUES (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000001',
    'The cobblestones below grew cold as a silver mist spilled from the clock tower foundations. From the fog emerged footprints that ceased abruptly at the edge of the fountain.',
    2,
    28,
    'active',
    1
)
ON CONFLICT (id) DO NOTHING;
