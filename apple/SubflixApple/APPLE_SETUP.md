# Apple App Setup

## Recommended config keys

Add these keys to your iOS app target `Info.plist`:

- `SubflixUseLiveServices` - `Boolean`
- `TMDBReadAccessToken` - `String`
- `TMDBAPIBaseURL` - `String`
- `TMDBImageBaseURL` - `String`
- `SupabaseURL` - `String`
- `SupabaseAnonKey` - `String`
- `ClerkPublishableKey` - `String`
- `ClerkJWTTemplate` - `String` (optional fallback)

## Suggested values

- `SubflixUseLiveServices` = `NO` while building UI
- `TMDBAPIBaseURL` = `https://api.themoviedb.org/3`
- `TMDBImageBaseURL` = `https://image.tmdb.org/t/p/w780`
- `ClerkJWTTemplate` = `supabase` only if you intentionally keep the legacy fallback path

## Native SDK plan

### TMDB

- `URLSession`
- bearer token auth
- map TMDB movie/TV payloads into `MediaItem`

### Clerk

- Xcode package URL: `https://github.com/clerk/clerk-ios`
- Add products: `ClerkKit` and `ClerkKitUI`
- use Clerk iOS SDK for session lifecycle
- expose a session token provider to the app service layer
- use standard Clerk session tokens first
- keep the custom `supabase` JWT template only as an optional fallback

### Supabase

- Xcode package URL: `https://github.com/supabase/supabase-swift`
- Add product: `Supabase`
- use `Supabase Swift` when the package is present, with REST fallback already included in this scaffold
- pass the Clerk-backed bearer token into authenticated calls
- keep RLS rules aligned with the current web schema

## Live-mode startup behavior

When `SubflixUseLiveServices` is enabled:

- auth uses `ClerkAuthService`
- catalog uses `RemoteDataStore` and TMDB
- account data uses `SupabaseSDKAccountDataStore` when the package is installed, otherwise `SupabaseAccountDataStore`

When disabled:

- the app stays on preview/mock services for fast UI iteration

## Xcode project generation

This folder now includes `project.yml` for `XcodeGen`.

Recommended Mac steps:

1. Install XcodeGen
2. Run `xcodegen generate` inside `apple/SubflixApple`
3. Open the generated `SubflixApple.xcodeproj`
4. Fill in the `Resources/Info.plist` keys

