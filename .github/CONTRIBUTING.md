# Contributing to StoryRemix

Thank you for your interest in contributing to **StoryRemix**, a proprietary collaborative storytelling platform crafted by **MHMD.STUDIO**.

---

## 1. Development Principles

1. **Literary Atmosphere**: Every component, interaction, and transition should feel like an elegant literary journal combined with a modern creative platform.
2. **Strict Democratic Integrity**: Voting logic, sentence limits (strictly 2–3 sentences for continuations, 2–5 for genesis), and author attribution must be mathematically and transactionally guaranteed.
3. **Multilingual by Design**: Every user-facing string must exist in English, French, and Arabic (`messages/*.json`) with 100% dictionary key parity and full RTL layout support.
4. **Least Privilege & Row Level Security (RLS)**: Direct database writes must be protected by explicit PostgreSQL RLS policies or atomic stored procedures. Never disable RLS.

---

## 2. Getting Started

### Prerequisites
- Node.js 20+ (Node v22 recommended)
- npm 10+
- Supabase CLI or project instance

### Local Installation
```bash
git clone https://github.com/mhmddesign/StoryRemix.git
cd StoryRemix
npm install
npm run dev
```

---

## 3. Quality Standards & CI

Before submitting a Pull Request, ensure:
```bash
# 1. Typecheck
npm run typecheck

# 2. Automated Test Suite (71+ tests)
npm run test

# 3. Production Build (Turbopack)
npm run build
```

---

## 4. Proprietary Notice

All contributions and code within this repository are proprietary to **MHMD.STUDIO**. By submitting code or proposals, you agree that all rights and intellectual property remain with MHMD.STUDIO.
