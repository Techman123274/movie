import { env, hasTmdbCredentials } from "@/lib/env";
import type {
  HomePageData,
  MediaDetail,
  MediaRail,
  MediaSummary,
  MediaType,
  ProviderInfo,
  ProviderRail,
  SeasonSummary,
  TitleProviderAvailability,
} from "@/lib/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const MAX_PROVIDER_RAILS = 12;
const PROVIDER_CANDIDATE_LIMIT = 24;
const MIN_PROVIDER_RAIL_ITEMS = 4;
const PREFERRED_PROVIDER_NAMES = [
  "netflix",
  "amazon prime video",
  "prime video",
  "disney plus",
  "hulu",
  "max",
  "apple tv plus",
  "paramount plus",
  "peacock premium",
  "crunchyroll",
];

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

  return {
    id: Number(item.id),
    mediaType,
    title: String(item.title || item.name || "Untitled"),
    overview: String(item.overview || "No synopsis available."),
    posterPath: (item.poster_path as string | null) ?? null,
    backdropPath: (item.backdrop_path as string | null) ?? null,
    genreNames:
      ((item.genres as { name: string }[] | undefined)?.map((genre) => genre.name) ??
        (item.genre_ids as number[] | undefined)?.map((genreId) => genreId.toString()) ??
        []) as string[],
    releaseDate: (item.release_date as string | undefined) || (item.first_air_date as string | undefined),
    voteAverage: typeof item.vote_average === "number" ? item.vote_average : undefined,
  };
}

function normalizeProvider(provider: Record<string, unknown>): ProviderInfo {
  return {
    providerId: Number(provider.provider_id),
    name: String(provider.provider_name || "Unknown"),
    logoPath: (provider.logo_path as string | null) ?? null,
    displayPriority:
      typeof provider.display_priority === "number" ? provider.display_priority : undefined,
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

function combineUniqueMedia(items: MediaSummary[]) {
  const seen = new Set<string>();

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

export function getImageUrl(path: string | null, size: "w342" | "w780" | "w1280" = "w780") {
  if (!path) {
    return null;
  }

  return `${TMDB_IMAGE_BASE}/${size}${path}`;
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

export async function getHomePageData(): Promise<HomePageData | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const [trending, topRatedMovies, topRatedShows] = await Promise.all([
      fetchTmdb<{ results: Record<string, unknown>[] }>("/trending/all/week"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/movie/top_rated"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/tv/top_rated"),
    ]);

    const trendingItems = trending.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => normalizeSummary(item))
      .slice(0, 8);

    const rails: MediaRail[] = [
      { id: "trending", title: "Trending Now", eyebrow: "Live from TMDB", items: trendingItems },
      {
        id: "top-rated-movies",
        title: "Top Rated Movies",
        eyebrow: "Big-screen prestige",
        items: topRatedMovies.results.map((item) => normalizeSummary(item, "movie")).slice(0, 8),
      },
      {
        id: "top-rated-shows",
        title: "Top Rated Series",
        eyebrow: "Season-stretching drama",
        items: topRatedShows.results.map((item) => normalizeSummary(item, "tv")).slice(0, 8),
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

export async function getCatalogRail(mediaType: MediaType): Promise<MediaRail[] | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const path = mediaType === "movie" ? "/movie/now_playing" : "/tv/popular";
    const secondaryPath = mediaType === "movie" ? "/movie/upcoming" : "/tv/top_rated";
    const [primary, secondary] = await Promise.all([
      fetchTmdb<{ results: Record<string, unknown>[] }>(path),
      fetchTmdb<{ results: Record<string, unknown>[] }>(secondaryPath),
    ]);

    return [
      {
        id: `${mediaType}-primary`,
        title: mediaType === "movie" ? "Now Playing" : "Popular Series",
        eyebrow: "Curated by TMDB",
        items: primary.results.map((item) => normalizeSummary(item, mediaType)).slice(0, 12),
      },
      {
        id: `${mediaType}-secondary`,
        title: mediaType === "movie" ? "Coming Soon" : "Top Rated Seasons",
        eyebrow: "Fresh additions",
        items: secondary.results.map((item) => normalizeSummary(item, mediaType)).slice(0, 12),
      },
    ];
  } catch {
    return null;
  }
}

export async function getShowCatalogRails(): Promise<MediaRail[] | null> {
  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const [trending, airingToday, popular, topRated, onTheAir] = await Promise.all([
      fetchTmdb<{ results: Record<string, unknown>[] }>("/trending/tv/week"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/tv/airing_today"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/tv/popular"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/tv/top_rated"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/tv/on_the_air"),
    ]);

    return [
      {
        id: "tv-trending",
        title: "Trending Series",
        eyebrow: "What everyone's starting",
        items: trending.results.map((item) => normalizeSummary(item, "tv")).slice(0, 12),
      },
      {
        id: "tv-airing-today",
        title: "Airing Today",
        eyebrow: "Fresh episodes",
        items: airingToday.results.map((item) => normalizeSummary(item, "tv")).slice(0, 12),
      },
      {
        id: "tv-popular",
        title: "Popular Series",
        eyebrow: "Big TV right now",
        items: popular.results.map((item) => normalizeSummary(item, "tv")).slice(0, 12),
      },
      {
        id: "tv-top-rated",
        title: "Top Rated Series",
        eyebrow: "Prestige picks",
        items: topRated.results.map((item) => normalizeSummary(item, "tv")).slice(0, 12),
      },
      {
        id: "tv-on-the-air",
        title: "Currently On The Air",
        eyebrow: "Week-to-week favorites",
        items: onTheAir.results.map((item) => normalizeSummary(item, "tv")).slice(0, 12),
      },
    ];
  } catch {
    return null;
  }
}

export async function searchCatalog(query: string, limit = 18): Promise<MediaSummary[] | null> {
  if (!query.trim()) {
    return [];
  }

  if (!hasTmdbCredentials()) {
    return null;
  }

  try {
    const response = await fetchTmdb<{ results: Record<string, unknown>[] }>(
      `/search/multi?query=${encodeURIComponent(query)}`,
    );

    return response.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => normalizeSummary(item))
      .slice(0, limit);
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
      fetchTmdb<Record<string, unknown>>(`/${mediaType}/${id}?append_to_response=credits,recommendations`),
      getTitleProviderAvailability(mediaType, id, region),
    ]);

    return {
      ...normalizeSummary(detail, mediaType),
      runtime:
        mediaType === "movie"
          ? (detail.runtime as number | undefined)
          : ((detail.episode_run_time as number[] | undefined)?.[0] ?? undefined),
      numberOfSeasons: detail.number_of_seasons as number | undefined,
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
    const [movieProviders, tvProviders] = await Promise.all([
      fetchTmdb<{ results: Record<string, unknown>[] }>("/watch/providers/movie"),
      fetchTmdb<{ results: Record<string, unknown>[] }>("/watch/providers/tv"),
    ]);

    const providerMap = new Map<number, { provider: ProviderInfo; mediaTypes: Set<MediaType> }>();

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
      } else {
        providerMap.set(provider.providerId, {
          provider,
          mediaTypes: new Set<MediaType>(["tv"]),
        });
      }
    });

    const sortedProviders = Array.from(providerMap.values()).sort(
      (a, b) =>
        getProviderPriority(a.provider.name) - getProviderPriority(b.provider.name) ||
        (a.provider.displayPriority ?? 9999) - (b.provider.displayPriority ?? 9999) ||
        a.provider.name.localeCompare(b.provider.name),
    );

    const sections = await Promise.allSettled(
      sortedProviders.slice(0, PROVIDER_CANDIDATE_LIMIT).map(async ({ provider, mediaTypes }) => {
        const mediaRequests = await Promise.allSettled(
          Array.from(mediaTypes).map(async (mediaType) => {
            const result = await fetchTmdb<{ results: Record<string, unknown>[] }>(
              `/discover/${mediaType}?watch_region=${encodeURIComponent(normalizedRegion)}&with_watch_providers=${provider.providerId}&sort_by=popularity.desc`,
            );

            return result.results.map((item) => normalizeSummary(item, mediaType)).slice(0, 6);
          }),
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
