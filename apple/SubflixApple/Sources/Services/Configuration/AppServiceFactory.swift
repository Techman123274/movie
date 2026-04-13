import Foundation

enum AppServiceFactory {
    @MainActor
    static func makeAppState(environment: AppEnvironment = .live) -> AppState {
        guard environment.useLiveServices, environment.hasTMDBConfig else {
            return AppState()
        }

        let clerkProvider = ClerkProviderFactory.make(environment: environment)
        let authService: AuthService = environment.hasClerkConfig
            ? ClerkAuthService(provider: clerkProvider)
            : MockAuthService()

        let accountDataStore: AccountDataStore
        if environment.hasSupabaseConfig {
            let tokenProvider = { await clerkProvider.fetchSupabaseAccessToken() }

            #if canImport(Supabase)
            accountDataStore = SupabaseSDKAccountDataStore(
                environment: environment,
                clientProvider: SupabaseClientProvider(
                    environment: environment,
                    tokenProvider: tokenProvider
                )
            )
            #else
            let supabaseClient = SupabaseRESTClient(
                environment: environment,
                tokenProvider: tokenProvider
            )
            accountDataStore = SupabaseAccountDataStore(
                environment: environment,
                client: supabaseClient
            )
            #endif
        } else {
            accountDataStore = MockAccountDataStore()
        }

        let dataStore = RemoteDataStore(
            environment: environment,
            tmdbClient: TMDBClient(environment: environment)
        )

        return AppState(
            authService: authService,
            dataStore: dataStore,
            accountDataStore: accountDataStore,
            playbackService: DefaultPlaybackService()
        )
    }
}
