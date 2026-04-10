import { useState, useEffect, useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Clock, Play, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { tmdbW300 } from "@/lib/tmdb";
import { filterItemsForProfile } from "@/lib/preferences";
import { buildWatchPath } from "@/lib/playback";
import PlaybackProgressBar from "@/components/ui/PlaybackProgressBar";
import { useAppTheme } from "@/lib/theme";

export default function History() {
  const { activeProfile } = useOutletContext() || {};
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.shellVariant === "hulu";
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
      <div className="min-h-screen bg-[var(--app-bg)] px-4 pt-24 md:px-12">
        <div className={`mb-8 animate-pulse rounded ${isHulu ? "h-10 w-72 bg-white/10" : "h-8 w-48 bg-[#1a1a1a]"}`} />
        <div className={`grid gap-3 ${isHulu ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}`}>
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className={`rounded-2xl animate-pulse ${isHulu ? "bg-white/10" : "bg-[#1a1a1a]"}`} style={{ aspectRatio: isHulu ? "16/9" : "2/3" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 pb-28 pt-24 md:px-12 md:pb-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-7 h-7 text-[var(--brand)]" />
          <h1 className="text-2xl font-bold text-white md:text-3xl">Watch History</h1>
        </div>
        {visibleItems.length > 0 && (
          <button
            onClick={clearAll}
            className="min-h-11 w-full rounded border border-gray-600 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-gray-400 hover:text-white sm:w-auto"
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
          <button onClick={() => navigate("/")} className="min-h-11 rounded bg-[var(--brand)] px-8 py-3 font-semibold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)]">
            Browse Content
          </button>
        </div>
      ) : (
        <div className={`grid gap-3 ${isHulu ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"}`}>
          {visibleItems.map((item) => (
            <div key={item.id} className={`group relative cursor-pointer overflow-hidden rounded-2xl ${isHulu ? "border border-white/8 bg-[rgba(255,255,255,0.03)]" : "bg-[#141414]"}`} style={{ aspectRatio: isHulu ? "16/9" : "2/3" }}>
              {item.poster_path ? (
                <img
                  src={tmdbW300(item.backdrop_path || item.poster_path)}
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

              <div className={`absolute inset-0 flex gap-2 transition-opacity ${isHulu ? "items-end justify-between bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.86)_100%)] p-4 opacity-100" : "items-end justify-center bg-gradient-to-t from-black/85 via-black/25 to-transparent p-3 opacity-100 md:items-center md:bg-black/60 md:p-0 md:opacity-0 md:group-hover:opacity-100"}`}>
                {isHulu && (
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/60">
                      {item.media_type === "tv" && item.season_number
                        ? `S${item.season_number}:E${item.episode_number}`
                        : item.media_type === "tv"
                          ? "Series"
                          : "Movie"}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => {
                    navigate(item.resume_path || buildWatchPath({
                      mediaType: item.media_type,
                      tmdbId: item.tmdb_id,
                      seasonNumber: item.season_number,
                      episodeNumber: item.episode_number,
                    }));
                  }}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-white p-3 text-black transition-colors hover:bg-gray-200"
                >
                  <Play className="w-5 h-5 fill-black" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                  className="flex min-h-11 min-w-11 items-center justify-center rounded-full bg-red-600/90 p-2 text-white transition-colors hover:bg-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* TV badge & episode info */}
              {!isHulu && item.media_type === "tv" && item.season_number && (
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
