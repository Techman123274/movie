import Foundation

protocol DataStore {
    func fetchHomeSections(for profile: UserProfile) async -> [ContentSection]
    func fetchBrowseItems(kind: MediaKind) async -> [MediaItem]
    func search(query: String) async -> [MediaItem]
}

struct MockDataStore: DataStore {
    func fetchHomeSections(for profile: UserProfile) async -> [ContentSection] {
        let heroItems = profile.isKids ? PreviewFixtures.kidsHero : PreviewFixtures.hero
        let trendingItems = profile.isKids ? PreviewFixtures.kidsShelf : PreviewFixtures.trending
        let recommendedItems = profile.isKids ? PreviewFixtures.kidsShelf : PreviewFixtures.recommended

        return [
            ContentSection(title: "Featured", subtitle: "Hero spotlight", style: .hero, items: heroItems),
            ContentSection(title: "Trending Now", subtitle: nil, style: .shelf, items: trendingItems),
            ContentSection(title: "Recommended For You", subtitle: "Taste profile driven", style: .shelf, items: recommendedItems)
        ]
    }

    func fetchBrowseItems(kind: MediaKind) async -> [MediaItem] {
        PreviewFixtures.allItems.filter { $0.kind == kind }
    }

    func search(query: String) async -> [MediaItem] {
        PreviewFixtures.allItems.filter {
            $0.title.localizedCaseInsensitiveContains(query) ||
            $0.overview.localizedCaseInsensitiveContains(query)
        }
    }
}
