import Foundation

struct TMDBClient {
    let environment: AppEnvironment
    let session: URLSession

    init(environment: AppEnvironment, session: URLSession = .shared) {
        self.environment = environment
        self.session = session
    }

    func fetchHomeSections(for profile: UserProfile) async throws -> [ContentSection] {
        async let featured = fetchTrending(kind: .movie)
        async let trendingTV = fetchTrending(kind: .tv)
        async let popular = fetchPopular(kind: profile.isKids ? .movie : .tv)

        let featuredItems = try await sanitize(items: featured, for: profile)
        let trendingItems = try await sanitize(items: trendingTV, for: profile)
        let recommendedItems = try await sanitize(items: popular, for: profile)

        return [
            ContentSection(title: "Featured", subtitle: "From TMDB", style: .hero, items: Array(featuredItems.prefix(5))),
            ContentSection(title: "Trending Now", subtitle: nil, style: .shelf, items: Array(trendingItems.prefix(12))),
            ContentSection(title: "Recommended For You", subtitle: "Live TMDB feed", style: .shelf, items: Array(recommendedItems.prefix(12)))
        ]
    }

    func fetchBrowseItems(kind: MediaKind) async throws -> [MediaItem] {
        try await fetchPopular(kind: kind)
    }

    func search(query: String) async throws -> [MediaItem] {
        let response: TMDBPagedResponse = try await request(
            path: "search/multi",
            queryItems: [
                URLQueryItem(name: "query", value: query),
                URLQueryItem(name: "include_adult", value: "false")
            ]
        )

        return response.results.compactMap(mapResult)
    }

    private func fetchTrending(kind: MediaKind) async throws -> [MediaItem] {
        let path = "trending/\(kind.rawValue)/week"
        let response: TMDBPagedResponse = try await request(path: path, queryItems: [])
        return response.results.compactMap(mapResult)
    }

    private func fetchPopular(kind: MediaKind) async throws -> [MediaItem] {
        let path = "discover/\(kind.rawValue)"
        let response: TMDBPagedResponse = try await request(
            path: path,
            queryItems: [
                URLQueryItem(name: "sort_by", value: "popularity.desc"),
                URLQueryItem(name: "include_adult", value: "false")
            ]
        )
        return response.results.compactMap(mapResult)
    }

    private func sanitize(items: [MediaItem], for profile: UserProfile) async throws -> [MediaItem] {
        if !profile.isKids {
            return items
        }

        return items.filter { $0.isKidsSafe }
    }

    private func request<T: Decodable>(path: String, queryItems: [URLQueryItem]) async throws -> T {
        var components = URLComponents(url: environment.tmdbAPIBaseURL.appending(path: path), resolvingAgainstBaseURL: false)
        components?.queryItems = queryItems

        guard let url = components?.url else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(environment.tmdbReadAccessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let (data, _) = try await session.data(for: request)
        return try JSONDecoder().decode(T.self, from: data)
    }

    private func mapResult(_ result: TMDBMediaResult) -> MediaItem? {
        guard let id = result.id else {
            return nil
        }

        let title = result.title ?? result.name ?? "Untitled"
        let kind: MediaKind = result.mediaType == "tv" || (result.mediaType == nil && result.name != nil) ? .tv : .movie
        let date = result.releaseDate ?? result.firstAirDate ?? ""
        let isKidsSafe = !(result.adult ?? false) && !(result.genreIDs ?? []).contains(where: blockedKidsGenreIDs.contains)

        return MediaItem(
            id: id,
            title: title,
            overview: result.overview ?? "",
            yearText: String(date.prefix(4)),
            runtimeText: kind == .tv ? "Series" : "Movie",
            kind: kind,
            posterURL: imageURL(path: result.posterPath),
            backdropURL: imageURL(path: result.backdropPath),
            matchPercent: result.voteAverage.map { min(99, Int($0 * 10)) },
            trailerYouTubeKey: nil,
            isKidsSafe: isKidsSafe
        )
    }

    private func imageURL(path: String?) -> URL? {
        guard let path, !path.isEmpty else {
            return nil
        }

        return environment.tmdbImageBaseURL.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/")))
    }

    private var blockedKidsGenreIDs: Set<Int> {
        [27, 53, 80, 9648, 10752]
    }
}

private struct TMDBPagedResponse: Decodable {
    let results: [TMDBMediaResult]
}

private struct TMDBMediaResult: Decodable {
    let id: Int?
    let title: String?
    let name: String?
    let overview: String?
    let posterPath: String?
    let backdropPath: String?
    let releaseDate: String?
    let firstAirDate: String?
    let mediaType: String?
    let voteAverage: Double?
    let adult: Bool?
    let genreIDs: [Int]?

    enum CodingKeys: String, CodingKey {
        case id
        case title
        case name
        case overview
        case posterPath = "poster_path"
        case backdropPath = "backdrop_path"
        case releaseDate = "release_date"
        case firstAirDate = "first_air_date"
        case mediaType = "media_type"
        case voteAverage = "vote_average"
        case adult
        case genreIDs = "genre_ids"
    }
}
