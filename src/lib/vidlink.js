/**
 * Vidlink.pro playback provider abstraction layer
 * Only used for content where playback is authorized
 */

const VIDLINK_BASE = "https://vidlink.pro";

/**
 * Generate embed URL for a movie
 */
export const getMovieEmbedUrl = (tmdbId, options = {}) => {
  const params = new URLSearchParams();
  if (options.autoplay !== false) params.set("autoplay", "true");
  if (options.primaryColor) params.set("primaryColor", options.primaryColor.replace("#", ""));
  if (options.secondaryColor) params.set("secondaryColor", options.secondaryColor.replace("#", ""));
  const query = params.toString();
  return `${VIDLINK_BASE}/movie/${tmdbId}${query ? "?" + query : ""}`;
};

/**
 * Generate embed URL for a TV episode
 */
export const getTVEmbedUrl = (tmdbId, season, episode, options = {}) => {
  const params = new URLSearchParams();
  if (options.autoplay !== false) params.set("autoplay", "true");
  if (options.primaryColor) params.set("primaryColor", options.primaryColor.replace("#", ""));
  if (options.secondaryColor) params.set("secondaryColor", options.secondaryColor.replace("#", ""));
  const query = params.toString();
  return `${VIDLINK_BASE}/tv/${tmdbId}/${season}/${episode}${query ? "?" + query : ""}`;
};

export const DEFAULT_PLAYER_OPTIONS = {
  primaryColor: "#E50914",
  secondaryColor: "#ffffff",
  autoplay: true,
};