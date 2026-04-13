import Foundation

enum MediaKind: String, Codable, CaseIterable, Identifiable {
    case movie
    case tv

    var id: String { rawValue }
    var title: String { rawValue.capitalized }
}

struct MediaItem: Identifiable, Hashable {
    let id: Int
    let title: String
    let overview: String
    let yearText: String
    let runtimeText: String
    let kind: MediaKind
    let posterURL: URL?
    let backdropURL: URL?
    let matchPercent: Int?
    let trailerYouTubeKey: String?
    let isKidsSafe: Bool
}

struct ContentSection: Identifiable, Hashable {
    let id = UUID()
    let title: String
    let subtitle: String?
    let style: SectionStyle
    let items: [MediaItem]
}

enum SectionStyle: String, Hashable {
    case hero
    case shelf
}

struct FriendRequest: Identifiable, Hashable {
    let id = UUID()
    let requesterName: String
    let requesterEmail: String
    let status: String
}
