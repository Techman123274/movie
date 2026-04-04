import { env, hasTmdbCredentials } from "@/lib/env";
import type {
  CatalogFilters,
  GenreOption,
  HomePageData,
  MediaDetail,
  MediaRail,
  MediaSummary,
  MediaType,
  PersonSummary,
  ProviderCatalog,
  ProviderInfo,
  ProviderRail,
  SearchExperienceFilters,
  SearchExperienceResult,
  SeasonSummary,
  TitleProviderAvailability,
  TrailerVideo,
} from "@/lib/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const MAX_PROVIDER_RAILS = 12;
const PROVIDER_CANDIDATE_LIMIT = 24;
const MIN_PROVIDER_RAIL_ITEMS = 4;
const PROVIDER_RAIL_PAGE_COUNT = 1;
const PROVIDER_CATALOG_PAGE_COUNT = 3;
const PROVIDER_CATALOG_MEDIA_LIMIT = 60;
const DEFAULT_DISCOVER_LIMIT = 12;
const PREFERRED_PROVIDER_NAMES = [
  "netflix",
  "hulu",
  "disney plus",
  "amazon prime video",
  "prime video",
  "max",
  "hbo",
  "apple tv plus",
  "paramount plus",
  "paramount+",
  "tubi",
  "tubi tv",
  "zeus",
  "zeus network",
  "kayo",
  "kayo sports",
  "peacock premium",
  "crunchyroll",
];

const MOVIE_GENRES: GenreOption[] = [
  { id: 28, label: "Action", mediaType: "movie" },
  { id: 12, label: "Adventure", mediaType: "movie" },
  { id: 35, label: "Comedy", mediaType: "movie" },
  { id: 18, label: "Drama", mediaType: "movie" },
  { id: 27, label: "Horror", mediaType: "movie" },
  { id: 9648, label: "Mystery", mediaType: "movie" },
  { id: 878, label: "Sci-Fi", mediaType: "movie" },
  { id: 53, label: "Thriller", mediaType: "movie" },
];

const TV_GENRES: GenreOption[] = [
  { id: 10759, label: "Action & Adventure", mediaType: "tv" },
  { id: 35, label: "Comedy", mediaType: "tv" },
  { id: 80, label: "Crime", mediaType: "tv" },
  { id: 18, label: "Drama", mediaType: "tv" },
  { id: 9648, label: "Mystery", mediaType: "tv" },
  { id: 10765, label: "Sci-Fi & Fantasy", mediaType: "tv" },
  { id: 10764, label: "Reality", mediaType: "tv" },
  { id: 10768, label: "War & Politics", mediaType: "tv" },
];

type SearchApiFilter = {
  type?: "all" | MediaType;
  limit?: number;
};

function tmdbHeaders() {
  if (env.tmdbReadToken) {
    return { Authorization: `Bearer ${env.tmdbReadToken}` };
  }

  return undefined;
}

async function fetchTmdb<T>(path: string): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);

  if (!env.tmdbReadToken && env.tmdbApiKey) {
    url.searchParams.set("api_key", env.tmdbApiKey);
  }

  const response = await fetch(url.toString(), {
    headers: tmdbHeaders(),
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeSummary(item: Record<string, unknown>, fallbackType?: MediaType): MediaSummary {
  const mediaType = (item.media_type as MediaType) || fallbackType || "movie";
  const genreIds = (item.genre_ids as number[] | undefined) ?? undefined;
  const genreNames =
    ((item.genres as { name: string }[] | undefined)?.map((genre) => genre.name) ??
      genreIds?.map((genreId) => getGenreLabel(mediaType, genreId)) ??
      []) as string[];

  return {
    id: Number(item.id),
    mediaType,
    title: String(item.title || item.name || "Untitled"),
    overview: String(item.overview || "No synopsis available."),
    posterPath: (item.poster_path as string | null) ?? null,
    backdropPath: (item.backdrop_path as string | null) ?? null,
    genreNames,
    genreIds,
    releaseDate: (item.release_date as string | undefined) || (item.first_air_date as string | undefined),
    voteAverage: typeof item.vote_average === "number" ? item.vote_average : undefined,
    popularity: typeof item.popularity === "number" ? item.popularity : undefined,
    originalLanguage: typeof item.original_language === "string" ? item.original_language : undefined,
    runtime: typeof item.runtime === "number" ? item.runtime : undefined,
  };
}

function normalizeProvider(provider: Record<string, unknown>): ProviderInfo {
  return {
    providerId: Number(provider.provider_id),
    name: String(provider.provider_name || "Unknown"),
    logoPath: (provider.logo_path as string | null) ?? null,
    displayPriority: typeof provider.display_priority === "number" ? provider.display_priority : undefined,
  };
}

function normalizeTrailer(video: Record<string, unknown>): TrailerVideo {
  return {
    id: String(video.id || crypto.randomUUID()),
    key: String(video.key || ""),
    name: String(video.name || "Trailer"),
    site: video.site === "YouTube" ? "YouTube" : "Unknown",
    type: String(video.type || "Trailer"),
    official: Boolean(video.official),
  };
}

function normalizePerson(person: Record<string, unknown>): PersonSummary {
  const knownForItems =
    ((person.known_for as Record<string, unknown>[] | undefined) ?? [])
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => normalizeSummary(item))
      .slice(0, 4);

  return {
    id: Number(person.id),
    name: String(person.name || "Unknown"),
    knownForDepartment: typeof person.known_for_department === "string" ? person.known_for_department : undefined,
    profilePath: (person.profile_path as string | null) ?? null,
    knownFor: knownForItems,
  };
}

function getProviderPriority(name: string) {
  const normalized = name.trim().toLowerCase();
  const preferredIndex = PREFERRED_PROVIDER_NAMES.findIndex(
    (preferredName) => normalized === preferredName || normalized.includes(preferredName),
  );

  return preferredIndex === -1 ? Number.MAX_SAFE_INTEGER : preferredIndex;
}

function sortProviders(providers: ProviderInfo[]) {
  return [...providers].sort(
    (a, b) =>
      getProviderPriority(a.name) - getProviderPriority(b.name) ||
      (a.displayPriority ?? 9999) - (b.displayPriority ?? 9999) ||
      a.name.localeCompare(b.name),
  );
}

type ProviderDirectoryEntry = {
  provider: ProviderInfo;
  mediaTypes: Set<MediaType>;
};

async function getProviderDirectory() {
  const [movieProviders, tvProviders] = await Promise.all([
    fetchTmdb<{ results: Record<string, unknown>[] }>("/watch/providers/movie"),
    fetchTmdb<{ results: Record<string, unknown>[] }>("/watch/providers/tv"),
  ]);

  const providerMap = new Map<number, ProviderDirectoryEntry>();

  movieProviders.results.forEach((entry) => {
    const provider = normalizeProvider(entry);
    providerMap.set(provider.providerId, {
      provider,
      mediaTypes: new Set<MediaType>(["movie"]),
    });
  });

  tvProviders.results.forEach((entry) => {
    const provider = normalizeProvider(entry);
    const existing = providerMap.get(provider.providerId);

    if (existing) {
      existing.mediaTypes.add("tv");
      return;
    }

    providerMap.set(provider.providerId, {
      provider,
      mediaTypes: new Set<MediaType>(["tv"]),
    });
  });

  return providerMap;
}

async function discoverProviderTitles(options: {
  mediaType: MediaType;
  providerId: number;
  region: string;
  pageCount?: number;
  limit?: number;
}) {
  const settled = await Promise.allSettled(
    Array.from({ length: options.pageCount ?? PROVIDER_RAIL_PAGE_COUNT }, (_, index) =>
      fetchTmdb<{ results: Record<string, unknown>[] }>(
        `/discover/${options.mediaType}?watch_region=${encodeURIComponent(options.region)}&with_watch_providers=${options.providerId}&sort_by=popularity.desc&page=${index + 1}`,
      ),
    ),
  );

  const items = settled
    .filter((request): request is PromiseFulfilledResult<{ results: Record<string, unknown>[] }> => request.status === "fulfilled")
    .flatMap((request) => request.value.results.map((item) => normalizeSummary(item, options.mediaType)));

  return combineUniqueMedia(items).slice(0, options.limit ?? PROVIDER_CATALOG_MEDIA_LIMIT);
}

function normalizeSeasons(seasons: Record<string, unknown>[] | undefined): SeasonSummary[] | undefined {
  if (!seasons?.length) {
    return undefined;
  }

  return seasons
    .filter((season) => Number(season.season_number) > 0)
    .map((season) => ({
      id: Number(season.id),
      name: String(season.name || `Season ${season.season_number}`),
      seasonNumber: Number(season.season_number),
      episodeCount: Number(season.episode_count || 0),
      posterPath: (season.poster_path as string | null) ?? null,
    }));
}

function combineUniqueMedia(items: MediaSummary[], excludeKeys: Set<string> = new Set()) {
  const seen = new Set<string>(excludeKeys);

  return items.filter((item) => {
    const key = `${item.mediaType}-${item.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function mapProviderGroup(label: TitleProviderAvailability["groups"][number]["label"], raw?: Record<string, unknown>[]) {
  if (!raw?.length) {
    return null;
  }

  return {
    label,
    providers: sortProviders(raw.map((provider) => normalizeProvider(provider))),
  };
}

function getGenreLabel(mediaType: MediaType, genreId: number) {
  const match = [...MOVIE_GENRES, ...TV_GENRES].find((genre) => genre.mediaType === mediaType && genre.id === genreId);
  return match?.label ?? String(genreId);
}

function buildDiscoverQuery(filters: CatalogFilters) {
  const searchParams = new URLSearchParams();
  searchParams.set(
    "sort_by",
    filters.sort ??
      (filters.mediaType === "movie" ? "popularity.desc" : "popularity.desc"),
  );
  searchParams.set("include_adult", "false");
  searchParams.set("include_null_first_air_dates", "false");

  if (filters.genreId) {
    searchParams.set("with_genres", String(filters.genreId));
  }

  if (filters.language) {
    searchParams.set("with_original_language", filters.language);
  }

  return `/discover/${filters.mediaType}?${searchParams.toString()}`;
}

function applyTitleFilters(
  items: MediaSummary[],
  filters: SearchExperienceFilters,
): MediaSummary[] {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    if (filters.type !== "all" && filters.type !== "person" && item.mediaType !== filters.type) {
      return false;
    }

    if (filters.year) {
      const itemYear = item.releaseDate ? new Date(item.releaseDate).getFullYear() : undefined;
      if (itemYear !== filters.year) {
        return false;
      }
    }

    if (filters.language && item.originalLanguage !== filters.language) {
      return false;
    }

    return true;
  });

  const scored = filtered.map((item) => {
    const title = item.title.toLowerCase();
    const overview = item.overview.toLowerCase();
    let score = 0;

    if (title === normalizedQuery) {
      score += 140;
    }
    if (title.startsWith(normalizedQuery)) {
      score += 90;
    }
    if (title.includes(normalizedQuery)) {
      score += 45;
    }
    if (overview.includes(normalizedQuery)) {
      score += 8;
    }

    score += Math.round((item.popularity ?? 0) / 10);
    score += Math.round((item.voteAverage ?? 0) * 2);

    return {
      item,
      score,
    };
  });

  if (filters.sort === "rating") {
    scored.sort((a, b) => (b.item.voteAverage ?? 0) - (a.item.voteAverage ?? 0) || b.score - a.score);
  } else if (filters.sort === "popularity") {
    scored.sort((a, b) => (b.item.popularity ?? 0) - (a.item.popularity ?? 0) || b.score - a.score);
  } else if (filters.sort === "release_date") {
    scored.sort(
      (a, b) =>
        new Date(b.item.releaseDate ?? "1900-01-01").getTime() -
          new Date(a.item.releaseDate ?? "1900-01-01").getTime() || b.score - a.score,
    );
  } else {
    scored.sort((a, b) => b.score - a.score || (b.item.popularity ?? 0) - (a.item.popularity ?? 0));
  }

  return scored.map((entry) => entry.item);
}

export function getImageUrl(path: string | null, size: "w342" | "w780" | "w1280" = "w780") {
  if (!path) {
    return null;
  }

  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getGenreOptions(mediaType: MediaType) {
  return mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;
}

export async function getMediaSummary(mediaType: MediaType, id: number): Promise<MediaSummary | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const detail = await fetchTmdb<Record<string, unknown>>(`/${mediaType}/${id}`);
    return normalizeSummary(detail, mediaType);
  } catch {
    return null;
  }
}

export async function getMediaSummariesByIds(
  refs: Array<{ mediaType: MediaType; mediaId: number }>,
): Promise<MediaSummary[]> {
  const results = await Promise.all(refs.map((ref) => getMediaSummary(ref.mediaType, ref.mediaId)));
  return results.filter((item): item is MediaSummary => Boolean(item));
}

export async function getRecommendedTitlesFromSeeds(
  refs: Array<{ mediaType: MediaType; mediaId: number }>,
  options?: { exclude?: Array<{ mediaType: MediaType; mediaId: number }>; limit?: number },
): Promise<MediaSummary[]> {
  if (!hasTmdbCredentials() || !refs.length) {
    return [];
  }

  try {
    const exclude = new Set(
      (options?.exclude ?? []).map((entry) => `${entry.mediaType}-${entry.mediaId}`),
    );
    const settled = await Promise.allSettled(
      refs.slice(0, 3).map((ref) =>
        fetchTmdb<{ results: Record<string, unknown>[] }>(`/${ref.mediaType}/${ref.mediaId}/recommendations`),
      ),
    );

    const combined = settled.flatMap((result, index) =>
      result.status === "fulfilled"
        ? result.value.results.map((item) => normalizeSummary(item, refs[index]?.mediaType))
        : [],
    );

    return combineUniqueMedia(combined, exclude).slice(0, options?.limit ?? DEFAULT_DISCOVER_LIMIT);
  } catch {
    return [];
  }
}

export async function discoverByGenres(options: {
  mediaType: MediaType;
  genreIds: number[];
  exclude?: Array<{ mediaType: MediaType; mediaId: number }>;
  limit?: number;
}): Promise<MediaSummary[]> {
  if (!hasTmdbCredentials() || !options.genreIds.length) {
    return [];
  }

  try {
    const response = await fetchTmdb<{ results: Record<string, unknown>[] }>(
      `/discover/${options.mediaType}?with_genres=${options.genreIds.slice(0, 3).join(",")}&sort_by=popularity.desc`,
    );

    const exclude = new Set(
      (options.exclude ?? []).map((entry) => `${entry.mediaType}-${entry.mediaId}`),
    );

    return combineUniqueMedia(
      response.results.map((item) => normalizeSummary(item, options.mediaType)),
      exclude,
    ).slice(0, options.limit ?? DEFAULT_DISCOVER_LIMIT);
  } catch {
    return [];
  }
}

export async function getHomePageData(): Promise<HomePageData | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const [trending, moviePopular, tvPopular, newMovies, newSeries, topRatedMovies, topRatedShows] = await Promise.all([
      fetchTmdb<{ results: Record<string, unknown>[] }>("/trending/all/week"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/movie/popular"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/tv/popular"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/movie/now_playing"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/tv/on_the_air"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/movie/top_rated"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/tv/top_rated"),
    ]);

    const trendingItems = trending.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => normalizeSummary(item))
      .slice(0, 10);

    const rails: MediaRail[] = [
      {
        id: "new-this-week",
        title: "New This Week",
        eyebrow: "Fresh drops",
        description: "Recently surfaced picks to kickstart a faster movie-night decision.",
        items: combineUniqueMedia(
          [
            ...newMovies.results.map((item) => normalizeSummary(item, "movie")),
            ...newSeries.results.map((item) => normalizeSummary(item, "tv")),
          ],
        ).slice(0, 12),
      },
      {
        id: "trending",
        title: "Trending Now",
        eyebrow: "Live from TMDB",
        description: "The titles drawing the most momentum right now.",
        items: trendingItems,
      },
      {
        id: "popular-movies",
        title: "Popular Movies",
        eyebrow: "Big-screen momentum",
        items: moviePopular.results.map((item) => normalizeSummary(item, "movie")).slice(0, 12),
      },
      {
        id: "popular-series",
        title: "Popular Series",
        eyebrow: "Binge radar",
        items: tvPopular.results.map((item) => normalizeSummary(item, "tv")).slice(0, 12),
      },
      {
        id: "top-rated-movies",
        title: "Top Rated Movies",
        eyebrow: "Prestige picks",
        items: topRatedMovies.results.map((item) => normalizeSummary(item, "movie")).slice(0, 12),
      },
      {
        id: "top-rated-shows",
        title: "Top Rated Series",
        eyebrow: "Critic-proof favorites",
        items: topRatedShows.results.map((item) => normalizeSummary(item, "tv")).slice(0, 12),
      },
    ];

    return {
      featured: trendingItems[0] ?? null,
      featuredSlides: trendingItems.slice(0, 5),
      rails,
    };
  } catch {
    return null;
  }
}

export async function getCatalogRail(
  mediaType: MediaType,
  filters?: Omit<CatalogFilters, "mediaType">,
): Promise<MediaRail[] | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const [heroDiscover, topRated, fresh, genreSpotlight] = await Promise.all([
      fetchTmdb<{ results: Record<string, unknown>[] }>(
        buildDiscoverQuery({
          mediaType,
          genreId: filters?.genreId,
          language: filters?.language,
          sort: filters?.sort,
        }),
      ),
      fetchTmdb<{ results: Record<string, unknown>[] }>(
        buildDiscoverQuery({
          mediaType,
          sort: "vote_average.desc",
          language: filters?.language,
          genreId: filters?.genreId,
        }),
      ),
      fetchTmdb<{ results: Record<string, unknown>[] }>(
        mediaType === "movie"
          ? "/movie/upcoming"
          : "/tv/on_the_air",
      ),
      fetchTmdb<{ results: Record<string, unknown>[] }>(
        buildDiscoverQuery({
          mediaType,
          genreId: filters?.genreId ?? getGenreOptions(mediaType)[0]?.id,
          language: filters?.language,
          sort: "popularity.desc",
        }),
      ),
    ]);

    const currentGenre = filters?.genreId
      ? getGenreLabel(mediaType, filters.genreId)
      : mediaType === "movie"
        ? "Movies"
        : "Series";

    return [
      {
        id: `${mediaType}-spotlight`,
        title: `${currentGenre} Spotlight`,
        eyebrow: "Browse with intent",
        description: "A denser browse lane built for faster picks instead of endless scrolling.",
        items: heroDiscover.results.map((item) => normalizeSummary(item, mediaType)).slice(0, 14),
      },
      {
        id: `${mediaType}-fresh`,
        title: mediaType === "movie" ? "Recently Arrived" : "Fresh Episodes",
        eyebrow: "Keep it current",
        items: fresh.results.map((item) => normalizeSummary(item, mediaType)).slice(0, 14),
      },
      {
        id: `${mediaType}-top-rated`,
        title: "Highest Rated",
        eyebrow: "When quality matters",
        items: topRated.results.map((item) => normalizeSummary(item, mediaType)).slice(0, 14),
      },
      {
        id: `${mediaType}-genre`,
        title: `${getGenreLabel(mediaType, filters?.genreId ?? getGenreOptions(mediaType)[0]?.id ?? 0)} Picks`,
        eyebrow: "Genre-driven",
        items: genreSpotlight.results.map((item) => normalizeSummary(item, mediaType)).slice(0, 14),
      },
    ];
  } catch {
    return null;
  }
}

export async function getShowCatalogRails(filters?: Omit<CatalogFilters, "mediaType">): Promise<MediaRail[] | null> {
  return getCatalogRail("tv", filters);
}

export async function searchCatalog(query: string, options?: SearchApiFilter): Promise<MediaSummary[] | null> {
  if (!query.trim()) {
    return [];
  }

  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const searchType = options?.type && options.type !== "all" ? options.type : "multi";
    const response = await fetchTmdb<{ results: Record<string, unknown>[] }>(
      `/search/${searchType}?query=${encodeURIComponent(query)}`,
    );

    return response.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv" || searchType !== "multi")
      .map((item) => normalizeSummary(item, options?.type && options.type !== "all" ? options.type : undefined))
      .slice(0, options?.limit ?? 18);
  } catch {
    return null;
  }
}

export async function getPersonCredits(personId: number): Promise<PersonSummary | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const [person, credits] = await Promise.all([
      fetchTmdb<Record<string, unknown>>(`/person/${personId}`),
      fetchTmdb<{ cast?: Record<string, unknown>[]; crew?: Record<string, unknown>[] }>(
        `/person/${personId}/combined_credits`,
      ),
    ]);

    return {
      id: Number(person.id),
      name: String(person.name || "Unknown"),
      knownForDepartment: typeof person.known_for_department === "string" ? person.known_for_department : undefined,
      profilePath: (person.profile_path as string | null) ?? null,
      knownFor: combineUniqueMedia(
        [...(credits.cast ?? []), ...(credits.crew ?? [])]
          .filter((item) => item.media_type === "movie" || item.media_type === "tv")
          .map((item) => normalizeSummary(item)),
      ).slice(0, 20),
    };
  } catch {
    return null;
  }
}

export async function searchCatalogExperience(filters: SearchExperienceFilters): Promise<SearchExperienceResult | null> {
  if (!filters.query.trim()) {
    return { titles: [], people: [] };
  }

  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    if (filters.personId) {
      const person = await getPersonCredits(filters.personId);

      return {
        titles: applyTitleFilters(person?.knownFor ?? [], filters),
        people: person ? [person] : [],
      };
    }

    const response = await fetchTmdb<{ results: Record<string, unknown>[] }>(
      `/search/multi?query=${encodeURIComponent(filters.query)}`,
    );

    const titles = response.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => normalizeSummary(item));
    const people = response.results
      .filter((item) => item.media_type === "person")
      .map((item) => normalizePerson(item))
      .slice(0, 8);

    return {
      titles: applyTitleFilters(titles, filters).slice(0, 30),
      people,
    };
  } catch {
    return null;
  }
}

export async function getTitleProviderAvailability(
  mediaType: MediaType,
  id: number,
  region: string,
): Promise<TitleProviderAvailability | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const response = await fetchTmdb<{ results?: Record<string, Record<string, unknown>> }>(
      `/${mediaType}/${id}/watch/providers`,
    );

    const regionResult = response.results?.[region.toUpperCase()];

    if (!regionResult) {
      return { region: region.toUpperCase(), groups: [] };
    }

    const groups = [
      mapProviderGroup("stream", regionResult.flatrate as Record<string, unknown>[] | undefined),
      mapProviderGroup("free", regionResult.free as Record<string, unknown>[] | undefined),
      mapProviderGroup("ads", regionResult.ads as Record<string, unknown>[] | undefined),
      mapProviderGroup("rent", regionResult.rent as Record<string, unknown>[] | undefined),
      mapProviderGroup("buy", regionResult.buy as Record<string, unknown>[] | undefined),
    ].filter((group): group is NonNullable<typeof group> => Boolean(group));

    return { region: region.toUpperCase(), groups };
  } catch {
    return null;
  }
}

export async function getMediaDetail(
  mediaType: MediaType,
  id: number,
  region: string,
): Promise<MediaDetail | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const [detail, providers] = await Promise.all([
      fetchTmdb<Record<string, unknown>>(`/${mediaType}/${id}?append_to_response=credits,recommendations,videos`),
      getTitleProviderAvailability(mediaType, id, region),
    ]);

    const trailers = ((detail.videos as { results?: Record<string, unknown>[] } | undefined)?.results ?? [])
      .map((video) => normalizeTrailer(video))
      .filter((video) => video.site === "YouTube" && (video.type === "Trailer" || video.type === "Teaser"));
    const heroTrailer =
      trailers.find((video) => video.official && video.type === "Trailer") ??
      trailers.find((video) => video.type === "Trailer") ??
      trailers[0] ??
      null;

    return {
      ...normalizeSummary(detail, mediaType),
      runtime:
        mediaType === "movie"
          ? (detail.runtime as number | undefined)
          : ((detail.episode_run_time as number[] | undefined)?.[0] ?? undefined),
      tagline: typeof detail.tagline === "string" ? detail.tagline : undefined,
      status: typeof detail.status === "string" ? detail.status : undefined,
      numberOfSeasons: detail.number_of_seasons as number | undefined,
      spokenLanguages:
        ((detail.spoken_languages as Record<string, unknown>[] | undefined) ?? [])
          .map((language) => String(language.english_name || language.name || ""))
          .filter(Boolean),
      cast:
        ((detail.credits as { cast?: Record<string, unknown>[] } | undefined)?.cast ?? [])
          .slice(0, 12)
          .map((person) => ({
            id: Number(person.id),
            name: String(person.name || "Unknown"),
            character: String(person.character || ""),
            profilePath: (person.profile_path as string | null) ?? null,
          })),
      seasons: normalizeSeasons(detail.seasons as Record<string, unknown>[] | undefined),
      related:
        ((detail.recommendations as { results?: Record<string, unknown>[] } | undefined)?.results ?? [])
          .slice(0, 8)
          .map((item) => normalizeSummary(item, mediaType)),
      providers: providers ?? undefined,
      trailers,
      heroTrailer,
    };
  } catch {
    return null;
  }
}

export async function getSeasonEpisodes(tvId: number, seasonNumber: number) {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const season = await fetchTmdb<Record<string, unknown>>(`/tv/${tvId}/season/${seasonNumber}`);

    return {
      id: Number(season.id),
      name: String(season.name || `Season ${seasonNumber}`),
      seasonNumber,
      episodeCount: Number(season.episodes ? (season.episodes as unknown[]).length : 0),
      posterPath: (season.poster_path as string | null) ?? null,
      episodes: ((season.episodes as Record<string, unknown>[] | undefined) ?? []).map((episode) => ({
        id: Number(episode.id),
        name: String(episode.name || `Episode ${episode.episode_number}`),
        overview: String(episode.overview || "No synopsis available."),
        episodeNumber: Number(episode.episode_number),
        runtime: episode.runtime as number | undefined,
        stillPath: (episode.still_path as string | null) ?? null,
      })),
    };
  } catch {
    return null;
  }
}

export async function getProviderRails(region: string): Promise<ProviderRail[] | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const normalizedRegion = region.toUpperCase();
    const providerMap = await getProviderDirectory();

    const sortedProviders = Array.from(providerMap.values()).sort(
      (a, b) =>
        getProviderPriority(a.provider.name) - getProviderPriority(b.provider.name) ||
        (a.provider.displayPriority ?? 9999) - (b.provider.displayPriority ?? 9999) ||
        a.provider.name.localeCompare(b.provider.name),
    );

    const sections = await Promise.allSettled(
      sortedProviders.slice(0, PROVIDER_CANDIDATE_LIMIT).map(async ({ provider, mediaTypes }) => {
        const mediaRequests = await Promise.allSettled(
          Array.from(mediaTypes).map((mediaType) =>
            discoverProviderTitles({
              mediaType,
              providerId: provider.providerId,
              region: normalizedRegion,
              pageCount: PROVIDER_RAIL_PAGE_COUNT,
              limit: 6,
            }),
          ),
        );

        const fulfilledItems = mediaRequests
          .filter((request): request is PromiseFulfilledResult<MediaSummary[]> => request.status === "fulfilled")
          .flatMap((request) => request.value);

        const items = combineUniqueMedia(fulfilledItems).slice(0, 10);

        if (items.length < MIN_PROVIDER_RAIL_ITEMS) {
          return null;
        }

        return {
          id: `provider-${provider.providerId}`,
          title: provider.name,
          eyebrow:
            mediaTypes.size > 1
              ? `Top picks in ${normalizedRegion} · Movies and Series`
              : mediaTypes.has("movie")
                ? `Top movie picks in ${normalizedRegion}`
                : `Top series picks in ${normalizedRegion}`,
          provider,
          items,
          mediaTypes: Array.from(mediaTypes),
          region: normalizedRegion,
        } satisfies ProviderRail;
      }),
    );

    return sections.reduce<ProviderRail[]>((accumulator, section) => {
      if (section.status === "fulfilled" && section.value) {
        accumulator.push(section.value);
      }

      return accumulator;
    }, []).slice(0, MAX_PROVIDER_RAILS);
  } catch {
    return null;
  }
}

export async function getProviderCatalog(providerId: number, region: string): Promise<ProviderCatalog | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const normalizedRegion = region.toUpperCase();
    const providerMap = await getProviderDirectory();
    const entry = providerMap.get(providerId);

    if (!entry) {
      return null;
    }

    const [movies, series] = await Promise.all([
      entry.mediaTypes.has("movie")
        ? discoverProviderTitles({
            mediaType: "movie",
            providerId,
            region: normalizedRegion,
            pageCount: PROVIDER_CATALOG_PAGE_COUNT,
            limit: PROVIDER_CATALOG_MEDIA_LIMIT,
          })
        : Promise.resolve([]),
      entry.mediaTypes.has("tv")
        ? discoverProviderTitles({
            mediaType: "tv",
            providerId,
            region: normalizedRegion,
            pageCount: PROVIDER_CATALOG_PAGE_COUNT,
            limit: PROVIDER_CATALOG_MEDIA_LIMIT,
          })
        : Promise.resolve([]),
    ]);

    return {
      provider: entry.provider,
      region: normalizedRegion,
      mediaTypes: Array.from(entry.mediaTypes),
      movies,
      series,
    };
  } catch {
    return null;
  }
}
