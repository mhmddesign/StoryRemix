# Security Policy

StoryRemix is committed to safeguarding creator content, financial transaction ledgers, and community trust.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| < 2.0   | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability in StoryRemix, please **do not report it publicly** via GitHub issues.

Instead, please send a private report to:
📧 **security@mhmd.studio** (or contact `@mhmddesign` directly).

Include:
1. Detailed description of the vulnerability.
2. Steps or proof-of-concept to reproduce the issue safely.
3. Potential impact on user data, authentication, or virtual balances.

We will acknowledge receipt within 48 hours and work with you on a coordinated resolution.

---

## Security Architecture Highlights

- **Row Level Security (RLS)**: Enforced across all 20+ PostgreSQL tables in Supabase.
- **Fail-Closed Cron Endpoints**: Endpoints like `/api/cron/process-rounds` require high-entropy `CRON_SECRET` headers.
- **Atomic Transactions**: Database operations use strict PostgreSQL transactions and explicit rollback handlers.
- **Virtual Economy Safety**: Points and credits are internal platform virtual currencies; integer arithmetic and double-entry ledgers prevent balance leakage or unauthorized minting.

---
*Proprietary © 2026 MHMD.STUDIO. All rights reserved.*
