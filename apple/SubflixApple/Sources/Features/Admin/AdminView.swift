import SwiftUI

struct AdminView: View {
    var body: some View {
        List {
            Text("Featured hero rows")
            Text("Notifications")
            Text("Site settings")
        }
        .navigationTitle("Admin")
    }
}
