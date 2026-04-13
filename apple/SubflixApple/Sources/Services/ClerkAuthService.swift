import Foundation

#if canImport(ClerkKit)
import ClerkKit
#endif

protocol ClerkSessionProvider {
    func restoreSession() async -> SessionUser?
    func signIn() async throws -> SessionUser
    func signOut() async
    func fetchSupabaseAccessToken() async -> String?
}

struct ClerkAuthService: AuthService {
    let provider: ClerkSessionProvider

    func restoreSession() async -> SessionUser? {
        await provider.restoreSession()
    }

    func signIn() async throws -> SessionUser {
        try await provider.signIn()
    }

    func signOut() async {
        await provider.signOut()
    }
}

struct PlaceholderClerkSessionProvider: ClerkSessionProvider {
    let environment: AppEnvironment

    func restoreSession() async -> SessionUser? {
        nil
    }

    func signIn() async throws -> SessionUser {
        throw NSError(
            domain: "SubflixApple.Clerk",
            code: 1,
            userInfo: [
                NSLocalizedDescriptionKey: "Hook the Clerk iOS SDK into PlaceholderClerkSessionProvider before enabling live auth mode."
            ]
        )
    }

    func signOut() async {}

    func fetchSupabaseAccessToken() async -> String? {
        nil
    }
}

#if canImport(ClerkKit)
struct NativeClerkSessionProvider: ClerkSessionProvider {
    let environment: AppEnvironment

    func restoreSession() async -> SessionUser? {
        mapUser(Clerk.shared.user)
    }

    func signIn() async throws -> SessionUser {
        if let user = mapUser(Clerk.shared.user) {
            return user
        }

        throw NSError(
            domain: "SubflixApple.Clerk",
            code: 2,
            userInfo: [
                NSLocalizedDescriptionKey: "No active Clerk user yet. Present AuthView or start a native sign-in flow first."
            ]
        )
    }

    func signOut() async {
        try? await Clerk.shared.auth.signOut()
    }

    func fetchSupabaseAccessToken() async -> String? {
        if let token = try? await Clerk.shared.auth.getToken() {
            return token
        }

        guard
            let session = Clerk.shared.session,
            !environment.clerkJWTTemplate.isEmpty,
            let token = try? await session.getToken(.init(template: environment.clerkJWTTemplate))?.jwt
        else {
            return nil
        }

        return token
    }

    private func mapUser(_ user: User?) -> SessionUser? {
        guard let user else {
            return nil
        }

        let email =
            user.primaryEmailAddress?.emailAddress ??
            user.emailAddresses.first?.emailAddress ??
            ""

        let displayName =
            [user.firstName, user.lastName]
                .compactMap { $0 }
                .filter { !$0.isEmpty }
                .joined(separator: " ")

        return SessionUser(
            id: user.id,
            email: email,
            displayName: displayName.isEmpty ? email : displayName
        )
    }
}
#endif

enum ClerkProviderFactory {
    static func make(environment: AppEnvironment) -> ClerkSessionProvider {
        #if canImport(ClerkKit)
        if environment.hasClerkConfig {
            return NativeClerkSessionProvider(environment: environment)
        }
        #endif

        return PlaceholderClerkSessionProvider(environment: environment)
    }
}
