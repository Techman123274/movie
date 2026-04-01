import {
  getProfileFeedbackMap,
  getRecentWatchHistory,
  getResumeTargets,
  getWatchlist,
} from "@/lib/persistence";
import {
  discoverByGenres,
  getMediaSummariesByIds,
  getRecommendedTitlesFromSeeds,
} from "@/lib/tmdb";
import { formatEpisodeLabel } from "@/lib/utils";
import type { MediaRail, MediaSummary, ResumeTarget, WatchHistoryRecord, WatchlistRecord } from "@/lib/types";

function buildMediaKey(mediaType: string, mediaId: number) {
  return `${mediaType}-${mediaId}`;
}

function buildRefList(records: Array<{ mediaType: "movie" | "tv"; mediaId: number }>) {
  return records.map((record) => ({
    mediaType: record.mediaType,
    mediaId: record.mediaId,
  }));
}

function getProgressSeconds(record: ResumeTarget | WatchHistoryRecord | undefined) {
  return record && "progressSeconds" in record ? record.progressSeconds : undefined;
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
    const progressSeconds = getProgressSeconds(record);
    const minuteLabel =
      typeof progressSeconds === "number" && progressSeconds > 0
        ? `${Math.max(1, Math.floor(progressSeconds / 60))}m saved`
        : null;

    const detailBits = [contextPrefix];
    if (episodeLabel) {
      detailBits.push(episodeLabel);
    }
    if (minuteLabel) {
      detailBits.push(minuteLabel);
    }

    return {
      ...item,
      hrefOverride: record?.watchHref ?? item.hrefOverride,
      actionLabel,
      contextLabel: detailBits.join(" · "),
      progressSeconds,
    };
  });
}

function mergeFeedback(items: MediaSummary[], feedbackMap: Map<string, { value: string }>) {
  return items
    .filter((item) => feedbackMap.get(buildMediaKey(item.mediaType, item.id))?.value !== "not_interested")
    .map((item) => ({
      ...item,
      feedback: (feedbackMap.get(buildMediaKey(item.mediaType, item.id))?.value as MediaSummary["feedback"]) ?? null,
    }));
}

function countTopGenres(items: MediaSummary[]) {
  const genreCounts = new Map<number, number>();

  for (const item of items) {
    for (const genreId of item.genreIds ?? []) {
      genreCounts.set(genreId, (genreCounts.get(genreId) ?? 0) + 1);
    }
  }

  return Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genreId]) => genreId)
    .slice(0, 3);
}

function getAffinityMediaType(items: MediaSummary[]): "movie" | "tv" {
  const movieCount = items.filter((item) => item.mediaType === "movie").length;
  const tvCount = items.filter((item) => item.mediaType === "tv").length;

  return movieCount >= tvCount ? "movie" : "tv";
}

function buildWatchlistLookup(records: WatchlistRecord[]) {
  return new Set(records.map((record) => buildMediaKey(record.mediaType, record.mediaId)));
}

export async function getPersonalizedRails(profileId: string): Promise<{
  continueWatchingRail: MediaRail | null;
  recentlyWatchedRail: MediaRail | null;
  becauseYouWatchedRail: MediaRail | null;
  watchlistPicksRail: MediaRail | null;
  genreAffinityRail: MediaRail | null;
  continueWatchingCount: number;
  recentlyWatchedCount: number;
}> {
  const [resumeTargets, recentHistory, watchlist, feedbackMap] = await Promise.all([
    getResumeTargets(profileId),
    getRecentWatchHistory(profileId),
    getWatchlist(profileId),
    getProfileFeedbackMap(profileId),
  ]);

  const resumeKeys = new Set(resumeTargets.map((record) => buildMediaKey(record.mediaType, record.mediaId)));
  const distinctHistory = recentHistory.filter((record) => !resumeKeys.has(buildMediaKey(record.mediaType, record.mediaId)));
  const watchlistKeys = buildWatchlistLookup(watchlist);

  const [resumeItems, recentItems, watchlistItems] = await Promise.all([
    getMediaSummariesByIds(buildRefList(resumeTargets)),
    getMediaSummariesByIds(buildRefList(distinctHistory)),
    getMediaSummariesByIds(buildRefList(watchlist)),
  ]);

  const affinitySeeds = [...resumeItems, ...recentItems, ...watchlistItems];
  const topGenreIds = countTopGenres(affinitySeeds);

  const [becauseYouWatched, genreAffinity, watchlistPicks] = await Promise.all([
    getRecommendedTitlesFromSeeds(
      buildRefList([...resumeTargets, ...distinctHistory]),
      {
        exclude: [...buildRefList([...resumeTargets, ...distinctHistory]), ...buildRefList(watchlist)],
        limit: 12,
      },
    ),
    affinitySeeds.length
      ? discoverByGenres({
          mediaType: getAffinityMediaType(affinitySeeds),
          genreIds: topGenreIds,
          exclude: [...buildRefList([...resumeTargets, ...distinctHistory]), ...buildRefList(watchlist)],
          limit: 12,
        })
      : Promise.resolve([]),
    watchlistItems.length
      ? getRecommendedTitlesFromSeeds(buildRefList(watchlist).slice(0, 3), {
          exclude: [...buildRefList(watchlist), ...buildRefList([...resumeTargets, ...distinctHistory])],
          limit: 12,
        })
      : Promise.resolve([]),
  ]);

  const mergedResumeItems = mergeFeedback(resumeItems, feedbackMap);
  const mergedRecentItems = mergeFeedback(recentItems, feedbackMap);
  const mergedBecauseItems = mergeFeedback(becauseYouWatched, feedbackMap).filter(
    (item) => !watchlistKeys.has(buildMediaKey(item.mediaType, item.id)),
  );
  const mergedWatchlistPicks = mergeFeedback(watchlistPicks, feedbackMap);
  const mergedGenreAffinity = mergeFeedback(genreAffinity, feedbackMap);

  return {
    continueWatchingRail: mergedResumeItems.length
      ? {
          id: "continue-watching",
          title: "Continue Watching",
          eyebrow: "Profile aware",
          description: "Jump back in exactly where this profile left off.",
          variant: "continue",
          items: enrichItemsWithWatchState(mergedResumeItems, resumeTargets, "Resume", "In progress"),
        }
      : null,
    recentlyWatchedRail: mergedRecentItems.length
      ? {
          id: "recently-watched",
          title: "Recently Watched",
          eyebrow: "Picked up recently",
          description: "The titles this profile has been circling back to.",
          items: enrichItemsWithWatchState(mergedRecentItems, distinctHistory, "Watch again", "Recently watched"),
        }
      : null,
    becauseYouWatchedRail: mergedBecauseItems.length
      ? {
          id: "because-you-watched",
          title: "Because You Watched",
          eyebrow: "Profile affinity",
          description: "Recommendations pulled from the titles this profile actually opened.",
          variant: "editorial",
          items: mergedBecauseItems,
        }
      : null,
    watchlistPicksRail: mergedWatchlistPicks.length
      ? {
          id: "watchlist-picks",
          title: "Watchlist Picks",
          eyebrow: "Saved-title momentum",
          description: "If these are in your queue, these should be too.",
          items: mergedWatchlistPicks,
        }
      : null,
    genreAffinityRail: mergedGenreAffinity.length
      ? {
          id: "genre-affinity",
          title: "More In Your Lane",
          eyebrow: "Genre affinity",
          description: "A faster lane for the genres this profile actually gravitates toward.",
          items: mergedGenreAffinity,
        }
      : null,
    continueWatchingCount: resumeTargets.length,
    recentlyWatchedCount: recentHistory.length,
  };
}
