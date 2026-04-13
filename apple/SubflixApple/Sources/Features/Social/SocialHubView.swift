import SwiftUI

struct SocialHubView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        List {
            Section("Friend Requests") {
                ForEach(appState.socialRequests) { request in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(request.requesterName)
                            .foregroundStyle(.white)
                        Text(request.requesterEmail)
                            .font(.caption)
                            .foregroundStyle(SubflixTheme.secondaryText)
                        Text(request.status.capitalized)
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.green)
                    }
                    .listRowBackground(SubflixTheme.surface)
                }
            }

            Section("Next Native Work") {
                Text("Wire Clerk iOS auth")
                Text("Wire Supabase Swift friend requests")
                Text("Add presence and chat threads")
            }
            .foregroundStyle(.white)
            .listRowBackground(SubflixTheme.surface)
        }
        .scrollContentBackground(.hidden)
        .background(SubflixTheme.background)
        .navigationTitle("Social")
    }
}
