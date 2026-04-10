import { useState, useEffect } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import ContentRow from "@/components/ui/ContentRow";
import { getPopularMovies, getTopRatedMovies, getPopularTV, getTopRatedTV, getByGenre, getAiringTodayTV } from "@/lib/tmdb";
import { filterItemsForProfile } from "@/lib/preferences";

const MOVIE_GENRE_ROWS = [
  { id: 28, name: "Action" }, { id: 35, name: "Comedy" }, { id: 18, name: "Drama" },
  { id: 27, name: "Horror" }, { id: 878, name: "Sci-Fi" }, { id: 10749, name: "Romance" },
];

const TV_GENRE_ROWS = [
  { id: 18, name: "Drama" }, { id: 35, name: "Comedy" }, { id: 10759, name: "Action & Adventure" },
  { id: 9648, name: "Mystery" }, { id: 10765, name: "Sci-Fi & Fantasy" }, { id: 10762, name: "Kids" },
];

const dedupeItems = (items) => {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = `${item.media_type || "movie"}-${item.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const buildShelf = (...groups) => dedupeItems(groups.flat().filter(Boolean));

export default function Browse() {
  const { activeProfile } = useOutletContext() || {};
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "movie";
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, [type, activeProfile]);

  const loadContent = async () => {
    setLoading(true);
    setRows([]);

    if (activeProfile?.is_kids) {
      if (type === "movie") {
        const [popular, popularPage2, topRated, animation, family, adventure, comedy, fantasy] = await Promise.all([
          getPopularMovies().catch(() => ({ results: [] })),
          getPopularMovies(2).catch(() => ({ results: [] })),
          getTopRatedMovies().catch(() => ({ results: [] })),
          getByGenre(16, "movie").catch(() => ({ results: [] })),
          getByGenre(10751, "movie").catch(() => ({ results: [] })),
          getByGenre(12, "movie").catch(() => ({ results: [] })),
          getByGenre(35, "movie").catch(() => ({ results: [] })),
          getByGenre(14, "movie").catch(() => ({ results: [] })),
        ]);

        setRows([
          {
            title: "Popular with Kids",
            items: filterItemsForProfile(
              buildShelf(
                (popular.results || []).map((item) => ({ ...item, media_type: "movie" })),
                (popularPage2.results || []).map((item) => ({ ...item, media_type: "movie" }))
              ),
              activeProfile
            ),
          },
          {
            title: "Animated Favorites",
            items: filterItemsForProfile(
              buildShelf(
                (animation.results || []).map((item) => ({ ...item, media_type: "movie" })),
                (topRated.results || []).map((item) => ({ ...item, media_type: "movie" }))
              ),
              activeProfile
            ),
          },
          {
            title: "Family Movie Night",
            items: filterItemsForProfile(
              buildShelf(
                (family.results || []).map((item) => ({ ...item, media_type: "movie" })),
                (popular.results || []).map((item) => ({ ...item, media_type: "movie" }))
              ),
              activeProfile
            ),
          },
          {
            title: "Adventure Time",
            items: filterItemsForProfile(
              buildShelf(
                (adventure.results || []).map((item) => ({ ...item, media_type: "movie" })),
                (fantasy.results || []).map((item) => ({ ...item, media_type: "movie" }))
              ),
              activeProfile
            ),
          },
          {
            title: "Laugh Out Loud",
            items: filterItemsForProfile(
              buildShelf(
                (comedy.results || []).map((item) => ({ ...item, media_type: "movie" })),
                (animation.results || []).map((item) => ({ ...item, media_type: "movie" }))
              ),
              activeProfile
            ),
          },
          {
            title: "Top Kids Movies",
            items: filterItemsForProfile(
              buildShelf(
                (topRated.results || []).map((item) => ({ ...item, media_type: "movie" })),
                (family.results || []).map((item) => ({ ...item, media_type: "movie" }))
              ),
              activeProfile
            ),
          },
        ]);
      } else {
        const [popular, popularPage2, topRated, airingToday, kidsTV, animation, comedy, documentary] = await Promise.all([
          getPopularTV().catch(() => ({ results: [] })),
          getPopularTV(2).catch(() => ({ results: [] })),
          getTopRatedTV().catch(() => ({ results: [] })),
          getAiringTodayTV().catch(() => ({ results: [] })),
          getByGenre(10762, "tv").catch(() => ({ results: [] })),
          getByGenre(16, "tv").catch(() => ({ results: [] })),
          getByGenre(35, "tv").catch(() => ({ results: [] })),
          getByGenre(99, "tv").catch(() => ({ results: [] })),
        ]);

        setRows([
          {
            title: "Popular with Kids",
            items: filterItemsForProfile(
              buildShelf(
                (popular.results || []).map((item) => ({ ...item, media_type: "tv" })),
                (popularPage2.results || []).map((item) => ({ ...item, media_type: "tv" }))
              ),
              activeProfile
            ),
          },
          {
            title: "Kids TV",
            items: filterItemsForProfile(
              buildShelf(
                (kidsTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
                (popular.results || []).map((item) => ({ ...item, media_type: "tv" }))
              ),
              activeProfile
            ),
          },
          {
            title: "Animated Series",
            items: filterItemsForProfile(
              buildShelf(
                (animation.results || []).map((item) => ({ ...item, media_type: "tv" })),
                (topRated.results || []).map((item) => ({ ...item, media_type: "tv" }))
              ),
              activeProfile
            ),
          },
          {
            title: "Funny Shows",
            items: filterItemsForProfile(
              buildShelf(
                (comedy.results || []).map((item) => ({ ...item, media_type: "tv" })),
                (kidsTV.results || []).map((item) => ({ ...item, media_type: "tv" }))
              ),
              activeProfile
            ),
          },
          {
            title: "Learning and Nature",
            items: filterItemsForProfile(
              buildShelf(
                (documentary.results || []).map((item) => ({ ...item, media_type: "tv" })),
                (kidsTV.results || []).map((item) => ({ ...item, media_type: "tv" }))
              ),
              activeProfile
            ),
          },
          {
            title: "Top Kids Shows",
            items: filterItemsForProfile(
              buildShelf(
                (topRated.results || []).map((item) => ({ ...item, media_type: "tv" })),
                (kidsTV.results || []).map((item) => ({ ...item, media_type: "tv" }))
              ),
              activeProfile
            ),
          },
          {
            title: "New for Kids",
            items: filterItemsForProfile(
              buildShelf(
                (airingToday.results || []).map((item) => ({ ...item, media_type: "tv" })),
                (popular.results || []).map((item) => ({ ...item, media_type: "tv" }))
              ),
              activeProfile
            ),
          },
        ]);
      }
      setLoading(false);
      return;
    }

    if (type === "movie") {
      const [popular, topRated, ...genreResults] = await Promise.all([
        getPopularMovies().catch(() => ({ results: [] })),
        getTopRatedMovies().catch(() => ({ results: [] })),
        ...MOVIE_GENRE_ROWS.map((g) => getByGenre(g.id, "movie").catch(() => ({ results: [] }))),
      ]);
      setRows([
        { title: "Popular Movies", items: filterItemsForProfile(popular.results || [], activeProfile) },
        { title: "Top Rated Movies", items: filterItemsForProfile(topRated.results || [], activeProfile) },
        ...MOVIE_GENRE_ROWS.map((g, i) => ({
          title: g.name + " Movies",
          items: filterItemsForProfile((genreResults[i]?.results || []).map((m) => ({ ...m, media_type: "movie" })), activeProfile),
        })),
      ]);
    } else {
      const [popular, topRated, ...genreResults] = await Promise.all([
        getPopularTV().catch(() => ({ results: [] })),
        getTopRatedTV().catch(() => ({ results: [] })),
        ...TV_GENRE_ROWS.map((g) => getByGenre(g.id, "tv").catch(() => ({ results: [] }))),
      ]);
      setRows([
        { title: "Popular TV Shows", items: filterItemsForProfile((popular.results || []).map((t) => ({ ...t, media_type: "tv" })), activeProfile) },
        { title: "Top Rated TV Shows", items: filterItemsForProfile((topRated.results || []).map((t) => ({ ...t, media_type: "tv" })), activeProfile) },
        ...TV_GENRE_ROWS.map((g, i) => ({
          title: g.name + " Shows",
          items: filterItemsForProfile((genreResults[i]?.results || []).map((t) => ({ ...t, media_type: "tv" })), activeProfile),
        })),
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-20">
      {/* Header */}
      <div className="px-4 py-6 md:px-12 md:py-8">
        <h1 className="text-2xl font-bold text-white md:text-4xl">
          {type === "movie" ? "Movies" : "TV Shows"}
        </h1>
      </div>

      {loading ? (
        <div className="space-y-8 px-4 md:px-12">
          {Array(4).fill(0).map((_, i) => (
            <div key={i}>
              <div className="h-5 w-40 bg-[#1a1a1a] rounded animate-pulse mb-3" />
              <div className="flex gap-2 overflow-hidden">
                {Array(7).fill(0).map((_, j) => (
                  <div key={j} className="w-[132px] flex-shrink-0 animate-pulse rounded bg-[#1a1a1a] sm:w-[150px] md:w-[clamp(140px,15vw,200px)]"
                    style={{ aspectRatio: "2/3" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pb-8">
          {rows.map((row) => (
            <ContentRow key={row.title} title={row.title} items={row.items} />
          ))}
        </div>
      )}
    </div>
  );
}
