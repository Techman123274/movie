import { base44 } from "@/api/base44Client";

const HEARTBEAT_MS = 25_000;

let heartbeatTimer = null;
let activeProfileSnapshot = null;
let watchingSnapshot = {
  tmdb_id: null,
  media_type: null,
  title: null,
  poster_path: null,
  started_at: null,
};

const getVisibilityStatus = () => {
  if (typeof document === "undefined") {
    return "online";
  }

  return document.visibilityState === "hidden" ? "away" : "online";
};

const buildPresencePayload = () => {
  const profile = activeProfileSnapshot;
  const nowIso = new Date().toISOString();

  return {
    active_profile_id: profile?.id || null,
    active_profile_name: profile?.name || null,
    avatar_url: profile?.avatar_asset_url || profile?.avatar_url || null,
    status: getVisibilityStatus(),
    last_seen_at: nowIso,
    watching_tmdb_id: watchingSnapshot.tmdb_id,
    watching_media_type: watchingSnapshot.media_type,
    watching_title: watchingSnapshot.title,
    watching_poster_path: watchingSnapshot.poster_path,
    watching_started_at: watchingSnapshot.started_at,
  };
};

const pushPresence = async () => {
  const payload = buildPresencePayload();
  await base44.presence.upsert(payload).catch(() => null);
};

export const startPresenceHeartbeat = async ({ activeProfile } = {}) => {
  activeProfileSnapshot = activeProfile || null;

  if (heartbeatTimer) {
    await pushPresence();
    return;
  }

  await pushPresence();

  if (typeof window === "undefined") {
    return;
  }

  heartbeatTimer = window.setInterval(() => {
    void pushPresence();
  }, HEARTBEAT_MS);

  const handleVisibility = () => {
    void pushPresence();
  };

  window.addEventListener("visibilitychange", handleVisibility);
  window.addEventListener("pagehide", handleVisibility);
  window.addEventListener("beforeunload", handleVisibility);

  heartbeatTimer._presenceCleanup = () => {
    window.removeEventListener("visibilitychange", handleVisibility);
    window.removeEventListener("pagehide", handleVisibility);
    window.removeEventListener("beforeunload", handleVisibility);
  };
};

export const stopPresenceHeartbeat = async () => {
  if (typeof window !== "undefined" && heartbeatTimer) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer?._presenceCleanup?.();
  }
  heartbeatTimer = null;
  activeProfileSnapshot = null;
};

export const setWatching = async ({ item, mediaType } = {}) => {
  const tmdbId = Number(item?.tmdb_id ?? item?.id);
  if (!tmdbId) {
    return;
  }

  watchingSnapshot = {
    tmdb_id: tmdbId,
    media_type: item?.media_type || mediaType || (item?.title ? "movie" : "tv"),
    title: item?.title || item?.name || "Untitled",
    poster_path: item?.poster_path || null,
    started_at: new Date().toISOString(),
  };

  if (heartbeatTimer) {
    await pushPresence();
  }
};

export const clearWatching = async () => {
  watchingSnapshot = {
    tmdb_id: null,
    media_type: null,
    title: null,
    poster_path: null,
    started_at: null,
  };

  if (heartbeatTimer) {
    await pushPresence();
  }
};

export const listFriendsPresence = async (friendEmails = []) =>
  base44.presence.listByEmails(friendEmails);

