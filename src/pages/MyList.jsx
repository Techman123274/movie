import { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Bookmark, Trash2, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { tmdbW300 } from "@/lib/tmdb";
import { filterItemsForProfile } from "@/lib/preferences";
import { LIBRARY_CHANGED_EVENT } from "@/lib/library";
import { attachPlaybackProgress, buildWatchPath } from "@/lib/playback";
import PlaybackProgressBar from "@/components/ui/PlaybackProgressBar";

export default function MyList() {
  const { activeProfile } = useOutletContext() || {};
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const visibleItems = useMemo(
    () => filterItemsForProfile(items, activeProfile),
    [items, activeProfile]
  );

  const loadList = async () => {
    setLoading(true);
    const user = await base44.auth.me().catch(() => null);
    if (!user) { base44.auth.redirectToLogin(); return; }
    const [watchlist, history] = await Promise.all([
      base44.entities.Watchlist.list("-created_date", 100).catch(() => []),
      base44.entities.WatchHistory.list("-updated_date", 100).catch(() => []),
    ]);
    setItems(attachPlaybackProgress(watchlist, history));
    setLoading(false);
  };

  useEffect(() => {
    loadList();

    const handleLibraryChanged = (event) => {
      if (event.detail?.scope === "watchlist") {
        loadList();
      }
    };

    window.addEventListener(LIBRARY_CHANGED_EVENT, handleLibraryChanged);
    return () => window.removeEventListener(LIBRARY_CHANGED_EVENT, handleLibraryChanged);
  }, []);

  const removeItem = async (id) => {
    await base44.entities.Watchlist.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-24 px-4 md:px-12">
        <div className="h-8 w-32 bg-[#1a1a1a] rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className="rounded bg-[#1a1a1a] animate-pulse" style={{ aspectRatio: "2/3" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-24 px-4 md:px-12 pb-12">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark className="w-7 h-7 text-[#E50914]" />
        <h1 className="text-white text-3xl font-bold">My List</h1>
        {visibleItems.length > 0 && (
          <span className="text-gray-500 text-lg">
            {visibleItems.length} title{visibleItems.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {visibleItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Bookmark className="w-20 h-20 text-gray-700 mb-6" />
          <h2 className="text-white text-2xl font-semibold mb-2">
            {items.length === 0 ? "Your list is empty" : "Nothing in this list matches this profile"}
          </h2>
          <p className="text-gray-500 mb-8">
            {items.length === 0
              ? "Add movies and TV shows to your list to watch later."
              : "Switch profiles to see titles hidden by the current maturity setting."}
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-[#E50914] text-white px-8 py-3 rounded font-semibold hover:bg-[#c40812] transition-colors"
          >
            Browse Content
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {visibleItems.map((item) => (
            <div key={item.id} className="relative group rounded overflow-hidden bg-[#141414] cursor-pointer"
              style={{ aspectRatio: "2/3" }}>
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

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                <button
                  onClick={() => navigate(item.resume_path || buildWatchPath({
                    mediaType: item.media_type,
                    tmdbId: item.tmdb_id,
                    seasonNumber: item.season_number,
                    episodeNumber: item.episode_number,
                  }))}
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

              {/* Media type badge */}
              {item.media_type === "tv" && (
                <div className="absolute top-2 left-2 bg-[#E50914] text-white text-xs font-bold px-1.5 py-0.5 rounded">
                  TV
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
