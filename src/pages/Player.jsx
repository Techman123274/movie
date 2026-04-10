import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  List,
  RotateCcw,
  SkipForward,
  Layers3,
} from "lucide-react";
import { getMovieDetails, getTVDetails, getTVSeason } from "@/lib/tmdb";
import { DEFAULT_PLAYER_OPTIONS, getPlaybackSourceCandidates } from "@/lib/vidlink";
import { base44 } from "@/api/base44Client";
import ProfileRestrictionNotice from "@/components/profile/ProfileRestrictionNotice";
import { isAllowedForProfile, readActiveProfile } from "@/lib/preferences";
import {
  estimateDurationSeconds,
  formatPlaybackTime,
  getLatestHistoryEntry,
  getProgressPercent,
} from "@/lib/playback";
import { logSocialActivity } from "@/lib/social";

const SAVE_INTERVAL_MS = 15000;
const PLAYER_LOAD_TIMEOUT_MS = 10000;
const AUTO_NEXT_TRIGGER_SECONDS = 20;
const AUTO_NEXT_COUNTDOWN_SECONDS = 12;

export default function Player() {
  const { type, id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeProfile = readActiveProfile();

  const season = parseInt(searchParams.get("season") || "1", 10);
  const episode = parseInt(searchParams.get("episode") || "1", 10);

  const [content, setContent] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [historyEntry, setHistoryEntry] = useState(null);
  const [historyReady, setHistoryReady] = useState(false);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [sourceLoaded, setSourceLoaded] = useState(false);
  const [currentProgressSeconds, setCurrentProgressSeconds] = useState(0);
  const [showAutoNext, setShowAutoNext] = useState(false);
  const [autoNextCountdown, setAutoNextCountdown] = useState(AUTO_NEXT_COUNTDOWN_SECONDS);
  const [autoNextDismissed, setAutoNextDismissed] = useState(false);

  const sessionRef = useRef({
    baselineProgressSeconds: 0,
    playedMs: 0,
    visibleStartedAt: null,
  });
  const historyEntryRef = useRef(null);

  useEffect(() => {
    historyEntryRef.current = historyEntry;
  }, [historyEntry]);

  const getCurrentProgressSeconds = () => {
    const session = sessionRef.current;
    let totalPlayedMs = session.playedMs;

    if (session.visibleStartedAt) {
      totalPlayedMs += Date.now() - session.visibleStartedAt;
    }

    return Math.max(
      0,
      Math.floor(session.baselineProgressSeconds + totalPlayedMs / 1000)
    );
  };

  const syncElapsedMs = () => {
    const session = sessionRef.current;
    if (!session.visibleStartedAt) {
      return;
    }

    session.playedMs += Date.now() - session.visibleStartedAt;
    session.visibleStartedAt = null;
  };

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      setLoading(true);
      setContent(null);
      setSeasonData(null);
      setHistoryEntry(null);
      setHistoryReady(false);
      setResumeSeconds(0);
      setDurationSeconds(0);
      setCurrentProgressSeconds(0);
      setSourceIndex(0);
      setSourceLoaded(false);
      setShowAutoNext(false);
      setAutoNextCountdown(AUTO_NEXT_COUNTDOWN_SECONDS);
      setAutoNextDismissed(false);

      const data = type === "movie"
        ? await getMovieDetails(id).catch(() => null)
        : await getTVDetails(id).catch(() => null);

      if (!cancelled) {
        setContent(data);
        setLoading(false);
      }
    };

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [type, id]);

  useEffect(() => {
    let cancelled = false;

    if (type !== "tv" || !content) {
      setSeasonData(null);
      return undefined;
    }

    const loadSeason = async () => {
      const data = await getTVSeason(id, season).catch(() => null);
      if (!cancelled) {
        setSeasonData(data);
      }
    };

    loadSeason();

    return () => {
      cancelled = true;
    };
  }, [type, id, season, content]);

  useEffect(() => {
    let cancelled = false;

    if (!content) {
      return undefined;
    }

    const loadHistoryEntry = async () => {
      const filters = {
        tmdb_id: Number(id),
        media_type: type,
      };

      if (type === "tv") {
        filters.season_number = season;
        filters.episode_number = episode;
      }

      const entries = await base44.entities.WatchHistory.filter(filters).catch(() => []);
      if (cancelled) {
        return;
      }

      const latestEntry = getLatestHistoryEntry(entries);
      const nextResumeSeconds = Number(latestEntry?.progress_seconds) || 0;
      setHistoryEntry(latestEntry);
      setResumeSeconds(nextResumeSeconds);
      setCurrentProgressSeconds(nextResumeSeconds);
      setHistoryReady(true);
    };

    loadHistoryEntry();

    return () => {
      cancelled = true;
    };
  }, [content, id, type, season, episode]);

  useEffect(() => {
    if (!content) {
      setDurationSeconds(0);
      return;
    }

    setDurationSeconds(
      estimateDurationSeconds({
        mediaType: type,
        content,
        seasonData,
        episodeNumber: episode,
      })
    );
  }, [content, seasonData, type, episode]);

  const isAllowed = !content || isAllowedForProfile(content, activeProfile);

  const sourceCandidates = useMemo(() => {
    if (!content || !historyReady || !isAllowed) {
      return [];
    }

    return getPlaybackSourceCandidates({
      type,
      tmdbId: id,
      season,
      episode,
      options: {
        ...DEFAULT_PLAYER_OPTIONS,
        resumeSeconds,
      },
    });
  }, [content, historyReady, isAllowed, type, id, season, episode, resumeSeconds]);

  const embedSource = sourceCandidates[sourceIndex] || null;

  useEffect(() => {
    setSourceIndex(0);
    setSourceLoaded(false);
  }, [type, id, season, episode, resumeSeconds]);

  useEffect(() => {
    if (!embedSource) {
      return undefined;
    }

    sessionRef.current = {
      baselineProgressSeconds: Number(resumeSeconds) || 0,
      playedMs: 0,
      visibleStartedAt: document.visibilityState === "visible" ? Date.now() : null,
    };

    const buildHistoryPayload = (progressSeconds, providerId = embedSource.id) => ({
      tmdb_id: Number(id),
      media_type: type,
      title: content?.title || content?.name || "",
      poster_path: content?.poster_path,
      backdrop_path: content?.backdrop_path,
      vote_average: content?.vote_average,
      release_date: content?.release_date || content?.first_air_date,
      genre_ids: content?.genres?.map((genre) => genre.id) || [],
      season_number: type === "tv" ? season : null,
      episode_number: type === "tv" ? episode : null,
      progress_percent: getProgressPercent(
        progressSeconds,
        durationSeconds,
        historyEntryRef.current?.progress_percent
      ),
      progress_seconds: progressSeconds,
      duration_seconds: durationSeconds || null,
      playback_provider: providerId,
    });

    const persistPlaybackProgress = async (forcedProgressSeconds = null) => {
      if (!content) {
        return null;
      }

      const user = await base44.auth.me().catch(() => null);
      if (!user) {
        return null;
      }

      const progressSeconds = forcedProgressSeconds ?? getCurrentProgressSeconds();
      const payload = buildHistoryPayload(progressSeconds);
      const isFirstEntry = !historyEntryRef.current?.id;

      let nextEntry = null;

      if (historyEntryRef.current?.id) {
        nextEntry = await base44.entities.WatchHistory
          .update(historyEntryRef.current.id, payload)
          .catch(() => null);
      } else {
        nextEntry = await base44.entities.WatchHistory
          .create(payload)
          .catch(() => null);
      }

      if (!nextEntry) {
        return null;
      }

      historyEntryRef.current = nextEntry;
      setHistoryEntry(nextEntry);
      setCurrentProgressSeconds(progressSeconds);

      if (isFirstEntry) {
        void logSocialActivity({
          user,
          profile: activeProfile,
          item: content,
          mediaType: type,
          activityType: "watch_started",
          message: `${user.full_name || user.email || "A friend"} started watching`,
        });
      }

      sessionRef.current = {
        baselineProgressSeconds: progressSeconds,
        playedMs: 0,
        visibleStartedAt: document.visibilityState === "visible" ? Date.now() : null,
      };

      return nextEntry;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        syncElapsedMs();
        persistPlaybackProgress();
        return;
      }

      sessionRef.current.visibleStartedAt = Date.now();
    };

    const handlePageExit = () => {
      syncElapsedMs();
      persistPlaybackProgress();
    };

    const saveInterval = window.setInterval(() => {
      persistPlaybackProgress();
    }, SAVE_INTERVAL_MS);

    const progressTickInterval = window.setInterval(() => {
      setCurrentProgressSeconds(getCurrentProgressSeconds());
    }, 1000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageExit);
    window.addEventListener("beforeunload", handlePageExit);

    return () => {
      syncElapsedMs();
      persistPlaybackProgress();
      window.clearInterval(saveInterval);
      window.clearInterval(progressTickInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageExit);
      window.removeEventListener("beforeunload", handlePageExit);
    };
  }, [content, historyReady, embedSource, durationSeconds, id, type, season, episode, resumeSeconds]);

  useEffect(() => {
    if (!embedSource || sourceLoaded || sourceIndex >= sourceCandidates.length - 1) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setSourceIndex((currentIndex) =>
        currentIndex < sourceCandidates.length - 1 ? currentIndex + 1 : currentIndex
      );
      setSourceLoaded(false);
    }, PLAYER_LOAD_TIMEOUT_MS);

    return () => window.clearTimeout(timeout);
  }, [embedSource, sourceLoaded, sourceIndex, sourceCandidates.length]);

  const nextEpisodeTarget = useMemo(() => {
    if (type !== "tv" || !content) {
      return null;
    }

    const maxEpisode = seasonData?.episodes?.length || 0;
    if (maxEpisode > 0 && episode < maxEpisode) {
      return { season, episode: episode + 1 };
    }

    if (content.number_of_seasons && season < content.number_of_seasons) {
      return { season: season + 1, episode: 1 };
    }

    return null;
  }, [type, content, seasonData, season, episode]);

  useEffect(() => {
    setShowAutoNext(false);
    setAutoNextCountdown(AUTO_NEXT_COUNTDOWN_SECONDS);
    setAutoNextDismissed(false);
  }, [type, id, season, episode]);

  useEffect(() => {
    if (type !== "tv" || !nextEpisodeTarget || autoNextDismissed || !durationSeconds) {
      return;
    }

    const remainingSeconds = durationSeconds - currentProgressSeconds;
    if (remainingSeconds <= AUTO_NEXT_TRIGGER_SECONDS && remainingSeconds > 0) {
      setShowAutoNext(true);
    }
  }, [type, nextEpisodeTarget, autoNextDismissed, durationSeconds, currentProgressSeconds]);

  useEffect(() => {
    if (!showAutoNext || autoNextDismissed || !nextEpisodeTarget) {
      return undefined;
    }

    if (autoNextCountdown <= 0) {
      setSearchParams({
        season: String(nextEpisodeTarget.season),
        episode: String(nextEpisodeTarget.episode),
      });
      setShowEpisodeList(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setAutoNextCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [showAutoNext, autoNextDismissed, autoNextCountdown, nextEpisodeTarget, setSearchParams]);

  const goToEpisode = (nextSeason, nextEpisode) => {
    setSearchParams({ season: String(nextSeason), episode: String(nextEpisode) });
    setShowEpisodeList(false);
  };

  const goNextEpisode = () => {
    if (!nextEpisodeTarget) {
      return;
    }

    goToEpisode(nextEpisodeTarget.season, nextEpisodeTarget.episode);
  };

  const persistManualProgress = async (targetSeconds) => {
    sessionRef.current = {
      baselineProgressSeconds: targetSeconds,
      playedMs: 0,
      visibleStartedAt: document.visibilityState === "visible" ? Date.now() : null,
    };

    setResumeSeconds(targetSeconds);
    setCurrentProgressSeconds(targetSeconds);
    setSourceIndex(0);
    setSourceLoaded(false);

    if (!content) {
      return;
    }

    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return;
    }

    const payload = {
      tmdb_id: Number(id),
      media_type: type,
      title: content.title || content.name || "",
      poster_path: content.poster_path,
      backdrop_path: content.backdrop_path,
      vote_average: content.vote_average,
      release_date: content.release_date || content.first_air_date,
      genre_ids: content.genres?.map((genre) => genre.id) || [],
      season_number: type === "tv" ? season : null,
      episode_number: type === "tv" ? episode : null,
      progress_percent: getProgressPercent(
        targetSeconds,
        durationSeconds,
        historyEntryRef.current?.progress_percent
      ),
      progress_seconds: targetSeconds,
      duration_seconds: durationSeconds || null,
      playback_provider: embedSource?.id || sourceCandidates[0]?.id || null,
    };

    let nextEntry = null;

    if (historyEntryRef.current?.id) {
      nextEntry = await base44.entities.WatchHistory
        .update(historyEntryRef.current.id, payload)
        .catch(() => null);
    } else {
      nextEntry = await base44.entities.WatchHistory
        .create(payload)
        .catch(() => null);
    }

    if (!nextEntry) {
      return;
    }

    historyEntryRef.current = nextEntry;
    setHistoryEntry(nextEntry);
  };

  const handleStartOver = () => persistManualProgress(0);

  const introEndSeconds = type === "tv"
    ? Math.min(95, Math.max(60, Math.floor((durationSeconds || 480) * 0.18)))
    : 0;
  const showSkipIntro = type === "tv" &&
    durationSeconds > 0 &&
    currentProgressSeconds >= 10 &&
    currentProgressSeconds < introEndSeconds - 5;

  const handleSkipIntro = () => {
    persistManualProgress(introEndSeconds);
  };

  const handleSwitchSource = () => {
    if (sourceCandidates.length <= 1) {
      return;
    }

    setSourceIndex((currentIndex) => (currentIndex + 1) % sourceCandidates.length);
    setSourceLoaded(false);
  };

  const title = content?.title || content?.name || "Loading...";
  const episodeName = type === "tv"
    ? seasonData?.episodes?.find((item) => item.episode_number === episode)?.name
    : null;
  const showingResume = resumeSeconds > 0;

  if (!loading && content && !isAllowed) {
    return (
      <ProfileRestrictionNotice
        profile={activeProfile}
        title="Playback is locked on this profile"
        description="This title is outside the maturity limit for the active profile, so playback has been blocked."
        onAction={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 100 }}>
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <p className="text-white font-semibold text-sm">{title}</p>
            {type === "tv" && (
              <p className="text-gray-400 text-xs">
                S{String(season).padStart(2, "0")}:E{String(episode).padStart(2, "0")}
                {episodeName ? ` - ${episodeName}` : ""}
              </p>
            )}
            {showingResume && (
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                Resuming from {formatPlaybackTime(currentProgressSeconds)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showingResume && (
            <button
              onClick={handleStartOver}
              className="flex items-center gap-1.5 text-white hover:text-gray-300 text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Start Over
            </button>
          )}
          {sourceCandidates.length > 1 && (
            <button
              onClick={handleSwitchSource}
              className="flex items-center gap-1.5 text-white hover:text-gray-300 text-sm transition-colors"
            >
              <Layers3 className="w-4 h-4" />
              {embedSource?.label || "Source"}
            </button>
          )}
          {type === "tv" && (
            <>
              <button
                onClick={goNextEpisode}
                className="flex items-center gap-1.5 text-white hover:text-gray-300 text-sm transition-colors"
              >
                <SkipForward className="w-5 h-5" /> Next
              </button>
              <button
                onClick={() => setShowEpisodeList(!showEpisodeList)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <List className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : embedSource?.url ? (
        <>
          <iframe
            key={`${embedSource.id}-${resumeSeconds}-${season}-${episode}`}
            src={embedSource.url}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            title={title}
            onLoad={() => setSourceLoaded(true)}
            onError={() => {
              if (sourceIndex < sourceCandidates.length - 1) {
                setSourceIndex((currentIndex) => currentIndex + 1);
                setSourceLoaded(false);
              }
            }}
          />

          {showSkipIntro && (
            <div className="absolute bottom-28 right-6 z-30">
              <button
                onClick={handleSkipIntro}
                className="rounded-full bg-white/92 px-5 py-3 text-sm font-semibold text-black shadow-xl transition-colors hover:bg-white"
              >
                Skip Intro
              </button>
            </div>
          )}

          {showAutoNext && nextEpisodeTarget && !autoNextDismissed && (
            <div className="absolute bottom-8 right-6 z-30 w-full max-w-sm rounded-3xl border border-white/10 bg-black/85 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.5)] backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.25em] text-[#E50914]">Up Next</p>
              <h3 className="mt-3 text-xl font-bold text-white">
                Starting next episode in {autoNextCountdown}s
              </h3>
              <p className="mt-2 text-sm text-white/65">
                We&apos;ll move to S{String(nextEpisodeTarget.season).padStart(2, "0")}:E{String(nextEpisodeTarget.episode).padStart(2, "0")} unless you cancel.
              </p>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={goNextEpisode}
                  className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-gray-200"
                >
                  Play Next Now
                </button>
                <button
                  onClick={() => {
                    setAutoNextDismissed(true);
                    setShowAutoNext(false);
                  }}
                  className="rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08]"
                >
                  Stay Here
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <p className="text-white text-xl font-semibold mb-2">Content not available</p>
            <p className="text-gray-400 text-sm mb-6">This title cannot be played at this time.</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-[#E50914] text-white px-6 py-2 rounded font-semibold hover:bg-[#c40812] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {showEpisodeList && type === "tv" && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/95 border-l border-white/10 z-30 flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Episodes</h3>
            <button
              onClick={() => setShowEpisodeList(false)}
              className="text-gray-400 hover:text-white"
            >
              x
            </button>
          </div>

          {content?.seasons && (
            <div className="px-4 py-3 border-b border-white/10">
              <select
                value={season}
                onChange={(event) => {
                  goToEpisode(Number(event.target.value), 1);
                }}
                className="bg-[#1a1a1a] text-white border border-gray-600 rounded px-3 py-1.5 text-sm w-full"
              >
                {content.seasons.filter((item) => item.season_number > 0).map((item) => (
                  <option key={item.id} value={item.season_number}>
                    Season {item.season_number}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {seasonData?.episodes?.map((item) => (
              <div
                key={item.id}
                onClick={() => goToEpisode(season, item.episode_number)}
                className={`flex gap-3 p-3 cursor-pointer transition-colors border-b border-white/5 ${
                  item.episode_number === episode
                    ? "bg-[#E50914]/20 border-l-2 border-l-[#E50914]"
                    : "hover:bg-white/5"
                }`}
              >
                <span className="text-gray-500 text-sm w-6 text-center pt-0.5 flex-shrink-0 font-mono">
                  {item.episode_number}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium line-clamp-1 ${
                      item.episode_number === episode ? "text-[#E50914]" : "text-white"
                    }`}
                  >
                    {item.name}
                  </p>
                  {item.runtime && <p className="text-gray-500 text-xs">{item.runtime}m</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
