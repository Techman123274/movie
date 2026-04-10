# Subflix App Overview

This app is a Netflix-style streaming frontend called `Subflix`.

At a high level, it does this:

- Authenticates users with Clerk.
- Pulls movie and TV metadata from TMDB.
- Lets signed-in users choose or create profiles.
- Filters content based on profile maturity rules, including kids-only behavior.
- Shows a home screen with trending, popular, top-rated, curated, and recommendation-based rows.
- Lets users browse movies and TV separately, search titles, open detail pages, and start playback.
- Stores profiles, watchlist, watch history, and admin-managed content in Supabase when available.
- Falls back to browser `localStorage` for many features if Supabase or its tables are not available.
- Uses a third-party embed player (`vidlink.pro`) for playback.

## What The App Actually Is

This is not a full streaming backend with its own video hosting.

It is a polished streaming UI that combines:

- `Clerk` for sign-in
- `TMDB` for catalog data, artwork, cast, trailers, genres, search, and recommendations source data
- `Supabase` for app data storage
- `localStorage` as a fallback and for browser-level preferences
- `VidLink` embeds for playback URLs

## Main User Flow

1. If Clerk is not configured, the app shows a missing-config screen.
2. If the visitor is not signed in, the app shows a public landing/sign-in page.
3. After sign-in, the app shows a profile picker.
4. If the user has no profiles yet, the app auto-creates a default profile.
5. After a profile is selected, the user gets the full app:
   - Home
   - Browse movies / TV
   - Search
   - Detail pages
   - My List
   - Watch History
   - Settings
   - Support pages
6. Admin users also get an admin panel.

## User-Facing Features

### Home

The home page builds a streaming-style homepage with:

- Hero banner content
- Continue Watching
- My List
- Your Thumbs Up
- Trending / popular / top-rated rows
- Admin-curated hero and row content
- Recommendation rows based on the user profile's watch history and saved titles

For kids profiles, the home page changes heavily and uses kid-safe genre shelves like:

- Animated Favorites
- Family Movie Night
- Kids TV
- Learning and Nature

### Browse

The `/browse` page supports:

- `?type=movie`
- `?type=tv`

It shows genre-based shelves plus popular and top-rated content. Kids profiles get a separate safer shelf layout.

### Search

Search uses TMDB multi-search and:

- excludes people results
- excludes items without posters
- filters results through the active profile restrictions

### Detail Pages

Movie and TV detail pages include:

- backdrop/poster art
- title metadata
- cast
- similar/recommended titles
- trailer modal using YouTube trailer data from TMDB
- add/remove watchlist
- thumbs-up style local likes
- play button

TV pages also include:

- season picker
- episode list
- direct episode launch

### Playback

Playback happens at `/watch/:type/:id`.

Behavior:

- Movies open a VidLink movie embed.
- TV opens a VidLink TV episode embed using season/episode query params.
- The player blocks playback if the active profile is not allowed to watch that title.
- TV playback supports next-episode navigation and episode list switching.
- Starting playback writes or updates a watch-history row.

## Profiles And Content Restrictions

Profiles are a major feature of the app.

Each signed-in account can have up to 5 profiles. A profile can be:

- Standard
- Kids

Each profile also has a maturity level:

- `all`
- `teens`
- `older_kids`
- `little_kids`

The app filters titles using:

- TMDB `adult` flag
- blocked genre sets
- mature keywords in title/overview text
- known adult-animation title patterns

This filtering affects:

- home rows
- browse pages
- search results
- detail-page access
- playback access
- visible items in My List and Watch History

## Personalization

The app builds a simple taste profile from:

- watch history
- watchlist
- liked titles

It weights:

- genres
- media type
- decades
- viewing recency / progress

That taste profile is used to:

- generate recommendation rows
- attach match percentages to content cards

## Library Features

### My List

Users can save movies and shows to a watchlist.

- Watchlist is stored in Supabase when available.
- It falls back to local storage through the app's storage layer when remote tables are missing/unavailable.
- Titles can be removed from the My List page or detail pages.

### Watch History

When playback starts, the app logs a history entry containing:

- TMDB id
- media type
- title
- artwork
- rating
- release date
- genres
- season/episode for TV

### Likes

Thumbs-up / likes are stored separately from the watchlist.

- Likes are stored in `localStorage`
- They are scoped by user and active profile
- They appear on the home page as `Your Thumbs Up`

## Notifications

The navbar notification center merges multiple sources:

- admin-created notifications
- upcoming movie alerts
- now-playing movie alerts
- airing-today TV alerts
- trending title alerts

Users can:

- enable/disable in-app notifications
- enable browser notifications if the browser grants permission

Seen notification state is stored in `localStorage`, scoped per profile.

## Settings

The settings screen is split into sections:

- Account
- Playback
- Notifications
- Library
- Developer

It lets the user manage:

- autoplay preferences
- browser notification preferences
- watch history preference UI
- TMDB API key saved in browser storage
- profile switching
- admin access shortcut if the user is an admin

Important implementation note:

- Some settings are currently UI/preferences only.
- Playback uses the VidLink embed regardless, and watch history is still logged when playback starts.

## Admin Panel

Admin access is based on allowlisted email addresses.

The admin panel supports:

- overview metrics
- top titles and recent activity
- homepage curation
- custom admin notifications
- site-wide public settings
- update mode
- read-only user summary tables

Admin-curated content can be scheduled by:

- audience (`global`, `standard`, `kids`)
- start/end times
- entry type (`hero` or `row`)
- row title / sort order

Site settings can control:

- homepage curation mode
- curated row title
- notification center title/subtitle
- landing-page tagline
- update mode title/message

## Public / Support Pages

The app includes public support-style pages:

- FAQ
- Help Center
- Ways to Watch
- Privacy
- Contact Us
- Speed Test
- Legal Notices

These are available even when the user is not signed in.

The speed test page runs a browser-side network check against the app origin and estimates:

- latency
- download speed
- a streaming recommendation

## Data Storage Model

### Stored In Supabase When Available

- `profiles`
- `watchlist`
- `watch_history`
- `admin_notifications`
- `admin_featured_entries`
- `admin_site_settings`

### Stored In localStorage

- active profile
- profile preferences and toggles
- TMDB browser override key
- likes
- taste profile
- seen notifications
- browser-notification delivery memory
- fallback copies of user/admin data when Supabase is unavailable or missing tables

## Routes

Main routes in the app:

- `/` home
- `/browse?type=movie`
- `/browse?type=tv`
- `/search`
- `/movie/:id`
- `/tv/:id`
- `/watch/:type/:id`
- `/my-list`
- `/history`
- `/settings`
- `/setup`
- `/admin`
- `/faq`
- `/help-center`
- `/ways-to-watch`
- `/privacy`
- `/contact-us`
- `/speed-test`
- `/legal-notices`

## Important Caveats

- The app depends on TMDB credentials for catalog browsing.
- Without Clerk, the app cannot boot normally.
- Playback is embed-based, not first-party hosted.
- A lot of persistence is designed to degrade gracefully into browser storage.
- The branding is `Subflix`, but some internal keys and package naming still use `cinestream`.

## Short Version

This app is a full streaming-style frontend for movies and TV.

It gives users authentication, profile selection, kids restrictions, search, browse, detail pages, watchlist, history, recommendations, notifications, support pages, and an admin back office, while using TMDB for metadata and a VidLink embed for playback.
