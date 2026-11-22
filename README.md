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
- **Defining Feature: Story Remixing**:
  - Readers can branch off any completed story at a chosen paragraph, creating an alternate timeline while perpetually honoring upstream author attribution.
- **Social & Community Architecture**:
  - User profiles with milestone achievement badges (*Story Creator*, *Collaborative Writer*, *Master Storyteller*).
  - Follow authors, bookmark reading lists, and receive in-app notifications.
- **Trust, Moderation & Admin Operations**:
  - Reporting queue for stories, continuations, comments, and profiles.
  - Admin dashboard with report management and audit logs.
- **Production Architecture**:
  - Next.js 16 (App Router, Turbopack, `proxy.ts` convention), React 19, TypeScript strict mode, Tailwind CSS 4.
  - Supabase PostgreSQL with Row Level Security (RLS) on every table and transactional SQL procedures.
  - Automated background round expiration cron route (`/api/cron/process-rounds`).
  - System health check endpoint (`/api/health`).

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.4.6 (App Router) |
| **UI Library** | React 19.3.1 |
| **Language** | TypeScript 5.7+ (Strict Mode) |
| **Styling** | Tailwind CSS 4.3+ & Literary Ink Design System |
| **Icons & Primitives** | Lucide Icons, Sonner Toaster |
| **Database & Auth** | Supabase (PostgreSQL 15+, RLS, SSR cookie handling) |
| **Testing** | Vitest 3.2+ (20 Unit & Integration Tests) |

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js 20+ (Node v24 supported)
- npm or pnpm

### 2. Clone & Install
```bash
git clone https://github.com/your-username/StoryRemix.git
cd StoryRemix
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Provide your Supabase URL and keys:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-random-cron-secret
```

### 4. Database Setup
Execute the comprehensive migration script in your Supabase SQL Editor:
```
supabase/migrations/20261122_initial_schema.sql
```
This sets up:
- All tables, constraints, foreign keys, and indexes
- Automatic `profiles` trigger on auth user creation
- Row Level Security (RLS) policies on all tables
- Stored procedures: `submit_continuation`, `cast_vote`, `finalize_round`, `resolve_unqualified_round`

### 5. Run Tests
```bash
npm test
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Background Processing

To automatically finalize expired rounds without relying on open browser windows:
Configure a cron scheduler (e.g. Vercel Cron or GitHub Actions) to send an authenticated GET request every 5–15 minutes:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-deployment.vercel.app/api/cron/process-rounds
```

---

## Deployment to Vercel

1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Configure Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`).
4. Deploy! Next.js 16 Turbopack will compile all routes and static assets automatically.

---

## License
MIT © StoryRemix Contributors.
