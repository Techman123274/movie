import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Play, Plus, Check, X, Star, Clock } from "lucide-react";
import { getMovieDetails, tmdbOriginal, tmdbW500, tmdbW185, getYouTubeTrailer } from "@/lib/tmdb";
import ContentRow from "@/components/ui/ContentRow";
import { DetailSkeleton } from "@/components/ui/LoadingSkeleton";
import { base44 } from "@/api/base44Client";
import ProfileRestrictionNotice from "@/components/profile/ProfileRestrictionNotice";
import { filterItemsForProfile, isAllowedForProfile } from "@/lib/preferences";

export default function MovieDetail() {
  const { id } = useParams();
  const { activeProfile } = useOutletContext() || {};
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [inList, setInList] = useState(false);

  useEffect(() => {
    setLoading(true);
    setMovie(null);
    window.scrollTo(0, 0);
    getMovieDetails(id)
      .then(setMovie)
      .catch(() => setMovie(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleWatchlist = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) { base44.auth.redirectToLogin(); return; }
      if (inList) {
        const items = await base44.entities.Watchlist.filter({ tmdb_id: Number(id), created_by: user.email });
        if (items.length) await base44.entities.Watchlist.delete(items[0].id);
        setInList(false);
      } else {
        await base44.entities.Watchlist.create({
          tmdb_id: Number(id), media_type: "movie",
          title: movie.title, poster_path: movie.poster_path,
          backdrop_path: movie.backdrop_path, vote_average: movie.vote_average,
          overview: movie.overview, release_date: movie.release_date,
          genre_ids: movie.genres?.map((g) => g.id),
        });
        setInList(true);
      }
    } catch { base44.auth.redirectToLogin(); }
  };

  if (loading) return <DetailSkeleton />;
  if (!movie) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20">
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
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
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => navigate(`/watch/movie/${id}`)}
                className="flex items-center gap-2 bg-white text-black font-bold px-8 py-3 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                <Play className="w-5 h-5 fill-black" /> Play
              </button>
              <button
                onClick={handleWatchlist}
                className="flex items-center gap-2 bg-gray-600/80 text-white font-semibold px-6 py-3 rounded hover:bg-gray-500/80 transition-colors text-sm"
              >
                {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {inList ? "In My List" : "My List"}
              </button>
              {trailerUrl && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 border border-gray-500 text-white font-semibold px-6 py-3 rounded hover:border-white transition-colors text-sm"
                >
                  Trailer
                </button>
              )}
            </div>

            {/* Overview */}
            <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">{movie.overview}</p>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 text-sm mb-8">
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
