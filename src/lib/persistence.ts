import { getSupabaseAdminClient, getSupabaseReadClient } from "@/lib/supabase";
import { buildWatchHref } from "@/lib/utils";
import type {
  AdminSupportAccountSummary,
  AdminSupportCounts,
  AdminSupportProfileDetail,
  AdminSupportProfileSummary,
  CatalogUnavailableReason,
  FeedbackValue,
  MediaType,
  ProfileFeedbackRecord,
  ProfileRecord,
  ResumeTarget,
  WatchHistoryRecord,
  WatchProgressRecord,
  WatchlistRecord,
} from "@/lib/types";

type ProfileInsert = {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  accent: string;
  maturity_rating: string;
  provider_region: string;
};

type AdminUserRow = {
  id: string;
  email: string | null;
  created_at: string;
};

type AdminProfileRow = {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  accent: string;
  maturity_rating: string;
  provider_region: string;
  created_at: string;
};

const WATCH_HISTORY_DEDUPE_WINDOW_MS = 1000 * 60 * 30;

const EMPTY_ADMIN_SUPPORT_COUNTS: AdminSupportCounts = {
  watchlist: 0,
  continueWatching: 0,
  history: 0,
  feedback: 0,
  likes: 0,
  dislikes: 0,
  notInterested: 0,
};

function mapProfile(profile: Record<string, unknown>): ProfileRecord {
  return {
    id: String(profile.id),
    userId: String(profile.user_id),
    name: String(profile.name),
    avatar: String(profile.avatar),
    accent: String(profile.accent),
    maturityRating: String(profile.maturity_rating),
    providerRegion: String(profile.provider_region || "US"),
  };
}

function createEmptyAdminSupportCounts(): AdminSupportCounts {
  return { ...EMPTY_ADMIN_SUPPORT_COUNTS };
}

function toTimestampOrNull(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function maxIsoTimestamp(current: string | null, next: string | null | undefined) {
  if (!next) {
    return current;
  }

  const currentTimestamp = toTimestampOrNull(current);
  const nextTimestamp = toTimestampOrNull(next);

  if (nextTimestamp === null) {
    return current;
  }

  if (currentTimestamp === null || nextTimestamp > currentTimestamp) {
    return next;
  }

  return current;
}

function createAdminProfileSummary(profile: AdminProfileRow): AdminSupportProfileSummary {
  return {
    id: profile.id,
    userId: profile.user_id,
    name: profile.name,
    avatar: profile.avatar,
    accent: profile.accent,
    maturityRating: profile.maturity_rating,
    providerRegion: profile.provider_region || "US",
    createdAt: profile.created_at,
    counts: createEmptyAdminSupportCounts(),
    lastActivityAt: null,
  };
}

function buildAdminSupportAccountSummaries(options: {
  users: AdminUserRow[];
  profiles: AdminProfileRow[];
  watchlistRows?: Array<{ profile_id: string; added_at?: string | null }>;
  progressRows?: Array<{ profile_id: string; updated_at?: string | null }>;
  historyRows?: Array<{ profile_id: string; watched_at?: string | null }>;
  feedbackRows?: Array<{ profile_id: string; value: FeedbackValue; updated_at?: string | null }>;
}) {
  const profilesById = new Map<string, AdminSupportProfileSummary>();

  for (const profile of options.profiles) {
    profilesById.set(profile.id, createAdminProfileSummary(profile));
  }

  for (const row of options.watchlistRows ?? []) {
    const profile = profilesById.get(row.profile_id);

    if (!profile) {
      continue;
    }

    profile.counts.watchlist += 1;
    profile.lastActivityAt = maxIsoTimestamp(profile.lastActivityAt, row.added_at ?? null);
  }

  for (const row of options.progressRows ?? []) {
    const profile = profilesById.get(row.profile_id);

    if (!profile) {
      continue;
    }

    profile.counts.continueWatching += 1;
    profile.lastActivityAt = maxIsoTimestamp(profile.lastActivityAt, row.updated_at ?? null);
  }

  for (const row of options.historyRows ?? []) {
    const profile = profilesById.get(row.profile_id);

    if (!profile) {
      continue;
    }

    profile.counts.history += 1;
    profile.lastActivityAt = maxIsoTimestamp(profile.lastActivityAt, row.watched_at ?? null);
  }

  for (const row of options.feedbackRows ?? []) {
    const profile = profilesById.get(row.profile_id);

    if (!profile) {
      continue;
    }

    profile.counts.feedback += 1;

    if (row.value === "like") {
      profile.counts.likes += 1;
    } else if (row.value === "dislike") {
      profile.counts.dislikes += 1;
    } else {
      profile.counts.notInterested += 1;
    }

    profile.lastActivityAt = maxIsoTimestamp(profile.lastActivityAt, row.updated_at ?? null);
  }

  const profilesByUser = new Map<string, AdminSupportProfileSummary[]>();

  for (const profile of profilesById.values()) {
    const existing = profilesByUser.get(profile.userId) ?? [];
    existing.push(profile);
    profilesByUser.set(profile.userId, existing);
  }

  for (const profiles of profilesByUser.values()) {
    profiles.sort((left, right) => {
      const leftTimestamp = toTimestampOrNull(left.createdAt) ?? 0;
      const rightTimestamp = toTimestampOrNull(right.createdAt) ?? 0;
      return leftTimestamp - rightTimestamp;
    });
  }

  return options.users.map<AdminSupportAccountSummary>((user) => {
    const profiles = profilesByUser.get(user.id) ?? [];
    const totals = profiles.reduce<AdminSupportAccountSummary["totals"]>(
      (accumulator, profile) => ({
        profiles: accumulator.profiles + 1,
        watchlist: accumulator.watchlist + profile.counts.watchlist,
        continueWatching: accumulator.continueWatching + profile.counts.continueWatching,
        history: accumulator.history + profile.counts.history,
        feedback: accumulator.feedback + profile.counts.feedback,
        likes: accumulator.likes + profile.counts.likes,
        dislikes: accumulator.dislikes + profile.counts.dislikes,
        notInterested: accumulator.notInterested + profile.counts.notInterested,
      }),
      {
        profiles: 0,
        ...createEmptyAdminSupportCounts(),
      },
    );

    const lastActivityAt = profiles.reduce<string | null>(
      (latest, profile) => maxIsoTimestamp(latest, profile.lastActivityAt),
      null,
    );

    return {
      userId: user.id,
      email: user.email,
      createdAt: user.created_at,
      profiles,
      totals,
      lastActivityAt,
    };
  });
}

function mapSupabaseReadiness(message: string): CatalogUnavailableReason | null {
  if (message.includes("public.profiles")) {
    return "missing-profiles-table";
  }

  return null;
}

function mapWatchProgressRecord(record: Record<string, unknown>): WatchProgressRecord {
  const seasonNumber = typeof record.season_number === "number" ? record.season_number : undefined;
  const episodeNumber = typeof record.episode_number === "number" ? record.episode_number : undefined;

  return {
    profileId: String(record.profile_id),
    mediaId: Number(record.media_id),
    mediaType: record.media_type as MediaType,
    seasonNumber,
    episodeNumber,
    progressSeconds: Number(record.progress_seconds ?? 0),
    updatedAt: String(record.updated_at),
  };
}

function toResumeTarget(record: WatchProgressRecord): ResumeTarget {
  return {
    ...record,
    watchHref: buildWatchHref(record.mediaType, record.mediaId, record.seasonNumber, record.episodeNumber),
  };
}

function mapWatchHistoryRecord(record: Record<string, unknown>): WatchHistoryRecord {
  const mediaType = record.media_type as MediaType;
  const mediaId = Number(record.media_id);
  const seasonNumber = typeof record.season_number === "number" ? record.season_number : undefined;
  const episodeNumber = typeof record.episode_number === "number" ? record.episode_number : undefined;

  return {
    profileId: String(record.profile_id),
    mediaId,
    mediaType,
    seasonNumber,
    episodeNumber,
    watchedAt: String(record.watched_at),
    watchHref: buildWatchHref(mediaType, mediaId, seasonNumber, episodeNumber),
  };
}

function mapProfileFeedbackRecord(record: Record<string, unknown>): ProfileFeedbackRecord {
  return {
    profileId: String(record.profile_id),
    mediaId: Number(record.media_id),
    mediaType: record.media_type as MediaType,
    value: record.value as FeedbackValue,
    updatedAt: String(record.updated_at),
  };
}

export async function ensureAppUser(userId: string, email: string | null) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return {
      success: false as const,
      error: "Supabase service role key is not configured.",
    };
  }

  const { error } = await client.from("users").upsert(
    {
      id: userId,
      email,
    },
    { onConflict: "id" },
  );

  if (error) {
    return {
      success: false as const,
      error: error.message,
    };
  }

  return {
    success: true as const,
  };
}

export async function getProfilesForUser(userId: string): Promise<{
  profiles: ProfileRecord[];
  readinessIssue: CatalogUnavailableReason | null;
  rawError?: string;
}> {
  const client = getSupabaseReadClient();

  if (!client) {
    return { profiles: [], readinessIssue: "missing-supabase-config" };
  }

  const { data, error } = await client.from("profiles").select("*").eq("user_id", userId).order("created_at");

  if (error || !data) {
    return {
      profiles: [],
      readinessIssue: error ? mapSupabaseReadiness(error.message) : null,
      rawError: error?.message,
    };
  }

  return { profiles: data.map((profile) => mapProfile(profile)), readinessIssue: null };
}

export async function createProfileForUser(profile: ProfileInsert) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return { success: false as const, error: "Supabase service role key is not configured." };
  }

  const { error } = await client.from("profiles").insert(profile);

  if (error) {
    return {
      success: false as const,
      error: error.message,
      readinessIssue: mapSupabaseReadiness(error.message),
    };
  }

  return { success: true as const };
}

export async function updateProfileRegion(profileId: string, userId: string, providerRegion: string) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return { success: false as const, error: "Supabase service role key is not configured." };
  }

  const { error } = await client
    .from("profiles")
    .update({ provider_region: providerRegion.toUpperCase() })
    .eq("id", profileId)
    .eq("user_id", userId);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function updateProfileAvatar(profileId: string, userId: string, avatar: string) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return { success: false as const, error: "Supabase service role key is not configured." };
  }

  const { error } = await client
    .from("profiles")
    .update({ avatar })
    .eq("id", profileId)
    .eq("user_id", userId);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function getContinueWatching(profileId: string): Promise<WatchProgressRecord[]> {
  const client = getSupabaseReadClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("watch_progress")
    .select("*")
    .eq("profile_id", profileId)
    .order("updated_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((record) => mapWatchProgressRecord(record));
}

export async function getResumeTargets(profileId: string): Promise<ResumeTarget[]> {
  const records = await getContinueWatching(profileId);
  return records.map((record) => toResumeTarget(record));
}

export async function getResumeTarget(profileId: string, mediaId: number, mediaType: MediaType): Promise<ResumeTarget | null> {
  const client = getSupabaseReadClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("watch_progress")
    .select("*")
    .eq("profile_id", profileId)
    .eq("media_id", mediaId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toResumeTarget(mapWatchProgressRecord(data));
}

export async function getRecentWatchHistory(profileId: string, limit = 8): Promise<WatchHistoryRecord[]> {
  const client = getSupabaseReadClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("watch_history")
    .select("*")
    .eq("profile_id", profileId)
    .order("watched_at", { ascending: false })
    .limit(Math.max(limit * 4, 24));

  if (error || !data) {
    return [];
  }

  const uniqueHistory = new Map<string, WatchHistoryRecord>();

  for (const record of data) {
    const historyRecord = mapWatchHistoryRecord(record);
    const key = `${historyRecord.mediaType}-${historyRecord.mediaId}`;

    if (!uniqueHistory.has(key)) {
      uniqueHistory.set(key, historyRecord);
    }

    if (uniqueHistory.size >= limit) {
      break;
    }
  }

  return Array.from(uniqueHistory.values());
}

export async function getWatchlist(profileId: string): Promise<WatchlistRecord[]> {
  const client = getSupabaseReadClient();

  if (!client) {
    return [];
  }

  const { data, error } = await client
    .from("watchlists")
    .select("*")
    .eq("profile_id", profileId)
    .order("added_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((record) => ({
    profileId: String(record.profile_id),
    mediaId: Number(record.media_id),
    mediaType: record.media_type as MediaType,
    addedAt: String(record.added_at),
  }));
}

export async function getProfileFeedbackMap(profileId: string) {
  const client = getSupabaseReadClient();

  if (!client) {
    return new Map<string, ProfileFeedbackRecord>();
  }

  const { data, error } = await client
    .from("profile_feedback")
    .select("*")
    .eq("profile_id", profileId);

  if (error || !data) {
    return new Map<string, ProfileFeedbackRecord>();
  }

  return new Map(
    data.map((record) => {
      const mapped = mapProfileFeedbackRecord(record);
      return [`${mapped.mediaType}-${mapped.mediaId}`, mapped] as const;
    }),
  );
}

export async function getProfileFeedback(profileId: string, mediaId: number, mediaType: MediaType) {
  const client = getSupabaseReadClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("profile_feedback")
    .select("*")
    .eq("profile_id", profileId)
    .eq("media_id", mediaId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfileFeedbackRecord(data);
}

export async function isInWatchlist(profileId: string, mediaId: number, mediaType: MediaType) {
  const client = getSupabaseReadClient();

  if (!client) {
    return false;
  }

  const { data, error } = await client
    .from("watchlists")
    .select("id")
    .eq("profile_id", profileId)
    .eq("media_id", mediaId)
    .eq("media_type", mediaType)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function toggleWatchlist(profileId: string, mediaId: number, mediaType: MediaType) {
  const admin = getSupabaseAdminClient();
  const read = getSupabaseReadClient();

  if (!admin || !read) {
    return { success: false as const, error: "Supabase is not fully configured." };
  }

  const { data: existing } = await read
    .from("watchlists")
    .select("id")
    .eq("profile_id", profileId)
    .eq("media_id", mediaId)
    .eq("media_type", mediaType)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin.from("watchlists").delete().eq("id", existing.id);

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const, state: "removed" as const };
  }

  const { error } = await admin.from("watchlists").insert({
    profile_id: profileId,
    media_id: mediaId,
    media_type: mediaType,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, state: "added" as const };
}

export async function setProfileFeedback(options: {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  value: FeedbackValue | null;
}) {
  const admin = getSupabaseAdminClient();
  const read = getSupabaseReadClient();

  if (!admin || !read) {
    return { success: false as const, error: "Supabase is not fully configured." };
  }

  const { data: existing } = await read
    .from("profile_feedback")
    .select("id")
    .eq("profile_id", options.profileId)
    .eq("media_id", options.mediaId)
    .eq("media_type", options.mediaType)
    .maybeSingle();

  if (!options.value) {
    if (!existing?.id) {
      return { success: true as const };
    }

    const { error } = await admin.from("profile_feedback").delete().eq("id", existing.id);

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const };
  }

  const payload = {
    profile_id: options.profileId,
    media_id: options.mediaId,
    media_type: options.mediaType,
    value: options.value,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await admin.from("profile_feedback").update(payload).eq("id", existing.id);

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const };
  }

  const { error } = await admin.from("profile_feedback").insert(payload);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function getProfileForUser(profileId: string, userId: string): Promise<ProfileRecord | null> {
  const client = getSupabaseAdminClient();

  if (!client) {
    return null;
  }

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapProfile(data);
}

export async function getAdminSupportAccounts(limit = 120): Promise<{
  accounts: AdminSupportAccountSummary[];
  error?: string;
}> {
  const client = getSupabaseAdminClient();

  if (!client) {
    return {
      accounts: [],
      error: "Supabase service role key is not configured.",
    };
  }

  const [usersResult, profilesResult, watchlistsResult, progressResult, historyResult, feedbackResult] = await Promise.all([
    client.from("users").select("id, email, created_at").order("created_at", { ascending: false }).limit(limit),
    client
      .from("profiles")
      .select("id, user_id, name, avatar, accent, maturity_rating, provider_region, created_at")
      .order("created_at", { ascending: true }),
    client.from("watchlists").select("profile_id, added_at"),
    client.from("watch_progress").select("profile_id, updated_at"),
    client.from("watch_history").select("profile_id, watched_at"),
    client.from("profile_feedback").select("profile_id, value, updated_at"),
  ]);

  const error =
    usersResult.error ??
    profilesResult.error ??
    watchlistsResult.error ??
    progressResult.error ??
    historyResult.error ??
    feedbackResult.error;

  if (error) {
    return {
      accounts: [],
      error: error.message,
    };
  }

  return {
    accounts: buildAdminSupportAccountSummaries({
      users: (usersResult.data ?? []) as AdminUserRow[],
      profiles: (profilesResult.data ?? []) as AdminProfileRow[],
      watchlistRows: ((watchlistsResult.data ?? []) as Array<{ profile_id: string; added_at?: string | null }>),
      progressRows: ((progressResult.data ?? []) as Array<{ profile_id: string; updated_at?: string | null }>),
      historyRows: ((historyResult.data ?? []) as Array<{ profile_id: string; watched_at?: string | null }>),
      feedbackRows: ((feedbackResult.data ?? []) as Array<{
        profile_id: string;
        value: FeedbackValue;
        updated_at?: string | null;
      }>),
    }),
  };
}

export async function getAdminSupportProfileDetail(
  userId: string,
  requestedProfileId?: string,
): Promise<{
  account: AdminSupportAccountSummary | null;
  detail: AdminSupportProfileDetail | null;
  error?: string;
}> {
  const client = getSupabaseAdminClient();

  if (!client) {
    return {
      account: null,
      detail: null,
      error: "Supabase service role key is not configured.",
    };
  }

  const userResult = await client.from("users").select("id, email, created_at").eq("id", userId).maybeSingle();

  if (userResult.error) {
    return {
      account: null,
      detail: null,
      error: userResult.error.message,
    };
  }

  if (!userResult.data) {
    return {
      account: null,
      detail: null,
    };
  }

  const profilesResult = await client
    .from("profiles")
    .select("id, user_id, name, avatar, accent, maturity_rating, provider_region, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (profilesResult.error) {
    return {
      account: null,
      detail: null,
      error: profilesResult.error.message,
    };
  }

  const profiles = (profilesResult.data ?? []) as AdminProfileRow[];
  const profileIds = profiles.map((profile) => profile.id);

  const [watchlistsResult, progressResult, historyResult, feedbackResult] = profileIds.length
    ? await Promise.all([
        client.from("watchlists").select("profile_id, added_at").in("profile_id", profileIds),
        client.from("watch_progress").select("profile_id, updated_at").in("profile_id", profileIds),
        client.from("watch_history").select("profile_id, watched_at").in("profile_id", profileIds),
        client.from("profile_feedback").select("profile_id, value, updated_at").in("profile_id", profileIds),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];

  const summaryError =
    watchlistsResult.error ?? progressResult.error ?? historyResult.error ?? feedbackResult.error;

  if (summaryError) {
    return {
      account: null,
      detail: null,
      error: summaryError.message,
    };
  }

  const account = buildAdminSupportAccountSummaries({
    users: [userResult.data as AdminUserRow],
    profiles,
    watchlistRows: ((watchlistsResult.data ?? []) as Array<{ profile_id: string; added_at?: string | null }>),
    progressRows: ((progressResult.data ?? []) as Array<{ profile_id: string; updated_at?: string | null }>),
    historyRows: ((historyResult.data ?? []) as Array<{ profile_id: string; watched_at?: string | null }>),
    feedbackRows: ((feedbackResult.data ?? []) as Array<{
      profile_id: string;
      value: FeedbackValue;
      updated_at?: string | null;
    }>),
  })[0] ?? null;

  if (!account || account.profiles.length === 0) {
    return {
      account,
      detail: {
        selectedProfileId: null,
        continueWatching: [],
        watchlist: [],
        history: [],
        feedback: [],
      },
    };
  }

  const selectedProfileId =
    account.profiles.find((profile) => profile.id === requestedProfileId)?.id ??
    account.profiles[0]?.id ??
    null;

  if (!selectedProfileId) {
    return {
      account,
      detail: {
        selectedProfileId: null,
        continueWatching: [],
        watchlist: [],
        history: [],
        feedback: [],
      },
    };
  }

  const [detailProgressResult, detailWatchlistResult, detailHistoryResult, detailFeedbackResult] = await Promise.all([
    client.from("watch_progress").select("*").eq("profile_id", selectedProfileId).order("updated_at", { ascending: false }).limit(12),
    client.from("watchlists").select("*").eq("profile_id", selectedProfileId).order("added_at", { ascending: false }).limit(12),
    client.from("watch_history").select("*").eq("profile_id", selectedProfileId).order("watched_at", { ascending: false }).limit(12),
    client.from("profile_feedback").select("*").eq("profile_id", selectedProfileId).order("updated_at", { ascending: false }).limit(12),
  ]);

  const detailError =
    detailProgressResult.error ??
    detailWatchlistResult.error ??
    detailHistoryResult.error ??
    detailFeedbackResult.error;

  if (detailError) {
    return {
      account,
      detail: null,
      error: detailError.message,
    };
  }

  return {
    account,
    detail: {
      selectedProfileId,
      continueWatching: (detailProgressResult.data ?? []).map((record) => mapWatchProgressRecord(record)),
      watchlist: (detailWatchlistResult.data ?? []).map((record) => ({
        profileId: String(record.profile_id),
        mediaId: Number(record.media_id),
        mediaType: record.media_type as MediaType,
        addedAt: String(record.added_at),
      })),
      history: (detailHistoryResult.data ?? []).map((record) => mapWatchHistoryRecord(record)),
      feedback: (detailFeedbackResult.data ?? []).map((record) => mapProfileFeedbackRecord(record)),
    },
  };
}

async function upsertWatchProgress(record: {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
  progressSeconds?: number;
}) {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return { success: false as const, error: "Supabase service role key is not configured." };
  }

  const { data: existing, error: selectError } = await admin
    .from("watch_progress")
    .select("id, progress_seconds")
    .eq("profile_id", record.profileId)
    .eq("media_id", record.mediaId)
    .eq("media_type", record.mediaType)
    .maybeSingle();

  if (selectError) {
    return { success: false as const, error: selectError.message };
  }

  const nextProgressSeconds = Math.max(
    Number(existing?.progress_seconds ?? 0),
    Math.max(0, Math.floor(record.progressSeconds ?? 0)),
  );

  const payload = {
    profile_id: record.profileId,
    media_id: record.mediaId,
    media_type: record.mediaType,
    season_number: record.seasonNumber ?? null,
    episode_number: record.episodeNumber ?? null,
    progress_seconds: nextProgressSeconds,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await admin.from("watch_progress").update(payload).eq("id", existing.id);

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const, progressSeconds: nextProgressSeconds };
  }

  const { error } = await admin.from("watch_progress").insert(payload);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const, progressSeconds: nextProgressSeconds };
}

async function touchWatchHistory(record: {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
}) {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return { success: false as const, error: "Supabase service role key is not configured." };
  }

  let query = admin
    .from("watch_history")
    .select("id, watched_at")
    .eq("profile_id", record.profileId)
    .eq("media_id", record.mediaId)
    .eq("media_type", record.mediaType)
    .order("watched_at", { ascending: false })
    .limit(1);

  query =
    record.seasonNumber === undefined ? query.is("season_number", null) : query.eq("season_number", record.seasonNumber);
  query =
    record.episodeNumber === undefined
      ? query.is("episode_number", null)
      : query.eq("episode_number", record.episodeNumber);

  const { data: matches, error: selectError } = await query;

  if (selectError) {
    return { success: false as const, error: selectError.message };
  }

  const nowIso = new Date().toISOString();
  const latestMatch = matches?.[0];

  if (latestMatch?.id && latestMatch.watched_at) {
    const lastWatchedAt = new Date(String(latestMatch.watched_at)).getTime();

    if (Number.isFinite(lastWatchedAt) && Date.now() - lastWatchedAt < WATCH_HISTORY_DEDUPE_WINDOW_MS) {
      const { error } = await admin
        .from("watch_history")
        .update({ watched_at: nowIso })
        .eq("id", latestMatch.id);

      if (error) {
        return { success: false as const, error: error.message };
      }

      return { success: true as const };
    }
  }

  const { error } = await admin.from("watch_history").insert({
    profile_id: record.profileId,
    media_id: record.mediaId,
    media_type: record.mediaType,
    season_number: record.seasonNumber ?? null,
    episode_number: record.episodeNumber ?? null,
    watched_at: nowIso,
  });

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function recordWatchStart(record: {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
}) {
  const progressResult = await upsertWatchProgress(record);

  if (!progressResult.success) {
    return progressResult;
  }

  return touchWatchHistory(record);
}

export async function recordWatchProgress(record: {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
  progressSeconds: number;
}) {
  return upsertWatchProgress(record);
}

export async function clearWatchProgress(record: {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
}) {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return { success: false as const, error: "Supabase service role key is not configured." };
  }

  const { error } = await admin
    .from("watch_progress")
    .delete()
    .eq("profile_id", record.profileId)
    .eq("media_id", record.mediaId)
    .eq("media_type", record.mediaType);

  if (error) {
    return { success: false as const, error: error.message };
  }

  return { success: true as const };
}

export async function completeWatch(record: {
  profileId: string;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
}) {
  const historyResult = await touchWatchHistory(record);

  if (!historyResult.success) {
    return historyResult;
  }

  return clearWatchProgress(record);
}
