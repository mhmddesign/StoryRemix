<div align="center">

  <img src="public/favicon.svg" alt="StoryRemix Logo" width="80" height="80" />

  # StoryRemix 2.0

  **"One story. Many minds. Endless possibilities."**

  *The premier collaborative fiction platform, democratic storytelling engine, and literary creator economy.*

  <p align="center">
    <a href="https://storyremix-green.vercel.app"><strong>Explore Live Platform »</strong></a>
  </p>

  [![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19.3.1-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
  [![Vitest](https://img.shields.io/badge/Tests-71%20Passed-FCC72B?style=for-the-badge&logo=vitest)](https://vitest.dev/)
  [![License](https://img.shields.io/badge/License-Proprietary%20MHMD.STUDIO-92400e?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Overview

**StoryRemix** is a digital literary publication and collaborative creator ecosystem. Writers plant original narrative seeds, competing authors submit punchy continuations in democratic rounds, and community readers elect the winning direction to build living, canonical literature.

StoryRemix 2.0 introduces a complete platform transformation: an idempotent public demo community, guided progressive onboarding, a non-guessable referral engine, a dual-currency virtual economy, and our signature **Paragraph-Level Gifting** system with permanent author attribution.

---

## ✨ Key Capabilities

### 🖋️ 1. Democratic Story Engine
- **Genesis Seeds**: Authors launch opening chapters (2–5 sentences), setting target story lengths (2–30 paragraphs), vote thresholds, and round deadlines.
- **Micro-Continuations**: Writers submit tightly validated **2-to-3 sentence candidate paragraphs** during active rounds.
- **Multilingual Tokenizer**: Robust sentence segmentation supporting English, French, and Arabic punctuation without naive regex flaws.
- **Democratic Resolution**: One vote per user per round with immutable deadlines; winning contributions lock into the canonical timeline.

### 🏛️ 2. Public Demo Community & Blended Showcase
- **Never an Empty Platform**: Anonymous visitors and newly registered writers immediately experience an active, vibrant literary guild.
- **18 Curated Author Personas**: High-fidelity fictional profiles spanning diverse cultural traditions (Dr. Maya Lin, Alexandre Dumas, Tariq Ibn Ziyad, Soraya Benjelloun) with custom avatars, bios, literary archetypes, XP levels, and follower counts.
- **35 Showcase Stories**: Diverse genres (Sci-Fi, Gothic Horror, Historical Fiction, Romance, Speculative Philosophy) across English, French, and Arabic, featuring active rounds, evaluating stages, and completed novels.
- **Showcase Distinction**: Subtle, tasteful `"Showcase"` pill badges ensure transparent separation from organic user content without distracting readers.

### 🧭 3. Guided User Onboarding
- **Progressive Disclosure**: A 7-step guided walkthrough (`OnboardingWizard`) introducing the genesis concept, genre preferences across 10 distinct literary categories, and language selection.
- **Creator Discovery**: Highlights prominent community writers with interactive 1-click follow capabilities.
- **Meaningful Action Pathways**: Direct routes into active voting rounds, reading completed anthologies, or planting original stories.
- **Welcome Bonus**: 50 Earned Points credited automatically upon completion.

### 🚀 4. Referral Growth Engine
- **Unique Invitation Codes**: Non-guessable codes (`SR-XXXXXX`) derived from cryptographic user hashes.
- **1-Click Social Sharing**: Native integrations for WhatsApp, X (Twitter), Email, and direct link copy.
- **Dedicated Referral Hub (`/referrals`)**: Live metrics tracking link clicks, registered scribes, qualified referrals, and total points earned.
- **Fair Qualification Lifecycle**: Awards **100 Points** to the referrer and **25 Welcome Points** to the invited author upon completing their first platform action. Anti-abuse filters prevent self-referrals and disposable accounts.

### 🪙 5. Dual-Currency Virtual Economy & Paragraph-Level Gifting
- **Dual-Currency Architecture**:
  - ✨ **Earned Points**: Earned freely by writing, voting, winning rounds, and referring friends. Used for community gifts and rank.
  - 🪙 **Purchased Credits**: Acquired to send premium creator tokens, Super Likes, and spotlight awards.
  - *No Cash Redemption*: Virtual points represent prestige and appreciation; zero speculative tokens or fiat withdrawal claims.
- **Signature Feature: Paragraph-Level Gifting**:
  - Readers appreciate individual paragraphs directly, crediting **70% of points value directly to that paragraph's author**.
  - **Gift Catalog**: Ink Feather (25 pts), Literary Rose (50 pts), Ancient Scroll (100 pts), Burning Star (200 pts), Crown of Words (10 cr).
  - **Super Likes**: Awards a permanent warm golden glow and highlighted border to celebrated paragraphs.
- **Gift Store (`/store`) & Double-Entry Ledger (`/wallet`)**: Complete transaction history with immutable debit/credit accounting.

### 🌐 6. Trilingual & Native RTL Architecture
- **Complete Parity**: 100% dictionary key parity across English (`en`), French (`fr`), and Arabic (`ar`).
- **Right-to-Left (RTL) Layout**: Tailored Arabic typography using the Amiri serif typeface, dynamic directional flipping, and natural mirroring.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16.4.6 (App Router, Turbopack, React 19 Server Components) |
| **Frontend Library** | React 19.3.1 & TypeScript Strict Mode |
| **Styling & Design** | Tailwind CSS 4.3+, Literary Ink Palette, Dark/Light Mode (WCAG AA) |
| **Database & Auth** | Supabase PostgreSQL 15+, Row Level Security (RLS), SSR Cookie Auth |
| **Internationalization** | `next-intl` (English, French, Arabic RTL) |
| **Automated Testing** | Vitest 3.2+ (71 Unit, Integration, and Parity Tests) |
| **Icons & Notifications** | Lucide React, Sonner Toaster |
| **CI / CD** | GitHub Actions (`.github/workflows/ci.yml`), Vercel Deployment |

---

## 📁 Repository Structure

```
StoryRemix/
├── .github/                     # GitHub workflows, templates, and CODEOWNERS
│   ├── workflows/ci.yml         # Automated typecheck, test, and build pipeline
│   ├── ISSUE_TEMPLATE/          # Bug report and feature request templates
│   ├── PULL_REQUEST_TEMPLATE.md # Structured PR verification template
│   └── CONTRIBUTING.md          # Contribution and code standards
├── messages/                    # Trilingual localization dictionaries
│   ├── en.json                  # English dictionary
│   ├── fr.json                  # French dictionary
│   └── ar.json                  # Arabic dictionary (RTL)
├── public/                      # Static branding and web assets
│   ├── favicon.svg              # Literary quill vector logo
│   ├── favicon.ico              # Multi-resolution icon binary
│   ├── og-image.png             # 1200x630 social share card
│   └── manifest.json            # Web App Manifest
├── src/
│   ├── app/                     # Next.js 16 App Router
│   │   ├── actions/             # Server actions (story, onboarding, referral, wallet, payment)
│   │   ├── explore/             # Story discovery feed
│   │   ├── join/                # Referral invitation landing page
│   │   ├── referrals/           # Creator Referral Hub dashboard
│   │   ├── rounds/              # Active democratic voting rounds
│   │   ├── store/               # Gift Emporium and credit top-up
│   │   ├── stories/             # Story detail, reader, and genesis creation
│   │   └── wallet/              # Dual-currency ledger and transaction history
│   ├── components/              # Modular UI components
│   │   ├── brand/               # Brand logo and literary insignias
│   │   ├── layout/              # Redesigned navbar, footer, and drawers
│   │   ├── onboarding/          # 7-step guided onboarding wizard
│   │   └── story/               # Story reader, cards, and paragraph gift modal
│   ├── data/                    # Curated showcase author and story datasets
│   ├── lib/                     # Core logic, showcase service, tokenizer, revenue formulas
│   └── types/                   # Supabase database TypeScript definitions
└── supabase/
    └── migrations/              # Additive PostgreSQL migrations and stored procedures
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v20 or v22+
- **npm**: v10+
- **Supabase**: Active PostgreSQL project reference

### 2. Clone & Install
```bash
git clone https://github.com/mhmddesign/StoryRemix.git
cd StoryRemix
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the project root:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-secure-cron-secret
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🧪 Testing & Verification

StoryRemix maintains a rigorous automated testing suite covering multilingual sentence boundary tokenization, story workflow bounds, atomic rollback guarantees, virtual economy ledger balances, 70% paragraph gift splits, and 100% i18n key parity:

```bash
# Run complete test suite (71 passing tests)
npm run test

# Run TypeScript strict typecheck
npm run typecheck

# Run production build (Turbopack)
npm run build
```

---

## 🔒 Security & Privacy

- **Row Level Security**: Every table in PostgreSQL is protected by explicit RLS policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- **Atomic Stored Procedures**: Multi-step actions (story launches, wallet transactions, gifts) execute within database transactions.
- **Fail-Closed Background Tasks**: Automated round closure routes require cryptographic bearer authentication.

---

## 📄 License & Proprietary Notice

**PROPRIETARY & CONFIDENTIAL**

Copyright © 2026 **MHMD.STUDIO**. All rights reserved.

This source code, designs, branding, assets, and documentation are the exclusive intellectual property of **MHMD.STUDIO**. Unauthorized copying, modification, distribution, public display, or commercial exploitation via any medium is strictly prohibited without prior written authorization.

For licensing or partnership inquiries, contact **MHMD.STUDIO** at [github.com/mhmddesign](https://github.com/mhmddesign).
