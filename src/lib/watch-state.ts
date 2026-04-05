import {
  getProfileFeedbackMap,
  getRecentWatchHistory,
  getResumeTargets,
  getWatchlist,
} from "@/lib/persistence";
import {
  discoverByPreferences,
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

function mergeFeedback(
  items: MediaSummary[],
  feedbackMap: Map<string, { value: string }>,
  options?: { hideDisliked?: boolean; hideNotInterested?: boolean },
) {
  return items
    .filter((item) => {
      const feedback = feedbackMap.get(buildMediaKey(item.mediaType, item.id))?.value;

      if (options?.hideNotInterested !== false && feedback === "not_interested") {
        return false;
      }

      if (options?.hideDisliked && feedback === "dislike") {
        return false;
      }

      return true;
    })
    .map((item) => ({
      ...item,
      feedback: (feedbackMap.get(buildMediaKey(item.mediaType, item.id))?.value as MediaSummary["feedback"]) ?? null,
    }));
}

function addPreferenceScore(scoreMap: Map<string, number>, items: MediaSummary[], score: number) {
  for (const item of items) {
    const key = buildMediaKey(item.mediaType, item.id);
    scoreMap.set(key, (scoreMap.get(key) ?? 0) + score);
  }
}

function countTopGenres(items: MediaSummary[], scoreMap?: Map<string, number>) {
  const genreCounts = new Map<number, number>();

  for (const item of items) {
    const score = scoreMap?.get(buildMediaKey(item.mediaType, item.id)) ?? 1;

    for (const genreId of item.genreIds ?? []) {
      genreCounts.set(genreId, (genreCounts.get(genreId) ?? 0) + score);
    }
  }

  return Array.from(genreCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genreId]) => genreId)
    .slice(0, 3);
}

function getAffinityMediaType(items: MediaSummary[], scoreMap?: Map<string, number>): "movie" | "tv" {
  let movieCount = 0;
  let tvCount = 0;

  for (const item of items) {
    const score = scoreMap?.get(buildMediaKey(item.mediaType, item.id)) ?? 1;

    if (item.mediaType === "movie") {
      movieCount += score;
    } else {
      tvCount += score;
    }
  }

  return movieCount >= tvCount ? "movie" : "tv";
}

function buildWatchlistLookup(records: WatchlistRecord[]) {
  return new Set(records.map((record) => buildMediaKey(record.mediaType, record.mediaId)));
}

function countTopLanguages(items: MediaSummary[], scoreMap?: Map<string, number>) {
  const languageCounts = new Map<string, number>();

  for (const item of items) {
    if (!item.originalLanguage) {
      continue;
    }

    const score = scoreMap?.get(buildMediaKey(item.mediaType, item.id)) ?? 1;
    languageCounts.set(item.originalLanguage, (languageCounts.get(item.originalLanguage) ?? 0) + score);
  }

  return Array.from(languageCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([language]) => language)
    .slice(0, 2);
}

function formatLanguageLabel(languageCode: string) {
  try {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    return displayNames.of(languageCode) ?? languageCode.toUpperCase();
  } catch {
    return languageCode.toUpperCase();
  }
}

export async function getPersonalizedRails(profileId: string): Promise<{
  continueWatchingRail: MediaRail | null;
  recentlyWatchedRail: MediaRail | null;
  becauseYouWatchedRail: MediaRail | null;
  watchlistPicksRail: MediaRail | null;
  genreAffinityRail: MediaRail | null;
  favoriteFormatRail: MediaRail | null;
  languageAffinityRail: MediaRail | null;
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
  const likedRefs = Array.from(feedbackMap.values())
    .filter((record) => record.value === "like")
    .map((record) => ({ mediaType: record.mediaType, mediaId: record.mediaId }));

  const [resumeItems, recentItems, watchlistItems, likedItems] = await Promise.all([
    getMediaSummariesByIds(buildRefList(resumeTargets)),
    getMediaSummariesByIds(buildRefList(distinctHistory)),
    getMediaSummariesByIds(buildRefList(watchlist)),
    likedRefs.length ? getMediaSummariesByIds(likedRefs) : Promise.resolve([]),
  ]);

  const preferenceScoreMap = new Map<string, number>();
  addPreferenceScore(preferenceScoreMap, likedItems, 7);
  addPreferenceScore(preferenceScoreMap, watchlistItems, 4);
  addPreferenceScore(preferenceScoreMap, resumeItems, 4);
  addPreferenceScore(preferenceScoreMap, recentItems, 3);

  const affinitySeedMap = new Map<string, MediaSummary>();

  for (const item of [...likedItems, ...resumeItems, ...recentItems, ...watchlistItems]) {
    affinitySeedMap.set(buildMediaKey(item.mediaType, item.id), item);
  }

  const affinitySeeds = Array.from(affinitySeedMap.values());
  const topGenreIds = countTopGenres(affinitySeeds, preferenceScoreMap);
  const topLanguages = countTopLanguages(affinitySeeds, preferenceScoreMap);
  const affinityMediaType = getAffinityMediaType(affinitySeeds, preferenceScoreMap);
  const dominantLanguage = topLanguages[0];
  const rankedSeedRefs = affinitySeeds
    .sort(
      (a, b) =>
        (preferenceScoreMap.get(buildMediaKey(b.mediaType, b.id)) ?? 0) -
        (preferenceScoreMap.get(buildMediaKey(a.mediaType, a.id)) ?? 0),
    )
    .map((item) => ({ mediaType: item.mediaType, mediaId: item.id }));
  const seenRefs = [
    ...buildRefList([...resumeTargets, ...distinctHistory]),
    ...buildRefList(watchlist),
    ...likedRefs,
  ];

  const [becauseYouWatched, genreAffinity, watchlistPicks, favoriteFormatPicks, languageAffinityPicks] = await Promise.all([
    getRecommendedTitlesFromSeeds(
      rankedSeedRefs.length ? rankedSeedRefs : buildRefList([...resumeTargets, ...distinctHistory]),
      {
        exclude: seenRefs,
        limit: 12,
      },
    ),
    affinitySeeds.length
      ? discoverByGenres({
          mediaType: affinityMediaType,
          genreIds: topGenreIds,
          exclude: seenRefs,
          limit: 12,
        })
      : Promise.resolve([]),
    watchlistItems.length
      ? getRecommendedTitlesFromSeeds(buildRefList(watchlist).slice(0, 3), {
          exclude: seenRefs,
          limit: 12,
        })
      : Promise.resolve([]),
    affinitySeeds.length
      ? discoverByPreferences({
          mediaType: affinityMediaType,
          genreIds: topGenreIds,
          language: dominantLanguage,
          exclude: seenRefs,
          limit: 12,
        })
      : Promise.resolve([]),
    dominantLanguage
      ? discoverByPreferences({
          mediaType: affinityMediaType,
          genreIds: topGenreIds,
          language: dominantLanguage,
          exclude: seenRefs,
          limit: 12,
          sort: "vote_average.desc",
        })
      : Promise.resolve([]),
  ]);

  const mergedResumeItems = mergeFeedback(resumeItems, feedbackMap, { hideNotInterested: false });
  const mergedRecentItems = mergeFeedback(recentItems, feedbackMap, { hideNotInterested: false });
  const mergedBecauseItems = mergeFeedback(becauseYouWatched, feedbackMap, {
    hideDisliked: true,
    hideNotInterested: true,
  }).filter(
    (item) => !watchlistKeys.has(buildMediaKey(item.mediaType, item.id)),
  );
  const mergedWatchlistPicks = mergeFeedback(watchlistPicks, feedbackMap, {
    hideDisliked: true,
    hideNotInterested: true,
  });
  const mergedGenreAffinity = mergeFeedback(genreAffinity, feedbackMap, {
    hideDisliked: true,
    hideNotInterested: true,
  });
  const mergedFavoriteFormatPicks = mergeFeedback(favoriteFormatPicks, feedbackMap, {
    hideDisliked: true,
    hideNotInterested: true,
  });
  const mergedLanguageAffinityPicks = mergeFeedback(languageAffinityPicks, feedbackMap, {
    hideDisliked: true,
    hideNotInterested: true,
  });
  const preferenceTitle = likedItems.length ? "Built Around What You Like" : "Because You Watched";
  const preferenceDescription = likedItems.length
    ? "This lane now leans on liked titles, watchlist saves, and repeat habits from this profile."
    : "Recommendations pulled from the titles this profile actually opens and sticks with.";
  const favoriteFormatTitle = affinityMediaType === "movie" ? "Your Movie Lane" : "Your Series Lane";
  const favoriteFormatDescription =
    affinityMediaType === "movie"
      ? "Subflix is leaning harder into the kinds of films this profile keeps picking."
      : "Subflix is leaning harder into the kinds of series this profile keeps coming back to.";
  const languageLabel = dominantLanguage ? formatLanguageLabel(dominantLanguage) : null;

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
          title: preferenceTitle,
          eyebrow: "Profile affinity",
          description: preferenceDescription,
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
    favoriteFormatRail: mergedFavoriteFormatPicks.length
      ? {
          id: "favorite-format",
          title: favoriteFormatTitle,
          eyebrow: "Habit learning",
          description: favoriteFormatDescription,
          items: mergedFavoriteFormatPicks,
        }
      : null,
    languageAffinityRail: mergedLanguageAffinityPicks.length && languageLabel
      ? {
          id: "language-affinity",
          title: `More In ${languageLabel}`,
          eyebrow: "Language pattern",
          description: `This profile keeps circling back to ${languageLabel}, so Subflix is following that pattern.`,
          items: mergedLanguageAffinityPicks,
        }
      : null,
    continueWatchingCount: resumeTargets.length,
    recentlyWatchedCount: recentHistory.length,
  };
}
