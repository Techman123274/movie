import Foundation

protocol PlaybackService {
    func nextEpisodeLabel(for item: MediaItem, autoplayEnabled: Bool) -> String
}

struct DefaultPlaybackService: PlaybackService {
    func nextEpisodeLabel(for item: MediaItem, autoplayEnabled: Bool) -> String {
        guard item.kind == .tv else {
            return "Movie playback"
        }

        return autoplayEnabled ? "Up Next enabled" : "Up Next disabled"
    }
}
