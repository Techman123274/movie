import Foundation

enum SupabaseRESTError: Error {
    case notConfigured
    case invalidResponse
}

struct SupabaseRESTClient {
    let environment: AppEnvironment
    let tokenProvider: () async -> String?
    let session: URLSession

    init(
        environment: AppEnvironment,
        tokenProvider: @escaping () async -> String?,
        session: URLSession = .shared
    ) {
        self.environment = environment
        self.tokenProvider = tokenProvider
        self.session = session
    }

    func selectRows<T: Decodable>(from table: String, queryItems: [URLQueryItem]) async throws -> [T] {
        guard let supabaseURL = environment.supabaseURL else {
            throw SupabaseRESTError.notConfigured
        }

        var components = URLComponents(url: supabaseURL.appending(path: "rest/v1/\(table)"), resolvingAgainstBaseURL: false)
        components?.queryItems = queryItems

        guard let url = components?.url else {
            throw SupabaseRESTError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(environment.supabaseAnonKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        let bearer = await tokenProvider() ?? environment.supabaseAnonKey
        request.setValue("Bearer \(bearer)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse, (200..<300).contains(httpResponse.statusCode) else {
            throw SupabaseRESTError.invalidResponse
        }

        return try JSONDecoder().decode([T].self, from: data)
    }
}
