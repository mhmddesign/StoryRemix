# Supabase Custom Email & SMTP Setup Guide

## 1. Overview

StoryRemix provides custom branded HTML email templates for all transactional user authentication flows:
- Account Confirmation (`confirmation.*.html`)
- Password Reset (`reset-password.*.html`)
- Magic Link Sign-in (`magic-link.*.html`)
- Email Address Change (`email-change.*.html`)

Templates are available in English (`.en.html`), French (`.fr.html`), and Arabic (`.ar.html` with full Right-to-Left styling).

---

## 2. Configuring Custom SMTP Provider

To ensure high email deliverability and avoid Supabase default rate limits (3 emails per hour on free tier), connect a dedicated SMTP service:

### Recommended Providers:
- **Resend** (Recommended for Next.js / Supabase projects)
- **SendGrid** (Twilio)
- **Amazon SES** (High volume, cost effective)
- **Brevo** (formerly Sendinblue)

### Configuration in Supabase Dashboard:
1. Navigate to: **Project Settings > Authentication > SMTP Settings**.
2. Toggle **Enable Custom SMTP** to `ON`.
3. Fill in provider details:
   - **Sender email**: `noreply@storyremix.com` (or your verified domain).
   - **Sender name**: `StoryRemix`.
   - **Host**: e.g., `smtp.resend.com` or `smtp.sendgrid.net`.
   - **Port**: `465` (SSL) or `587` (TLS).
   - **User**: `resend` or `apikey`.
   - **Password**: Your provider API Key.
4. Click **Save Changes**.

---

## 3. Applying Custom Email Templates

1. In the Supabase Dashboard, navigate to **Authentication > Email Templates**.
2. For each email type:
   - **Confirm signup**:
     - Subject: `Welcome to StoryRemix — Confirm Your Account`
     - Body: Copy contents from `supabase/email-templates/confirmation.en.html` (or `.fr.html` / `.ar.html`).
   - **Reset password**:
     - Subject: `Reset Your StoryRemix Password`
     - Body: Copy contents from `supabase/email-templates/reset-password.en.html`.
   - **Magic Link**:
     - Subject: `Your StoryRemix Magic Sign-in Link`
     - Body: Copy contents from `supabase/email-templates/magic-link.en.html`.
   - **Change Email Address**:
     - Subject: `Confirm Your New StoryRemix Email Address`
     - Body: Copy contents from `supabase/email-templates/email-change.en.html`.
3. Click **Save** for each template.

---

## 4. Supabase Template Variables Reference

- `{{ .ConfirmationURL }}`: The one-time secure link to confirm the action.
- `{{ .Token }}`: The 6-digit verification token (if using token-based verification).
- `{{ .SiteURL }}`: The application base URL (e.g., `https://storyremix-green.vercel.app`).
- `{{ .Email }}`: The recipient's email address.
- `{{ .NewEmail }}`: The new email address (for email change flows).

---

## 5. Deliverability & Spam Reputation Best Practices

1. **DKIM & SPF Records**: Ensure DNS records are verified with your domain registrar (Namecheap, Cloudflare, etc.).
2. **DMARC Policy**: Set up a `_dmarc` TXT record with `p=none` or `p=quarantine`.
3. **Redirect URLs**: In **Authentication > URL Configuration**, add:
   - Site URL: `https://storyremix-green.vercel.app`
   - Redirect URLs:
     - `https://storyremix-green.vercel.app/**`
     - `http://localhost:3000/**`
