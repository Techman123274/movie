import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";
import { searchMulti } from "@/lib/tmdb";
import ContentCard from "@/components/ui/ContentCard";
import { SearchCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { useAppOutletContext } from "@/lib/outlet-context";
import { filterItemsForProfile } from "@/lib/preferences";
import { useAppTheme } from "@/lib/theme";

export default function Search() {
  const { activeProfile } = useAppOutletContext();
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.shellVariant === "hulu";
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams, activeProfile]);

  const performSearch = async (q) => {
    if (!q?.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setSearched(true);
    const data = await searchMulti(q).catch(() => ({ results: [] }));
    setResults(
      filterItemsForProfile(
        (data.results || []).filter((r) => r.media_type !== "person" && r.poster_path),
        activeProfile
      )
    );
    setLoading(false);
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (val.trim()) {
        setSearchParams({ q: val.trim() });
      } else {
        setSearchParams({});
        setResults([]);
        setSearched(false);
      }
    }, 400);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setSearchParams({});
    inputRef.current?.focus();
  };

  const POPULAR_SEARCHES = ["Action", "Comedy", "Thriller", "Romance", "Horror", "Sci-Fi", "Documentary", "Animation"];

  return (
    <div className="min-h-screen bg-[var(--app-bg)] px-4 pb-28 pt-20 md:px-12 md:pb-12">
      <div className={`mx-auto mt-4 ${isHulu ? "mb-10 max-w-5xl" : "mb-8 max-w-2xl md:mb-10"}`}>
        {isHulu && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">Discover</p>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">Search the catalog</h1>
          </div>
        )}
        <div className={`relative flex items-center transition-colors focus-within:border-white ${isHulu ? "rounded-full border border-white/10 bg-[#111815] px-2 shadow-[0_18px_50px_rgba(0,0,0,0.24)]" : "rounded-lg border border-gray-700 bg-[#141414]"}`}>
          <SearchIcon className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            placeholder="Search movies, TV shows..."
            className={`min-w-0 flex-1 bg-transparent px-4 text-base text-white outline-none placeholder-gray-600 md:text-lg ${isHulu ? "py-5" : "py-4"}`}
          />
          {query && (
            <button onClick={clearSearch} className="mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-gray-400 transition-colors hover:text-white md:mr-4">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Popular Searches (when no query) */}
      {!query && !searched && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">Popular Searches</h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  setSearchParams({ q: term });
                }}
                className={`min-h-11 rounded-full px-4 py-2 text-sm text-white transition-colors ${isHulu ? "border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]" : "border border-gray-700 bg-[#141414] hover:border-gray-500 hover:bg-[#1f1f1f]"}`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div>
          <div className="h-5 w-48 bg-[#1a1a1a] rounded animate-pulse mb-4" />
          <SearchCardSkeleton count={12} />
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <div>
          <p className="text-gray-400 text-sm mb-4">
            {results.length > 0
              ? `${results.length} results for "${query}"`
              : `No results for "${query}"`}
          </p>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <SearchIcon className="w-16 h-16 text-gray-700 mb-4" />
              <p className="text-gray-500 text-lg mb-2">No results found</p>
              <p className="text-gray-600 text-sm">Try different keywords or browse our catalog</p>
              <button
                onClick={() => navigate("/")}
                className="mt-6 min-h-11 rounded bg-[var(--brand)] px-6 py-2 font-semibold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)]"
              >
                Browse Home
              </button>
            </div>
          ) : (
            <div className={`grid gap-3 ${isHulu ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"}`}>
              {results.map((item) => (
                <div key={`${item.id}-${item.media_type}`} className="w-full">
                  <ContentCard item={item} layout="grid" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
