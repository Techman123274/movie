import Foundation

@MainActor
final class AppState: ObservableObject {
    @Published var currentUser: SessionUser?
    @Published var isAuthenticated = false
    @Published var availableProfiles: [UserProfile] = PreviewFixtures.profiles
    @Published var selectedProfile: UserProfile?
    @Published var selectedTab: AppTab = .home
    @Published var homeSections: [ContentSection] = []
    @Published var browseItems: [MediaItem] = []
    @Published var myList: [MediaItem] = PreviewFixtures.myList
    @Published var searchResults: [MediaItem] = []
    @Published var socialRequests: [FriendRequest] = PreviewFixtures.friendRequests
    @Published var autoplayPreviewsEnabled = true
    @Published var autoplayNextEpisodeEnabled = true
    @Published var selectedBrowseKind: MediaKind = .movie

    let authService: AuthService
    let dataStore: DataStore
    let accountDataStore: AccountDataStore
    let playbackService: PlaybackService

    init(
        authService: AuthService = MockAuthService(),
        dataStore: DataStore = MockDataStore(),
        accountDataStore: AccountDataStore = MockAccountDataStore(),
        playbackService: PlaybackService = DefaultPlaybackService()
    ) {
        self.authService = authService
        self.dataStore = dataStore
        self.accountDataStore = accountDataStore
        self.playbackService = playbackService
    }

    func bootstrap() async {
        currentUser = await authService.restoreSession()
        isAuthenticated = currentUser != nil
        await loadAccountData()
        browseItems = await dataStore.fetchBrowseItems(kind: selectedBrowseKind)
        if selectedProfile == nil {
            selectedProfile = availableProfiles.first
        }
        if selectedProfile != nil {
            await refreshHome()
        }
    }

    func signIn() async {
        do {
            currentUser = try await authService.signIn()
            isAuthenticated = currentUser != nil
        } catch {
            currentUser = nil
            isAuthenticated = false
        }
        await loadAccountData()
        if selectedProfile == nil {
            selectedProfile = availableProfiles.first
        }
        await refreshHome()
    }

    func signOut() {
        Task {
            await authService.signOut()
        }
        currentUser = nil
        isAuthenticated = false
        selectedProfile = nil
        availableProfiles = PreviewFixtures.profiles
        homeSections = []
        myList = []
        searchResults = []
        socialRequests = []
    }

    func selectProfile(_ profile: UserProfile) async {
        selectedProfile = profile
        await refreshHome()
    }

    func refreshHome() async {
        guard let profile = selectedProfile else {
            homeSections = []
            return
        }

        var sections = await dataStore.fetchHomeSections(for: profile)
        if !myList.isEmpty {
            sections.append(
                ContentSection(title: "My List", subtitle: nil, style: .shelf, items: myList)
            )
        }
        homeSections = sections
    }

    func refreshBrowse() async {
        browseItems = await dataStore.fetchBrowseItems(kind: selectedBrowseKind)
    }

    func runSearch(query: String) async {
        let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmedQuery.isEmpty {
            searchResults = []
            return
        }

        searchResults = await dataStore.search(query: trimmedQuery)
    }

    private func loadAccountData() async {
        availableProfiles = await accountDataStore.fetchProfiles(for: currentUser)
        if availableProfiles.isEmpty {
            availableProfiles = PreviewFixtures.profiles
        }
        myList = await accountDataStore.fetchMyList(for: currentUser)
        socialRequests = await accountDataStore.fetchFriendRequests(for: currentUser)
    }
}

enum AppTab: String, CaseIterable, Hashable {
    case home
    case browse
    case search
    case myList
    case social
    case settings
}
