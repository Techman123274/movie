import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate, useOutletContext } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";
import { searchMulti } from "@/lib/tmdb";
import ContentCard from "@/components/ui/ContentCard";
import { SearchCardSkeleton } from "@/components/ui/LoadingSkeleton";
import { filterItemsForProfile } from "@/lib/preferences";

export default function Search() {
  const { activeProfile } = useOutletContext() || {};
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
    <div className="min-h-screen bg-[#0a0a0a] pt-20 px-4 md:px-12">
      {/* Search Input */}
      <div className="max-w-2xl mx-auto mb-10 mt-4">
        <div className="relative flex items-center bg-[#141414] border border-gray-700 rounded-lg focus-within:border-white transition-colors">
          <SearchIcon className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInput}
            placeholder="Search movies, TV shows..."
            className="flex-1 bg-transparent text-white text-lg py-4 px-4 outline-none placeholder-gray-600"
          />
          {query && (
            <button onClick={clearSearch} className="mr-4 text-gray-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Popular Searches (when no query) */}
      {!query && !searched && (
        <div>
          <h2 className="text-white text-xl font-semibold mb-4">Popular Searches</h2>
          <div className="flex flex-wrap gap-2 mb-8">
            {POPULAR_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => {
                  setQuery(term);
                  setSearchParams({ q: term });
                }}
                className="bg-[#141414] hover:bg-[#1f1f1f] border border-gray-700 hover:border-gray-500 text-white px-4 py-2 rounded-full text-sm transition-colors"
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
                className="mt-6 bg-[#E50914] text-white px-6 py-2 rounded font-semibold hover:bg-[#c40812] transition-colors"
              >
                Browse Home
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {results.map((item) => (
                <div key={`${item.id}-${item.media_type}`} className="w-full">
                  <ContentCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
