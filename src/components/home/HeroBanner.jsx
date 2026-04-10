import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info, Plus, Check } from "lucide-react";
import { tmdbOriginal } from "@/lib/tmdb";
import { base44 } from "@/api/base44Client";
import { getMatchPercentage } from "@/lib/recommendations";
import { buildWatchPath, getResumeLabel } from "@/lib/playback";
import PlaybackProgressBar from "@/components/ui/PlaybackProgressBar";

export default function HeroBanner({ items = [] }) {
  const [current, setCurrent] = useState(0);
  const [inList, setInList] = useState(false);
  const navigate = useNavigate();

  const item = items[current];

  useEffect(() => {
    if (!items.length) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % Math.min(items.length, 5));
    }, 8000);
    return () => clearInterval(timer);
  }, [items.length]);

  useEffect(() => {
    setInList(false);
  }, [current]);

  if (!item) {
    return (
      <div className="relative w-full h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const title = item.title || item.name || "";
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const overview = item.overview || "";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const rating = item.vote_average ? Math.round(item.vote_average * 10) : null;
  const matchPercentage = item.match_percentage || getMatchPercentage(item);
  const progressPercent = Math.max(0, Math.min(100, Math.round(Number(item.progress_percent) || 0)));
  const playPath = item.resume_path || buildWatchPath({
    mediaType,
    tmdbId: item.tmdb_id ?? item.id,
    seasonNumber: item.season_number,
    episodeNumber: item.episode_number,
  });

  const handlePlay = () => navigate(playPath);
  const handleDetails = () => navigate(`/${mediaType}/${item.id}`);

  const handleWatchlist = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) { base44.auth.redirectToLogin(); return; }
      if (inList) {
        const existing = await base44.entities.Watchlist.filter({ tmdb_id: item.id, created_by: user.email });
        if (existing.length > 0) await base44.entities.Watchlist.delete(existing[0].id);
        setInList(false);
      } else {
        await base44.entities.Watchlist.create({
          tmdb_id: item.id, media_type: mediaType, title,
          poster_path: item.poster_path, backdrop_path: item.backdrop_path,
          vote_average: item.vote_average, overview, release_date: item.release_date || item.first_air_date,
          genre_ids: item.genre_ids,
        });
        setInList(true);
      }
    } catch {
      base44.auth.redirectToLogin();
    }
  };

  return (
    <div className="relative h-[86svh] min-h-[560px] w-full md:h-screen md:max-h-[900px] md:min-h-[600px]">
      {/* Backdrop */}
      <div className="absolute inset-0 overflow-hidden">
        {item.backdrop_path ? (
          <img
            src={tmdbOriginal(item.backdrop_path)}
            alt={title}
            className="w-full h-full object-cover object-center"
            style={{ transition: "opacity 0.8s ease" }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black" />
        )}
        {/* Gradients */}
        <div className="absolute inset-0 gradient-overlay" />
        <div className="absolute inset-0 gradient-bottom" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full max-w-2xl flex-col justify-end px-4 pb-8 md:px-16 md:pb-24">
        {/* Meta tags */}
        <div className="flex items-center gap-3 mb-3">
          {mediaType === "tv" && (
            <span className="bg-[#E50914] text-white text-xs font-bold px-2 py-0.5 rounded">SERIES</span>
          )}
          {matchPercentage && (
            <span className="text-green-400 text-sm font-bold">{matchPercentage}% Match</span>
          )}
          {!matchPercentage && rating && (
            <span className="text-green-400 text-sm font-bold">{rating}% Rating</span>
          )}
          {year && <span className="text-gray-300 text-sm">{year}</span>}
        </div>

        {/* Title */}
        <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-6xl">
          {title}
        </h1>

        {/* Overview */}
        <p className="text-gray-200 text-sm md:text-base leading-relaxed mb-6 line-clamp-3 drop-shadow">
          {overview}
        </p>

        {progressPercent > 0 && (
          <div className="mb-5 max-w-md">
            <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-white/65">
              <span>{getResumeLabel(item, mediaType)}</span>
              <span>{progressPercent}% watched</span>
            </div>
            <PlaybackProgressBar progress={progressPercent} className="h-2 bg-white/20" />
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePlay}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-white px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-gray-200 sm:flex-none sm:px-6 md:text-base"
          >
            <Play className="w-5 h-5 fill-black" /> {getResumeLabel(item, mediaType)}
          </button>
          <button
            onClick={handleDetails}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-gray-600/80 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-gray-500/80 sm:flex-none sm:px-6 md:text-base"
          >
            <Info className="w-5 h-5" /> More Info
          </button>
          <button
            onClick={handleWatchlist}
            className="ml-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-gray-400 transition-colors hover:border-white"
          >
            {inList ? <Check className="w-5 h-5 text-white" /> : <Plus className="w-5 h-5 text-white" />}
          </button>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 right-8 flex gap-1.5 z-10">
        {items.slice(0, 5).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-0.5 rounded-full transition-all duration-300 ${
              i === current ? "w-6 bg-white" : "w-3 bg-gray-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
