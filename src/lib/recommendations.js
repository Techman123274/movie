import { readActiveProfile } from "@/lib/preferences";

const isBrowser = typeof window !== "undefined";
const TASTE_PROFILE_PREFIX = "subflix_taste_profile";

export const getItemGenres = (item) =>
  item?.genre_ids ||
  item?.genres?.map((genre) => genre.id) ||
  [];

const getTasteStorageKey = (profile) =>
  `${TASTE_PROFILE_PREFIX}_${profile?.id || profile?.name || "global"}`;

export const readTasteProfile = (profile = readActiveProfile()) => {
  if (!isBrowser) {
    return null;
  }

  const raw = window.localStorage.getItem(getTasteStorageKey(profile));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveTasteProfile = (tasteProfile, profile = readActiveProfile()) => {
  if (!isBrowser || !tasteProfile) {
    return;
  }

  window.localStorage.setItem(getTasteStorageKey(profile), JSON.stringify(tasteProfile));
};

export const buildTasteProfile = ({ history = [], watchlist = [] }) => {
  const genreWeights = {};
  const mediaTypeWeights = {};
  const decadeWeights = {};

  const applyItem = (item, weight) => {
    getItemGenres(item).forEach((genreId) => {
      genreWeights[genreId] = (genreWeights[genreId] || 0) + weight;
    });

    if (item.media_type) {
      mediaTypeWeights[item.media_type] = (mediaTypeWeights[item.media_type] || 0) + weight;
    }

    const year = Number((item.release_date || item.first_air_date || "").slice(0, 4));
    if (year) {
      const decade = Math.floor(year / 10) * 10;
      decadeWeights[decade] = (decadeWeights[decade] || 0) + weight;
    }
  };

  history.forEach((item, index) => {
    const progressBoost = Math.max(0, (item.progress_percent || 0) / 25);
    applyItem(item, 3 + progressBoost + Math.max(0, 4 - index) * 0.35);
  });

  watchlist.forEach((item, index) => {
    applyItem(item, 2.2 + Math.max(0, 5 - index) * 0.2);
  });

  const topGenres = Object.entries(genreWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([genreId]) => Number(genreId));

  const preferredMediaType = Object.entries(mediaTypeWeights)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const topDecades = Object.entries(decadeWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([decade]) => Number(decade));

  if (topGenres.length === 0 && !preferredMediaType) {
    return null;
  }

  return {
    genreWeights,
    mediaTypeWeights,
    decadeWeights,
    topGenres,
    topDecades,
    preferredMediaType,
  };
};

export const getMatchPercentage = (item, tasteProfile = readTasteProfile()) => {
  if (!item || !tasteProfile) {
    return null;
  }

  const genreIds = getItemGenres(item);
  if (genreIds.length === 0 && !tasteProfile.preferredMediaType) {
    return null;
  }

  const maxGenreWeight = Math.max(
    1,
    ...Object.values(tasteProfile.genreWeights || {}).map((value) => Number(value) || 0)
  );
  const overlapWeight = genreIds.reduce(
    (sum, genreId) => sum + (tasteProfile.genreWeights?.[genreId] || 0),
    0
  );

  let score = 52;
  if (overlapWeight > 0) {
    score += Math.min(28, (overlapWeight / maxGenreWeight) * 11);
    score += Math.min(12, genreIds.filter((genreId) => tasteProfile.topGenres?.includes(genreId)).length * 4);
  }

  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  if (tasteProfile.preferredMediaType && tasteProfile.preferredMediaType === mediaType) {
    score += 8;
  }

  const year = Number((item.release_date || item.first_air_date || "").slice(0, 4));
  if (year) {
    const decade = Math.floor(year / 10) * 10;
    if (tasteProfile.topDecades?.includes(decade)) {
      score += 5;
    }
  }

  if (item.vote_average) {
    score += Math.min(8, item.vote_average * 0.8);
  }

  return Math.max(55, Math.min(99, Math.round(score)));
};

export const decorateItemsWithMatch = (items, tasteProfile = readTasteProfile()) =>
  (items || []).map((item) => {
    const matchPercentage = getMatchPercentage(item, tasteProfile);
    return matchPercentage
      ? { ...item, match_percentage: matchPercentage }
      : item;
  });

export const getRecommendedItems = (items, tasteProfile = readTasteProfile(), limit = 20) =>
  decorateItemsWithMatch(items, tasteProfile)
    .filter((item) => item.match_percentage)
    .sort((a, b) => {
      if (b.match_percentage !== a.match_percentage) {
        return b.match_percentage - a.match_percentage;
      }
      return (b.vote_average || 0) - (a.vote_average || 0);
    })
    .slice(0, limit);
