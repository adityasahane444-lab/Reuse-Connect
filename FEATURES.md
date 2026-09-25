# New in this update

Run `supabase/migration-002-features.sql` once in the Supabase SQL editor (after the original
`schema.sql`) before deploying. It's additive and safe to re-run.

It also creates a public `avatars` storage bucket automatically (if Storage is enabled on your
project). To make yourself an admin, run:

```sql
update users set is_admin = true where email = 'you@example.com';
```

## 1. Profile & account management
- **`/profile`** — avatar upload (drag a PNG/JPEG/WebP, 2 MB max), editable bio, Green Points
  and rank, listing/exchange counts, exchange history, and reviews received.
- **`/users/[id]`** — the public version of a profile (no email), linked from every listing,
  request and event.
- **`/settings`** — privacy toggles (allow DMs from anyone / notification categories), change
  password (signs you out of other devices), and delete account (type-to-confirm + password).

## 2. Discovery & campus utility
- Search bars + category chips on Food, Resources and Events, with a small debounce so typing
  feels instant.
- Resources gained **tags** (free text, plus one-click suggested tags like `sppu`, `se`,
  `chemistry`, `lab-kit`) and three new academic categories — Question Banks (SPPU), Textbooks,
  Lab Equipment — marked with a 🎓.
- **Map view** on Food and Events (Leaflet + OpenStreetMap, no API key needed). Posting a food
  item or event lets you drop a pin or use your current location; the Food page also has a
  "Nearest first" sort using your location.

## 3. Communication & alerts
- **Exchange requests**: ask for a food/resource item → owner accepts or declines → an
  in-app chat conversation opens automatically → either side marks the handover complete →
  both can rate each other. All of it is visible under **`/requests`**.
- **`/messages`** — a simple inbox/thread UI; polls for new messages every 5s. You can message
  anyone directly from a listing without seeing their phone number or email.
- **Notification bell** in the navbar + **`/notifications`** — fires on new requests,
  accept/decline, cancellations, completions, ratings, event joins, and food nearing its
  expiry time (checked automatically whenever you're active, no cron needed).

## 4. Moderation & trust
- **`/admin`** (admin-only) — platform stats including an "items diverted from landfill" impact
  counter, a flagged-posts queue (dismiss / remove / remove & suspend), and a user search with
  suspend/unsuspend.
- 🚩 **Report** button on every listing/event card.
- **Ratings**: after a handover is marked complete, both sides can leave a 1–5 star rating +
  comment, shown on profiles and next to listings.

## New environment note
No new environment variables are required — everything reuses the existing
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`. Avatar uploads need the Storage feature enabled
on your Supabase project (the migration creates the `avatars` bucket for you).
