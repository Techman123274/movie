import Foundation

struct AppEnvironment {
    let useLiveServices: Bool
    let tmdbReadAccessToken: String
    let tmdbAPIBaseURL: URL
    let tmdbImageBaseURL: URL
    let supabaseURL: URL?
    let supabaseAnonKey: String
    let clerkPublishableKey: String
    let clerkJWTTemplate: String

    var hasTMDBConfig: Bool {
        !tmdbReadAccessToken.isEmpty
    }

    var hasSupabaseConfig: Bool {
        supabaseURL != nil && !supabaseAnonKey.isEmpty
    }

    var hasClerkConfig: Bool {
        !clerkPublishableKey.isEmpty
    }

    static let live = AppEnvironment(bundle: .main)

    init(bundle: Bundle) {
        let dictionary = bundle.infoDictionary ?? [:]

        useLiveServices = dictionary["SubflixUseLiveServices"] as? Bool ?? false
        tmdbReadAccessToken = dictionary["TMDBReadAccessToken"] as? String ?? ""
        supabaseAnonKey = dictionary["SupabaseAnonKey"] as? String ?? ""
        clerkPublishableKey = dictionary["ClerkPublishableKey"] as? String ?? ""
        clerkJWTTemplate = dictionary["ClerkJWTTemplate"] as? String ?? "supabase"

        let tmdbBaseURLString = dictionary["TMDBAPIBaseURL"] as? String ?? "https://api.themoviedb.org/3"
        tmdbAPIBaseURL = URL(string: tmdbBaseURLString) ?? URL(string: "https://api.themoviedb.org/3")!

        let tmdbImageBaseURLString = dictionary["TMDBImageBaseURL"] as? String ?? "https://image.tmdb.org/t/p/w780"
        tmdbImageBaseURL = URL(string: tmdbImageBaseURLString) ?? URL(string: "https://image.tmdb.org/t/p/w780")!

        if let supabaseURLString = dictionary["SupabaseURL"] as? String {
            supabaseURL = URL(string: supabaseURLString)
        } else {
            supabaseURL = nil
        }
    }
}
