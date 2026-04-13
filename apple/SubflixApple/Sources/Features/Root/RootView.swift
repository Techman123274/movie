import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if !appState.isAuthenticated {
                SignInView()
            } else if appState.selectedProfile == nil {
                ProfilePickerView()
            } else {
                MainTabView()
            }
        }
        .background(SubflixTheme.background.ignoresSafeArea())
    }
}

private struct MainTabView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        TabView(selection: $appState.selectedTab) {
            NavigationStack { HomeView() }
                .tabItem { Label("Home", systemImage: "house.fill") }
                .tag(AppTab.home)

            NavigationStack { BrowseView() }
                .tabItem { Label("Browse", systemImage: "square.grid.2x2.fill") }
                .tag(AppTab.browse)

            NavigationStack { SearchView() }
                .tabItem { Label("Search", systemImage: "magnifyingglass") }
                .tag(AppTab.search)

            NavigationStack { MyListView() }
                .tabItem { Label("My List", systemImage: "checklist") }
                .tag(AppTab.myList)

            NavigationStack { SocialHubView() }
                .tabItem { Label("Social", systemImage: "person.2.fill") }
                .tag(AppTab.social)

            NavigationStack { SettingsView() }
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
                .tag(AppTab.settings)
        }
        .tint(SubflixTheme.accent)
    }
}
