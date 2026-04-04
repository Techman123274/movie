import { getProfileFeedbackMap, getRecentWatchHistory, getWatchlist } from "@/lib/persistence";
import { getMediaSummariesByIds } from "@/lib/tmdb";
import type { MediaSummary, ProfileRecord } from "@/lib/types";

function buildMediaKey(mediaType: "movie" | "tv", mediaId: number) {
  return `${mediaType}-${mediaId}`;
}

type HouseholdProfileHighlight = {
  id: string;
  name: string;
  avatar: string;
  accent: string;
  watchlistCount: number;
  likedCount: number;
  latestTitle: string | null;
  latestHref: string | null;
  note: string;
  isActive: boolean;
};

export type HouseholdSocialState = {
  headline: string;
  description: string;
  sharedQueueCount: number;
  totalLikes: number;
  activeProfiles: number;
  spotlightTitles: MediaSummary[];
  profileHighlights: HouseholdProfileHighlight[];
};

export async function getHouseholdSocialState(
  profiles: ProfileRecord[],
  activeProfileId: string | null,
): Promise<HouseholdSocialState | null> {
  if (!profiles.length) {
    return null;
  }

  const householdRecords = await Promise.all(
    profiles.map(async (profile) => {
      const [watchlist, recent, feedbackMap] = await Promise.all([
        getWatchlist(profile.id),
        getRecentWatchHistory(profile.id, 2),
        getProfileFeedbackMap(profile.id),
      ]);

      const likedCount = Array.from(feedbackMap.values()).filter((value) => value.value === "like").length;

      return {
        profile,
        watchlist,
        recent,
        likedCount,
      };
    }),
  );

  const watchlistOverlap = new Map<string, { mediaType: "movie" | "tv"; mediaId: number; count: number }>();
  const summaryRefs = new Map<string, { mediaType: "movie" | "tv"; mediaId: number }>();

  for (const record of householdRecords) {
    for (const watchlistEntry of record.watchlist) {
      const key = buildMediaKey(watchlistEntry.mediaType, watchlistEntry.mediaId);
      watchlistOverlap.set(key, {
        mediaType: watchlistEntry.mediaType,
        mediaId: watchlistEntry.mediaId,
        count: (watchlistOverlap.get(key)?.count ?? 0) + 1,
      });
      summaryRefs.set(key, { mediaType: watchlistEntry.mediaType, mediaId: watchlistEntry.mediaId });
    }

    const latestRecord = record.recent[0] ?? record.watchlist[0];

    if (latestRecord) {
      summaryRefs.set(buildMediaKey(latestRecord.mediaType, latestRecord.mediaId), {
        mediaType: latestRecord.mediaType,
        mediaId: latestRecord.mediaId,
      });
    }
  }

  const spotlightRefs = Array.from(watchlistOverlap.values())
    .filter((entry) => entry.count > 1)
    .sort((left, right) => right.count - left.count)
    .slice(0, 8)
    .map((entry) => ({
      mediaType: entry.mediaType,
      mediaId: entry.mediaId,
    }));

  const fallbackRefs =
    spotlightRefs.length > 0
      ? []
      : householdRecords
          .map((record) => record.recent[0] ?? record.watchlist[0] ?? null)
          .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
          .map((entry) => ({
            mediaType: entry.mediaType,
            mediaId: entry.mediaId,
          }))
          .filter(
            (entry, index, records) =>
              records.findIndex(
                (candidate) =>
                  buildMediaKey(candidate.mediaType, candidate.mediaId) === buildMediaKey(entry.mediaType, entry.mediaId),
              ) === index,
          )
          .slice(0, 8);

  const summaries = await getMediaSummariesByIds(Array.from(summaryRefs.values()));
  const summaryMap = new Map(summaries.map((summary) => [buildMediaKey(summary.mediaType, summary.id), summary]));
  const spotlightTitles = (spotlightRefs.length ? spotlightRefs : fallbackRefs)
    .map((entry) => summaryMap.get(buildMediaKey(entry.mediaType, entry.mediaId)))
    .filter((value): value is MediaSummary => Boolean(value));

  const profileHighlights = householdRecords.map((record) => {
    const latestRecord = record.recent[0] ?? record.watchlist[0];
    const latestSummary = latestRecord
      ? summaryMap.get(buildMediaKey(latestRecord.mediaType, latestRecord.mediaId))
      : null;
    const note = latestSummary
      ? `Most recently orbiting around ${latestSummary.title}. ${record.likedCount > 0 ? `${record.likedCount} likes are shaping this lane.` : `${record.watchlist.length} titles are queued up next.`}`
      : record.watchlist.length
        ? `${record.watchlist.length} titles are saved and ready for the next night in.`
        : "Fresh profile energy. Start saving titles to give this lane some personality.";

    return {
      id: record.profile.id,
      name: record.profile.name,
      avatar: record.profile.avatar,
      accent: record.profile.accent,
      watchlistCount: record.watchlist.length,
      likedCount: record.likedCount,
      latestTitle: latestSummary?.title ?? null,
      latestHref: latestSummary ? `/${latestSummary.mediaType}/${latestSummary.id}` : null,
      note,
      isActive: record.profile.id === activeProfileId,
    };
  });

  const sharedQueueCount = spotlightRefs.length;
  const totalLikes = householdRecords.reduce((sum, record) => sum + record.likedCount, 0);
  const activeProfiles = householdRecords.filter(
    (record) => record.watchlist.length > 0 || record.recent.length > 0 || record.likedCount > 0,
  ).length;

  return {
    headline:
      sharedQueueCount > 0
        ? `${sharedQueueCount} title${sharedQueueCount === 1 ? "" : "s"} are already crossing profiles.`
        : profiles.length > 1
          ? "This household is building a taste profile of its own."
          : "This profile is ready to become the center of movie night.",
    description:
      sharedQueueCount > 0
        ? "Shared saves and recent activity are starting to overlap, which makes the app feel less solitary and a lot more ready for group picks."
        : "Profiles, reactions, and saved titles now create a social layer that makes discovery feel more alive, even before a queue starts overlapping.",
    sharedQueueCount,
    totalLikes,
    activeProfiles,
    spotlightTitles,
    profileHighlights,
  };
}
