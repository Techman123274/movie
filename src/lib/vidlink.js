const VIDLINK_BASE = "https://vidlink.pro";
const VIDSRC_BASE = "https://vidsrc.to/embed";
const PLAYER_PROVIDERS = [
  {
    id: "vidlink",
    label: "VidLink",
    moviePath: (tmdbId) => `${VIDLINK_BASE}/movie/${tmdbId}`,
    tvPath: (tmdbId, season, episode) => `${VIDLINK_BASE}/tv/${tmdbId}/${season}/${episode}`,
    buildParams: (params, options) => {
      if (options.autoplay !== false) {
        params.set("autoplay", "true");
      }
      if (options.primaryColor) {
        params.set("primaryColor", options.primaryColor.replace("#", ""));
      }
      if (options.secondaryColor) {
        params.set("secondaryColor", options.secondaryColor.replace("#", ""));
      }
      if (Number.isFinite(Number(options.resumeSeconds)) && Number(options.resumeSeconds) > 0) {
        params.set("startAt", String(Math.floor(Number(options.resumeSeconds))));
      }
    },
  },
  {
    id: "vidsrc",
    label: "VidSrc",
    moviePath: (tmdbId) => `${VIDSRC_BASE}/movie/${tmdbId}`,
    tvPath: (tmdbId, season, episode) => `${VIDSRC_BASE}/tv/${tmdbId}/${season}/${episode}`,
    buildParams: (params, options) => {
      if (options.autoplay !== false) {
        params.set("autoplay", "1");
      }
      if (Number.isFinite(Number(options.resumeSeconds)) && Number(options.resumeSeconds) > 0) {
        params.set("start", String(Math.floor(Number(options.resumeSeconds))));
      }
    },
  },
];

const buildQueryParams = (provider, options = {}) => {
  const params = new URLSearchParams();
  provider.buildParams?.(params, options);
  return params;
};

const buildProviderUrl = (provider, type, tmdbId, season, episode, options = {}) => {
  const params = buildQueryParams(provider, options);
  const query = params.toString();
  const basePath = type === "movie"
    ? provider.moviePath(tmdbId)
    : provider.tvPath(tmdbId, season, episode);

  return `${basePath}${query ? `?${query}` : ""}`;
};

export const getPlaybackSourceCandidates = ({
  type,
  tmdbId,
  season = 1,
  episode = 1,
  options = {},
}) =>
  PLAYER_PROVIDERS.map((provider) => ({
    id: provider.id,
    label: provider.label,
    url: buildProviderUrl(provider, type, tmdbId, season, episode, options),
  }));

/**
 * Generate embed URL for a movie
 */
export const getMovieEmbedUrl = (tmdbId, options = {}) => {
  return getPlaybackSourceCandidates({
    type: "movie",
    tmdbId,
    options,
  })[0]?.url || "";
};

/**
 * Generate embed URL for a TV episode
 */
export const getTVEmbedUrl = (tmdbId, season, episode, options = {}) => {
  return getPlaybackSourceCandidates({
    type: "tv",
    tmdbId,
    season,
    episode,
    options,
  })[0]?.url || "";
};

export const DEFAULT_PLAYER_OPTIONS = {
  primaryColor: "#E50914",
  secondaryColor: "#ffffff",
  autoplay: true,
};
