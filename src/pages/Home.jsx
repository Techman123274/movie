import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import HeroBanner from "@/components/home/HeroBanner";
import ContentRow from "@/components/ui/ContentRow";
import { HeroSkeleton, RowSkeleton } from "@/components/ui/LoadingSkeleton";
import NoApiKeyBanner from "@/components/home/NoApiKeyBanner";
import {
  buildCuratedHomeState,
  fetchPublicFeaturedEntries,
  fetchPublicSiteSettings,
  getDefaultSiteSettings,
} from "@/lib/admin-config";
import {
  getTrending,
  getPopularMovies,
  getTopRatedMovies,
  getPopularTV,
  getTopRatedTV,
  getNowPlayingMovies,
  getAiringTodayTV,
  getByGenre,
  tmdbConfigured,
} from "@/lib/tmdb";
import { base44 } from "@/api/base44Client";
import { filterItemsForProfile } from "@/lib/preferences";
import {
  buildTasteProfile,
  decorateItemsWithMatch,
  getRecommendedItems,
  saveTasteProfile,
} from "@/lib/recommendations";

const KIDS_MOVIE_ROWS = [
  { id: 16, title: "Animated Favorites" },
  { id: 10751, title: "Family Movie Night" },
  { id: 12, title: "Adventure Time" },
  { id: 35, title: "Laugh Out Loud" },
  { id: 14, title: "Magic and Fantasy" },
];

const KIDS_TV_ROWS = [
  { id: 10762, title: "Kids TV" },
  { id: 16, title: "Animated Series" },
  { id: 35, title: "Funny Shows" },
  { id: 99, title: "Learning and Nature" },
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

export default function Home() {
  const { user, activeProfile } = useOutletContext() || {};
  const [heroItems, setHeroItems] = useState([]);
  const [rows, setRows] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [myList, setMyList] = useState([]);
  const [tasteProfile, setTasteProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    loadContent();
  }, [activeProfile, tasteProfile]);

  useEffect(() => {
    if (user) {
      loadUserContent();
      return;
    }
    setContinueWatching([]);
    setMyList([]);
  }, [user, activeProfile]);

  const loadContent = async () => {
    setLoading(true);
    setHasApiKey(tmdbConfigured());

    if (!tmdbConfigured()) {
      setHeroItems([]);
      setRows([]);
      setLoading(false);
      return;
    }

    const [publicSettings, featuredEntries] = await Promise.all([
      fetchPublicSiteSettings().catch(() => getDefaultSiteSettings()),
      fetchPublicFeaturedEntries(activeProfile).catch(() => []),
    ]);
    const curatedState = buildCuratedHomeState(
      featuredEntries,
      publicSettings.home_curated_row_title || "Staff Picks"
    );
    const curatedMode = publicSettings.home_curation_mode || "hybrid";

    if (activeProfile?.is_kids) {
      const [
        popularMovies,
        popularMoviesPage2,
        topMovies,
        popularTV,
        popularTVPage2,
        topTV,
        familyMovies,
        animatedMovies,
        adventureMovies,
        comedyMovies,
        fantasyMovies,
        kidsTV,
        animatedTV,
        comedyTV,
        documentaryTV,
      ] = await Promise.all([
        getPopularMovies().catch(() => ({ results: [] })),
        getPopularMovies(2).catch(() => ({ results: [] })),
        getTopRatedMovies().catch(() => ({ results: [] })),
        getPopularTV().catch(() => ({ results: [] })),
        getPopularTV(2).catch(() => ({ results: [] })),
        getTopRatedTV().catch(() => ({ results: [] })),
        getByGenre(10751, "movie").catch(() => ({ results: [] })),
        getByGenre(16, "movie").catch(() => ({ results: [] })),
        getByGenre(12, "movie").catch(() => ({ results: [] })),
        getByGenre(35, "movie").catch(() => ({ results: [] })),
        getByGenre(14, "movie").catch(() => ({ results: [] })),
        getByGenre(10762, "tv").catch(() => ({ results: [] })),
        getByGenre(16, "tv").catch(() => ({ results: [] })),
        getByGenre(35, "tv").catch(() => ({ results: [] })),
        getByGenre(99, "tv").catch(() => ({ results: [] })),
      ]);

      const kidsHeroPool = filterItemsForProfile(
        buildShelf(
          (familyMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
          (animatedMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
          (kidsTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
          (animatedTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
          (popularMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
          (popularTV.results || []).map((item) => ({ ...item, media_type: "tv" }))
        ),
        activeProfile
      );

      const defaultKidsRows = [
        {
          title: "Popular with Kids",
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (popularMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
              (popularMoviesPage2.results || []).map((item) => ({ ...item, media_type: "movie" })),
              (popularTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
              (popularTVPage2.results || []).map((item) => ({ ...item, media_type: "tv" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: KIDS_MOVIE_ROWS[0].title,
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (animatedMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
              (topMovies.results || []).map((item) => ({ ...item, media_type: "movie" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: KIDS_MOVIE_ROWS[1].title,
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (familyMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
              (popularMovies.results || []).map((item) => ({ ...item, media_type: "movie" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: KIDS_MOVIE_ROWS[2].title,
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (adventureMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
              (fantasyMovies.results || []).map((item) => ({ ...item, media_type: "movie" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: KIDS_MOVIE_ROWS[3].title,
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (comedyMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
              (animatedMovies.results || []).map((item) => ({ ...item, media_type: "movie" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: KIDS_MOVIE_ROWS[4].title,
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (fantasyMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
              (familyMovies.results || []).map((item) => ({ ...item, media_type: "movie" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: "Top Kids Movies",
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (topMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
              (popularMovies.results || []).map((item) => ({ ...item, media_type: "movie" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: KIDS_TV_ROWS[0].title,
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (kidsTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
              (popularTV.results || []).map((item) => ({ ...item, media_type: "tv" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: KIDS_TV_ROWS[1].title,
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (animatedTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
              (topTV.results || []).map((item) => ({ ...item, media_type: "tv" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: KIDS_TV_ROWS[2].title,
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (comedyTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
              (kidsTV.results || []).map((item) => ({ ...item, media_type: "tv" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: KIDS_TV_ROWS[3].title,
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (documentaryTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
              (kidsTV.results || []).map((item) => ({ ...item, media_type: "tv" }))
            ),
            activeProfile
          ), tasteProfile),
        },
        {
          title: "Top Kids Shows",
          items: decorateItemsWithMatch(filterItemsForProfile(
            buildShelf(
              (topTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
              (popularTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
              (popularTVPage2.results || []).map((item) => ({ ...item, media_type: "tv" }))
            ),
            activeProfile
          ), tasteProfile),
        },
      ];

      const curatedHero = decorateItemsWithMatch(curatedState.heroItems, tasteProfile).slice(0, 5);
      const curatedRows = curatedState.rows.map((row) => ({
        title: row.title,
        items: decorateItemsWithMatch(filterItemsForProfile(row.items, activeProfile), tasteProfile),
      })).filter((row) => row.items.length > 0);

      setHeroItems(curatedHero.length > 0 ? curatedHero : decorateItemsWithMatch(kidsHeroPool.slice(0, 5), tasteProfile));
      setRows(curatedMode === "curated" && curatedRows.length > 0 ? curatedRows : [...curatedRows, ...defaultKidsRows]);
      setLoading(false);
      return;
    }

    const [trending, popularMovies, topMovies, popularTV, topTV, nowPlaying, airingToday] =
      await Promise.all([
        getTrending("all", "week").catch(() => ({ results: [] })),
        getPopularMovies().catch(() => ({ results: [] })),
        getTopRatedMovies().catch(() => ({ results: [] })),
        getPopularTV().catch(() => ({ results: [] })),
        getTopRatedTV().catch(() => ({ results: [] })),
        getNowPlayingMovies().catch(() => ({ results: [] })),
        getAiringTodayTV().catch(() => ({ results: [] })),
      ]);

    const candidatePool = buildShelf(
      (trending.results || []).map((item) => ({ ...item, media_type: item.media_type || (item.title ? "movie" : "tv") })),
      (popularMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
      (topMovies.results || []).map((item) => ({ ...item, media_type: "movie" })),
      (popularTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
      (topTV.results || []).map((item) => ({ ...item, media_type: "tv" })),
      (nowPlaying.results || []).map((item) => ({ ...item, media_type: "movie" })),
      (airingToday.results || []).map((item) => ({ ...item, media_type: "tv" }))
    );
    const filteredCandidates = filterItemsForProfile(candidatePool, activeProfile);
    const recommendedItems = tasteProfile ? getRecommendedItems(filteredCandidates, tasteProfile, 20) : [];
    const heroSource = recommendedItems.length > 0
      ? recommendedItems
      : decorateItemsWithMatch(filterItemsForProfile(trending.results || [], activeProfile), tasteProfile);

    const curatedHero = decorateItemsWithMatch(curatedState.heroItems, tasteProfile).slice(0, 5);
    setHeroItems((curatedHero.length > 0 ? curatedHero : heroSource).slice(0, 5));

    const nextRows = [
      recommendedItems.length > 0 ? { title: "Recommended For You", items: recommendedItems } : null,
      { title: "Trending Now", items: decorateItemsWithMatch(filterItemsForProfile(trending.results || [], activeProfile), tasteProfile) },
      { title: "Now Playing in Theaters", items: decorateItemsWithMatch(filterItemsForProfile(nowPlaying.results || [], activeProfile), tasteProfile) },
      { title: "Popular Movies", items: decorateItemsWithMatch(filterItemsForProfile(popularMovies.results || [], activeProfile), tasteProfile) },
      { title: "Top Rated Movies", items: decorateItemsWithMatch(filterItemsForProfile(topMovies.results || [], activeProfile), tasteProfile) },
      { title: "Airing Today on TV", items: decorateItemsWithMatch(filterItemsForProfile(airingToday.results?.map(t => ({ ...t, media_type: "tv" })) || [], activeProfile), tasteProfile) },
      { title: "Popular TV Shows", items: decorateItemsWithMatch(filterItemsForProfile(popularTV.results?.map(t => ({ ...t, media_type: "tv" })) || [], activeProfile), tasteProfile) },
      { title: "Top Rated TV Shows", items: decorateItemsWithMatch(filterItemsForProfile(topTV.results?.map(t => ({ ...t, media_type: "tv" })) || [], activeProfile), tasteProfile) },
    ].filter(Boolean);

    const curatedRows = curatedState.rows.map((row) => ({
      title: row.title,
      items: decorateItemsWithMatch(filterItemsForProfile(row.items, activeProfile), tasteProfile),
    })).filter((row) => row.items.length > 0);

    setRows(curatedMode === "curated" && curatedRows.length > 0 ? curatedRows : [...curatedRows, ...nextRows]);
    setLoading(false);
  };

  const loadUserContent = async () => {
    const [history, watchlist] = await Promise.all([
      base44.entities.WatchHistory.list("-updated_date", 10).catch(() => []),
      base44.entities.Watchlist.list("-created_date", 20).catch(() => []),
    ]);
    const historyItems = history.map((h) => ({
      id: h.tmdb_id,
      title: h.title,
      poster_path: h.poster_path,
      backdrop_path: h.backdrop_path,
      media_type: h.media_type,
      vote_average: h.vote_average,
      progress_percent: h.progress_percent,
      release_date: h.release_date,
      genre_ids: h.genre_ids,
    }));
    const watchlistItems = watchlist.map((w) => ({
      id: w.tmdb_id,
      title: w.title,
      poster_path: w.poster_path,
      backdrop_path: w.backdrop_path,
      media_type: w.media_type,
      vote_average: w.vote_average,
      overview: w.overview,
      release_date: w.release_date,
      genre_ids: w.genre_ids,
    }));

    const nextTasteProfile = buildTasteProfile({
      history: filterItemsForProfile(historyItems, activeProfile),
      watchlist: filterItemsForProfile(watchlistItems, activeProfile),
    });

    setTasteProfile(nextTasteProfile);
    if (nextTasteProfile) {
      saveTasteProfile(nextTasteProfile, activeProfile);
    }

    setContinueWatching(decorateItemsWithMatch(filterItemsForProfile(historyItems, activeProfile), nextTasteProfile));
    setMyList(decorateItemsWithMatch(filterItemsForProfile(watchlistItems, activeProfile), nextTasteProfile));
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-4">
        <span className="text-[#E50914] font-black text-4xl tracking-tight mb-6">SUBFLIX</span>
        <h2 className="text-white text-2xl font-bold mb-3">Welcome to Subflix</h2>
        <p className="text-gray-400 mb-8 max-w-md">Open Settings to connect TMDB and start browsing movies and TV shows.</p>
        <NoApiKeyBanner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#0a0a0a]">
        <HeroSkeleton />
        <div className="mt-4 space-y-2">
          {Array(4).fill(0).map((_, i) => <RowSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0a]">
      {!hasApiKey && <NoApiKeyBanner />}
      <HeroBanner items={heroItems} />

      <div className="relative z-10 pb-8">
        {user && continueWatching.length > 0 && (
          <ContentRow title="Continue Watching" items={continueWatching} />
        )}
        {user && myList.length > 0 && (
          <ContentRow title="My List" items={myList} />
        )}
        {rows.map((row) => (
          <ContentRow key={row.title} title={row.title} items={row.items} />
        ))}
      </div>
    </div>
  );
}
