# Vercel Production Deployment & Maintenance Guide

## 1. Live Deployment Targets

- **Live URL**: [https://storyremix-green.vercel.app/](https://storyremix-green.vercel.app/)
- **GitHub Repository**: [https://github.com/mhmddesign/StoryRemix.git](https://github.com/mhmddesign/StoryRemix.git)
- **Default Production Branch**: `main`
- **Hosting Provider**: Vercel

---

## 2. Environment Variables Checklist

Configure the following variables in the **Vercel Project Settings > Environment Variables**:

| Variable Name | Required | Environment | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | All | `https://ysrxzzscfttsiscdpiby.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | All | Supabase project publishable key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | All | Alias for publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server | Administrative key for cron & triggers |
| `NEXT_PUBLIC_APP_URL` | Yes | All | `https://storyremix-green.vercel.app` |
| `CRON_SECRET` | Yes | Server | Secure random secret for round cron |
| `NEXT_PUBLIC_ADSENSE_ENABLED` | No | All | `false` (default) or `true` |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | No | All | `ca-pub-XXXXXXXXXXXXXXXX` |
| `AI_PROVIDER_ENABLED` | No | Server | `false` (default) |
| `AI_PROVIDER_API_KEY` | No | Server | Private AI key (optional) |

---

## 3. Automated Round Resolution Cron

StoryRemix relies on a scheduled cron to transition expired rounds, select winning continuations, and advance stories.

File: `vercel.json`
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

The endpoint validates:
```typescript
const authHeader = req.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new NextResponse("Unauthorized", { status: 401 });
}
```

---

## 4. Pre-Deployment Verification Protocol

Before pushing to `main`, execute the local verification suite:

```bash
# 1. Typecheck
npm run typecheck

# 2. Automated Test Suite (All 45+ unit & integration tests)
npm run test

# 3. Production Build
npm run build
```

---

## 5. Deployment Rollback & Incident Response

1. If a regression occurs, use Vercel's **Instant Rollback** to return to the previous stable deployment.
2. If database schema drift is suspected, run `SELECT * FROM pgrst_watch;` and execute `NOTIFY pgrst, 'reload schema';` in the Supabase SQL Editor.
