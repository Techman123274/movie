import Foundation

struct SessionUser: Identifiable, Hashable {
    let id: String
    let email: String
    let displayName: String
}

protocol AuthService {
    func restoreSession() async -> SessionUser?
    func signIn() async throws -> SessionUser
    func signOut() async
}

struct MockAuthService: AuthService {
    private let mockUser = SessionUser(
        id: "mock-user-1",
        email: "taylor@example.com",
        displayName: "Taylor"
    )

    func restoreSession() async -> SessionUser? {
        mockUser
    }

    func signIn() async throws -> SessionUser {
        mockUser
    }

    func signOut() async {}
}
