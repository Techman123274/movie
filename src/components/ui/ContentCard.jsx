import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Plus, Check, ThumbsUp, ChevronDown } from "lucide-react";
import { tmdbW300, tmdbW500, GENRE_MAP } from "@/lib/tmdb";
import { base44 } from "@/api/base44Client";
import { getMatchPercentage } from "@/lib/recommendations";

export default function ContentCard({ item, onWatchlistChange, isInWatchlist = false }) {
  const [hovered, setHovered] = useState(false);
  const [inList, setInList] = useState(isInWatchlist);
  const navigate = useNavigate();

  const title = item.title || item.name || "Unknown";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const genres = (item.genre_ids || []).slice(0, 3).map((id) => GENRE_MAP[id]).filter(Boolean);
  const rating = item.vote_average ? Math.round(item.vote_average * 10) : null;
  const matchPercentage = item.match_percentage || getMatchPercentage(item);

  const handlePlay = (event) => {
    event.stopPropagation();
    navigate(`/watch/${mediaType}/${item.id}`);
  };

  const handleDetails = () => {
    navigate(`/${mediaType}/${item.id}`);
  };

  const handleWatchlist = async (event) => {
    event.stopPropagation();
    try {
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }

      if (inList) {
        const items = await base44.entities.Watchlist.filter({ tmdb_id: item.id, created_by: user.email });
        if (items.length > 0) {
          await base44.entities.Watchlist.delete(items[0].id);
        }
        setInList(false);
      } else {
        await base44.entities.Watchlist.create({
          tmdb_id: item.id,
          media_type: mediaType,
          title,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average,
          overview: item.overview,
          release_date: item.release_date || item.first_air_date,
          genre_ids: item.genre_ids,
        });
        setInList(true);
      }
      onWatchlistChange?.();
    } catch {
      base44.auth.redirectToLogin();
    }
  };

  return (
    <div
      className="relative flex-shrink-0 cursor-pointer group"
      style={{ width: "clamp(140px, 15vw, 200px)", zIndex: hovered ? 50 : 1, position: "relative" }}
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

        {(matchPercentage || rating) && (
          <div className="absolute top-2 left-2 bg-[#E50914] text-white text-xs font-bold px-1.5 py-0.5 rounded">
            {matchPercentage || rating}%
          </div>
        )}
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
              <button className="w-8 h-8 rounded-full border border-gray-500 flex items-center justify-center hover:border-white transition-colors">
                <ThumbsUp className="w-4 h-4 text-white" />
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
              {matchPercentage && <span className="text-green-400 font-bold">{matchPercentage}% Match</span>}
              {!matchPercentage && rating && <span className="text-green-400 font-bold">{rating}% Rating</span>}
              {year && <span className="text-gray-400">{year}</span>}
              <span className="border border-gray-500 text-gray-400 px-1 text-[10px] rounded">HD</span>
            </div>

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
