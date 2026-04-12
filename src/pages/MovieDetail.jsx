import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Play, Plus, Check, X, Star, Clock, ThumbsUp } from "lucide-react";
import { getMovieDetails, tmdbOriginal, tmdbW500, tmdbW185, getYouTubeTrailer } from "@/lib/tmdb";
import ContentRow from "@/components/ui/ContentRow";
import RatingStars from "@/components/ui/RatingStars";
import TitleSocialPanel from "@/components/social/TitleSocialPanel";
import { DetailSkeleton } from "@/components/ui/LoadingSkeleton";
import { base44 } from "@/api/base44Client";
import ProfileRestrictionNotice from "@/components/profile/ProfileRestrictionNotice";
import { filterItemsForProfile, isAllowedForProfile } from "@/lib/preferences";
import { buildWatchPath, getLatestHistoryEntry, getResumeLabel, shouldResumePlayback } from "@/lib/playback";
import {
  getWatchlistEntry,
  isItemLiked,
  LIBRARY_CHANGED_EVENT,
  toggleLikedItem,
  toggleWatchlistItem,
} from "@/lib/library";
import {
  clearRating,
  getRatingEntry,
  getTitleFriendSignals,
  saveRating,
} from "@/lib/social";
import { useAppTheme } from "@/lib/theme";

export default function MovieDetail() {
  const { id } = useParams();
  const { activeProfile } = useOutletContext() || {};
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.detailVariant === "hulu";
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [inList, setInList] = useState(false);
  const [liked, setLiked] = useState(false);
  const [resumeEntry, setResumeEntry] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [friendsSummary, setFriendsSummary] = useState("");
  const [savingRating, setSavingRating] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMovie(null);
    window.scrollTo(0, 0);
    getMovieDetails(id)
      .then(setMovie)
      .catch(() => setMovie(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const loadLibraryState = async () => {
      const user = await base44.auth.me().catch(() => null);
      if (!user || cancelled) {
        if (!cancelled) {
          setInList(false);
          setLiked(false);
          setResumeEntry(null);
          setUserRating(0);
          setFriendsSummary("");
        }
        return;
      }

      const [watchlistEntry, historyEntries, ratingEntry, friendSignals] = await Promise.all([
        getWatchlistEntry({ tmdb_id: Number(id), media_type: "movie" }, "movie").catch(() => null),
        base44.entities.WatchHistory.filter({ tmdb_id: Number(id), media_type: "movie" }).catch(() => []),
        getRatingEntry({ tmdbId: Number(id), mediaType: "movie", profile: activeProfile }).catch(() => null),
        getTitleFriendSignals({ tmdbId: Number(id), mediaType: "movie" }).catch(() => ({ summary: "" })),
      ]);

      if (!cancelled) {
        setInList(Boolean(watchlistEntry));
        setLiked(isItemLiked(user, activeProfile, { tmdb_id: Number(id), media_type: "movie" }, "movie"));
        setResumeEntry(getLatestHistoryEntry(historyEntries));
        setUserRating(Number(ratingEntry?.rating_value) || 0);
        setFriendsSummary(friendSignals.summary || "");
      }
    };

    loadLibraryState();
    window.addEventListener(LIBRARY_CHANGED_EVENT, loadLibraryState);
    return () => {
      cancelled = true;
      window.removeEventListener(LIBRARY_CHANGED_EVENT, loadLibraryState);
    };
  }, [id, activeProfile]);

  const handleWatchlist = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) { base44.auth.redirectToLogin(); return; }
      const result = await toggleWatchlistItem({ item: movie, mediaType: "movie" });
      setInList(result.inWatchlist);
    } catch { base44.auth.redirectToLogin(); }
  };

  const handleLike = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) { base44.auth.redirectToLogin(); return; }
      const nextLiked = toggleLikedItem({
        user,
        profile: activeProfile,
        item: movie,
        mediaType: "movie",
      });
      setLiked(nextLiked);
    } catch { base44.auth.redirectToLogin(); }
  };

  const handleRate = async (nextRating) => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }

      setSavingRating(true);
      await saveRating({
        user,
        profile: activeProfile,
        item: movie,
        mediaType: "movie",
        ratingValue: nextRating,
      });
      setUserRating(nextRating);
      const friendSignals = await getTitleFriendSignals({ tmdbId: Number(id), mediaType: "movie" }).catch(() => ({ summary: "" }));
      setFriendsSummary(friendSignals.summary || "");
    } catch {
      base44.auth.redirectToLogin();
    } finally {
      setSavingRating(false);
    }
  };

  const handleClearRating = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }

      setSavingRating(true);
      await clearRating({ tmdbId: Number(id), mediaType: "movie", profile: activeProfile });
      setUserRating(0);
    } catch {
      base44.auth.redirectToLogin();
    } finally {
      setSavingRating(false);
    }
  };

  if (loading) return <DetailSkeleton />;
  if (!movie) return (
    <div className="app-page app-page-content app-page-animate flex items-center justify-center bg-[#0a0a0a]">
      <p className="text-gray-400">Movie not found.</p>
    </div>
  );

  const trailerUrl = getYouTubeTrailer(movie.videos);
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : null;
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const year = movie.release_date?.slice(0, 4);
  const cast = movie.credits?.cast?.slice(0, 12) || [];
  const similar = filterItemsForProfile(
    [...(movie.similar?.results || []), ...(movie.recommendations?.results || [])].slice(0, 20),
    activeProfile
  );
  const isAllowed = isAllowedForProfile(movie, activeProfile);
  const canResume = shouldResumePlayback(resumeEntry);
  const playPath = resumeEntry?.resume_path || buildWatchPath({
    mediaType: "movie",
    tmdbId: Number(id),
  });
  const playLabel = getResumeLabel(resumeEntry, "movie");

  if (!isAllowed) {
    return (
      <ProfileRestrictionNotice
        profile={activeProfile}
        title="This movie is locked on this profile"
        description="Its maturity level is outside the limit for the current profile. Switch profiles to watch it."
        onAction={() => navigate(-1)}
      />
    );
  }

  if (isHulu) {
    return (
      <div className="min-h-[var(--app-viewport-height)] bg-[var(--app-bg)] pb-[calc(var(--app-bottom-offset)+0.75rem)] pt-[calc(var(--app-top-offset)+0.5rem)] md:pb-12 md:pt-20">
        <div className="mx-auto max-w-7xl px-4 pb-12 md:px-12">
          <section className="relative overflow-hidden rounded-[28px] border border-white/8 bg-[var(--panel-bg)] shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-0">
              {movie.backdrop_path ? (
                <img
                  src={tmdbOriginal(movie.backdrop_path)}
                  alt={movie.title}
                  className="h-full w-full object-cover object-top"
                />
              ) : null}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,10,8,0.96)_0%,rgba(8,14,11,0.78)_44%,rgba(8,14,11,0.3)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,6,0.08)_0%,rgba(5,8,6,0.78)_100%)]" />
            </div>

            <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="max-w-3xl">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgba(29,231,144,0.24)] bg-[rgba(29,231,144,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
                    Movie
                  </span>
                  {year && (
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
                      {year}
                    </span>
                  )}
                </div>

                <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">
                  {movie.title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/65">
                  {rating && (
                    <div className="flex items-center gap-1 text-[var(--brand)]">
                      <Star className="h-4 w-4 fill-[var(--brand)]" />
                      <span className="font-semibold">{rating}</span>
                    </div>
                  )}
                  {runtime && <span>{runtime}</span>}
                  <span>Movie</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                    HD
                  </span>
                </div>

                {movie.genres?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {movie.genres.slice(0, 4).map((genre) => (
                      <span key={genre.id} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/68">
                        {genre.name}
                      </span>
                    ))}
                  </div>
                )}

                <p className="mt-5 max-w-2xl text-sm leading-relaxed text-white/74 md:text-base">
                  {movie.overview}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(playPath)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-bold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)]"
                  >
                    <Play className="h-4 w-4 fill-[var(--brand-contrast)]" /> {playLabel}
                  </button>
                  <button
                    onClick={handleWatchlist}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                  >
                    {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {inList ? "Saved" : "My Stuff"}
                  </button>
                  <button
                    onClick={handleLike}
                    className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-6 py-3 text-sm font-semibold transition-colors ${
                      liked
                        ? "border-[var(--brand)] bg-[rgba(29,231,144,0.12)] text-[var(--brand)] hover:bg-[rgba(29,231,144,0.18)]"
                        : "border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                    }`}
                  >
                    <ThumbsUp className={`h-4 w-4 ${liked ? "fill-[var(--brand)]" : ""}`} />
                    {liked ? "Liked" : "Rate Up"}
                  </button>
                  {trailerUrl && (
                    <button
                      onClick={() => setShowTrailer(true)}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                    >
                      Trailer
                    </button>
                  )}
                </div>

                {canResume && (
                  <p className="mt-3 text-sm text-white/56">
                    Pick up where you left off without losing your spot.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="overflow-hidden rounded-[22px] border border-white/10 bg-black/20">
                  {movie.poster_path ? (
                    <img src={tmdbW500(movie.poster_path)} alt={movie.title} className="w-full object-cover" />
                  ) : (
                    <div className="aspect-[2/3] w-full bg-[#1a1a1a]" />
                  )}
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/45">Your Rating</p>
                  <div className="mt-3">
                    <RatingStars value={userRating} onChange={handleRate} disabled={savingRating} />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {userRating > 0 && (
                      <button
                        type="button"
                        onClick={handleClearRating}
                        className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/75 hover:border-white/25 hover:text-white"
                      >
                        Clear
                      </button>
                    )}
                    {friendsSummary && (
                      <p className="text-sm text-[#86efac]">{friendsSummary}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-8 grid grid-cols-1 gap-3 rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-5 text-sm sm:grid-cols-2">
                {movie.spoken_languages?.length > 0 && (
                  <div>
                    <span className="text-white/45">Languages: </span>
                    <span className="text-white/75">{movie.spoken_languages.map((language) => language.english_name).join(", ")}</span>
                  </div>
                )}
                {movie.production_companies?.slice(0, 2).length > 0 && (
                  <div>
                    <span className="text-white/45">Studio: </span>
                    <span className="text-white/75">{movie.production_companies.slice(0, 2).map((company) => company.name).join(", ")}</span>
                  </div>
                )}
              </div>

              {cast.length > 0 && (
                <div className="mb-8">
                  <h2 className="mb-4 text-2xl font-bold text-white">Cast</h2>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {cast.map((person) => (
                      <div key={person.id} className="flex items-center gap-3 rounded-[20px] border border-white/8 bg-[rgba(255,255,255,0.03)] p-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#1a1a1a]">
                          {person.profile_path ? (
                            <img src={tmdbW185(person.profile_path)} alt={person.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-600">
                              {person.name?.[0]}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-white">{person.name}</p>
                          <p className="line-clamp-1 text-xs text-white/55">{person.character}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {similar.length > 0 && (
                <div className="mt-8">
                  <ContentRow
                    title="More Like This"
                    items={similar.map((entry) => ({ ...entry, media_type: "movie" }))}
                  />
                </div>
              )}
            </div>

            <div>
              <TitleSocialPanel item={movie} mediaType="movie" activeProfile={activeProfile} />
            </div>
          </div>
        </div>

        {showTrailer && trailerUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="relative aspect-video w-full max-w-4xl">
              <button
                onClick={() => setShowTrailer(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
              <iframe
                src={trailerUrl}
                className="h-full w-full rounded-lg"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-[var(--app-viewport-height)] bg-[#0a0a0a] pb-[calc(var(--app-bottom-offset)+0.75rem)] md:pb-12">
      {/* Hero Backdrop */}
      <div className="relative w-full h-[55vh] md:h-[70vh]">
        {movie.backdrop_path && (
          <img
            src={tmdbOriginal(movie.backdrop_path)}
            alt={movie.title}
            className="w-full h-full object-cover object-top"
          />
        )}
        <div className="absolute inset-0 gradient-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent opacity-60" />
      </div>

      {/* Content */}
      <div className="relative z-10 -mt-48 md:-mt-64 px-4 md:px-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0 hidden md:block">
            <div className="w-48 rounded-lg overflow-hidden shadow-2xl border border-white/10">
              {movie.poster_path ? (
                <img src={tmdbW500(movie.poster_path)} alt={movie.title} className="w-full" />
              ) : (
                <div className="w-full aspect-[2/3] bg-[#1a1a1a] flex items-center justify-center">
                  <span className="text-gray-500 text-sm text-center px-2">{movie.title}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">{movie.title}</h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              {rating && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <span className="font-bold">{rating}</span>
                </div>
              )}
              {year && <span className="text-gray-300">{year}</span>}
              {runtime && (
                <span className="flex items-center gap-1 text-gray-300">
                  <Clock className="w-3.5 h-3.5" /> {runtime}
                </span>
              )}
              <span className="border border-gray-500 text-gray-400 px-2 py-0.5 rounded text-xs">HD</span>
              {movie.genres?.slice(0, 3).map((g) => (
                <span key={g.id} className="bg-[#E50914]/20 text-[#E50914] text-xs px-2 py-0.5 rounded border border-[#E50914]/30">
                  {g.name}
                </span>
              ))}
            </div>

            {/* Actions */}
            <div className="mb-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <button
                onClick={() => navigate(playPath)}
                className="flex min-h-11 items-center justify-center gap-2 rounded bg-white px-8 py-3 text-sm font-bold text-black transition-colors hover:bg-gray-200"
              >
                <Play className="w-5 h-5 fill-black" /> {playLabel}
              </button>
              <button
                onClick={handleWatchlist}
                className="flex min-h-11 items-center justify-center gap-2 rounded bg-gray-600/80 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-500/80"
              >
                {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {inList ? "In My List" : "My List"}
              </button>
              <button
                onClick={handleLike}
                className={`flex min-h-11 items-center justify-center gap-2 rounded border px-6 py-3 text-sm transition-colors ${
                  liked
                    ? "border-[#E50914] bg-[#E50914]/15 text-white hover:bg-[#E50914]/25"
                    : "border-gray-500 text-white hover:border-white"
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${liked ? "fill-[#E50914] text-[#E50914]" : ""}`} />
                {liked ? "Liked" : "Rate Up"}
              </button>
              {trailerUrl && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex min-h-11 items-center justify-center gap-2 rounded border border-gray-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:border-white"
                >
                  Trailer
                </button>
              )}
            </div>

            {canResume && (
              <p className="-mt-2 mb-6 text-sm text-white/65">
                Pick up where you left off without losing your spot.
              </p>
            )}

            {/* Overview */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-gray-500">Your Rating</p>
                  <div className="mt-2">
                    <RatingStars value={userRating} onChange={handleRate} disabled={savingRating} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {userRating > 0 && (
                    <button
                      type="button"
                      onClick={handleClearRating}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white/75 hover:border-white/25 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                  {friendsSummary && (
                    <p className="max-w-sm text-sm text-[#86efac]">{friendsSummary}</p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">{movie.overview}</p>

            {/* Details grid */}
            <div className="mb-8 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
              {movie.spoken_languages?.length > 0 && (
                <div>
                  <span className="text-gray-500">Languages: </span>
                  <span className="text-gray-300">{movie.spoken_languages.map((l) => l.english_name).join(", ")}</span>
                </div>
              )}
              {movie.production_companies?.slice(0, 2).length > 0 && (
                <div>
                  <span className="text-gray-500">Studio: </span>
                  <span className="text-gray-300">{movie.production_companies.slice(0, 2).map((c) => c.name).join(", ")}</span>
                </div>
              )}
            </div>

            {/* Cast */}
            {cast.length > 0 && (
              <div className="mb-8">
                <h2 className="text-white font-semibold text-lg mb-4">Cast</h2>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
                  {cast.map((person) => (
                    <div key={person.id} className="flex-shrink-0 w-20 text-center">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-[#1a1a1a] mb-2 mx-auto">
                        {person.profile_path ? (
                          <img src={tmdbW185(person.profile_path)} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xl font-bold">
                            {person.name?.[0]}
                          </div>
                        )}
                      </div>
                      <p className="text-white text-xs font-medium line-clamp-2 leading-tight">{person.name}</p>
                      <p className="text-gray-500 text-xs line-clamp-1">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <TitleSocialPanel item={movie} mediaType="movie" activeProfile={activeProfile} />
          </div>
        </div>

        {/* Similar titles */}
        {similar.length > 0 && (
          <div className="mt-8">
            <ContentRow
              title="More Like This"
              items={similar.map((m) => ({ ...m, media_type: "movie" }))}
            />
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailerUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl aspect-video">
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
            <iframe
              src={trailerUrl}
              className="w-full h-full rounded-lg"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
