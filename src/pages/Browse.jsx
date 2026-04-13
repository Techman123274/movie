import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ContentRow from "@/components/ui/ContentRow";
import {
  getAiringTodayTV,
  getByGenre,
  getNowPlayingMovies,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
  getTrending,
} from "@/lib/tmdb";
import { useAppOutletContext } from "@/lib/outlet-context";
import { filterItemsForProfile } from "@/lib/preferences";
import { useAppTheme } from "@/lib/theme";

const MOVIE_GENRE_ROWS = [
  { id: 28, name: "Action" }, { id: 35, name: "Comedy" }, { id: 18, name: "Drama" },
  { id: 27, name: "Horror" }, { id: 878, name: "Sci-Fi" }, { id: 10749, name: "Romance" },
];

const TV_GENRE_ROWS = [
  { id: 18, name: "Drama" }, { id: 35, name: "Comedy" }, { id: 10759, name: "Action & Adventure" },
  { id: 9648, name: "Mystery" }, { id: 10765, name: "Sci-Fi & Fantasy" }, { id: 10762, name: "Kids" },
];

const QUICK_FILTERS = [
  { id: "trending", label: "Trending" },
  { id: "top-rated", label: "Top Rated" },
  { id: "just-added", label: "Just Added" },
  { id: "comfort-picks", label: "Comfort Picks" },
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
const normalizeMediaItems = (items, mediaType) => (items || []).map((item) => ({ ...item, media_type: mediaType }));

const buildRows = (definitions, activeProfile) =>
  definitions
    .map((row) => ({
      ...row,
      items: filterItemsForProfile(row.items || [], activeProfile),
    }))
    .filter((row) => row.items.length > 0);

const getStandardFilterRows = async ({ type, quickFilter, activeProfile }) => {
  const genreRows = type === "movie" ? MOVIE_GENRE_ROWS : TV_GENRE_ROWS;

  if (quickFilter === "top-rated") {
    const [topRated, popular, ...genreResults] = type === "movie"
      ? await Promise.all([
        getTopRatedMovies().catch(() => ({ results: [] })),
        getPopularMovies().catch(() => ({ results: [] })),
        ...MOVIE_GENRE_ROWS.map((genre) => getByGenre(genre.id, "movie").catch(() => ({ results: [] }))),
      ])
      : await Promise.all([
        getTopRatedTV().catch(() => ({ results: [] })),
        getPopularTV().catch(() => ({ results: [] })),
        ...TV_GENRE_ROWS.map((genre) => getByGenre(genre.id, "tv").catch(() => ({ results: [] }))),
      ]);

    return buildRows([
      {
        title: type === "movie" ? "Top Rated Movies" : "Top Rated TV Shows",
        items: normalizeMediaItems(topRated.results, type),
      },
      {
        title: type === "movie" ? "Critics & Crowd Favorites" : "Acclaimed Series",
        items: buildShelf(normalizeMediaItems(topRated.results, type), normalizeMediaItems(popular.results, type)),
      },
      ...genreRows.map((genre, index) => ({
        title: `${genre.name} ${type === "movie" ? "Spotlight" : "Standouts"}`,
        items: normalizeMediaItems(genreResults[index]?.results, type),
      })),
    ], activeProfile);
  }

  if (quickFilter === "just-added") {
    if (type === "movie") {
      const [nowPlaying, popular, topRated, family, fantasy] = await Promise.all([
        getNowPlayingMovies().catch(() => ({ results: [] })),
        getPopularMovies().catch(() => ({ results: [] })),
        getTopRatedMovies().catch(() => ({ results: [] })),
        getByGenre(10751, "movie").catch(() => ({ results: [] })),
        getByGenre(14, "movie").catch(() => ({ results: [] })),
      ]);

      return buildRows([
        {
          title: "Fresh in Theaters",
          items: normalizeMediaItems(nowPlaying.results, "movie"),
        },
        {
          title: "Just Added to the Conversation",
          items: buildShelf(
            normalizeMediaItems(nowPlaying.results, "movie"),
            normalizeMediaItems(popular.results, "movie")
          ),
        },
        {
          title: "New Family Picks",
          items: buildShelf(
            normalizeMediaItems(family.results, "movie"),
            normalizeMediaItems(fantasy.results, "movie"),
            normalizeMediaItems(topRated.results, "movie")
          ),
        },
      ], activeProfile);
    }

    const [airingToday, popular, topRated, comedy, kids] = await Promise.all([
      getAiringTodayTV().catch(() => ({ results: [] })),
      getPopularTV().catch(() => ({ results: [] })),
      getTopRatedTV().catch(() => ({ results: [] })),
      getByGenre(35, "tv").catch(() => ({ results: [] })),
      getByGenre(10762, "tv").catch(() => ({ results: [] })),
    ]);

    return buildRows([
      {
        title: "Premiering Today",
        items: normalizeMediaItems(airingToday.results, "tv"),
      },
      {
        title: "Fresh Series to Start",
        items: buildShelf(
          normalizeMediaItems(airingToday.results, "tv"),
          normalizeMediaItems(popular.results, "tv")
        ),
      },
      {
        title: "Easy New Comfort Watches",
        items: buildShelf(
          normalizeMediaItems(comedy.results, "tv"),
          normalizeMediaItems(kids.results, "tv"),
          normalizeMediaItems(topRated.results, "tv")
        ),
      },
    ], activeProfile);
  }

  if (quickFilter === "comfort-picks") {
    if (type === "movie") {
      const [comedy, family, romance, animation, popular] = await Promise.all([
        getByGenre(35, "movie").catch(() => ({ results: [] })),
        getByGenre(10751, "movie").catch(() => ({ results: [] })),
        getByGenre(10749, "movie").catch(() => ({ results: [] })),
        getByGenre(16, "movie").catch(() => ({ results: [] })),
        getPopularMovies().catch(() => ({ results: [] })),
      ]);

      return buildRows([
        {
          title: "Cozy Movie Night",
          items: buildShelf(
            normalizeMediaItems(comedy.results, "movie"),
            normalizeMediaItems(family.results, "movie")
          ),
        },
        {
          title: "Warm & Familiar",
          items: buildShelf(
            normalizeMediaItems(romance.results, "movie"),
            normalizeMediaItems(animation.results, "movie"),
            normalizeMediaItems(popular.results, "movie")
          ),
        },
        {
          title: "Feel-Good Rewatchables",
          items: buildShelf(
            normalizeMediaItems(family.results, "movie"),
            normalizeMediaItems(animation.results, "movie"),
            normalizeMediaItems(comedy.results, "movie")
          ),
        },
      ], activeProfile);
    }

    const [comedy, familyFriendly, drama, kids, popular] = await Promise.all([
      getByGenre(35, "tv").catch(() => ({ results: [] })),
      getByGenre(10762, "tv").catch(() => ({ results: [] })),
      getByGenre(18, "tv").catch(() => ({ results: [] })),
      getByGenre(10762, "tv").catch(() => ({ results: [] })),
      getPopularTV().catch(() => ({ results: [] })),
    ]);

    return buildRows([
      {
        title: "Comfort Series",
        items: buildShelf(
          normalizeMediaItems(comedy.results, "tv"),
          normalizeMediaItems(kids.results, "tv")
        ),
      },
      {
        title: "Low-Stakes Favorites",
        items: buildShelf(
          normalizeMediaItems(familyFriendly.results, "tv"),
          normalizeMediaItems(drama.results, "tv"),
          normalizeMediaItems(popular.results, "tv")
        ),
      },
      {
        title: "Background Watch Gold",
        items: buildShelf(
          normalizeMediaItems(comedy.results, "tv"),
          normalizeMediaItems(popular.results, "tv"),
          normalizeMediaItems(kids.results, "tv")
        ),
      },
    ], activeProfile);
  }

  const [trending, popular, topRated, ...genreResults] = type === "movie"
    ? await Promise.all([
      getTrending("movie", "week").catch(() => ({ results: [] })),
      getPopularMovies().catch(() => ({ results: [] })),
      getTopRatedMovies().catch(() => ({ results: [] })),
      ...MOVIE_GENRE_ROWS.map((genre) => getByGenre(genre.id, "movie").catch(() => ({ results: [] }))),
    ])
    : await Promise.all([
      getTrending("tv", "week").catch(() => ({ results: [] })),
      getPopularTV().catch(() => ({ results: [] })),
      getTopRatedTV().catch(() => ({ results: [] })),
      ...TV_GENRE_ROWS.map((genre) => getByGenre(genre.id, "tv").catch(() => ({ results: [] }))),
    ]);

  return buildRows([
    {
      title: type === "movie" ? "Trending Movies" : "Trending TV Shows",
      items: normalizeMediaItems(trending.results, type),
    },
    {
      title: type === "movie" ? "Popular Right Now" : "Popular Right Now on TV",
      items: normalizeMediaItems(popular.results, type),
    },
    {
      title: type === "movie" ? "Top Rated Picks" : "Best Rated Series",
      items: normalizeMediaItems(topRated.results, type),
    },
    ...genreRows.map((genre, index) => ({
      title: `${genre.name} ${type === "movie" ? "Movies" : "Shows"}`,
      items: normalizeMediaItems(genreResults[index]?.results, type),
    })),
  ], activeProfile);
};

const getKidsFilterRows = async ({ type, quickFilter, activeProfile }) => {
  if (type === "movie") {
    const [popular, topRated, animation, family, adventure, comedy, fantasy, recent] = await Promise.all([
      getPopularMovies().catch(() => ({ results: [] })),
      getTopRatedMovies().catch(() => ({ results: [] })),
      getByGenre(16, "movie").catch(() => ({ results: [] })),
      getByGenre(10751, "movie").catch(() => ({ results: [] })),
      getByGenre(12, "movie").catch(() => ({ results: [] })),
      getByGenre(35, "movie").catch(() => ({ results: [] })),
      getByGenre(14, "movie").catch(() => ({ results: [] })),
      getNowPlayingMovies().catch(() => ({ results: [] })),
    ]);

    const filterRows = {
      trending: [
        { title: "Popular with Kids", items: buildShelf(normalizeMediaItems(popular.results, "movie"), normalizeMediaItems(animation.results, "movie")) },
        { title: "Adventure Time", items: buildShelf(normalizeMediaItems(adventure.results, "movie"), normalizeMediaItems(fantasy.results, "movie")) },
        { title: "Animated Favorites", items: buildShelf(normalizeMediaItems(animation.results, "movie"), normalizeMediaItems(topRated.results, "movie")) },
      ],
      "top-rated": [
        { title: "Top Kids Movies", items: buildShelf(normalizeMediaItems(topRated.results, "movie"), normalizeMediaItems(family.results, "movie")) },
        { title: "Animated Winners", items: buildShelf(normalizeMediaItems(animation.results, "movie"), normalizeMediaItems(topRated.results, "movie")) },
        { title: "Family Favourites", items: buildShelf(normalizeMediaItems(family.results, "movie"), normalizeMediaItems(popular.results, "movie")) },
      ],
      "just-added": [
        { title: "Fresh for Family Night", items: buildShelf(normalizeMediaItems(recent.results, "movie"), normalizeMediaItems(family.results, "movie")) },
        { title: "New Animated Picks", items: buildShelf(normalizeMediaItems(recent.results, "movie"), normalizeMediaItems(animation.results, "movie")) },
        { title: "Latest Adventures", items: buildShelf(normalizeMediaItems(adventure.results, "movie"), normalizeMediaItems(fantasy.results, "movie")) },
      ],
      "comfort-picks": [
        { title: "Cozy Family Rewatches", items: buildShelf(normalizeMediaItems(family.results, "movie"), normalizeMediaItems(animation.results, "movie")) },
        { title: "Laugh Out Loud", items: buildShelf(normalizeMediaItems(comedy.results, "movie"), normalizeMediaItems(popular.results, "movie")) },
        { title: "Magic & Wonder", items: buildShelf(normalizeMediaItems(fantasy.results, "movie"), normalizeMediaItems(family.results, "movie")) },
      ],
    };

    return buildRows(filterRows[quickFilter] || filterRows.trending, activeProfile);
  }

  const [popular, topRated, airingToday, kidsTV, animation, comedy, documentary] = await Promise.all([
    getPopularTV().catch(() => ({ results: [] })),
    getTopRatedTV().catch(() => ({ results: [] })),
    getAiringTodayTV().catch(() => ({ results: [] })),
    getByGenre(10762, "tv").catch(() => ({ results: [] })),
    getByGenre(16, "tv").catch(() => ({ results: [] })),
    getByGenre(35, "tv").catch(() => ({ results: [] })),
    getByGenre(99, "tv").catch(() => ({ results: [] })),
  ]);

  const filterRows = {
    trending: [
      { title: "Popular with Kids", items: buildShelf(normalizeMediaItems(popular.results, "tv"), normalizeMediaItems(kidsTV.results, "tv")) },
      { title: "Animated Series", items: buildShelf(normalizeMediaItems(animation.results, "tv"), normalizeMediaItems(topRated.results, "tv")) },
      { title: "Funny Shows", items: buildShelf(normalizeMediaItems(comedy.results, "tv"), normalizeMediaItems(kidsTV.results, "tv")) },
    ],
    "top-rated": [
      { title: "Top Kids Shows", items: buildShelf(normalizeMediaItems(topRated.results, "tv"), normalizeMediaItems(kidsTV.results, "tv")) },
      { title: "Animated Winners", items: buildShelf(normalizeMediaItems(animation.results, "tv"), normalizeMediaItems(topRated.results, "tv")) },
      { title: "Learning & Nature", items: buildShelf(normalizeMediaItems(documentary.results, "tv"), normalizeMediaItems(kidsTV.results, "tv")) },
    ],
    "just-added": [
      { title: "New for Kids", items: buildShelf(normalizeMediaItems(airingToday.results, "tv"), normalizeMediaItems(popular.results, "tv")) },
      { title: "Fresh Laughs", items: buildShelf(normalizeMediaItems(comedy.results, "tv"), normalizeMediaItems(airingToday.results, "tv")) },
      { title: "Fresh Animation", items: buildShelf(normalizeMediaItems(animation.results, "tv"), normalizeMediaItems(airingToday.results, "tv")) },
    ],
    "comfort-picks": [
      { title: "Comfort Cartoons", items: buildShelf(normalizeMediaItems(animation.results, "tv"), normalizeMediaItems(kidsTV.results, "tv")) },
      { title: "Easygoing Favorites", items: buildShelf(normalizeMediaItems(comedy.results, "tv"), normalizeMediaItems(popular.results, "tv")) },
      { title: "Curious Minds", items: buildShelf(normalizeMediaItems(documentary.results, "tv"), normalizeMediaItems(kidsTV.results, "tv")) },
    ],
  };

  return buildRows(filterRows[quickFilter] || filterRows.trending, activeProfile);
};

export default function Browse() {
  const { activeProfile } = useAppOutletContext();
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.shellVariant === "hulu";
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get("type") || "movie";
  const quickFilter = useMemo(() => {
    const requestedFilter = searchParams.get("filter") || "trending";
    return QUICK_FILTERS.some((filter) => filter.id === requestedFilter) ? requestedFilter : "trending";
  }, [searchParams]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadContent = async () => {
      setLoading(true);
      setRows([]);

      const nextRows = activeProfile?.is_kids
        ? await getKidsFilterRows({ type, quickFilter, activeProfile })
        : await getStandardFilterRows({ type, quickFilter, activeProfile });

      if (!active) {
        return;
      }

      setRows(nextRows);
      setLoading(false);
    };

    void loadContent();

    return () => {
      active = false;
    };
  }, [activeProfile, quickFilter, type]);

  const handleFilterChange = (filterId) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("type", type);
    nextParams.set("filter", filterId);
    setSearchParams(nextParams);
  };

  return (
    <div className="min-h-screen bg-[var(--app-bg)] pt-20">
      <div className={`px-4 py-6 md:px-12 ${isHulu ? "md:py-6" : "md:py-8"}`}>
        {isHulu && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
            Browse
          </p>
        )}
        <h1 className={`font-bold text-white ${isHulu ? "text-3xl md:text-5xl" : "text-2xl md:text-4xl"}`}>
          {type === "movie" ? "Movies" : "TV Shows"}
        </h1>
        <p className={`mt-3 max-w-2xl text-sm leading-relaxed ${isHulu ? "text-white/62" : "text-white/58"}`}>
          Switch lanes fast with curated chips that keep the current vibe in the URL for easy deep links.
        </p>
      </div>

      <div className="sticky top-[68px] z-20 border-y border-white/8 bg-[rgba(8,8,8,0.84)] backdrop-blur-xl">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3 md:px-12">
          {QUICK_FILTERS.map((filter) => {
            const isActive = filter.id === quickFilter;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => handleFilterChange(filter.id)}
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-[var(--brand)] bg-[rgba(var(--brand-rgb),0.16)] text-white"
                    : "border-white/10 bg-white/[0.03] text-white/68 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-8 px-4 py-6 md:px-12">
          {Array(4).fill(0).map((_, i) => (
            <div key={i}>
              <div className={`mb-3 animate-pulse rounded ${isHulu ? "h-4 w-52 bg-white/10" : "h-5 w-40 bg-[#1a1a1a]"}`} />
              <div className="flex gap-2 overflow-hidden">
                {Array(7).fill(0).map((_, j) => (
                  <div
                    key={j}
                    className={`flex-shrink-0 animate-pulse rounded-2xl ${isHulu ? "w-[240px] bg-white/10" : "w-[132px] bg-[#1a1a1a] sm:w-[150px] md:w-[clamp(140px,15vw,200px)]"}`}
                    style={{ aspectRatio: isHulu ? "16/9" : "2/3" }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pb-8 pt-4">
          {rows.map((row) => (
            <ContentRow key={row.title} title={row.title} items={row.items} />
          ))}
        </div>
      )}
    </div>
  );
}
