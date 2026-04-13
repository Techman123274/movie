import SwiftUI

@main
struct SubflixAppleApp: App {
    @StateObject private var appState = AppServiceFactory.makeAppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .withSubflixClerk()
                .task {
                    await appState.bootstrap()
                }
        }
    }
}
