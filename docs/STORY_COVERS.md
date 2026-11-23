# StoryRemix Book Covers & Community Proposals

## 1. Design Standard: 2:3 Aspect Ratio

Every book cover in StoryRemix adheres to the standard literary book cover ratio of **2:3** (e.g. 600x900px or 400x600px).
This creates a consistent, editorial bookshelf feel across feed cards, story pages, and user collections.

---

## 2. Generative Typography Fallback

When a story creator does not provide a custom cover image, StoryRemix does not render a broken image or empty gray placeholder.
Instead, `<StoryCover />` (`src/components/story/story-cover.tsx`) generates an editorial typography book cover tailored to the story's genre.

### Genre Color Themes:
- **Fantasy**: Deep royal violet and indigo (`from-purple-950 via-indigo-900 to-purple-900`) with celestial icon (`✨`).
- **Science Fiction**: Deep cyan and midnight blue (`from-sky-950 via-cyan-950 to-blue-950`) with cosmic icon (`🚀`).
- **Mystery & Detective**: Warm noir amber and charcoal (`from-slate-950 via-zinc-900 to-amber-950`) with magnifying glass (`🔍`).
- **Thriller & Suspense**: Stark crimson and zinc (`from-red-950 via-neutral-900 to-zinc-950`) with bolt icon (`⚡`).
- **Horror & Supernatural**: Shadow stone and violet (`from-zinc-950 via-stone-900 to-violet-950`) with crescent moon (`🌙`).
- **Romance**: Velvet rose and dusky taupe (`from-rose-950 via-pink-950 to-stone-900`) with rose symbol (`🌹`).
- **Historical Fiction**: Warm antique gold and parchment (`from-amber-950 via-yellow-950 to-stone-900`) with scroll symbol (`📜`).
- **Literary Fiction**: Minimalist espresso and bone serif (`from-stone-900 via-neutral-900 to-amber-950`) with quill symbol (`🪶`).
- **Adventure**: Forest emerald and sea teal (`from-emerald-950 via-teal-950 to-stone-950`) with compass (`🧭`).
- **Satire & Comedy**: Vibrant amber and tangerine (`from-amber-900 via-orange-950 to-stone-900`) with comedy mask (`🎭`).

---

## 3. Storage Bucket Configuration

- **Bucket name**: `story-covers`
- **Visibility**: Public read
- **Allowed MIME types**: `image/png`, `image/jpeg`, `image/webp`
- **Max file size**: 5 MB
- **RLS Policy**: Authenticated users can upload to `story-covers/{storyId}/*`.

---

## 4. Community Cover Proposals & Voting

Collaborative storytelling extends to visual identity:

1. **Submission**:
   - Any collaborator or reader can submit a cover proposal via the `<CoverProposalsModal />`.
   - Submissions require image URL or upload, accessibility alt text, and explicit confirmation that the submitter owns or holds rights to the image.
2. **Community Voting**:
   - Registered users can upvote proposals they feel capture the story's essence.
3. **Creator Approval**:
   - The original story creator retains ultimate editorial authority.
   - The creator can accept a winning proposal with 1 click, which automatically updates the story's active cover and archives previous covers in `story_cover_history`.
   - The creator can also reject proposals that do not align with their artistic vision.
