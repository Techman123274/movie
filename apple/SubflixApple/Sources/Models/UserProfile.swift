import Foundation

struct UserProfile: Identifiable, Hashable {
    let id: UUID
    let name: String
    let isKids: Bool
    let maturityRating: String
    let avatarColorHex: String
}
