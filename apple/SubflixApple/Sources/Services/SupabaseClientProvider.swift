import Foundation

#if canImport(Supabase)
import Supabase

struct SupabaseClientProvider {
    let environment: AppEnvironment
    let tokenProvider: () async -> String?

    func makeClient() async throws -> SupabaseClient {
        guard
            let supabaseURL = environment.supabaseURL
        else {
            throw URLError(.badURL)
        }

        let headers = await requestHeaders()
        let options = SupabaseClientOptions(
            global: .init(
                headers: headers
            )
        )

        return SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: environment.supabaseAnonKey,
            options: options
        )
    }

    private func requestHeaders() async -> [String: String] {
        var headers: [String: String] = [:]

        if let token = await tokenProvider() {
            headers["Authorization"] = "Bearer \(token)"
        }

        return headers
    }
}
#endif
