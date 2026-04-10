import { readActiveProfile } from "@/lib/preferences";

const isBrowser = typeof window !== "undefined";
const TASTE_PROFILE_PREFIX = "subflix_taste_profile";
const getMediaType = (item) => item?.media_type || (item?.title ? "movie" : "tv");
const getItemKey = (item) => `${getMediaType(item)}:${item?.tmdb_id ?? item?.id ?? ""}`;
const getRecencyWeight = (value) => {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return 0;
  }

  const ageDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
  if (ageDays <= 7) {
    return 1.4;
  }
  if (ageDays <= 30) {
    return 0.9;
  }
  if (ageDays <= 90) {
    return 0.45;
  }
  return 0.15;
};

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
  const titleWeights = {};
  const recentItems = [];

  const applyItem = (item, weight) => {
    getItemGenres(item).forEach((genreId) => {
      genreWeights[genreId] = (genreWeights[genreId] || 0) + weight;
    });

    const mediaType = getMediaType(item);
    if (mediaType) {
      mediaTypeWeights[mediaType] = (mediaTypeWeights[mediaType] || 0) + weight;
    }

    const year = Number((item.release_date || item.first_air_date || "").slice(0, 4));
    if (year) {
      const decade = Math.floor(year / 10) * 10;
      decadeWeights[decade] = (decadeWeights[decade] || 0) + weight;
    }

    titleWeights[getItemKey(item)] = (titleWeights[getItemKey(item)] || 0) + weight;
  };

  history.forEach((item, index) => {
    const progressBoost = Math.max(0, (item.progress_percent || 0) / 18);
    const recencyBoost = getRecencyWeight(item.updated_at || item.created_at);
    const weight = 3.4 + progressBoost + Math.max(0, 5 - index) * 0.4 + recencyBoost;
    applyItem(item, weight);

    if (recentItems.length < 5) {
      recentItems.push({
        id: item.tmdb_id ?? item.id,
        tmdb_id: item.tmdb_id ?? item.id,
        title: item.title || item.name || "Untitled",
        media_type: getMediaType(item),
      });
    }
  });

  watchlist.forEach((item, index) => {
    const likedBoost = item.liked_at ? 1.4 : 0;
    const recencyBoost = getRecencyWeight(item.liked_at || item.updated_at || item.created_at);
    applyItem(item, 2.1 + Math.max(0, 5 - index) * 0.22 + likedBoost + recencyBoost);
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
    titleWeights,
    topGenres,
    topDecades,
    preferredMediaType,
    recentItems,
  };
};

export const getRecommendationScore = (item, tasteProfile = readTasteProfile()) => {
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

  let score = 50;
  if (overlapWeight > 0) {
    score += Math.min(30, (overlapWeight / maxGenreWeight) * 12.5);
    score += Math.min(14, genreIds.filter((genreId) => tasteProfile.topGenres?.includes(genreId)).length * 4.5);
  }

  const mediaType = getMediaType(item);
  if (tasteProfile.preferredMediaType && tasteProfile.preferredMediaType === mediaType) {
    score += 8.5;
  }

  const year = Number((item.release_date || item.first_air_date || "").slice(0, 4));
  if (year) {
    const decade = Math.floor(year / 10) * 10;
    if (tasteProfile.topDecades?.includes(decade)) {
      score += 5.5;
    }
  }

  const voteAverage = Number(item.vote_average) || 0;
  if (voteAverage > 0) {
    score += Math.min(7.5, voteAverage * 0.7);
  }

  const popularity = Number(item.popularity) || 0;
  if (popularity > 0 && popularity < 80) {
    score += 2.5;
  }

  const itemKey = getItemKey(item);
  if (tasteProfile.titleWeights?.[itemKey]) {
    score -= 6;
  }

  if (item.vote_average) {
    score += Math.min(8, item.vote_average * 0.8);
  }

  return score;
};

export const getMatchPercentage = (item, tasteProfile = readTasteProfile()) => {
  const score = getRecommendationScore(item, tasteProfile);
  if (score === null) {
    return null;
  }

  if (item.vote_average) {
    return Math.max(55, Math.min(99, Math.round(score)));
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

export const getTrendingInFavoriteGenres = (items, tasteProfile = readTasteProfile(), limit = 20) =>
  decorateItemsWithMatch(items, tasteProfile)
    .filter((item) =>
      getItemGenres(item).some((genreId) => tasteProfile?.topGenres?.slice(0, 3).includes(genreId))
    )
    .sort((a, b) => {
      const aGenreHits = getItemGenres(a).filter((genreId) => tasteProfile?.topGenres?.includes(genreId)).length;
      const bGenreHits = getItemGenres(b).filter((genreId) => tasteProfile?.topGenres?.includes(genreId)).length;
      if (bGenreHits !== aGenreHits) {
        return bGenreHits - aGenreHits;
      }
      return (b.popularity || 0) - (a.popularity || 0);
    })
    .slice(0, limit);

export const getHiddenGemItems = (items, tasteProfile = readTasteProfile(), limit = 20) =>
  decorateItemsWithMatch(items, tasteProfile)
    .filter((item) =>
      (Number(item.vote_average) || 0) >= 7 &&
      (Number(item.vote_count) || 0) >= 30 &&
      (Number(item.popularity) || 0) < 110
    )
    .sort((a, b) => {
      if ((b.match_percentage || 0) !== (a.match_percentage || 0)) {
        return (b.match_percentage || 0) - (a.match_percentage || 0);
      }
      if ((b.vote_average || 0) !== (a.vote_average || 0)) {
        return (b.vote_average || 0) - (a.vote_average || 0);
      }
      return (a.popularity || 0) - (b.popularity || 0);
    })
    .slice(0, limit);
