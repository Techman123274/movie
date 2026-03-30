import { getRecentWatchHistory, getResumeTargets } from "@/lib/persistence";
import { getMediaSummariesByIds } from "@/lib/tmdb";
import { formatEpisodeLabel } from "@/lib/utils";
import type { MediaRail, MediaSummary, ResumeTarget, WatchHistoryRecord } from "@/lib/types";

function buildMediaKey(mediaType: string, mediaId: number) {
  return `${mediaType}-${mediaId}`;
}

function enrichItemsWithWatchState(
  items: MediaSummary[],
  records: Array<ResumeTarget | WatchHistoryRecord>,
  actionLabel: string,
  contextPrefix: string,
) {
  const recordMap = new Map(records.map((record) => [buildMediaKey(record.mediaType, record.mediaId), record]));

  return items.map((item) => {
    const record = recordMap.get(buildMediaKey(item.mediaType, item.id));
    const episodeLabel = formatEpisodeLabel(record?.seasonNumber, record?.episodeNumber);

    return {
      ...item,
      hrefOverride: record?.watchHref ?? item.hrefOverride,
      actionLabel,
      contextLabel: episodeLabel ? `${contextPrefix} ${episodeLabel}` : contextPrefix,
    };
  });
}

export async function getPersonalizedRails(profileId: string): Promise<{
  continueWatchingRail: MediaRail | null;
  recentlyWatchedRail: MediaRail | null;
  continueWatchingCount: number;
  recentlyWatchedCount: number;
}> {
  const [resumeTargets, recentHistory] = await Promise.all([
    getResumeTargets(profileId),
    getRecentWatchHistory(profileId),
  ]);

  const resumeKeys = new Set(resumeTargets.map((record) => buildMediaKey(record.mediaType, record.mediaId)));
  const distinctHistory = recentHistory.filter((record) => !resumeKeys.has(buildMediaKey(record.mediaType, record.mediaId)));

  const [resumeItems, recentItems] = await Promise.all([
    getMediaSummariesByIds(
      resumeTargets.map((record) => ({
        mediaType: record.mediaType,
        mediaId: record.mediaId,
      })),
    ),
    getMediaSummariesByIds(
      distinctHistory.map((record) => ({
        mediaType: record.mediaType,
        mediaId: record.mediaId,
      })),
    ),
  ]);

  return {
    continueWatchingRail: resumeItems.length
      ? {
          id: "continue-watching",
          title: "Continue Watching",
          eyebrow: "Profile aware",
          items: enrichItemsWithWatchState(resumeItems, resumeTargets, "Resume", "In progress"),
        }
      : null,
    recentlyWatchedRail: recentItems.length
      ? {
          id: "recently-watched",
          title: "Recently Watched",
          eyebrow: "Picked up recently",
          items: enrichItemsWithWatchState(recentItems, distinctHistory, "Watch again", "Recently watched"),
        }
      : null,
    continueWatchingCount: resumeTargets.length,
    recentlyWatchedCount: recentHistory.length,
  };
}
