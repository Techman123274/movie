import SwiftUI

struct SignInView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showClerkAuth = false

    var body: some View {
        VStack(alignment: .leading, spacing: 20) {
            Spacer()

            Text("Subflix")
                .font(.system(size: 44, weight: .bold, design: .rounded))
                .foregroundStyle(.white)

            Text("A native Apple rebuild of the current streaming app, starting with auth, profiles, home, search, playback, social, and settings.")
                .foregroundStyle(SubflixTheme.secondaryText)

            Button {
                showClerkAuth = true
            } label: {
                Text("Open Native Sign In")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(SubflixTheme.accent, in: RoundedRectangle(cornerRadius: 16))
                    .foregroundStyle(.white)
            }

            Button {
                Task {
                    await appState.signIn()
                }
            } label: {
                Text("Continue In Mock Mode")
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16))
                    .foregroundStyle(.white)
            }

            Text("This scaffold currently uses a mock sign-in path so we can focus on app architecture first.")
                .font(.footnote)
                .foregroundStyle(SubflixTheme.secondaryText)

            Spacer()
        }
        .padding(24)
        .sheet(isPresented: $showClerkAuth) {
            ClerkAuthViewBridge {
                Task {
                    await appState.bootstrap()
                }
            }
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
            .background(SubflixTheme.background)
        }
    }
}
