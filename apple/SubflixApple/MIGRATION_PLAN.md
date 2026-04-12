# Subflix Apple Migration Plan

## Goal

Rebuild the current Subflix web experience as a native Apple app while keeping the same product shape:

- Sign in
- Profile selection
- Home hero and content rows
- Browse and search
- Detail and playback flows
- My List and history
- Social and friend requests
- Settings and admin tools

## Suggested native stack

- `SwiftUI` for screens and navigation
- `Observation` or `ObservableObject` for app state
- `URLSession` for TMDB networking
- `Supabase Swift` for data sync
- `Clerk iOS SDK` or native auth strategy
- `AVKit` for trailers and native playback where possible
- `WebKit` only where embedded providers are still required

## Migration phases

### Phase 1

- Build app shell
- Build auth flow
- Build profile picker
- Build home, browse, search, and detail screens

### Phase 2

- Wire TMDB API
- Wire Supabase data models
- Add watchlist, history, likes, and recommendations

### Phase 3

- Add social features
- Add friend requests and presence
- Add notifications
- Add admin tools

### Phase 4

- Replace embedded playback where possible
- Add offline caching
- Add polish, haptics, widgets, and deep links

## Important architecture note

The current web app relies on:

- browser `localStorage`
- Clerk web flows
- Supabase RLS with JWT-based identity
- a web embed player

The Apple app should not copy those patterns directly. We should keep the product behavior, but move to native storage, native auth/session handling, and native service clients.
