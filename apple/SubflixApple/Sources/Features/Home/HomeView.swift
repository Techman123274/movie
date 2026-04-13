import SwiftUI

struct HomeView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 28) {
                if let heroSection = appState.homeSections.first(where: { $0.style == .hero }) {
                    HeroHeaderView(items: heroSection.items)
                }

                ForEach(appState.homeSections.filter { $0.style == .shelf }) { section in
                    VStack(alignment: .leading, spacing: 12) {
                        Text(section.title)
                            .font(.title3.bold())
                            .foregroundStyle(.white)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(section.items) { item in
                                    NavigationLink {
                                        PlayerView(item: item)
                                    } label: {
                                        MediaCardView(item: item)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 16)
        }
        .navigationTitle("Home")
        .task {
            await appState.refreshHome()
        }
    }
}

private struct HeroHeaderView: View {
    @EnvironmentObject private var appState: AppState
    let items: [MediaItem]

    var body: some View {
        TabView {
            ForEach(items) { item in
                VStack(alignment: .leading, spacing: 14) {
                    RoundedRectangle(cornerRadius: 24)
                        .fill(LinearGradient(colors: [.red.opacity(0.85), .black], startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(height: 280)
                        .overlay(alignment: .bottomLeading) {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(item.title)
                                    .font(.largeTitle.bold())
                                    .foregroundStyle(.white)
                                Text(item.overview)
                                    .font(.subheadline)
                                    .foregroundStyle(.white.opacity(0.85))
                                    .lineLimit(3)
                                HStack {
                                    Label(appState.autoplayPreviewsEnabled ? "Preview autoplay on" : "Preview autoplay off", systemImage: "play.rectangle.fill")
                                    if item.kind == .tv {
                                        Label("Up Next ready", systemImage: "forward.end.fill")
                                    }
                                }
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.white)
                            }
                            .padding(20)
                        }
                }
            }
        }
        .frame(height: 320)
        .tabViewStyle(.page(indexDisplayMode: .automatic))
    }
}
