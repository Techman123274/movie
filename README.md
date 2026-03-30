# Subflix

Subflix is a premium streaming-style movie, TV, and sports web app built with Next.js App Router. It uses TMDB as the primary metadata source for film and series, Supabase for profile-scoped data, Clerk for auth, a guarded playback layer for VidLink and MoviesAPI, and a separate sports watch flow linked into StreamCenter.

## Features

- Public marketing landing page at `/` and streaming app browse home at `/browse`
- Live TMDB catalog for browse, search, movies, shows, detail pages, and provider discovery
- Real Clerk + Supabase user flow with profile onboarding and profile-scoped region preferences
- Provider sections for Netflix, Hulu, Max, Prime Video, and any other TMDB watch providers in the active region
- Detail-page provider badges separate from the playback providers used on watch pages
- Real watchlist and continue-watching rails resolved from stored TMDB IDs instead of filler content
- Separate sports section with live league/event discovery and StreamCenter handoff pages
- Strict ad-free playback gate for VidLink and MoviesAPI embeds

## Environment

Copy `.env.example` to `.env.local` and configure:

- `TMDB_API_KEY` or `TMDB_READ_ACCESS_TOKEN`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_DEFAULT_PROVIDER_REGION` for signed-out browsing defaults
- `NEXT_PUBLIC_STREAMCENTER_URL` if you want to override the default StreamCenter destination

This version is **real-data only**. Missing TMDB or Supabase configuration now produces explicit unavailable states instead of mock fallback content.

## Development

```bash
npm run dev
npm run lint
npm run build
```

## Test On Phone

`npm run dev` now binds to `0.0.0.0`, so you can open the app from your phone while both devices are on the same Wi-Fi or LAN.

1. Run `npm run dev`
2. Open `http://YOUR_LOCAL_IP:3000` on your phone
3. If it does not load, allow Node.js through Windows Firewall

Current local IPv4 in this environment: `10.0.0.98`

## Database

Apply `supabase/schema.sql` so the app can persist:

- `users`
- `profiles`
- `watchlists`
- `watch_progress`
- `watch_history`

`profiles.provider_region` stores the active region for TMDB watch-provider rails and detail badges.

## Auth and Onboarding

After adding Clerk keys and restarting the dev server:

1. Use the `Sign up` button in the top-right nav.
2. Create your first test user.
3. Complete profile onboarding.
4. You should be redirected into `/browse` after the first profile is created.
5. Switch profiles from the Profiles page and update provider region from Account, Settings, or Providers.

## Playback Safety

Watch pages only embed VidLink or MoviesAPI when a provider is included in `NEXT_PUBLIC_VALIDATED_PLAYBACK_PROVIDERS`. TMDB watch-provider badges like Netflix or Hulu are informational discovery data and are intentionally separate from playback embeds.

## Database Note

If onboarding reports that `public.profiles` is missing, apply `supabase/schema.sql` to your live Supabase project before trying again.
