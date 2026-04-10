import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Plus, Check, ThumbsUp, ChevronDown } from "lucide-react";
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

export default function ContentCard({ item, onWatchlistChange, isInWatchlist = false, layout = "row" }) {
  const [hovered, setHovered] = useState(false);
  const [inList, setInList] = useState(isInWatchlist);
  const [liked, setLiked] = useState(false);
  const [watchlistLoaded, setWatchlistLoaded] = useState(false);
  const navigate = useNavigate();
  const activeProfile = readActiveProfile();

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
  const cardWidthClass = layout === "grid"
    ? "w-full"
    : "w-[132px] sm:w-[150px] md:w-[clamp(140px,15vw,200px)]";

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
      return;
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

  return (
    <div
      className={`relative flex-shrink-0 snap-start cursor-pointer group ${cardWidthClass}`}
      style={{ zIndex: hovered ? 50 : 1, position: "relative" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleDetails}
    >
      <div className="relative rounded overflow-hidden aspect-[2/3] bg-[#1a1a1a]">
        {item.poster_path ? (
          <img
            src={tmdbW300(item.poster_path)}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#1a1a1a]">
            <span className="text-gray-600 text-xs text-center px-2">{title}</span>
          </div>
        )}

        <div className={`absolute inset-0 bg-black/20 transition-opacity duration-200 ${hovered ? "opacity-100" : "opacity-0"}`} />

        {topRank ? (
          <div className="absolute top-2 left-2 rounded bg-[#E50914] px-2 py-1 text-xs font-black text-white shadow-lg">
            #{topRank}
          </div>
        ) : (matchPercentage || rating) ? (
          <div className="absolute top-2 left-2 bg-[#E50914] text-white text-xs font-bold px-1.5 py-0.5 rounded">
            {matchPercentage || rating}%
          </div>
        ) : null}

        <div className="absolute inset-x-2 bottom-2 z-10">
          <PlaybackProgressBar progress={progressPercent} />
        </div>
      </div>

      {hovered && (
        <div
          className="absolute z-30 bg-[#141414] rounded-md shadow-2xl border border-white/10 overflow-hidden"
          style={{
            width: "clamp(200px, 20vw, 280px)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) scale(1.05)",
            animation: "fade-in 0.15s ease-out",
          }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative aspect-video bg-[#1a1a1a] overflow-hidden">
            {item.backdrop_path ? (
              <img
                src={tmdbW500(item.backdrop_path)}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : item.poster_path ? (
              <img
                src={tmdbW300(item.poster_path)}
                alt={title}
                className="w-full h-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 gradient-bottom" />
          </div>

          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={handlePlay}
                className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <Play className="w-4 h-4 text-black fill-black" />
              </button>
              <button
                onClick={handleWatchlist}
                className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center hover:border-white transition-colors"
              >
                {inList ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <Plus className="w-4 h-4 text-white" />
                )}
              </button>
              <button
                onClick={handleLike}
                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-colors ${
                  liked
                    ? "border-[#E50914] bg-[#E50914]/15 hover:bg-[#E50914]/25"
                    : "border-gray-500 hover:border-white"
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${liked ? "fill-[#E50914] text-[#E50914]" : "text-white"}`} />
              </button>
              <button
                onClick={handleDetails}
                className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center hover:border-white transition-colors ml-auto"
              >
                <ChevronDown className="w-4 h-4 text-white" />
              </button>
            </div>

            <p className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-1">{title}</p>

            <div className="flex items-center gap-2 text-xs mb-2">
            {topRank && <span className="text-[#E50914] font-bold">Top {topRank} this week</span>}
            {matchPercentage && <span className="text-green-400 font-bold">{matchPercentage}% Match</span>}
            {!matchPercentage && rating && <span className="text-green-400 font-bold">{rating}% Rating</span>}
            {!matchPercentage && !rating && userRating > 0 && (
              <span className="text-yellow-400 font-bold">{userRating}/5 Rated</span>
            )}
            {year && <span className="text-gray-400">{year}</span>}
            <span className="border border-gray-500 text-gray-400 px-1 text-[10px] rounded">HD</span>
          </div>

            {socialReason && (
              <p className="mb-2 text-[11px] font-medium text-[#86efac] line-clamp-2">
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
                  <span key={genre} className="text-gray-400 text-xs">
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
