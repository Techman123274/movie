import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import ContentRow from "@/components/ui/ContentRow";
import { getByGenre, getMovieGenres, getPopularMovies, getPopularTV, getTVGenres } from "@/lib/tmdb";
import { filterItemsForProfile } from "@/lib/preferences";
import { useAppTheme } from "@/lib/theme";

const dedupeItems = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.media_type || "movie"}-${item.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const decorateMediaType = (items = [], type = "movie") =>
  items.map((item) => ({ ...item, media_type: type }));

export default function Browse() {
  const { activeProfile } = useOutletContext() || {};
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.shellVariant === "hulu";
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "movie";

  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("all");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);

  const getFeedResponse = async (nextPage = 1) => {
    if (selectedGenre === "all") {
      return type === "tv" ? getPopularTV(nextPage) : getPopularMovies(nextPage);
    }

    return getByGenre(Number(selectedGenre), type, nextPage);
  };

  useEffect(() => {
    let cancelled = false;

    const loadGenres = async () => {
      try {
        const response = type === "tv" ? await getTVGenres() : await getMovieGenres();
        if (cancelled) {
          return;
        }

        const nextGenres = [...(response?.genres || [])].sort((a, b) => a.name.localeCompare(b.name));
        setGenres(nextGenres);
      } catch {
        if (!cancelled) {
          setGenres([]);
        }
      }
    };

    setSelectedGenre("all");
    loadGenres();

    return () => {
      cancelled = true;
    };
  }, [type]);

  useEffect(() => {
    let cancelled = false;

    const loadFirstPage = async () => {
      setError("");
      setItems([]);
      setPage(1);
      setHasMore(false);
      setLoading(true);

      try {
        const response = await getFeedResponse(1);
        if (cancelled) {
          return;
        }

        const normalized = decorateMediaType(response?.results || [], type);
        const filtered = filterItemsForProfile(normalized, activeProfile);

        setItems(dedupeItems(filtered));
        setPage(1);
        setHasMore((response?.page || 1) < (response?.total_pages || 1));
      } catch (err) {
        if (cancelled) {
          return;
        }
        setError(err?.message || "We couldn’t load this genre right now.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFirstPage();

    return () => {
      cancelled = true;
    };
  }, [type, selectedGenre, activeProfile, refreshToken]);

  const handleLoadMore = async () => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    setLoadingMore(true);
    setError("");

    try {
      const response = await getFeedResponse(nextPage);
      const normalized = decorateMediaType(response?.results || [], type);
      const filtered = filterItemsForProfile(normalized, activeProfile);

      setItems((current) => dedupeItems([...current, ...filtered]));
      setPage(nextPage);
      setHasMore((response?.page || nextPage) < (response?.total_pages || nextPage));
    } catch (err) {
      setError(err?.message || "We couldn’t load more titles.");
    } finally {
      setLoadingMore(false);
    }
  };

  const selectedGenreLabel = useMemo(() => {
    if (selectedGenre === "all") {
      return type === "movie" ? "Popular Movies" : "Popular TV Shows";
    }

    const genre = genres.find((item) => String(item.id) === String(selectedGenre));
    if (!genre) {
      return type === "movie" ? "Movies" : "TV Shows";
    }

    return type === "movie" ? `${genre.name} Movies` : `${genre.name} Shows`;
  }, [genres, selectedGenre, type]);

  return (
    <div className="app-page app-page-animate bg-[var(--app-bg)]">
      <div className={`app-page-content py-4 md:py-8 ${isHulu ? "md:py-6" : "md:py-8"}`}>
        {isHulu && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
            Browse
          </p>
        )}

        <h1 className={`font-bold text-white ${isHulu ? "text-3xl md:text-5xl" : "text-2xl md:text-4xl"}`}>
          {type === "movie" ? "Movies" : "TV Shows"}
        </h1>

        {isHulu && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/62">
            Pick a genre at the top, browse a bigger feed, and load more titles whenever you want.
          </p>
        )}

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            Genre Filter
          </p>

          <div className="scrollbar-hide -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
            <button
              type="button"
              onClick={() => setSelectedGenre("all")}
              className={`min-h-10 shrink-0 snap-start rounded-full border px-4 text-sm font-semibold transition-colors ${
                selectedGenre === "all"
                  ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]"
                  : "border-white/15 bg-white/[0.03] text-white/75 hover:border-white/25 hover:bg-white/[0.08]"
              }`}
            >
              All
            </button>

            {genres.map((genre) => {
              const isSelected = String(selectedGenre) === String(genre.id);
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => setSelectedGenre(String(genre.id))}
                  className={`min-h-10 shrink-0 snap-start rounded-full border px-4 text-sm font-semibold transition-colors ${
                    isSelected
                      ? "border-[var(--brand)] bg-[var(--brand)] text-[var(--brand-contrast)]"
                      : "border-white/15 bg-white/[0.03] text-white/75 hover:border-white/25 hover:bg-white/[0.08]"
                  }`}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-[#E50914]/20 bg-[#E50914]/10 px-4 py-3 text-sm text-white/85">
            {error}
            <button
              type="button"
              onClick={() => setRefreshToken((current) => current + 1)}
              className="ml-3 rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white/85 hover:bg-white/[0.08]"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="app-page-content space-y-8 pb-8">
          <div>
            <div className={`mb-3 animate-pulse rounded ${isHulu ? "h-4 w-52 bg-white/10" : "h-5 w-40 bg-[#1a1a1a]"}`} />
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 7 }).map((_, j) => (
                <div
                  key={j}
                  className={`flex-shrink-0 animate-pulse rounded-2xl ${isHulu ? "w-[240px] bg-white/10" : "w-[132px] bg-[#1a1a1a] sm:w-[150px] md:w-[clamp(140px,15vw,200px)]"}`}
                  style={{ aspectRatio: isHulu ? "16/9" : "2/3" }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="pb-8">
          <ContentRow key={`${type}-${selectedGenre}`} title={selectedGenreLabel} items={items} />

          {!items.length && !error && (
            <div className="app-page-content px-4 text-sm text-white/60 md:px-12">
              No titles found in this genre. Try another filter.
            </div>
          )}

          {hasMore && (
            <div className="app-page-content mt-2 px-4 md:px-12">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] disabled:opacity-70 sm:w-auto"
              >
                {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loadingMore
                  ? "Loading more..."
                  : `Load More ${type === "movie" ? "Movies" : "Shows"}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
