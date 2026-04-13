import SwiftUI

struct ProfilePickerView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            Text("Who’s Watching?")
                .font(.largeTitle.bold())
                .foregroundStyle(.white)

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 140), spacing: 20)], spacing: 20) {
                ForEach(appState.availableProfiles) { profile in
                    Button {
                        Task {
                            await appState.selectProfile(profile)
                        }
                    } label: {
                        VStack(spacing: 12) {
                            RoundedRectangle(cornerRadius: 24)
                                .fill(Color(hex: profile.avatarColorHex))
                                .frame(height: 140)
                                .overlay {
                                    Text(String(profile.name.prefix(1)))
                                        .font(.system(size: 44, weight: .bold))
                                        .foregroundStyle(.white)
                                }

                            Text(profile.name)
                                .font(.headline)
                                .foregroundStyle(.white)

                            Text(profile.isKids ? "Kids" : profile.maturityRating.capitalized)
                                .font(.caption)
                                .foregroundStyle(SubflixTheme.secondaryText)
                        }
                    }
                    .buttonStyle(.plain)
                }
            }

            Spacer()
        }
        .padding(24)
    }
}

private extension Color {
    init(hex: String) {
        let cleaned = hex.replacingOccurrences(of: "#", with: "")
        var value: UInt64 = 0
        Scanner(string: cleaned).scanHexInt64(&value)

        let red = Double((value >> 16) & 0xFF) / 255.0
        let green = Double((value >> 8) & 0xFF) / 255.0
        let blue = Double(value & 0xFF) / 255.0

        self.init(red: red, green: green, blue: blue)
    }
}
