import { getSupabaseAdminClient, getSupabaseReadClient } from "@/lib/supabase";
import type {
  CatalogUnavailableReason,
  MediaType,
  ProfileRecord,
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

function mapSupabaseReadiness(message: string): CatalogUnavailableReason | null {
  if (message.includes("public.profiles")) {
    return "missing-profiles-table";
  }

  return null;
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

  return data.map((record) => ({
    profileId: String(record.profile_id),
    mediaId: Number(record.media_id),
    mediaType: record.media_type as MediaType,
    seasonNumber: record.season_number ?? undefined,
    episodeNumber: record.episode_number ?? undefined,
    progressSeconds: Number(record.progress_seconds),
    updatedAt: String(record.updated_at),
  }));
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
