import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Info, Plus, Check } from "lucide-react";
import { tmdbOriginal } from "@/lib/tmdb";
import { base44 } from "@/api/base44Client";
import { getMatchPercentage } from "@/lib/recommendations";

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

  const handlePlay = () => navigate(`/watch/${mediaType}/${item.id}`);
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
    <div className="relative w-full h-screen min-h-[600px] max-h-[900px]">
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
      <div className="relative z-10 flex flex-col justify-end h-full pb-8 md:pb-24 px-4 md:px-16 max-w-2xl">
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
        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight drop-shadow-lg">
          {title}
        </h1>

        {/* Overview */}
        <p className="text-gray-200 text-sm md:text-base leading-relaxed mb-6 line-clamp-3 drop-shadow">
          {overview}
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2.5 rounded hover:bg-gray-200 transition-colors text-sm md:text-base"
          >
            <Play className="w-5 h-5 fill-black" /> Play
          </button>
          <button
            onClick={handleDetails}
            className="flex items-center gap-2 bg-gray-600/80 text-white font-semibold px-6 py-2.5 rounded hover:bg-gray-500/80 transition-colors text-sm md:text-base backdrop-blur-sm"
          >
            <Info className="w-5 h-5" /> More Info
          </button>
          <button
            onClick={handleWatchlist}
            className="w-10 h-10 rounded-full border-2 border-gray-400 flex items-center justify-center hover:border-white transition-colors ml-1"
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
