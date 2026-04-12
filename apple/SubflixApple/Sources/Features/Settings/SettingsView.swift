import SwiftUI

struct SettingsView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Form {
            Section("Playback") {
                Toggle("Autoplay previews", isOn: $appState.autoplayPreviewsEnabled)
                Toggle("Autoplay next episode", isOn: $appState.autoplayNextEpisodeEnabled)
            }

            Section("Account") {
                Button("Sign Out", role: .destructive) {
                    appState.signOut()
                }
            }

            Section("Native roadmap") {
                Text("Replace local mock services with TMDB, Clerk, Supabase, notifications, and native playback.")
            }
        }
        .scrollContentBackground(.hidden)
        .background(SubflixTheme.background)
        .navigationTitle("Settings")
    }
}
