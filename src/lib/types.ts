export type MediaType = "movie" | "tv";

export type FeedbackValue = "like" | "dislike" | "not_interested";

export type MediaSummary = {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  genreNames: string[];
  genreIds?: number[];
  releaseDate?: string;
  voteAverage?: number;
  popularity?: number;
  originalLanguage?: string;
  runtime?: number;
  hrefOverride?: string;
  actionLabel?: string;
  contextLabel?: string;
  progressSeconds?: number;
  feedback?: FeedbackValue | null;
};

export type PersonSummary = {
  id: number;
  name: string;
  knownForDepartment?: string;
  profilePath: string | null;
  knownFor: MediaSummary[];
};

export type ProviderInfo = {
  providerId: number;
  name: string;
  logoPath: string | null;
  displayPriority?: number;
};

export type ProviderAvailabilityGroup = {
  label: "stream" | "rent" | "buy" | "free" | "ads";
  providers: ProviderInfo[];
};

export type TitleProviderAvailability = {
  region: string;
  groups: ProviderAvailabilityGroup[];
};

export type CastMember = {
  id: number;
  name: string;
  character?: string;
  profilePath: string | null;
};

export type TrailerVideo = {
  id: string;
  key: string;
  name: string;
  site: "YouTube" | "Unknown";
  type: string;
  official: boolean;
};

export type EpisodeSummary = {
  id: number;
  name: string;
  overview: string;
  episodeNumber: number;
  runtime?: number;
  stillPath: string | null;
};

export type SeasonSummary = {
  id: number;
  name: string;
  seasonNumber: number;
  episodeCount: number;
  posterPath: string | null;
  episodes?: EpisodeSummary[];
};

export type MediaDetail = MediaSummary & {
  tagline?: string;
  status?: string;
  numberOfSeasons?: number;
  spokenLanguages: string[];
  cast: CastMember[];
  seasons?: SeasonSummary[];
  related: MediaSummary[];
  providers?: TitleProviderAvailability;
  trailers: TrailerVideo[];
  heroTrailer: TrailerVideo | null;
};

export type MediaRail = {
  id: string;
  title: string;
  eyebrow?: string;
  description?: string;
  variant?: "default" | "continue" | "editorial";
  items: MediaSummary[];
};

export type ProviderRail = {
  id: string;
  title: string;
  eyebrow?: string;
  provider: ProviderInfo;
  items: MediaSummary[];
  mediaTypes: MediaType[];
  region: string;
};

export type ProviderCatalog = {
  provider: ProviderInfo;
  region: string;
  mediaTypes: MediaType[];
  movies: MediaSummary[];
  series: MediaSummary[];
};

export type HomePageData = {
  featured: MediaSummary | null;
  featuredSlides: MediaSummary[];
  rails: MediaRail[];
};

export type SearchExperienceFilters = {
  query: string;
  type: "all" | MediaType | "person";
  year?: number;
  language?: string;
  sort: "relevance" | "rating" | "popularity" | "release_date";
  personId?: number;
};

export type SearchExperienceResult = {
  titles: MediaSummary[];
  people: PersonSummary[];
};

export type GenreOption = {
  id: number;
  label: string;
  mediaType: MediaType;
};

export type CatalogFilters = {
  mediaType: MediaType;
  genreId?: number;
  sort?: "popularity.desc" | "vote_average.desc" | "primary_release_date.desc" | "first_air_date.desc";
  language?: string;
};

export type ProfileRecord = {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  accent: string;
  maturityRating: string;
  providerRegion: string;
};

export type ProfileFeedbackRecord = {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  value: FeedbackValue;
  updatedAt: string;
};

export type WatchProgressRecord = {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
  progressSeconds: number;
  updatedAt: string;
};

export type ResumeTarget = WatchProgressRecord & {
  watchHref: string;
};

export type WatchHistoryRecord = {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
  watchedAt: string;
  watchHref: string;
};

export type WatchlistRecord = {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  addedAt: string;
};

export type WatchStateEvent = "start" | "progress" | "complete" | "clear";

export type WatchStatePayload = {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
  progressSeconds?: number;
  event: WatchStateEvent;
};

export type PlaybackRequest = {
  mediaType: MediaType;
  tmdbId: number;
  seasonNumber?: number;
  episodeNumber?: number;
};

export type PlaybackProviderResult = {
  provider: "vidlink" | "moviesapi";
  label: string;
  description: string;
  embedUrl: string;
  supportedMediaType: MediaType;
  supportsEpisodes: boolean;
  capabilities: string[];
  availability: "enabled" | "disabled" | "pending-review";
  statusMessage: string;
  rank: number;
  recommended: boolean;
};

export type CatalogUnavailableReason =
  | "missing-tmdb-config"
  | "tmdb-request-failed"
  | "missing-supabase-config"
  | "missing-service-role"
  | "missing-profiles-table"
  | "not-signed-in";

export type SportsLeague = "nfl" | "nba" | "mlb" | "nhl" | "epl";

export type SportsEvent = {
  id: string;
  league: SportsLeague;
  title: string;
  subtitle: string;
  startTime: string;
  status: string;
  venue?: string;
  competitors: string[];
};

export type SportsLeagueGroup = {
  league: SportsLeague;
  title: string;
  description: string;
  streamcenterUrl: string;
  events: SportsEvent[];
};
