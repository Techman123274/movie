import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bookmark, Trash2, Play } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { tmdbW300 } from "@/lib/tmdb";
import { useAppOutletContext } from "@/lib/outlet-context";
import { filterItemsForProfile } from "@/lib/preferences";
import { LIBRARY_CHANGED_EVENT } from "@/lib/library";
import { attachPlaybackProgress, buildWatchPath } from "@/lib/playback";
import PlaybackProgressBar from "@/components/ui/PlaybackProgressBar";
import { useAppTheme } from "@/lib/theme";

export default function MyList() {
  const { activeProfile } = useAppOutletContext();
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.shellVariant === "hulu";
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
      <div className="min-h-screen bg-[var(--app-bg)] px-4 pt-24 md:px-12">
        <div className={`mb-8 animate-pulse rounded ${isHulu ? "h-10 w-56 bg-white/10" : "h-8 w-32 bg-[#1a1a1a]"}`} />
        <div className={`grid gap-3 ${isHulu ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}`}>
          {Array(12).fill(0).map((_, i) => (
            <div key={i} className={`rounded-2xl animate-pulse ${isHulu ? "bg-white/10" : "bg-[#1a1a1a]"}`} style={{ aspectRatio: isHulu ? "16/9" : "2/3" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 pb-28 pt-24 md:px-12 md:pb-12">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Bookmark className="h-7 w-7 text-[var(--brand)]" />
        <h1 className="text-2xl font-bold text-white md:text-3xl">My List</h1>
        {visibleItems.length > 0 && (
          <span className="text-base text-gray-500 md:text-lg">
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
            className="min-h-11 rounded bg-[var(--brand)] px-8 py-3 font-semibold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)]"
          >
            Browse Content
          </button>
        </div>
      ) : (
        <div className={`grid gap-3 ${isHulu ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}`}>
          {visibleItems.map((item) => (
            <div
              key={item.id}
              className={`group relative cursor-pointer overflow-hidden rounded-2xl ${isHulu ? "border border-white/8 bg-[rgba(255,255,255,0.03)]" : "bg-[#141414]"}`}
              style={{ aspectRatio: isHulu ? "16/9" : "2/3" }}
            >
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
                      {item.media_type === "tv" ? "Series" : "Movie"}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => navigate(item.resume_path || buildWatchPath({
                    mediaType: item.media_type,
                    tmdbId: item.tmdb_id,
                    seasonNumber: item.season_number,
                    episodeNumber: item.episode_number,
                  }))}
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

              {/* Media type badge */}
              {item.media_type === "tv" && (
                <div className="absolute top-2 left-2 rounded bg-[var(--brand)] px-1.5 py-0.5 text-xs font-bold text-[var(--brand-contrast)]">
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
