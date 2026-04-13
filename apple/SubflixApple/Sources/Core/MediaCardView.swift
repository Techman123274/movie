import SwiftUI

struct MediaCardView: View {
    let item: MediaItem

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            RoundedRectangle(cornerRadius: 16)
                .fill(LinearGradient(colors: [.red.opacity(0.8), .black], startPoint: .topLeading, endPoint: .bottomTrailing))
                .frame(width: 150, height: 220)
                .overlay(alignment: .bottomLeading) {
                    Text(item.kind.title)
                        .font(.caption.weight(.semibold))
                        .padding(8)
                        .background(.ultraThinMaterial, in: Capsule())
                        .padding(10)
                }

            Text(item.title)
                .font(.headline)
                .foregroundStyle(.white)
                .lineLimit(2)

            HStack(spacing: 8) {
                Text(item.yearText)
                Text(item.runtimeText)
                if let matchPercent = item.matchPercent {
                    Text("\(matchPercent)% Match")
                        .foregroundStyle(.green)
                }
            }
            .font(.caption)
            .foregroundStyle(SubflixTheme.secondaryText)
        }
        .frame(width: 150, alignment: .leading)
    }
}
