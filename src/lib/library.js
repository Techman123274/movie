import { base44 } from "@/api/base44Client";
import { readActiveProfile } from "@/lib/preferences";
import { logSocialActivity } from "@/lib/social";

export const LIBRARY_CHANGED_EVENT = "subflix:library-changed";

const isBrowser = typeof window !== "undefined";
const LIKES_STORAGE_PREFIX = "subflix_likes";
const WATCHLIST_CACHE_LIMIT = 500;

let watchlistCache = {
  items: null,
  promise: null,
};

const getMediaIdentity = (item, fallbackType) => {
  const mediaType = item?.media_type || fallbackType || (item?.title ? "movie" : "tv");
  const tmdbId = Number(item?.tmdb_id ?? item?.id);

  return {
    media_type: mediaType,
    tmdb_id: Number.isFinite(tmdbId) ? tmdbId : null,
  };
};

const getLikesStorageKey = (user, profile) =>
  `${LIKES_STORAGE_PREFIX}:${user?.id || user?.email || "guest"}:${profile?.id || profile?.name || "default"}`;

const dispatchLibraryChange = (detail) => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(LIBRARY_CHANGED_EVENT, {
      detail,
    })
  );
};

const setWatchlistCache = (items) => {
  watchlistCache = {
    items: Array.isArray(items) ? items : [],
    promise: Promise.resolve(Array.isArray(items) ? items : []),
  };
};

const clearWatchlistCache = () => {
  watchlistCache = {
    items: null,
    promise: null,
  };
};

export const listWatchlistItems = async () => {
  if (watchlistCache.items) {
    return watchlistCache.items;
  }

  if (!watchlistCache.promise) {
    watchlistCache.promise = base44.entities.Watchlist
      .list("-created_date", WATCHLIST_CACHE_LIMIT)
      .then((items) => {
        setWatchlistCache(items);
        return watchlistCache.items || [];
      })
      .catch((error) => {
        clearWatchlistCache();
        throw error;
      });
  }

  return watchlistCache.promise;
};

const normalizeLikedItem = (item, fallbackType) => {
  const identity = getMediaIdentity(item, fallbackType);

  return {
    tmdb_id: identity.tmdb_id,
    media_type: identity.media_type,
    id: identity.tmdb_id,
    title: item?.title || item?.name || "Untitled",
    poster_path: item?.poster_path || null,
    backdrop_path: item?.backdrop_path || null,
    vote_average: item?.vote_average || null,
    overview: item?.overview || "",
    release_date: item?.release_date || item?.first_air_date || null,
    genre_ids: item?.genre_ids || item?.genres?.map((genre) => genre.id) || [],
    liked_at: item?.liked_at || new Date().toISOString(),
  };
};

export const readLikedItems = (user, profile) => {
  if (!isBrowser || !user) {
    return [];
  }

  const raw = window.localStorage.getItem(getLikesStorageKey(user, profile));
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLikedItems = (user, profile, items) => {
  if (!isBrowser || !user) {
    return;
  }

  window.localStorage.setItem(getLikesStorageKey(user, profile), JSON.stringify(items));
};

export const isItemLiked = (user, profile, item, fallbackType) => {
  const identity = getMediaIdentity(item, fallbackType);
  if (!user || !identity.tmdb_id) {
    return false;
  }

  return readLikedItems(user, profile).some(
    (entry) => entry.tmdb_id === identity.tmdb_id && entry.media_type === identity.media_type
  );
};

export const toggleLikedItem = ({ user, profile, item, mediaType }) => {
  const normalized = normalizeLikedItem(item, mediaType);
  if (!user || !normalized.tmdb_id) {
    return false;
  }

  const currentItems = readLikedItems(user, profile);
  const exists = currentItems.some(
    (entry) => entry.tmdb_id === normalized.tmdb_id && entry.media_type === normalized.media_type
  );

  const nextItems = exists
    ? currentItems.filter(
        (entry) => !(entry.tmdb_id === normalized.tmdb_id && entry.media_type === normalized.media_type)
      )
    : [{ ...normalized, liked_at: new Date().toISOString() }, ...currentItems];

  writeLikedItems(user, profile, nextItems);
  if (!exists) {
    void logSocialActivity({
      user,
      profile,
      item: normalized,
      mediaType: normalized.media_type,
      activityType: "liked",
      message: `${user.full_name || user.email || "A friend"} liked this`,
    });
  }
  dispatchLibraryChange({
    scope: "likes",
    action: exists ? "removed" : "added",
    item: normalized,
    profileId: profile?.id || null,
  });

  return !exists;
};

export const getWatchlistEntry = async (item, fallbackType) => {
  const identity = getMediaIdentity(item, fallbackType);
  if (!identity.tmdb_id || !identity.media_type) {
    return null;
  }

  const entries = await listWatchlistItems().catch(() => []);
  return entries.find(
    (entry) =>
      Number(entry?.tmdb_id) === identity.tmdb_id &&
      entry?.media_type === identity.media_type
  ) || null;
};

export const toggleWatchlistItem = async ({ item, mediaType }) => {
  const identity = getMediaIdentity(item, mediaType);
  if (!identity.tmdb_id || !identity.media_type) {
    throw new Error("Invalid watchlist item.");
  }

  const existing = await getWatchlistEntry(identity, identity.media_type);

  if (existing) {
    await base44.entities.Watchlist.delete(existing.id);
    setWatchlistCache(
      (watchlistCache.items || []).filter((entry) => Number(entry?.id) !== Number(existing.id))
    );
    dispatchLibraryChange({
      scope: "watchlist",
      action: "removed",
      item: identity,
    });
    return { inWatchlist: false, entry: null };
  }

  const created = await base44.entities.Watchlist.create({
    tmdb_id: identity.tmdb_id,
    media_type: identity.media_type,
    title: item?.title || item?.name || "Untitled",
    poster_path: item?.poster_path || null,
    backdrop_path: item?.backdrop_path || null,
    vote_average: item?.vote_average || null,
    overview: item?.overview || "",
    release_date: item?.release_date || item?.first_air_date || null,
    genre_ids: item?.genre_ids || item?.genres?.map((genre) => genre.id) || [],
  });
  setWatchlistCache([created, ...(watchlistCache.items || [])]);

  const user = await base44.auth.me().catch(() => null);
  const profile = readActiveProfile();
  if (user) {
    await logSocialActivity({
      user,
      profile,
      item: { ...item, ...identity },
      mediaType: identity.media_type,
      activityType: "watchlist_added",
      message: `${user.full_name || user.email || "A friend"} added this to My List`,
    }).catch(() => null);
  }

  dispatchLibraryChange({
    scope: "watchlist",
    action: "added",
    item: identity,
  });

  return { inWatchlist: true, entry: created };
};
