import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, Play, Plus, ThumbsUp } from "lucide-react";
import { tmdbW300, tmdbW500, GENRE_MAP } from "@/lib/tmdb";
import { base44 } from "@/api/base44Client";
import { getMatchPercentage } from "@/lib/recommendations";
import { buildWatchPath } from "@/lib/playback";
import {
  getWatchlistEntry,
  isItemLiked,
  LIBRARY_CHANGED_EVENT,
  toggleLikedItem,
  toggleWatchlistItem,
} from "@/lib/library";
import { readActiveProfile } from "@/lib/preferences";
import PlaybackProgressBar from "@/components/ui/PlaybackProgressBar";
import { useAppTheme } from "@/lib/theme";

export default function ContentCard({ item, onWatchlistChange, isInWatchlist = false, layout = "row" }) {
  const [hovered, setHovered] = useState(false);
  const [inList, setInList] = useState(isInWatchlist);
  const [liked, setLiked] = useState(false);
  const [watchlistLoaded, setWatchlistLoaded] = useState(false);
  const navigate = useNavigate();
  const activeProfile = readActiveProfile();
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.cardVariant === "hulu";

  const title = item.title || item.name || "Unknown";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const genres = (item.genre_ids || []).slice(0, 3).map((id) => GENRE_MAP[id]).filter(Boolean);
  const rating = item.vote_average ? Math.round(item.vote_average * 10) : null;
  const matchPercentage = item.match_percentage || getMatchPercentage(item);
  const topRank = item.top_rank || null;
  const progressPercent = Math.max(0, Math.min(100, Math.round(Number(item.progress_percent) || 0)));
  const socialReason = item.social_reason || "";
  const userRating = Number(item.user_rating) || 0;
  const playPath = item.resume_path || buildWatchPath({
    mediaType,
    tmdbId: item.tmdb_id ?? item.id,
    seasonNumber: item.season_number,
    episodeNumber: item.episode_number,
  });

  const effectiveLayout = useMemo(() => {
    if (!isHulu) {
      return layout;
    }
    return layout === "grid" ? "hulu-grid" : "hulu-row";
  }, [isHulu, layout]);

  const handlePlay = (event) => {
    event.stopPropagation();
    navigate(playPath);
  };

  const handleDetails = () => {
    navigate(`/${mediaType}/${item.id}`);
  };

  useEffect(() => {
    let cancelled = false;

    const loadLikeState = async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user || cancelled) {
        return;
      }
      setLiked(isItemLiked(user, activeProfile, item, mediaType));
    };

    loadLikeState();

    const handleLibraryChanged = async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user || cancelled) {
        return;
      }
      setLiked(isItemLiked(user, activeProfile, item, mediaType));
      if (watchlistLoaded) {
        const entry = await getWatchlistEntry(item, mediaType).catch(() => null);
        if (!cancelled) {
          setInList(Boolean(entry));
        }
      }
    };

    window.addEventListener(LIBRARY_CHANGED_EVENT, handleLibraryChanged);
    return () => {
      cancelled = true;
      window.removeEventListener(LIBRARY_CHANGED_EVENT, handleLibraryChanged);
    };
  }, [activeProfile, item, mediaType, watchlistLoaded]);

  useEffect(() => {
    if (!hovered || watchlistLoaded) {
      return undefined;
    }

    let cancelled = false;
    const loadWatchlistState = async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user) {
        return;
      }
      const entry = await getWatchlistEntry(item, mediaType).catch(() => null);
      if (!cancelled) {
        setInList(Boolean(entry));
        setWatchlistLoaded(true);
      }
    };

    loadWatchlistState();
    return () => {
      cancelled = true;
    };
  }, [hovered, item, mediaType, watchlistLoaded]);

  const handleWatchlist = async (event) => {
    event.stopPropagation();
    try {
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }

      const result = await toggleWatchlistItem({ item: { ...item, title }, mediaType });
      setInList(result.inWatchlist);
      setWatchlistLoaded(true);
      onWatchlistChange?.();
    } catch {
      base44.auth.redirectToLogin();
    }
  };

  const handleLike = async (event) => {
    event.stopPropagation();
    try {
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }

      const nextLiked = toggleLikedItem({
        user,
        profile: activeProfile,
        item: { ...item, title },
        mediaType,
      });
      setLiked(nextLiked);
    } catch {
      base44.auth.redirectToLogin();
    }
  };

  if (effectiveLayout === "hulu-row" || effectiveLayout === "hulu-grid") {
    const cardWidthClass = effectiveLayout === "hulu-grid"
      ? "w-full"
      : "w-[240px] sm:w-[260px] lg:w-[280px]";
    const heroImage = item.backdrop_path || item.poster_path;

    return (
      <article
        className={`group relative flex-shrink-0 snap-start cursor-pointer ${cardWidthClass}`}
        onClick={handleDetails}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="overflow-hidden rounded-[22px] border border-white/8 bg-[rgba(255,255,255,0.03)] transition-all duration-200 hover:border-white/18 hover:bg-[rgba(255,255,255,0.05)]">
          <div className="relative aspect-video overflow-hidden bg-[#111814]">
            {heroImage ? (
              <img
                src={tmdbW500(heroImage)}
                alt={title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-gray-500">
                {title}
              </div>
            )}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.72)_100%)]" />
            {(topRank || matchPercentage || rating) && (
              <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                {topRank ? `Top ${topRank}` : `${matchPercentage || rating}%`}
              </div>
            )}
            {progressPercent > 0 && (
              <div className="absolute inset-x-3 bottom-3">
                <PlaybackProgressBar progress={progressPercent} className="h-1.5 bg-white/15" />
              </div>
            )}
          </div>

          <div className="space-y-3 p-4">
            <div>
              <h3 className="line-clamp-1 text-base font-semibold text-white">{title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/55">
                {matchPercentage && <span className="font-semibold text-[var(--brand)]">{matchPercentage}% Match</span>}
                {!matchPercentage && rating && <span className="font-semibold text-[var(--brand)]">{rating}% Rating</span>}
                {!matchPercentage && !rating && userRating > 0 && (
                  <span className="font-semibold text-yellow-400">{userRating}/5 Rated</span>
                )}
                {year && <span>{year}</span>}
                <span>{mediaType === "tv" ? "Series" : "Movie"}</span>
              </div>
            </div>

            {socialReason && (
              <p className="line-clamp-2 text-[12px] leading-relaxed text-[#86efac]">
                {socialReason}
              </p>
            )}

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.slice(0, 2).map((genre) => (
                  <span key={genre} className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/55">
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handlePlay}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)]"
              >
                <Play className="h-3.5 w-3.5 fill-[var(--brand-contrast)]" />
                Play
              </button>
              <button
                onClick={handleWatchlist}
                className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] text-white transition-colors hover:bg-white/[0.08]"
              >
                {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
              <button
                onClick={handleLike}
                className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border transition-colors ${
                  liked
                    ? "border-[var(--brand)] bg-[rgba(29,231,144,0.12)] text-[var(--brand)]"
                    : "border-white/12 bg-white/[0.03] text-white hover:bg-white/[0.08]"
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${liked ? "fill-[var(--brand)]" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  const cardWidthClass = layout === "grid"
    ? "w-full"
    : "w-[132px] sm:w-[150px] md:w-[clamp(140px,15vw,200px)]";

  return (
    <div
      className={`group relative flex-shrink-0 snap-start cursor-pointer ${cardWidthClass}`}
      style={{ zIndex: hovered ? 50 : 1, position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleDetails}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded bg-[#1a1a1a]">
        {item.poster_path ? (
          <img
            src={tmdbW300(item.poster_path)}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#1a1a1a]">
            <span className="px-2 text-center text-xs text-gray-600">{title}</span>
          </div>
        )}

        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`} />

        {topRank ? (
          <div className="absolute left-2 top-2 rounded bg-[#E50914] px-2 py-1 text-xs font-black text-white shadow-lg">
            #{topRank}
          </div>
        ) : (matchPercentage || rating) ? (
          <div className="absolute left-2 top-2 rounded bg-[#E50914] px-1.5 py-0.5 text-xs font-bold text-white">
            {matchPercentage || rating}%
          </div>
        ) : null}

        <div className="absolute inset-x-2 bottom-2 z-10">
          <PlaybackProgressBar progress={progressPercent} />
        </div>
      </div>

      {hovered && (
        <div
          className="absolute z-30 overflow-hidden rounded-md border border-white/10 bg-[#141414] shadow-2xl"
          style={{
            width: "clamp(200px, 20vw, 280px)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) scale(1.05)",
            animation: "fade-in 0.15s ease-out",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative aspect-video overflow-hidden bg-[#1a1a1a]">
            {item.backdrop_path ? (
              <img
                src={tmdbW500(item.backdrop_path)}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : item.poster_path ? (
              <img
                src={tmdbW300(item.poster_path)}
                alt={title}
                className="h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 gradient-bottom" />
          </div>

          <div className="p-3">
            <div className="mb-2 flex items-center gap-2">
              <button
                onClick={handlePlay}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition-colors hover:bg-gray-200"
              >
                <Play className="h-4 w-4 fill-black text-black" />
              </button>
              <button
                onClick={handleWatchlist}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-500 transition-colors hover:border-white"
              >
                {inList ? (
                  <Check className="h-4 w-4 text-white" />
                ) : (
                  <Plus className="h-4 w-4 text-white" />
                )}
              </button>
              <button
                onClick={handleLike}
                className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                  liked
                    ? "border-[#E50914] bg-[#E50914]/15 hover:bg-[#E50914]/25"
                    : "border-gray-500 hover:border-white"
                }`}
              >
                <ThumbsUp className={`h-4 w-4 ${liked ? "fill-[#E50914] text-[#E50914]" : "text-white"}`} />
              </button>
              <button
                onClick={handleDetails}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-gray-500 transition-colors hover:border-white"
              >
                <ChevronDown className="h-4 w-4 text-white" />
              </button>
            </div>

            <p className="mb-1 line-clamp-1 text-sm font-semibold leading-tight text-white">{title}</p>

            <div className="mb-2 flex items-center gap-2 text-xs">
              {topRank && <span className="font-bold text-[#E50914]">Top {topRank} this week</span>}
              {matchPercentage && <span className="font-bold text-green-400">{matchPercentage}% Match</span>}
              {!matchPercentage && rating && <span className="font-bold text-green-400">{rating}% Rating</span>}
              {!matchPercentage && !rating && userRating > 0 && (
                <span className="font-bold text-yellow-400">{userRating}/5 Rated</span>
              )}
              {year && <span className="text-gray-400">{year}</span>}
              <span className="rounded border border-gray-500 px-1 text-[10px] text-gray-400">HD</span>
            </div>

            {socialReason && (
              <p className="mb-2 line-clamp-2 text-[11px] font-medium text-[#86efac]">
                {socialReason}
              </p>
            )}

            {progressPercent > 0 && (
              <div className="mb-2">
                <p className="mb-1 text-[11px] font-medium text-white/70">
                  {mediaType === "tv" && item.season_number
                    ? `Resume S${String(item.season_number).padStart(2, "0")}:E${String(item.episode_number || 1).padStart(2, "0")}`
                    : "Continue watching"}
                </p>
                <PlaybackProgressBar progress={progressPercent} />
              </div>
            )}

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {genres.map((genre, index) => (
                  <span key={genre} className="text-xs text-gray-400">
                    {index > 0 && <span className="mr-1">|</span>}
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
