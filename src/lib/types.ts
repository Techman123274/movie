export type MediaType = "movie" | "tv";

export type MediaSummary = {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  genreNames: string[];
  releaseDate?: string;
  voteAverage?: number;
  hrefOverride?: string;
  actionLabel?: string;
  contextLabel?: string;
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
  runtime?: number;
  numberOfSeasons?: number;
  cast: CastMember[];
  seasons?: SeasonSummary[];
  related: MediaSummary[];
  providers?: TitleProviderAvailability;
};

export type MediaRail = {
  id: string;
  title: string;
  eyebrow?: string;
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

export type HomePageData = {
  featured: MediaSummary | null;
  featuredSlides: MediaSummary[];
  rails: MediaRail[];
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

export type WatchStateEvent = "start" | "complete" | "clear";

export type WatchStatePayload = {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
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
  embedUrl: string;
  supportedMediaType: MediaType;
  supportsEpisodes: boolean;
  availability: "enabled" | "disabled" | "pending-review";
  statusMessage: string;
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
