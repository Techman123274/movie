const COMPLETE_THRESHOLD_PERCENT = 92;
const MIN_RESUME_SECONDS = 60;

const toFiniteNumber = (value) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : 0;
};

export const formatPlaybackTime = (seconds) => {
  const totalSeconds = Math.max(0, Math.floor(toFiniteNumber(seconds)));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
};

export const getProgressPercent = (progressSeconds, durationSeconds, fallbackPercent = 0) => {
  const safeDuration = toFiniteNumber(durationSeconds);
  const safeProgress = toFiniteNumber(progressSeconds);

  if (safeDuration > 0) {
    return Math.max(0, Math.min(100, Math.round((safeProgress / safeDuration) * 100)));
  }

  return Math.max(0, Math.min(100, Math.round(toFiniteNumber(fallbackPercent))));
};

export const isPlaybackComplete = (entry) =>
  getProgressPercent(entry?.progress_seconds, entry?.duration_seconds, entry?.progress_percent) >= COMPLETE_THRESHOLD_PERCENT;

export const shouldResumePlayback = (entry) => {
  if (!entry) {
    return false;
  }

  const progressSeconds = toFiniteNumber(entry.progress_seconds);
  const progressPercent = getProgressPercent(entry.progress_seconds, entry.duration_seconds, entry.progress_percent);

  return progressSeconds >= MIN_RESUME_SECONDS && progressPercent > 0 && progressPercent < COMPLETE_THRESHOLD_PERCENT;
};

export const buildWatchPath = ({
  mediaType,
  tmdbId,
  seasonNumber,
  episodeNumber,
}) => {
  if (!mediaType || !tmdbId) {
    return "/";
  }

  if (mediaType === "tv" && Number.isFinite(Number(seasonNumber)) && Number.isFinite(Number(episodeNumber))) {
    return `/watch/tv/${tmdbId}?season=${Number(seasonNumber)}&episode=${Number(episodeNumber)}`;
  }

  return `/watch/${mediaType}/${tmdbId}`;
};

const getItemKey = (tmdbId, mediaType) => `${mediaType || "movie"}:${tmdbId}`;

const toHistoryItem = (entry) => ({
  id: entry.tmdb_id,
  tmdb_id: entry.tmdb_id,
  title: entry.title,
  name: entry.title,
  poster_path: entry.poster_path,
  backdrop_path: entry.backdrop_path,
  media_type: entry.media_type,
  vote_average: entry.vote_average,
  overview: entry.overview || "",
  release_date: entry.release_date,
  genre_ids: entry.genre_ids || [],
  season_number: entry.season_number,
  episode_number: entry.episode_number,
  progress_percent: getProgressPercent(entry.progress_seconds, entry.duration_seconds, entry.progress_percent),
  progress_seconds: toFiniteNumber(entry.progress_seconds),
  duration_seconds: toFiniteNumber(entry.duration_seconds),
  resume_path: buildWatchPath({
    mediaType: entry.media_type,
    tmdbId: entry.tmdb_id,
    seasonNumber: entry.season_number,
    episodeNumber: entry.episode_number,
  }),
});

const sortHistoryEntries = (entries = []) =>
  [...entries].sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));

export const getLatestHistoryEntry = (entries = []) => sortHistoryEntries(entries)[0] || null;

export const getResumeLabel = (entry, mediaType) => {
  if (!shouldResumePlayback(entry)) {
    return mediaType === "tv" ? "Play S1:E1" : "Play";
  }

  if (mediaType === "tv") {
    return `Resume S${String(entry.season_number || 1).padStart(2, "0")}:E${String(entry.episode_number || 1).padStart(2, "0")}`;
  }

  return `Resume ${formatPlaybackTime(entry.progress_seconds)}`;
};

export const estimateDurationSeconds = ({ mediaType, content, seasonData, episodeNumber }) => {
  if (mediaType === "movie") {
    return toFiniteNumber(content?.runtime) * 60;
  }

  const selectedEpisode = seasonData?.episodes?.find(
    (episode) => episode.episode_number === Number(episodeNumber)
  );

  if (selectedEpisode?.runtime) {
    return toFiniteNumber(selectedEpisode.runtime) * 60;
  }

  const seasonEpisodeRuntimes = (seasonData?.episodes || [])
    .map((episode) => toFiniteNumber(episode?.runtime))
    .filter((runtime) => runtime > 0);

  if (seasonEpisodeRuntimes.length > 0) {
    const averageRuntime = seasonEpisodeRuntimes.reduce((sum, value) => sum + value, 0) / seasonEpisodeRuntimes.length;
    return Math.round(averageRuntime) * 60;
  }

  if (content?.last_episode_to_air?.runtime) {
    return toFiniteNumber(content.last_episode_to_air.runtime) * 60;
  }

  if (content?.next_episode_to_air?.runtime) {
    return toFiniteNumber(content.next_episode_to_air.runtime) * 60;
  }

  if (Array.isArray(content?.episode_run_time) && content.episode_run_time[0]) {
    return toFiniteNumber(content.episode_run_time[0]) * 60;
  }

  // TMDB can omit runtime metadata for some shows/seasons.
  // Avoid under-estimating here (it could trigger auto-next early).
  return 45 * 60;
};

export const buildContinueWatchingItems = (historyEntries = []) => {
  const sortedEntries = sortHistoryEntries(historyEntries);
  const items = [];
  const seenKeys = new Set();

  sortedEntries.forEach((entry) => {
    const key = getItemKey(entry.tmdb_id, entry.media_type);
    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);

    if (!shouldResumePlayback(entry)) {
      return;
    }

    items.push(toHistoryItem(entry));
  });

  return items;
};

const buildPlaybackMap = (historyEntries = []) => {
  const playbackMap = new Map();

  sortHistoryEntries(historyEntries).forEach((entry) => {
    if (!shouldResumePlayback(entry)) {
      return;
    }

    const key = getItemKey(entry.tmdb_id, entry.media_type);
    if (!playbackMap.has(key)) {
      playbackMap.set(key, entry);
    }
  });

  return playbackMap;
};

export const attachPlaybackProgress = (items = [], historyEntries = []) => {
  const playbackMap = buildPlaybackMap(historyEntries);

  return (items || []).map((item) => {
    const mediaType = item.media_type || (item.title ? "movie" : "tv");
    const tmdbId = Number(item.tmdb_id ?? item.id);
    const playbackEntry = playbackMap.get(getItemKey(tmdbId, mediaType));

    if (!playbackEntry) {
      return item;
    }

    return {
      ...item,
      progress_percent: getProgressPercent(
        playbackEntry.progress_seconds,
        playbackEntry.duration_seconds,
        playbackEntry.progress_percent
      ),
      progress_seconds: toFiniteNumber(playbackEntry.progress_seconds),
      duration_seconds: toFiniteNumber(playbackEntry.duration_seconds),
      season_number: playbackEntry.season_number ?? item.season_number,
      episode_number: playbackEntry.episode_number ?? item.episode_number,
      resume_path: buildWatchPath({
        mediaType,
        tmdbId,
        seasonNumber: playbackEntry.season_number,
        episodeNumber: playbackEntry.episode_number,
      }),
    };
  });
};
