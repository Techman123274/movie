import Foundation

enum PreviewFixtures {
    static let profiles: [UserProfile] = [
        UserProfile(id: UUID(), name: "Taylor", isKids: false, maturityRating: "teens", avatarColorHex: "#E50914"),
        UserProfile(id: UUID(), name: "Kids", isKids: true, maturityRating: "little_kids", avatarColorHex: "#3B82F6")
    ]

    static let hero: [MediaItem] = [
        MediaItem(id: 1, title: "Skyline Protocol", overview: "A glossy sci-fi thriller with a high-end hero presentation, social buzz, and autoplay-ready trailer hooks.", yearText: "2026", runtimeText: "2h 08m", kind: .movie, posterURL: nil, backdropURL: nil, matchPercent: 97, trailerYouTubeKey: "hero123", isKidsSafe: false),
        MediaItem(id: 2, title: "Night Shift Unit", overview: "A prestige series with episode progression, watch history, and Up Next support.", yearText: "2026", runtimeText: "46m", kind: .tv, posterURL: nil, backdropURL: nil, matchPercent: 94, trailerYouTubeKey: "tv456", isKidsSafe: false)
    ]

    static let kidsHero: [MediaItem] = [
        MediaItem(id: 3, title: "Planet Pals", overview: "A kids-safe animated adventure shelf for the native home screen.", yearText: "2025", runtimeText: "1h 22m", kind: .movie, posterURL: nil, backdropURL: nil, matchPercent: 99, trailerYouTubeKey: "kids111", isKidsSafe: true)
    ]

    static let trending: [MediaItem] = [
        MediaItem(id: 4, title: "Glass Harbor", overview: "Mystery drama series.", yearText: "2025", runtimeText: "51m", kind: .tv, posterURL: nil, backdropURL: nil, matchPercent: 91, trailerYouTubeKey: nil, isKidsSafe: false),
        MediaItem(id: 5, title: "The Last Frequency", overview: "Action movie with a polished detail page.", yearText: "2026", runtimeText: "1h 54m", kind: .movie, posterURL: nil, backdropURL: nil, matchPercent: 88, trailerYouTubeKey: nil, isKidsSafe: false),
        MediaItem(id: 6, title: "Parallel Hearts", overview: "Romance sci-fi crossover.", yearText: "2024", runtimeText: "1h 48m", kind: .movie, posterURL: nil, backdropURL: nil, matchPercent: 83, trailerYouTubeKey: nil, isKidsSafe: false)
    ]

    static let recommended: [MediaItem] = [
        MediaItem(id: 7, title: "Echo District", overview: "Recommendation rail sample.", yearText: "2025", runtimeText: "44m", kind: .tv, posterURL: nil, backdropURL: nil, matchPercent: 92, trailerYouTubeKey: nil, isKidsSafe: false),
        MediaItem(id: 8, title: "Atlas Run", overview: "High-energy action feature.", yearText: "2023", runtimeText: "2h 01m", kind: .movie, posterURL: nil, backdropURL: nil, matchPercent: 89, trailerYouTubeKey: nil, isKidsSafe: false)
    ]

    static let kidsShelf: [MediaItem] = [
        MediaItem(id: 9, title: "Ocean School", overview: "Learning and nature content for kids mode.", yearText: "2025", runtimeText: "28m", kind: .tv, posterURL: nil, backdropURL: nil, matchPercent: 98, trailerYouTubeKey: nil, isKidsSafe: true),
        MediaItem(id: 10, title: "Mini Monsters", overview: "Friendly monster comedy.", yearText: "2024", runtimeText: "1h 17m", kind: .movie, posterURL: nil, backdropURL: nil, matchPercent: 96, trailerYouTubeKey: nil, isKidsSafe: true)
    ]

    static let myList: [MediaItem] = [
        MediaItem(id: 11, title: "Signal Zero", overview: "Saved to My List.", yearText: "2026", runtimeText: "1h 43m", kind: .movie, posterURL: nil, backdropURL: nil, matchPercent: 87, trailerYouTubeKey: nil, isKidsSafe: false),
        MediaItem(id: 12, title: "Afterlight", overview: "Saved series sample.", yearText: "2025", runtimeText: "47m", kind: .tv, posterURL: nil, backdropURL: nil, matchPercent: 90, trailerYouTubeKey: nil, isKidsSafe: false)
    ]

    static let friendRequests: [FriendRequest] = [
        FriendRequest(requesterName: "Jordan", requesterEmail: "jordan@example.com", status: "pending"),
        FriendRequest(requesterName: "Alex", requesterEmail: "alex@example.com", status: "accepted")
    ]

    static let allItems: [MediaItem] = hero + kidsHero + trending + recommended + kidsShelf + myList
}
