import Foundation

struct RemoteDataStore: DataStore {
    let environment: AppEnvironment
    let tmdbClient: TMDBClient

    func fetchHomeSections(for profile: UserProfile) async -> [ContentSection] {
        do {
            return try await tmdbClient.fetchHomeSections(for: profile)
        } catch {
            return await MockDataStore().fetchHomeSections(for: profile)
        }
    }

    func fetchBrowseItems(kind: MediaKind) async -> [MediaItem] {
        do {
            return try await tmdbClient.fetchBrowseItems(kind: kind)
        } catch {
            return await MockDataStore().fetchBrowseItems(kind: kind)
        }
    }

    func search(query: String) async -> [MediaItem] {
        do {
            return try await tmdbClient.search(query: query)
        } catch {
            return await MockDataStore().search(query: query)
        }
    }
}
