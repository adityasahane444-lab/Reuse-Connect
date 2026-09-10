# Reuse & Connect

A community reuse and sustainability platform: share surplus food, give away or find reusable items, organize and join community events, and earn Green Points on a live leaderboard.

Built with Next.js (App Router) + React + Tailwind CSS, with Supabase (PostgreSQL) as the database.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Local dev also needs a Supabase project connected — see below. Without it, the app will error when it tries to read/write data (auth, posts, events, points).

## Setting up the database (Supabase)

1. Create a free project at https://supabase.com.
2. In the project dashboard, go to **SQL Editor -> New query**, paste the contents of `supabase/schema.sql`, and click **Run**. This creates all the tables (`users`, `sessions`, `food_posts`, `resource_posts`, `events`, `event_participants`, `points_tx`) and a helper function for awarding points.
3. Go to **Settings -> API** and copy:
   - **Project URL**
   - **service_role** secret key (not the `anon` key)
4. Copy `.env.local.example` to `.env.local` and paste those two values in:
   ```
   SUPABASE_URL=https://xxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. Restart `npm run dev` if it was already running.

The `service_role` key has full database access and is only ever used on the server (API routes and server components) — it's never sent to the browser. Keep it out of git; `.env.local` is already in `.gitignore`.

## Deploying so anyone can use it

1. Push this project to a GitHub repository.
2. Go to https://vercel.com, sign in with GitHub, and import the repository.
3. In the Vercel project's **Settings -> Environment Variables**, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` with the same values as your `.env.local`.
4. Deploy. Vercel gives you a public URL anyone can visit and use.

Because the data lives in Supabase (not on disk), it persists across deploys and works correctly on Vercel's serverless functions.

## Project structure

- `app/` — pages (App Router) and API routes (`app/api/**/route.ts`)
- `lib/supabase.ts` — server-only Supabase client
- `lib/auth.ts` — password hashing, session cookies, Green Points awarding
- `lib/types.ts` — shared TypeScript types
- `supabase/schema.sql` — database schema to run in Supabase's SQL Editor
- `components/Navbar.tsx` — shared header with live login state

## Not yet built

Travel-specific carpool/plans, badges & awards, admin dashboard — planned as future phases.
