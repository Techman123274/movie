import SwiftUI

struct BrowseView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Picker("Type", selection: $appState.selectedBrowseKind) {
                    ForEach(MediaKind.allCases) { kind in
                        Text(kind.title).tag(kind)
                    }
                }
                .pickerStyle(.segmented)

                LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 16)], spacing: 20) {
                    ForEach(appState.browseItems) { item in
                        NavigationLink {
                            PlayerView(item: item)
                        } label: {
                            MediaCardView(item: item)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .padding(20)
        }
        .navigationTitle("Browse")
        .task {
            await appState.refreshBrowse()
        }
        .onChange(of: appState.selectedBrowseKind) { _ in
            Task {
                await appState.refreshBrowse()
            }
        }
    }
}
