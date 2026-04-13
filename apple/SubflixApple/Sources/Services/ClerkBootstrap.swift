import SwiftUI

#if canImport(ClerkKit)
import ClerkKit
#endif

struct ClerkBootstrapModifier: ViewModifier {
    let environment: AppEnvironment

    init(environment: AppEnvironment) {
        self.environment = environment

        #if canImport(ClerkKit)
        if environment.hasClerkConfig {
            Clerk.configure(publishableKey: environment.clerkPublishableKey)
        }
        #endif
    }

    func body(content: Content) -> some View {
        #if canImport(ClerkKit)
        if environment.hasClerkConfig {
            content.environment(Clerk.shared)
        } else {
            content
        }
        #else
        content
        #endif
    }
}

extension View {
    func withSubflixClerk(environment: AppEnvironment = .live) -> some View {
        modifier(ClerkBootstrapModifier(environment: environment))
    }
}
