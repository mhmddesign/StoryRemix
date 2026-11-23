# Supabase Database Setup & Migration Guide

## 1. Remote Project Identification

- **Supabase Reference ID**: `ysrxzzscfttsiscdpiby`
- **REST URL**: `https://ysrxzzscfttsiscdpiby.supabase.co/rest/v1/`
- **Dashboard URL**: [https://supabase.com/dashboard/project/ysrxzzscfttsiscdpiby](https://supabase.com/dashboard/project/ysrxzzscfttsiscdpiby)

---

## 2. Resolving PGRST205 ("Could not find the table in schema cache")

If you see an error such as:
```json
{
  "code": "PGRST205",
  "details": null,
  "hint": null,
  "message": "Could not find the table 'public.stories' in the schema cache"
}
```
This indicates that the remote PostgreSQL database instance does not yet have the StoryRemix schema applied or that PostgREST has not reloaded its schema cache.

### Step-by-Step 1-Click Fix:
1. Open the [Supabase Dashboard SQL Editor](https://supabase.com/dashboard/project/ysrxzzscfttsiscdpiby/sql).
2. Open the file `supabase/migrations/master_setup.sql` in this repository.
3. Copy its entire content into the Supabase SQL Editor.
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`).
5. The script creates all tables, indexes, RLS policies, storage buckets, triggers, and runs:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```
6. Verify by opening **Table Editor** in the dashboard. You should see all 19 tables listed.

---

## 3. Database Schema Overview

The database consists of 19 core tables:

### User & Gamification:
- `public.profiles`: User account details, username, display name, language preference, bio, avatar URL.
- `public.user_xp`: Accumulated XP balance, current level, lifetime XP.
- `public.xp_ledger`: Immutable append-only audit trail of XP awards with idempotency keys.
- `public.achievements`: Configurable platform achievements.
- `public.user_achievements`: Unlocked user achievements with unlock timestamps.

### Collaborative Storytelling:
- `public.stories`: Story title, slug, genre, language, max paragraphs, current count, status, cover image URL, cover alt text.
- `public.story_segments`: Canonical winning paragraphs in sequential order (`paragraph_index: 1, 2, ...`).
- `public.story_rounds`: Active and completed rounds for each story (`opened_at`, `deadline_at`, `status`, `vote_threshold`).
- `public.contributions`: Community-submitted paragraph candidates competing in a round (`body`, `sentence_count`, `vote_count`).
- `public.votes`: Recorded user votes per round (enforces 1 vote per user per round).

### Engagement & Economy:
- `public.story_likes`: Story favorites.
- `public.bookmarks`: Saved reading lists.
- `public.story_reactions`: Free social emoji reactions (👏, ❤️, 💡, 🔥, 🏆).
- `public.author_revenue_policies`: Configured revenue split policies per story (`equal_collaborators`, `creator_and_collaborators`, etc.).
- `public.donations`: Recorded voluntary reader donations with 90% creator pool and 10% platform fee.
- `public.donation_allocations`: Individual co-author share allocations.

### Story Covers & Visual Identity:
- `public.story_cover_proposals`: Community-submitted book cover proposals with copyright confirmation.
- `public.story_cover_votes`: Community upvotes on cover proposals.
- `public.story_cover_history`: Audit log of previous approved covers.

---

## 4. Storage Buckets Configuration

The migration automatically creates and configures two public storage buckets:

1. `avatars`:
   - Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`, `image/gif`.
   - Max file size: 2MB.
   - Public read access enabled.
   - Authenticated users can upload to their own user folder: `auth.uid() = (storage.foldername(name))[1]`.

2. `story-covers`:
   - Allowed MIME types: `image/png`, `image/jpeg`, `image/webp`.
   - Max file size: 5MB.
   - Public read access enabled.
   - Aspect ratio: 2:3 standard book cover.

---

## 5. Automated Round Expiration Cron

StoryRemix includes an automated round-processing endpoint at `/api/cron/process-rounds`.

### Vercel Cron (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/process-rounds",
      "schedule": "* * * * *"
    }
  ]
}
```

### Manual Trigger for Testing:
```bash
curl -X POST https://storyremix-green.vercel.app/api/cron/process-rounds \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```
The cron checks for expired rounds (`deadline_at <= now()`), calculates winning contributions, locks in canonical story segments, opens the subsequent round, and closes the story once `max_paragraphs` is reached.
