# Coduy Instagram Publisher

Automated daily Instagram carousel posts for the Coduy learning app.

## What it does

Every day at 09:00 CEST, this job:
1. Picks the next unposted lesson from Supabase
2. Renders a carousel (1 video + 5 images) using Remotion
3. Uploads assets to Supabase Storage
4. Publishes to both EN and SK Instagram accounts
5. Marks the lesson as posted

## Carousel structure

| Slide | Type | Content |
|-------|------|---------|
| 1 | Video | Byte mascot animation + lesson title |
| 2-4 | Image | Learning content (split into slides) |
| 5 | Image | "Why should you care?" (real-world examples) |
| 6 | Image | CTA — "Download Coduy" |

Byte's outfit changes based on module difficulty (common → legendary → mythic).

## Setup

### GitHub Secrets
- `IG_PAGE_TOKEN_EN` — Instagram Page token (EN account)
- `IG_PAGE_TOKEN_SK` — Instagram Page token (SK account)
- `IG_USER_ID_EN` — `17841480513550720`
- `IG_USER_ID_SK` — `17841479030655283`
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key

### Supabase
- `cb_lessons` table with `posted_at` column
- `ig-media` public storage bucket

### Local testing
```bash
cp .env.example .env  # fill in values
npm install
npm run post:dry      # render + upload, skip Instagram publish
npm run post -- --lesson-id 1  # specific lesson
```

## Dimensions
All slides: 1087×1447 (custom aspect ratio, close to 3:4)

## Notes
- GitHub Actions free tier: 2000 min/month, this uses ~90 min/month
- IG carousel limit: 10 items, we use 6
- IG caption limit: 2200 chars — captions are auto-trimmed
- Repos with no commits for 60 days auto-disable scheduled workflows
