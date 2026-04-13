import Foundation

#if canImport(Supabase)
import Supabase

struct SupabaseSDKAccountDataStore: AccountDataStore {
    let environment: AppEnvironment
    let clientProvider: SupabaseClientProvider

    func fetchProfiles(for user: SessionUser?) async -> [UserProfile] {
        guard let user else {
            return PreviewFixtures.profiles
        }

        do {
            let client = try await clientProvider.makeClient()
            let rows: [SupabaseProfileRow] = try await client
                .from("profiles")
                .select("id,name,is_kids,maturity_rating,avatar_color")
                .eq("user_id", value: user.id)
                .order("updated_at", ascending: false)
                .execute()
                .value

            let mapped = rows.map {
                UserProfile(
                    id: UUID(uuidString: $0.id) ?? UUID(),
                    name: $0.name,
                    isKids: $0.isKids,
                    maturityRating: $0.maturityRating ?? "all",
                    avatarColorHex: $0.avatarColor ?? "#E50914"
                )
            }

            return mapped.isEmpty ? PreviewFixtures.profiles : mapped
        } catch {
            return PreviewFixtures.profiles
        }
    }

    func fetchMyList(for user: SessionUser?) async -> [MediaItem] {
        guard let user else {
            return PreviewFixtures.myList
        }

        do {
            let client = try await clientProvider.makeClient()
            let rows: [SupabaseWatchlistRow] = try await client
                .from("watchlist")
                .select("tmdb_id,title,overview,release_date,media_type,poster_path,backdrop_path,vote_average")
                .eq("user_id", value: user.id)
                .order("updated_at", ascending: false)
                .execute()
                .value

            let mapped = rows.map { row in
                MediaItem(
                    id: row.tmdbID,
                    title: row.title,
                    overview: row.overview ?? "",
                    yearText: String((row.releaseDate ?? "").prefix(4)),
                    runtimeText: row.mediaType == "tv" ? "Series" : "Movie",
                    kind: row.mediaType == "tv" ? .tv : .movie,
                    posterURL: imageURL(path: row.posterPath),
                    backdropURL: imageURL(path: row.backdropPath),
                    matchPercent: row.voteAverage.map { min(99, Int($0 * 10)) },
                    trailerYouTubeKey: nil,
                    isKidsSafe: true
                )
            }

            return mapped.isEmpty ? PreviewFixtures.myList : mapped
        } catch {
            return PreviewFixtures.myList
        }
    }

    func fetchFriendRequests(for user: SessionUser?) async -> [FriendRequest] {
        guard let user else {
            return PreviewFixtures.friendRequests
        }

        do {
            let client = try await clientProvider.makeClient()
            let email = user.email.lowercased()
            let rows: [SupabaseFriendRequestRow] = try await client
                .from("friend_requests")
                .select("requester_name,requester_email,status")
                .or("requester_user_id.eq.\(user.id),addressee_email.eq.\(email)")
                .order("updated_at", ascending: false)
                .execute()
                .value

            let mapped = rows.map {
                FriendRequest(
                    requesterName: $0.requesterName ?? $0.requesterEmail,
                    requesterEmail: $0.requesterEmail,
                    status: $0.status
                )
            }

            return mapped.isEmpty ? PreviewFixtures.friendRequests : mapped
        } catch {
            return PreviewFixtures.friendRequests
        }
    }

    private func imageURL(path: String?) -> URL? {
        guard let path, !path.isEmpty else {
            return nil
        }

        return environment.tmdbImageBaseURL.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/")))
    }
}
#endif
