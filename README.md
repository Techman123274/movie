# Subflix

Subflix is a Vite + React movie streaming UI powered by TMDB for metadata, Clerk for authentication, and Supabase for user data.

## Stack

- `TMDB` for movies, shows, posters, and search
- `Clerk` for sign-in/sign-up
- `Supabase` for profiles, watchlist, and watch history
- `localStorage` fallback when Supabase is not fully configured yet

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

3. Start the app:

```bash
npm run dev
```

## Environment Variables

The app reads public browser-safe variables from `.env.local`.

```env
TMDB_API_KEY=your_tmdb_api_key
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_CLERK_SUPABASE_JWT_TEMPLATE=supabase
```

Do not expose `CLERK_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in this frontend app.

## Supabase Setup

Run the SQL in [supabase/schema.sql](C:/Users/user/Desktop/cinematique/supabase/schema.sql) inside the Supabase SQL editor.

For Clerk-authenticated Supabase requests, the recommended setup is Supabase's native Clerk third-party auth integration plus Clerk session tokens. This app also supports the legacy Clerk JWT template named `supabase` as a fallback. If neither is configured, authenticated Supabase writes such as friend requests will be rejected by RLS.

## Notes

- `NEXT_PUBLIC_*` variables are supported directly in Vite through config.
- `TMDB_*` variables are also supported so you can keep your existing TMDB names.
- The app no longer depends on Base44 runtime services.
