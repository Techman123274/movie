# Subflix Apple App

This folder is the SwiftUI starting point for rebuilding the current web app as a native Apple app.

## What is included

- A clean SwiftUI app scaffold
- Feature folders that mirror the current web app
- Shared models for media, profiles, and content sections
- Mock services and preview data so we can build UI before wiring live APIs
- Live-service architecture for TMDB plus Clerk/Supabase-ready native integrations
- A migration guide for TMDB, Clerk, Supabase, playback, and notifications

## Folder structure

- `Sources/App` - app entry and root state
- `Sources/Models` - media and profile models
- `Sources/Services` - auth, data, and playback abstractions
- `Sources/Services/Configuration` - app config and live/mock switching
- `Sources/Features` - Home, Browse, Search, Library, Social, Settings, Player, Admin
- `Sources/Core` - theme and shared UI
- `Sources/Support` - preview fixtures and notes

## Recommended next step on a Mac

1. Open Xcode
2. Install `XcodeGen`
3. Run `xcodegen generate` inside `apple/SubflixApple`
4. Open the generated `SubflixApple.xcodeproj`
5. Fill in the config keys from `APPLE_SETUP.md`
6. If needed, adjust package versions and signing in Xcode

## Platform assumption

This scaffold targets `Swift` + `SwiftUI` for a native iPhone/iPad app.

## Live mode

The app scaffold now supports two modes:

- mock mode for UI and architecture work
- live mode for TMDB + Clerk + Supabase wiring

Set `SubflixUseLiveServices` in your app config when you are ready to switch over.

## Native integrations included

- `TMDBClient` for live catalog fetches
- `ClerkAuthService` with conditional `ClerkKit` / `ClerkKitUI` integration
- `SupabaseSDKAccountDataStore` with SDK-first behavior when `Supabase` is installed
- REST fallback for Supabase account data if the SDK is not present yet
- `project.yml`, `Configs/`, `Resources/Info.plist`, and asset placeholders for Xcode generation

