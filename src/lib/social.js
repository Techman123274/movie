import { base44 } from "@/api/base44Client";
import { filterItemsForProfile } from "@/lib/preferences";

export const SOCIAL_CHANGED_EVENT = "subflix:social-changed";

const isBrowser = typeof window !== "undefined";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const dispatchSocialChanged = (detail) => {
  if (!isBrowser) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(SOCIAL_CHANGED_EVENT, {
      detail,
    })
  );
};

const getProfileScope = (profile) => ({
  profile_id: profile?.id || null,
  profile_name: profile?.name || "Profile",
});

const getMediaIdentity = (item, fallbackType) => ({
  tmdb_id: Number(item?.tmdb_id ?? item?.id),
  media_type: item?.media_type || fallbackType || (item?.title ? "movie" : "tv"),
});

const buildTitlePayload = ({ item, mediaType, profile }) => {
  const identity = getMediaIdentity(item, mediaType);
  const scope = getProfileScope(profile);

  return {
    ...scope,
    tmdb_id: identity.tmdb_id,
    media_type: identity.media_type,
    title: item?.title || item?.name || "Untitled",
    poster_path: item?.poster_path || null,
    backdrop_path: item?.backdrop_path || null,
    vote_average: item?.vote_average || null,
    release_date: item?.release_date || item?.first_air_date || null,
    overview: item?.overview || "",
    genre_ids: item?.genre_ids || item?.genres?.map((genre) => genre.id) || [],
    is_adult: Boolean(item?.adult),
  };
};

const getUniqueNames = (activities = [], limit = 3) => {
  const names = [];
  const seen = new Set();

  activities.forEach((activity) => {
    const nextName = String(activity?.actor_name || activity?.actor_email || "").trim();
    if (!nextName || seen.has(nextName)) {
      return;
    }

    seen.add(nextName);
    names.push(nextName);
  });

  return names.slice(0, limit);
};

const joinNames = (names = []) => {
  if (names.length <= 1) {
    return names[0] || "A friend";
  }

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  }

  return `${names[0]}, ${names[1]}, and ${names.length - 2} others`;
};

export const buildFriendActivityLabel = (activities = []) => {
  const latest = activities[0];
  if (!latest) {
    return "";
  }

  const names = getUniqueNames(activities);
  const lead = joinNames(names);

  switch (latest.activity_type) {
    case "liked":
      return `${lead} liked this`;
    case "rated":
      return latest.rating_value
        ? `${lead} rated this ${latest.rating_value}/5`
        : `${lead} rated this`;
    case "watchlist_added":
      return `${lead} added this to My List`;
    case "watch_started":
      return `${lead} started watching`;
    case "commented":
      return `${lead} commented on this`;
    default:
      return `${lead} interacted with this`;
  }
};

export const getRatingEntry = async ({ tmdbId, mediaType, profile }) => {
  const filters = {
    tmdb_id: Number(tmdbId),
    media_type: mediaType,
  };

  if (profile?.id) {
    filters.profile_id = profile.id;
  }

  const rows = await base44.entities.Rating.filter(filters).catch(() => []);
  return rows[0] || null;
};

export const listTitleRatings = async ({ tmdbId, mediaType, limit = 40 } = {}) =>
  base44.social.listTitleRatings(Number(tmdbId), mediaType, limit);

export const listTitleComments = async ({ tmdbId, mediaType, limit = 60 } = {}) =>
  base44.social.listTitleComments(Number(tmdbId), mediaType, limit);

export const listGlobalSocialFeed = async ({ limit = 60 } = {}) => {
  const [activities, comments] = await Promise.all([
    base44.social.listGlobalActivity(limit).catch(() => []),
    base44.social.listGlobalComments(Math.ceil(limit / 2)).catch(() => []),
  ]);

  return [
    ...activities
      .filter((entry) => entry.activity_type !== "commented")
      .map((entry) => ({ ...entry, feed_type: entry.activity_type || "activity" })),
    ...comments.map((entry) => ({ ...entry, feed_type: "comment", activity_type: "comment" })),
  ]
    .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))
    .slice(0, limit);
};

export const saveRating = async ({ user, profile, item, mediaType, ratingValue, reviewText = "" }) => {
  const numericRating = Number(ratingValue);
  const identity = getMediaIdentity(item, mediaType);

  if (!user || !identity.tmdb_id || numericRating < 1 || numericRating > 5) {
    throw new Error("Invalid rating payload.");
  }

  const titlePayload = buildTitlePayload({ item, mediaType, profile });
  const existing = await getRatingEntry({
    tmdbId: identity.tmdb_id,
    mediaType: identity.media_type,
    profile,
  });
  const payload = {
    ...titlePayload,
    actor_email: normalizeEmail(user.email),
    actor_name: user.full_name || user.email || "Subflix Member",
    actor_avatar_url: getActorAvatarUrl({ user, profile }),
    rating_value: numericRating,
    review_text: reviewText || "",
  };

  const entry = existing?.id
    ? await base44.entities.Rating.update(existing.id, payload)
    : await base44.entities.Rating.create(payload);

  await base44.social.logActivity({
    ...titlePayload,
    activity_type: "rated",
    rating_value: numericRating,
    actor_avatar_url: getActorAvatarUrl({ user, profile }),
    activity_message: `${user.full_name || user.email || "A friend"} rated this ${numericRating}/5`,
  }).catch(() => null);

  dispatchSocialChanged({
    scope: "rating",
    action: existing?.id ? "updated" : "created",
    rating: entry,
  });

  return entry;
};

export const saveComment = async ({ user, profile, item, mediaType, commentText }) => {
  const text = String(commentText || "").trim();
  const identity = getMediaIdentity(item, mediaType);

  if (!user || !identity.tmdb_id || !text) {
    throw new Error("A comment is required.");
  }

  const titlePayload = buildTitlePayload({ item, mediaType, profile });
  const entry = await base44.entities.Comment.create({
    ...titlePayload,
    actor_email: normalizeEmail(user.email),
    actor_name: user.full_name || user.email || "Subflix Member",
    actor_avatar_url: getActorAvatarUrl({ user, profile }),
    comment_text: text,
  });

  await base44.social.logActivity({
    ...titlePayload,
    activity_type: "commented",
    actor_avatar_url: getActorAvatarUrl({ user, profile }),
    activity_message: `${user.full_name || user.email || "A friend"} commented on this`,
    metadata: {
      comment_id: entry?.id || null,
      comment_text: text.slice(0, 240),
    },
  }).catch(() => null);

  dispatchSocialChanged({
    scope: "comment",
    action: "created",
    comment: entry,
  });

  return entry;
};

export const deleteComment = async (id) => {
  await base44.entities.Comment.delete(id);
  dispatchSocialChanged({
    scope: "comment",
    action: "deleted",
    commentId: id,
  });
  return true;
};

export const clearRating = async ({ tmdbId, mediaType, profile }) => {
  const existing = await getRatingEntry({ tmdbId, mediaType, profile });
  if (!existing?.id) {
    return false;
  }

  await base44.entities.Rating.delete(existing.id);
  dispatchSocialChanged({
    scope: "rating",
    action: "deleted",
    tmdb_id: Number(tmdbId),
    media_type: mediaType,
  });
  return true;
};

export const listFriends = async () => base44.entities.Friendship.list("-updated_date", 100);

export const addFriend = async ({ user, email, name = "" }) => {
  const normalizedEmail = normalizeEmail(email);
  if (!user || !normalizedEmail) {
    throw new Error("A valid email address is required.");
  }

  if (normalizedEmail === normalizeEmail(user.email)) {
    throw new Error("You cannot add yourself as a friend.");
  }

  const existing = await base44.entities.Friendship.filter({ friend_email: normalizedEmail }).catch(() => []);
  const payload = {
    friend_email: normalizedEmail,
    friend_name: String(name || "").trim() || null,
    status: "accepted",
  };

  const entry = existing[0]?.id
    ? await base44.entities.Friendship.update(existing[0].id, payload)
    : await base44.entities.Friendship.create(payload);

  dispatchSocialChanged({
    scope: "friendships",
    action: existing[0]?.id ? "updated" : "created",
    friendship: entry,
  });

  return entry;
};

export const removeFriend = async (id) => {
  await base44.entities.Friendship.delete(id);
  dispatchSocialChanged({
    scope: "friendships",
    action: "deleted",
    friendshipId: id,
  });
  return true;
};

export const logSocialActivity = async ({ user, profile, item, mediaType, activityType, ratingValue = null, message = "" }) => {
  if (!user) {
    return null;
  }

  const identity = getMediaIdentity(item, mediaType);
  if (!identity.tmdb_id) {
    return null;
  }

  const titlePayload = buildTitlePayload({ item, mediaType, profile });
  const entry = await base44.social.logActivity({
    ...titlePayload,
    activity_type: activityType,
    rating_value: ratingValue,
    actor_avatar_url: getActorAvatarUrl({ user, profile }),
    activity_message: message || null,
  }).catch(() => null);

  if (entry) {
    dispatchSocialChanged({
      scope: "activity",
      action: "upserted",
      activity: entry,
    });
  }

  return entry;
};

export const buildFriendActivityItems = (activities = [], activeProfile) => {
  const grouped = new Map();

  activities.forEach((activity) => {
    const key = `${activity.media_type}:${activity.tmdb_id}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(activity);
  });

  const items = [...grouped.values()].map((group) => {
    const sortedGroup = [...group].sort((a, b) =>
      String(b.updated_at || "").localeCompare(String(a.updated_at || ""))
    );
    const latest = sortedGroup[0];

    return {
      id: latest.tmdb_id,
      tmdb_id: latest.tmdb_id,
      media_type: latest.media_type,
      title: latest.title,
      poster_path: latest.poster_path,
      backdrop_path: latest.backdrop_path,
      vote_average: latest.vote_average,
      release_date: latest.release_date,
      overview: latest.overview,
      genre_ids: latest.genre_ids || [],
      adult: Boolean(latest.is_adult),
      updated_at: latest.updated_at,
      social_reason: buildFriendActivityLabel(sortedGroup),
      social_actor_names: getUniqueNames(sortedGroup, 4),
      social_count: sortedGroup.length,
    };
  });

  return filterItemsForProfile(items, activeProfile).sort((a, b) =>
    String(b.updated_at || "").localeCompare(String(a.updated_at || ""))
  );
};

export const listFriendActivityItems = async ({ activeProfile, limit = 12 } = {}) => {
  const activities = await base44.social.listFriendActivity(limit * 4).catch(() => []);
  return buildFriendActivityItems(activities, activeProfile).slice(0, limit);
};

export const getTitleFriendSignals = async ({ tmdbId, mediaType, limit = 3 } = {}) => {
  const activities = await base44.social
    .listTitleFriendActivity(Number(tmdbId), mediaType, Math.max(limit * 3, 12))
    .catch(() => []);
  const names = getUniqueNames(activities, limit);

  return {
    activities,
    names,
    summary: buildFriendActivityLabel(activities),
  };
};

export const getTitleSocialSummary = async ({ tmdbId, mediaType, limit = 40 } = {}) => {
  const [ratings, comments, activities] = await Promise.all([
    listTitleRatings({ tmdbId, mediaType, limit }).catch(() => []),
    listTitleComments({ tmdbId, mediaType, limit }).catch(() => []),
    base44.social.listTitleActivity(Number(tmdbId), mediaType, limit).catch(() => []),
  ]);
  const averageRating = ratings.length
    ? ratings.reduce((sum, entry) => sum + Number(entry.rating_value || 0), 0) / ratings.length
    : 0;

  return {
    activities,
    comments,
    ratings,
    averageRating,
    ratingCount: ratings.length,
    commentCount: comments.length,
  };
};

const getActorAvatarUrl = ({ user, profile }) =>
  profile?.avatar_asset_url || profile?.avatar_url || user?.image_url || null;
