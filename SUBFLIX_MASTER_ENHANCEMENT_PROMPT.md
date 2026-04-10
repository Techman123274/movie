# Subflix Master Enhancement Prompt

You are a senior full-stack engineer and product designer working inside an existing React + Vite codebase called `Subflix`.

This app already includes:

- Clerk authentication
- TMDB integration for movies and TV metadata
- profile selection and management
- kids profiles and maturity filtering
- home, browse, search, movie detail, TV detail, player, watchlist, history, settings, support pages
- a Supabase-backed data layer with localStorage fallback
- an admin panel for curated content, notifications, and site settings
- embedded playback through a provider abstraction

Your task is to upgrade this app into a premium, production-quality streaming platform without breaking existing functionality.

Do not remove or rewrite working features unless required for scalability. Extend the current architecture cleanly.

## Core Objective

Transform Subflix from a polished streaming frontend into a higher-end, Netflix-level product with:

- better playback continuity
- stronger personalization
- social features
- richer UI polish
- better mobile support
- more capable admin tooling
- scalable data and state architecture

## Existing Constraints You Must Respect

- Frontend stack is `React + Vite`
- Auth uses `Clerk`
- App data uses `Supabase` with `localStorage` fallback
- TMDB is the metadata source
- Active profile and profile restrictions are central to the UX
- Existing routes and current pages must keep working
- Existing admin features must remain intact
- Graceful fallback behavior must continue when Supabase tables are unavailable
- Current branding is `Subflix`, though some internal keys still use `cinestream`

## High-Priority Features To Implement

### 1. Advanced Playback System

Upgrade the player and playback tracking to support:

- precise playback progress storage using timestamps, not only basic percent progress
- resume playback from the last saved timestamp
- visible progress bars on cards, rows, My List, and Continue Watching
- richer Continue Watching behavior with last episode / next episode awareness
- mock or heuristic `Skip Intro` support
- `Next Episode` auto-play with countdown
- hover-based auto trailer previews on eligible cards, muted by default

Implementation requirements:

- design the playback system so it works for both movies and TV episodes
- store enough metadata to resume a specific season/episode correctly
- preserve profile-based restrictions in playback

### 2. Enhanced Recommendation Engine

Upgrade the current taste-profile system.

Add new recommendation rows such as:

- `Because You Watched X`
- `Trending In Your Favorite Genres`
- `Hidden Gems For You`

Improve recommendation scoring using:

- genre overlap
- recency
- watch duration / progress
- likes or ratings
- media type preference
- decade / era preference

Improve match percentage quality so it feels more intentional and less arbitrary.

### 3. Social Features

Add a lightweight social layer that fits the current app architecture.

Support:

- friend relationships
- friend activity feed
- `Friends Activity` row on home
- signals like `X liked this`
- trending among friends
- user ratings using either 1-5 stars or a thumbs-based model
- optional lightweight comments/reviews if it fits cleanly

Do not redesign auth from scratch. Build this on top of current authenticated users.

### 4. Multi-Source Playback

The app currently relies on a single playback source.

Upgrade it to:

- support multiple playback providers
- use a provider abstraction layer
- fall back automatically if one source fails
- allow future expansion to more providers

The implementation should keep the player modular and avoid hardcoding a single provider path deep in UI components.

### 5. UI/UX Polish

Make the entire app feel more premium and production-ready.

Priorities:

- replace basic loading states with polished skeleton loaders where appropriate
- improve horizontal rails with smooth scrolling, snap behavior, and touch-friendly movement
- richer card hover interactions with motion and optional preview behavior
- dynamic hero visuals derived from title artwork
- better route/page transitions
- more polished empty states, locked states, and loading states

Preserve the existing visual identity while elevating it.

### 6. Mobile + PWA Support

Upgrade the app for mobile and installability.

Implement:

- robust mobile layouts
- touch-friendly row interaction
- installable PWA support
- improved mobile performance
- sensible offline/fallback behavior where feasible

### 7. Admin Panel Upgrade

Enhance admin capabilities without removing current tools.

Add:

- drag-and-drop homepage row ordering
- preview mode before publishing
- analytics dashboard
- better scheduling UX for featured content and notifications

Analytics should include:

- most watched titles
- most active users
- most popular genres
- optionally profile-type segmentation

### 8. AI-Powered Features

Add AI-driven features that feel useful and realistic.

Examples:

- natural language search like `funny high school movies`
- AI recommendation assistant such as `What should I watch tonight?`
- optional generated summaries or recap-style content

Design these features so they are additive and do not break normal TMDB search flows.

### 9. Performance + Architecture

Improve technical quality across the app.

Add or improve:

- TMDB response caching
- batched or reduced API calls where possible
- error boundaries around key app sections
- clearer separation of UI, state, and data access
- scalable utility layers for recommendations, playback, social features, and admin data

### 10. Data Model Updates

Update the database and fallback data model to support:

- precise playback progress timestamps
- ratings
- friendships
- social activity
- recommendation signals if needed

Schema changes must fit both:

- Supabase tables
- local fallback behavior

## Implementation Rules

- Keep the code modular and scalable
- Reuse existing components and patterns where sensible
- Do not break current routes
- Do not remove kids filtering or profile restrictions
- Keep Clerk auth intact
- Keep Supabase fallback behavior intact
- Separate UI, domain logic, and storage/data access cleanly
- Prefer progressive enhancement instead of giant rewrites
- If a feature is too large to ship at once, phase it cleanly

## Design Goal

The final result should feel like:

- Netflix + Hulu hybrid
- fast, polished, cinematic, and premium
- personalized per user and per profile
- mobile-friendly and production-minded

## Expected Output Format

Provide the result in this structure:

1. Updated architecture overview
2. Recommended implementation phases
3. New files and components to add
4. Existing files/modules to modify
5. Database schema updates
6. Key code snippets for critical systems
7. Migration and rollout notes
8. Risks, tradeoffs, and fallback considerations

## Important Delivery Behavior

Do not try to hand-wave the work.

Be concrete about:

- which files should change
- which new abstractions should be introduced
- how playback progress should be stored
- how recommendation scoring should evolve
- how the admin panel should be extended
- how fallback storage should behave when Supabase is unavailable

When suggesting code, make it align with the current codebase structure instead of inventing a new app from scratch.

## Follow-Up Prompt

After completing the initial response, also provide a second section titled:

`Recommended Ship Plan`

Break the upgrade into practical phases, with Phase 1 focused on the highest-impact improvements that can ship fastest.

Phase 1 should prioritize:

- resume playback
- real progress tracking
- progress bars on cards
- better Continue Watching
- playback provider abstraction improvements

## Final Instruction

Treat this as an upgrade of a real app that already works.

Do not respond with generic advice only. Respond like an engineer planning and implementing a production-ready enhancement path for the existing Subflix codebase.
