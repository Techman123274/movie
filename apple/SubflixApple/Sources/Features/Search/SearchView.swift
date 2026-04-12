import SwiftUI

struct SearchView: View {
    @EnvironmentObject private var appState: AppState
    @State private var query = ""

    var body: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.adaptive(minimum: 150), spacing: 16)], spacing: 20) {
                ForEach(appState.searchResults) { item in
                    NavigationLink {
                        PlayerView(item: item)
                    } label: {
                        MediaCardView(item: item)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(20)
        }
        .navigationTitle("Search")
        .searchable(text: $query, prompt: "Titles, genres, cast, themes")
        .task(id: query) {
            await appState.runSearch(query: query)
        }
    }
}
