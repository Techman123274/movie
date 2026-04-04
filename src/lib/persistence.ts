import { getSupabaseAdminClient, getSupabaseReadClient } from "@/lib/supabase";
import { buildWatchHref } from "@/lib/utils";
import type {
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

const WATCH_HISTORY_DEDUPE_WINDOW_MS = 1000 * 60 * 30;

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
