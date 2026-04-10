import { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Clock, Play, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { tmdbW300 } from "@/lib/tmdb";
import { filterItemsForProfile } from "@/lib/preferences";
import { buildWatchPath } from "@/lib/playback";
import PlaybackProgressBar from "@/components/ui/PlaybackProgressBar";

export default function History() {
  const { activeProfile } = useOutletContext() || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const visibleItems = useMemo(
    () => filterItemsForProfile(items, activeProfile),
    [items, activeProfile]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const user = await base44.auth.me().catch(() => null);
      if (!user) { base44.auth.redirectToLogin(); return; }
      const data = await base44.entities.WatchHistory.list("-updated_date", 100).catch(() => []);
      setItems(data);
      setLoading(false);
    };
    load();
  }, []);

  const removeItem = async (id) => {
    await base44.entities.WatchHistory.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearAll = async () => {
    if (!confirm("Clear all watch history?")) return;
    await Promise.all(items.map((i) => base44.entities.WatchHistory.delete(i.id)));
    setItems([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-24 px-4 md:px-12">
        <div className="h-8 w-48 bg-[#1a1a1a] rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="rounded bg-[#1a1a1a] animate-pulse" style={{ aspectRatio: "2/3" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 px-4 md:px-12 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Clock className="w-7 h-7 text-[#E50914]" />
          <h1 className="text-white text-3xl font-bold">Watch History</h1>
        </div>
        {visibleItems.length > 0 && (
          <button
            onClick={clearAll}
            className="text-gray-400 hover:text-white text-sm border border-gray-600 hover:border-gray-400 px-4 py-2 rounded transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Clock className="w-20 h-20 text-gray-700 mb-6" />
          <h2 className="text-white text-2xl font-semibold mb-2">
            {items.length === 0 ? "No watch history" : "This profile cannot see the current watch history"}
          </h2>
          <p className="text-gray-500 mb-8">
            {items.length === 0
              ? "Start watching to build your history."
              : "Some entries are hidden because they are above this profile's maturity setting."}
          </p>
          <button onClick={() => navigate("/")} className="bg-[#E50914] text-white px-8 py-3 rounded font-semibold hover:bg-[#c40812] transition-colors">
            Browse Content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {visibleItems.map((item) => (
            <div key={item.id} className="relative group rounded overflow-hidden bg-[#141414] cursor-pointer" style={{ aspectRatio: "2/3" }}>
              {item.poster_path ? (
                <img
                  src={tmdbW300(item.poster_path)}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onClick={() => navigate(`/${item.media_type}/${item.tmdb_id}`)}
                />
              ) : (
                <div className="w-full h-full bg-[#1a1a1a] flex items-center justify-center p-4"
                  onClick={() => navigate(`/${item.media_type}/${item.tmdb_id}`)}>
                  <p className="text-gray-500 text-xs text-center">{item.title}</p>
                </div>
              )}

              <div className="absolute inset-x-2 bottom-2 z-10">
                <PlaybackProgressBar progress={item.progress_percent} />
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  onClick={() => {
                    navigate(item.resume_path || buildWatchPath({
                      mediaType: item.media_type,
                      tmdbId: item.tmdb_id,
                      seasonNumber: item.season_number,
                      episodeNumber: item.episode_number,
                    }));
                  }}
                  className="bg-white text-black rounded-full p-3 hover:bg-gray-200 transition-colors"
                >
                  <Play className="w-5 h-5 fill-black" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  className="bg-red-600/80 text-white rounded-full p-2 hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* TV badge & episode info */}
              {item.media_type === "tv" && item.season_number && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs font-medium line-clamp-1">{item.title}</p>
                  <p className="text-gray-400 text-xs">S{item.season_number}:E{item.episode_number}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
