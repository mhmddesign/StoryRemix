# StoryRemix

> **"One story. Many minds. Endless possibilities."**

StoryRemix is a collaborative storytelling social platform where users co-create narrative literature, one paragraph at a time. Through community-driven rounds, writers submit 2-to-3 sentence continuations, voters elect the winning direction, and completed stories preserve moral and canonical attribution for every contributing author.

---

## Key Features

- **Core Story Engine**:
  - Author plants a genesis paragraph (2–5 sentences), sets target story length (2–30 paragraphs), vote threshold, and round duration.
  - Competing community continuations submitted during active rounds (strictly validated 2–3 sentences).
  - Multilingual sentence tokenizer supporting English, French, and Arabic RTL without naive regex pitfalls.
- **Fair Democratic Voting**:
  - One vote per user per round, vote-switching enabled before round deadline.
  - Self-voting prevention enforced at both application and database levels.
  - Immutable server-side deadlines and transactional vote tallying.
- **Winner Determination & Creator Fallback**:
  - Highest-voted candidate at or above threshold automatically appended to canonical story.
  - Unqualified rounds (threshold not reached or ties) enter an explicit `awaiting_creator_resolution` state with transparent options (extend round, creator override with public disclosure badge, or cancel and reopen).
- **Story Remixing**:
  - Readers can branch off any completed story at a chosen paragraph, creating an alternate timeline while perpetually honoring upstream author attribution.
- **Gamification & Creative Paths**:
  - 10 Level Progression Tiers (*Newcomer* to *Living Legend*).
  - 6 Creative Paths (*The Storyteller*, *The Collaborator*, *The Explorer*, *The Curator*, *The Worldbuilder*, *The Patron*).
  - Milestone achievements across Common, Uncommon, Rare, Epic, and Legendary tiers.
- **Creator Economy & Co-Author Revenue Sharing**:
  - Free community emoji reactions and virtual appreciation gifts (🌹, 🪶, 📚, ⭐, 🏆, 👑).
  - Platform Fee (25%) and Creator Escrow Pool (75%) split via integer basis points.
  - Four deterministic co-author revenue sharing policies:
    - **Policy A (Equal Collaborators)**: Equal split among unique contributing authors.
    - **Policy B (Contribution-Weighted)**: Proportional to canonical accepted paragraphs.
    - **Policy C (Creator Reserved + Pool)**: Originator receives guaranteed 30% baseline; remaining 70% shared by continuation writers.
    - **Policy D (Weighted Roles)**: Genesis opening paragraph (2.0x), middle continuations (1.0x), and climax (2.0x).
  - Strict integer cent arithmetic with residual distribution, guaranteeing total allocations match pool cents.
  - Pre-submission contributor consent agreements.
  - Double-entry minor currency accounting ledger.
- **Leaderboards & Competitions**:
  - Time-decay Hot score: $(3 \cdot \text{votes} + 5 \cdot \text{contributors} + 2 \cdot \text{likes}) / (\text{hours} + 2)^{1.5}$.
  - Trending momentum velocity (48h activity window).
  - Democratic ranking guarantee: Virtual gifts and XP are strictly excluded from ranking calculations.
  - Monthly Story Cup and Annual Story Laureate awards.
- **Trust, Moderation & Admin Operations**:
  - Reporting queue for stories, continuations, comments, and profiles.
  - Admin dashboard with report management and audit logs.
- **Production Architecture**:
  - Next.js 16.4+ (App Router, Turbopack, `proxy.ts` convention), React 19.3+, TypeScript strict mode, Tailwind CSS 4.3+.
  - Supabase PostgreSQL with Row Level Security (RLS) on every table and transactional SQL procedures.
  - Automated background round expiration cron route (`/api/cron/process-rounds`) with fail-closed authentication.
  - System health check endpoint (`/api/health`).

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.4.6 (App Router, Turbopack) |
| **UI Library** | React 19.3.1 |
| **Language** | TypeScript 5.7+ (Strict Mode) |
| **Styling** | Tailwind CSS 4.3+ & Literary Ink Design System |
| **Icons & Primitives** | Lucide Icons, Sonner Toaster |
| **Database & Auth** | Supabase (PostgreSQL 15+, RLS, SSR cookie handling) |
| **Testing** | Vitest 3.2+ (41 Unit & Integration Tests) |
| **CI/CD** | GitHub Actions (`.github/workflows/ci.yml`) |

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+ (Node v22 / v24 supported)
- npm

### 2. Clone & Install
```bash
git clone https://github.com/mhmddesign/StoryRemix.git
cd StoryRemix
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your Supabase URL and keys in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ysrxzzscfttsiscdpiby.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
# Or NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CRON_SECRET=your-random-cron-secret
```

### 4. Database Setup
Apply both migrations in your Supabase SQL Editor in sequence:
1. `supabase/migrations/20261122_initial_schema.sql` (Core platform tables, RLS, functions)
2. `supabase/migrations/20261122_gamification_economy_leaderboards.sql` (Gamification, economy, revenue policies, leaderboards, competitions)

### 5. Typecheck & Tests
```bash
npm run typecheck
npm test
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Background Processing

To automatically evaluate expired rounds:
Configure a cron scheduler (e.g. Vercel Cron or GitHub Actions) to send an authenticated GET request every 5–15 minutes:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-deployment.vercel.app/api/cron/process-rounds
```

---

## Deployment to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Configure Environment Variables under Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://ysrxzzscfttsiscdpiby.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: (Your project publishable key)
   - `SUPABASE_SERVICE_ROLE_KEY`: (Your project service role key, server-only)
   - `CRON_SECRET`: (Secure random string for cron route authentication)
4. In your **Supabase Dashboard** under *Authentication* -> *URL Configuration*:
   - Set **Site URL** to `https://your-domain.vercel.app`
   - Add **Redirect URLs**: `https://your-domain.vercel.app/auth/callback`
5. Deploy. Next.js 16 with Turbopack compiles all routes and static assets automatically.

---

## License
MIT © StoryRemix Contributors.
