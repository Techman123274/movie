import {
  getAiringTodayTV,
  getNowPlayingMovies,
  getTrending,
  getUpcomingMovies,
} from "@/lib/tmdb";
import { filterItemsForProfile, readPreference, writePreference } from "@/lib/preferences";
import { fetchPublicAdminNotifications } from "@/lib/admin-config";

const PROFILE_SEEN_KEY_PREFIX = "subflix_notifications_seen";
const PUSH_SEEN_KEY = "subflix_browser_notifications_seen";
const getProfileKey = (profile) => {
  if (!profile) {
    return `${PROFILE_SEEN_KEY_PREFIX}_global`;
  }

  return `${PROFILE_SEEN_KEY_PREFIX}_${profile.id || profile.name || "profile"}`;
};

export const fetchNotifications = async (profile) => {
  const todayStamp = `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`;
  const [adminNotices, upcomingMovies, nowPlayingMovies, airingToday, trending] = await Promise.all([
    fetchPublicAdminNotifications(profile).catch(() => []),
    getUpcomingMovies().catch(() => ({ results: [] })),
    getNowPlayingMovies().catch(() => ({ results: [] })),
    getAiringTodayTV().catch(() => ({ results: [] })),
    getTrending("all", "week").catch(() => ({ results: [] })),
  ]);

  const filteredUpcoming = filterItemsForProfile(
    (upcomingMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
    profile
  );
  const filteredNowPlaying = filterItemsForProfile(
    (nowPlayingMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
    profile
  );
  const filteredAiringToday = filterItemsForProfile(
    (airingToday.results || []).map((item) => ({ ...item, media_type: "tv" })),
    profile
  );
  const filteredTrending = filterItemsForProfile(
    (trending.results || []).map((item) => ({
      ...item,
      media_type: item.media_type || (item.title ? "movie" : "tv"),
    })),
    profile
  );

  const notifications = [
    ...adminNotices,
    ...filteredUpcoming.slice(0, 4).map((item) => ({
      id: `upcoming-movie-${item.id}`,
      title: `${item.title} is coming soon`,
      body: item.release_date
        ? `Expected on ${item.release_date}. Add it to your list before release day.`
        : "A new movie release is on the horizon.",
      type: "release",
      created_at: item.release_date || todayStamp,
      media_type: "movie",
      tmdb_id: item.id,
    })),
    ...filteredNowPlaying.slice(0, 3).map((item) => ({
      id: `now-playing-${item.id}`,
      title: `${item.title} just dropped`,
      body: "Now playing and ready to watch in Subflix.",
      type: "release",
      created_at: item.release_date || todayStamp,
      media_type: "movie",
      tmdb_id: item.id,
    })),
    ...filteredAiringToday.slice(0, 3).map((item) => ({
      id: `airing-tv-${item.id}`,
      title: `${item.name} has a new episode today`,
      body: "Fresh TV episodes are available now.",
      type: "release",
      created_at: item.first_air_date || todayStamp,
      media_type: "tv",
      tmdb_id: item.id,
    })),
    ...filteredTrending.slice(0, 2).map((item) => ({
      id: `trending-${item.media_type}-${item.id}`,
      title: `${item.title || item.name} is trending`,
      body: "Popular right now on Subflix this week.",
      type: "trending",
      created_at: todayStamp,
      media_type: item.media_type,
      tmdb_id: item.id,
    })),
  ];

  return notifications.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
};

export const getSeenNotificationIds = (profile) => {
  const seenRaw = readPreference(getProfileKey(profile), "[]");

  try {
    return JSON.parse(seenRaw);
  } catch {
    return [];
  }
};

export const markNotificationsSeen = (profile, notifications) => {
  const currentIds = new Set(getSeenNotificationIds(profile));

  (notifications || []).forEach((notification) => {
    currentIds.add(notification.id);
  });

  writePreference(getProfileKey(profile), JSON.stringify([...currentIds]));
};

export const getUnreadNotifications = (profile, notifications) => {
  const seenIds = new Set(getSeenNotificationIds(profile));
  return (notifications || []).filter((notification) => !seenIds.has(notification.id));
};

export const sendBrowserNotifications = async (notifications, enabled) => {
  if (!enabled || typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  const seenRaw = readPreference(PUSH_SEEN_KEY, "[]");
  let seenIds = [];

  try {
    seenIds = JSON.parse(seenRaw);
  } catch {
    seenIds = [];
  }

  const nextSeenIds = new Set(seenIds);

  notifications.slice(0, 3).forEach((notification) => {
    if (nextSeenIds.has(notification.id)) {
      return;
    }

    new Notification(notification.title, {
      body: notification.body,
      tag: notification.id,
    });
    nextSeenIds.add(notification.id);
  });

  writePreference(PUSH_SEEN_KEY, JSON.stringify([...nextSeenIds]));
};
