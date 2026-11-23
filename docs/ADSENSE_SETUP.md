# Google AdSense Monetization & Integration Guide

## 1. Ethical, Zero-Intrusion Design

StoryRemix implements a clean, non-disruptive Google AdSense architecture:
- **Disabled by default**: Enabled strictly via feature flag `NEXT_PUBLIC_ADSENSE_ENABLED=true`.
- **Zero CLS (Cumulative Layout Shift)**: Containers reserve fixed min-heights and aspect ratios before ad tags evaluate, maintaining a 100% stable reading viewport.
- **No Disruptive Formats**: No interstitials, popups, auto-playing video/audio, sticky blockers, or reader interruptions.
- **Sanctuary Zones**: The active paragraph writing and voting surfaces (`<ActiveRoundWidget />`) are strictly ad-free to keep creative collaboration focused.

---

## 2. Environment Configuration

Add the following variables to `.env.local` or Vercel environment variables:

```env
# Enable AdSense (Defaults to false in dev/test)
NEXT_PUBLIC_ADSENSE_ENABLED=true

# Your Google AdSense Publisher ID (format: ca-pub-XXXXXXXXXXXXXXXX)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-1234567890123456
```

---

## 3. Placement Specifications

### 1. Discovery Feed Banner (`explore_feed_bottom`)
- Location: Bottom of the `/explore` stories feed.
- Format: `horizontal` (728x90 desktop / 320x50 mobile fluid).
- Min-height: `90px` reservation.

### 2. Story Page Footer (`story_footer_banner`)
- Location: Bottom of `/stories/[slug]`, below completed story text and remixes.
- Format: `horizontal`.
- Min-height: `90px` reservation.

---

## 4. Google `ads.txt` Verification

Google AdSense requires an authorized seller file placed at the domain root:
- File location: `public/ads.txt`
- Web address: `https://storyremix-green.vercel.app/ads.txt`

Content format:
```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```
Replace `pub-XXXXXXXXXXXXXXXX` with your verified publisher ID once approved in the Google AdSense dashboard.
