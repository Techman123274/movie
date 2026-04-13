import SwiftUI

#if canImport(ClerkKit)
import ClerkKit
#endif

#if canImport(ClerkKitUI)
import ClerkKitUI
#endif

struct ClerkAuthViewBridge: View {
    let onSignedIn: () -> Void
    @State private var hasCompleted = false

    var body: some View {
        #if canImport(ClerkKitUI)
        AuthView()
            .task {
                while !hasCompleted {
                    if Clerk.shared.user != nil {
                        hasCompleted = true
                        onSignedIn()
                        break
                    }

                    try? await Task.sleep(nanoseconds: 500_000_000)
                }
            }
        #else
        VStack(alignment: .leading, spacing: 8) {
            Text("Clerk UI not installed")
                .font(.headline)
                .foregroundStyle(.white)
            Text("Add `ClerkKitUI` in Xcode to use Clerk's native AuthView here.")
                .font(.footnote)
                .foregroundStyle(.white.opacity(0.75))
        }
        .padding()
        .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 16))
        #endif
    }
}

