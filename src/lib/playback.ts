import { env } from "@/lib/env";
import type { PlaybackProviderResult, PlaybackRequest } from "@/lib/types";

type ProviderName = "vidlink" | "moviesapi";

const providers: Record<
  ProviderName,
  {
    label: string;
    description: string;
    supportsEpisodes: boolean;
    capabilities: string[];
    rank: number;
    buildUrl: (request: PlaybackRequest) => string;
  }
> = {
  vidlink: {
    label: "VidLink",
    description: "Best overall default for fast launch, episode handoff, and autoplay continuity.",
    supportsEpisodes: true,
    capabilities: ["Autoplay next", "Episode routing", "Cleaner metadata skin"],
    rank: 1,
    buildUrl: (request) =>
      request.mediaType === "movie"
        ? `https://vidlink.pro/movie/${request.tmdbId}?primaryColor=d6b36d&secondaryColor=0d1724&iconColor=f5f1e8&title=true&poster=true&autoplay=false`
        : `https://vidlink.pro/tv/${request.tmdbId}/${request.seasonNumber}/${request.episodeNumber}?primaryColor=d6b36d&secondaryColor=0d1724&iconColor=f5f1e8&title=true&poster=true&autoplay=true&nextbutton=true`,
  },
  moviesapi: {
    label: "MoviesAPI",
    description: "Strong fallback server when you want a second path ready without leaving the page.",
    supportsEpisodes: true,
    capabilities: ["Backup server", "Episode routing"],
    rank: 2,
    buildUrl: (request) =>
      request.mediaType === "movie"
        ? `https://moviesapi.club/movie/${request.tmdbId}`
        : `https://moviesapi.club/tv/${request.tmdbId}-${request.seasonNumber}-${request.episodeNumber}?autoplay=1`,
  },
};

function getAvailability(provider: ProviderName) {
  if (!env.playback.enabledProviders.includes(provider)) {
    return {
      availability: "disabled" as const,
      statusMessage: "Provider disabled in environment configuration.",
    };
  }

  if (env.playback.strictAdFree && !env.playback.validatedProviders.includes(provider)) {
    return {
      availability: "pending-review" as const,
      statusMessage: "Playback held until manual ad-free validation is complete.",
    };
  }

  return {
    availability: "enabled" as const,
    statusMessage: "Provider enabled for playback.",
  };
}

export function resolvePlaybackOptions(request: PlaybackRequest): PlaybackProviderResult[] {
  return (Object.keys(providers) as ProviderName[])
    .map((providerName) => {
      const provider = providers[providerName];
      const availability = getAvailability(providerName);

      return {
        provider: providerName,
        label: provider.label,
        description: provider.description,
        embedUrl: provider.buildUrl(request),
        supportedMediaType: request.mediaType,
        supportsEpisodes: provider.supportsEpisodes,
        capabilities: provider.capabilities,
        rank: provider.rank,
        recommended: provider.rank === 1,
        ...availability,
      };
    })
    .sort((a, b) => a.rank - b.rank);
}
