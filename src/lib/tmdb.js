const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
import { hasTmdbCredentials, tmdbApiKey, tmdbReadAccessToken } from "@/lib/env";

export const tmdbImage = (path, size = "w500") => {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const tmdbOriginal = (path) => tmdbImage(path, "original");
export const tmdbW500 = (path) => tmdbImage(path, "w500");
export const tmdbW300 = (path) => tmdbImage(path, "w300");
export const tmdbW185 = (path) => tmdbImage(path, "w185");
export const tmdbConfigured = () => hasTmdbCredentials();

const tmdbFetch = async (endpoint, params = {}) => {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  const accessToken = tmdbReadAccessToken();
  const apiKey = tmdbApiKey();

  if (!accessToken && !apiKey) {
    throw new Error("TMDB credentials are not configured.");
  }

  /** @type {HeadersInit} */
  const headers = {};

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else {
    url.searchParams.set("api_key", apiKey);
  }

  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
};

// Trending
export const getTrending = (mediaType = "all", timeWindow = "week") =>
  tmdbFetch(`/trending/${mediaType}/${timeWindow}`);

// Movies
export const getPopularMovies = (page = 1) =>
  tmdbFetch("/movie/popular", { page });

export const getTopRatedMovies = (page = 1) =>
  tmdbFetch("/movie/top_rated", { page });

export const getNowPlayingMovies = () =>
  tmdbFetch("/movie/now_playing");

export const getUpcomingMovies = () =>
  tmdbFetch("/movie/upcoming");

export const getMovieDetails = (id) =>
  tmdbFetch(`/movie/${id}`, { append_to_response: "credits,videos,similar,recommendations,images" });

// TV Shows
export const getPopularTV = (page = 1) =>
  tmdbFetch("/tv/popular", { page });

export const getTopRatedTV = (page = 1) =>
  tmdbFetch("/tv/top_rated", { page });

export const getAiringTodayTV = () =>
  tmdbFetch("/tv/airing_today");

export const getTVDetails = (id) =>
  tmdbFetch(`/tv/${id}`, { append_to_response: "credits,videos,similar,recommendations,aggregate_credits,images" });

export const getTVSeason = (tvId, seasonNumber) =>
  tmdbFetch(`/tv/${tvId}/season/${seasonNumber}`);

// Search
export const searchMulti = (query, page = 1) =>
  tmdbFetch("/search/multi", { query, page });

export const searchMovies = (query, page = 1) =>
  tmdbFetch("/search/movie", { query, page });

export const searchTV = (query, page = 1) =>
  tmdbFetch("/search/tv", { query, page });

// Genres
export const getMovieGenres = () =>
  tmdbFetch("/genre/movie/list");

export const getTVGenres = () =>
  tmdbFetch("/genre/tv/list");

export const getByGenre = (genreId, mediaType = "movie", page = 1) =>
  tmdbFetch(`/discover/${mediaType}`, { with_genres: genreId, page, sort_by: "popularity.desc" });

// Person
export const getPersonDetails = (id) =>
  tmdbFetch(`/person/${id}`, { append_to_response: "movie_credits,tv_credits,images" });

const buildYouTubeEmbedUrl = (videoKey, options = {}) => {
  if (!videoKey) {
    return null;
  }

  const params = new URLSearchParams({
    autoplay: options.autoplay === false ? "0" : "1",
    mute: options.mute === false ? "0" : "1",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });

  return `https://www.youtube.com/embed/${videoKey}?${params.toString()}`;
};

// Videos helper
export const getYouTubeTrailer = (videos, options = {}) => {
  if (!videos?.results) return null;
  const trailer = videos.results.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")
  );
  return trailer ? buildYouTubeEmbedUrl(trailer.key, options) : null;
};

export const GENRE_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western",
  10759: "Action & Adventure", 10762: "Kids", 10763: "News",
  10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap",
  10767: "Talk", 10768: "War & Politics"
};
