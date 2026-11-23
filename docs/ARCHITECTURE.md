# StoryRemix System Architecture

## 1. Overview & Core Philosophy

**StoryRemix** is a production-grade collaborative storytelling platform where communities co-write stories round by round.
Tagline: *"One story. Many minds. Endless possibilities."*

The architecture is built on five core pillars:
1. **Deterministic Round Progression**: Atomic turns with transparent community voting.
2. **Fair Creator Economy**: 90% of net revenue from donations and gifts flows directly to story creators and collaborators; 10% sustains platform infrastructure.
3. **Inclusive Multilingual Experience**: Full internationalization across English, French, and Arabic with true bidirectional Right-to-Left (RTL) layout.
4. **Resilient Data Foundations**: PostgreSQL Row Level Security (RLS), self-healing user profiles, and idempotent database triggers.
5. **Zero-Friction Performance**: Server Components by default, optimistic client interactions, and zero Cumulative Layout Shift (CLS).

---

## 2. Technology Stack

- **Framework**: Next.js 16 (App Router with Turbopack).
- **Language**: TypeScript 5 (Strict Mode).
- **Styling**: Tailwind CSS with CSS Variables for themes and logical properties (`[dir="rtl"]`) for bidirectional localization.
- **Database & Auth**: Supabase PostgreSQL with PostgREST, Supabase Auth SSR (`@supabase/ssr`), and Supabase Storage.
- **Internationalization**: `next-intl` (v4) with 100% dictionary key parity enforcement via automated testing.
- **Testing**: Vitest with unit and integration tests covering sentence tokenization, story workflow logic, i18n parity, gamification economy, and cron security.
- **Icons**: Lucide React.
- **Notifications**: Sonner toast system.

---

## 3. Directory Layout

```
StoryRemix/
├── docs/                             # Production documentation suite
├── messages/                         # JSON localization dictionaries
│   ├── en.json                       # English master dictionary (16 namespaces)
│   ├── fr.json                       # French dictionary
│   └── ar.json                       # Arabic dictionary
├── public/                           # Static assets & ads.txt
├── src/
│   ├── app/                          # Next.js App Router routes & Server Actions
│   │   ├── actions/                  # Server Actions (auth, story, covers, donations, etc.)
│   │   ├── api/cron/process-rounds/  # Automated round resolution cron endpoint
│   │   ├── explore/                  # Story discovery feed with filters
│   │   ├── leaderboard/              # XP & author leaderboards
│   │   ├── profile/                  # User profile & self-healing routes
│   │   ├── stories/                  # Story reader, active round, and creation
│   │   ├── globals.css               # Global theme tokens & RTL styling rules
│   │   ├── layout.tsx                # Root layout with providers & direction binding
│   │   └── page.tsx                  # Landing page & featured stories
│   ├── components/                   # React components
│   │   ├── ads/                      # Google AdSense component (disabled by default)
│   │   ├── auth/                     # AuthProvider, AuthModal, ProtectedRoute
│   │   ├── economy/                  # DonationModal, GiftModal, StoryReactionBar
│   │   ├── i18n/                     # LanguageProvider & LanguageSelector
│   │   ├── layout/                   # Navbar, Footer
│   │   ├── profile/                  # ProfileEditModal
│   │   └── story/                    # StoryCover, StoryCard, ActiveRoundWidget, CoverProposalsModal
│   ├── i18n/                         # next-intl request and routing configuration
│   ├── lib/                          # Core business logic & utilities
│   │   ├── ai/                       # Private server-side AI abstraction
│   │   ├── supabase/                 # Server, Browser, and Admin Supabase clients
│   │   ├── donations.ts              # Integer cents 90/10 split calculator
│   │   ├── sentence-tokenizer.ts     # Punctuation & sentence analysis
│   │   └── utils.ts                  # Classnames, slugify, time formatting
│   ├── types/                        # TypeScript types & Supabase schema definitions
│   └── proxy.ts                      # Unified Next.js 16 session refresh & locale proxy
└── supabase/
    ├── email-templates/              # Branded HTML email templates (EN, FR, AR)
    └── migrations/                   # Additive SQL migrations & master_setup.sql
```

---

## 4. Next.js 16 Request Interception (`src/proxy.ts`)

In Next.js 16, request interception and session refreshing are unified inside `src/proxy.ts`. This proxy:
1. Detects or resolves the active locale (`en`, `fr`, or `ar`) via cookie `NEXT_LOCALE` or `Accept-Language` headers.
2. Refreshes the Supabase authentication session using `createServerClient` and safely copies refreshed auth cookies to the outgoing response.
3. Guarantees that server components always receive valid auth tokens without session desynchronization.

---

## 5. Security Architecture

1. **Row Level Security (RLS)**: Every table in `public` has RLS enabled with explicit `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies.
2. **Server-Side Validation**: All user submissions pass through Zod schemas and server-side sentence tokenization before database insertion.
3. **Cron Authentication**: The automated round-closing endpoint `/api/cron/process-rounds` strictly requires `Bearer ${CRON_SECRET}` in the `Authorization` header.
4. **Private AI Abstraction**: Zero user text is transmitted to third-party AI services. The provider defaults to `DisabledAIProvider`.
5. **Financial Invariants**: No XP or monetary payment can purchase voting power or alter competitive rankings.
