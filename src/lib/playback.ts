import { env } from "@/lib/env";
import type { PlaybackProviderResult, PlaybackRequest } from "@/lib/types";

type ProviderName = "vidlink" | "moviesapi";

const providers: Record<
  ProviderName,
  {
    supportsEpisodes: boolean;
    buildUrl: (request: PlaybackRequest) => string;
  }
> = {
  vidlink: {
    supportsEpisodes: true,
    buildUrl: (request) =>
      request.mediaType === "movie"
        ? `https://vidlink.pro/movie/${request.tmdbId}?primaryColor=d6b36d&secondaryColor=0d1724&iconColor=f5f1e8&title=true&poster=true&autoplay=false`
        : `https://vidlink.pro/tv/${request.tmdbId}/${request.seasonNumber}/${request.episodeNumber}?primaryColor=d6b36d&secondaryColor=0d1724&iconColor=f5f1e8&title=true&poster=true&autoplay=true&nextbutton=true`,
  },
  moviesapi: {
    supportsEpisodes: true,
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
  return (Object.keys(providers) as ProviderName[]).map((providerName) => {
    const provider = providers[providerName];
    const availability = getAvailability(providerName);

    return {
      provider: providerName,
      embedUrl: provider.buildUrl(request),
      supportedMediaType: request.mediaType,
      supportsEpisodes: provider.supportsEpisodes,
      ...availability,
    };
  });
}
