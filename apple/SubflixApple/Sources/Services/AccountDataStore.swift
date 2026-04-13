import Foundation

protocol AccountDataStore {
    func fetchProfiles(for user: SessionUser?) async -> [UserProfile]
    func fetchMyList(for user: SessionUser?) async -> [MediaItem]
    func fetchFriendRequests(for user: SessionUser?) async -> [FriendRequest]
}

struct MockAccountDataStore: AccountDataStore {
    func fetchProfiles(for user: SessionUser?) async -> [UserProfile] {
        PreviewFixtures.profiles
    }

    func fetchMyList(for user: SessionUser?) async -> [MediaItem] {
        PreviewFixtures.myList
    }

    func fetchFriendRequests(for user: SessionUser?) async -> [FriendRequest] {
        PreviewFixtures.friendRequests
    }
}

struct SupabaseAccountDataStore: AccountDataStore {
    let environment: AppEnvironment
    let client: SupabaseRESTClient

    func fetchProfiles(for user: SessionUser?) async -> [UserProfile] {
        guard let user else {
            return PreviewFixtures.profiles
        }

        do {
            let rows: [SupabaseProfileRow] = try await client.selectRows(
                from: "profiles",
                queryItems: [
                    URLQueryItem(name: "select", value: "id,name,is_kids,maturity_rating,avatar_color"),
                    URLQueryItem(name: "user_id", value: "eq.\(user.id)"),
                    URLQueryItem(name: "order", value: "updated_at.desc")
                ]
            )

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
            let rows: [SupabaseWatchlistRow] = try await client.selectRows(
                from: "watchlist",
                queryItems: [
                    URLQueryItem(name: "select", value: "tmdb_id,title,overview,release_date,media_type,poster_path,backdrop_path,vote_average"),
                    URLQueryItem(name: "user_id", value: "eq.\(user.id)"),
                    URLQueryItem(name: "order", value: "updated_at.desc")
                ]
            )

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
            let email = user.email.lowercased()
            let rows: [SupabaseFriendRequestRow] = try await client.selectRows(
                from: "friend_requests",
                queryItems: [
                    URLQueryItem(name: "select", value: "requester_name,requester_email,status"),
                    URLQueryItem(name: "or", value: "(requester_user_id.eq.\(user.id),addressee_email.eq.\(email))"),
                    URLQueryItem(name: "order", value: "updated_at.desc")
                ]
            )

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

private struct SupabaseProfileRow: Decodable {
    let id: String
    let name: String
    let isKids: Bool
    let maturityRating: String?
    let avatarColor: String?

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case isKids = "is_kids"
        case maturityRating = "maturity_rating"
        case avatarColor = "avatar_color"
    }
}

private struct SupabaseWatchlistRow: Decodable {
    let tmdbID: Int
    let title: String
    let overview: String?
    let releaseDate: String?
    let mediaType: String
    let posterPath: String?
    let backdropPath: String?
    let voteAverage: Double?

    enum CodingKeys: String, CodingKey {
        case tmdbID = "tmdb_id"
        case title
        case overview
        case releaseDate = "release_date"
        case mediaType = "media_type"
        case posterPath = "poster_path"
        case backdropPath = "backdrop_path"
        case voteAverage = "vote_average"
    }
}

private struct SupabaseFriendRequestRow: Decodable {
    let requesterName: String?
    let requesterEmail: String
    let status: String

    enum CodingKeys: String, CodingKey {
        case requesterName = "requester_name"
        case requesterEmail = "requester_email"
        case status
    }
}
