import SwiftUI

struct MyListView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        List {
            ForEach(appState.myList) { item in
                NavigationLink {
                    PlayerView(item: item)
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(item.title)
                            .foregroundStyle(.white)
                        Text("\(item.kind.title) • \(item.yearText) • \(item.runtimeText)")
                            .font(.caption)
                            .foregroundStyle(SubflixTheme.secondaryText)
                    }
                }
                .listRowBackground(SubflixTheme.surface)
            }
        }
        .scrollContentBackground(.hidden)
        .background(SubflixTheme.background)
        .navigationTitle("My List")
    }
}
