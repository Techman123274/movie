import SwiftUI

struct PlayerView: View {
    @EnvironmentObject private var appState: AppState
    let item: MediaItem

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                RoundedRectangle(cornerRadius: 24)
                    .fill(.black.opacity(0.9))
                    .frame(height: 240)
                    .overlay {
                        VStack(spacing: 12) {
                            Image(systemName: "play.rectangle.fill")
                                .font(.system(size: 56))
                                .foregroundStyle(.white)
                            Text("Native player placeholder")
                                .foregroundStyle(.white)
                            Text(item.kind == .tv && appState.autoplayNextEpisodeEnabled ? "Up Next will auto-advance here." : "Playback settings apply here.")
                                .font(.caption)
                                .foregroundStyle(SubflixTheme.secondaryText)
                        }
                    }

                Text(item.title)
                    .font(.largeTitle.bold())
                    .foregroundStyle(.white)

                Text(item.overview)
                    .foregroundStyle(SubflixTheme.secondaryText)

                Label(appState.playbackService.nextEpisodeLabel(for: item, autoplayEnabled: appState.autoplayNextEpisodeEnabled), systemImage: "forward.end.fill")
                    .foregroundStyle(.white)

                if let trailerKey = item.trailerYouTubeKey {
                    Text("Trailer key: \(trailerKey)")
                        .font(.caption)
                        .foregroundStyle(SubflixTheme.secondaryText)
                }
            }
            .padding(20)
        }
        .navigationTitle("Player")
        .background(SubflixTheme.background)
    }
}
