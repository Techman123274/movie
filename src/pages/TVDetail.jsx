import { useState, useEffect } from "react";
import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { Play, Plus, Check, Star, X, ChevronDown } from "lucide-react";
import { getTVDetails, getTVSeason, tmdbOriginal, tmdbW500, tmdbW185, tmdbW300, getYouTubeTrailer } from "@/lib/tmdb";
import ContentRow from "@/components/ui/ContentRow";
import { DetailSkeleton } from "@/components/ui/LoadingSkeleton";
import { base44 } from "@/api/base44Client";
import ProfileRestrictionNotice from "@/components/profile/ProfileRestrictionNotice";
import { filterItemsForProfile, isAllowedForProfile } from "@/lib/preferences";

export default function TVDetail() {
  const { id } = useParams();
  const { activeProfile } = useOutletContext() || {};
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [seasonData, setSeasonData] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [inList, setInList] = useState(false);

  useEffect(() => {
    setLoading(true);
    setShow(null);
    window.scrollTo(0, 0);
    getTVDetails(id)
      .then((data) => {
        setShow(data);
        setSelectedSeason(1);
      })
      .catch(() => setShow(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!show) return;
    getTVSeason(id, selectedSeason).then(setSeasonData).catch(() => setSeasonData(null));
  }, [id, selectedSeason, show]);

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
          tmdb_id: Number(id), media_type: "tv",
          title: show.name, poster_path: show.poster_path,
          backdrop_path: show.backdrop_path, vote_average: show.vote_average,
          overview: show.overview, release_date: show.first_air_date,
          genre_ids: show.genres?.map((g) => g.id),
        });
        setInList(true);
      }
    } catch { base44.auth.redirectToLogin(); }
  };

  if (loading) return <DetailSkeleton />;
  if (!show) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center pt-20">
      <p className="text-gray-400">Show not found.</p>
    </div>
  );

  const trailerUrl = getYouTubeTrailer(show.videos);
  const rating = show.vote_average ? show.vote_average.toFixed(1) : null;
  const year = show.first_air_date?.slice(0, 4);
  const cast = (show.credits?.cast || show.aggregate_credits?.cast || []).slice(0, 12);
  const similar = filterItemsForProfile(
    [...(show.similar?.results || []), ...(show.recommendations?.results || [])].slice(0, 20),
    activeProfile
  );
  const isAllowed = isAllowedForProfile(show, activeProfile);

  if (!isAllowed) {
    return (
      <ProfileRestrictionNotice
        profile={activeProfile}
        title="This series is locked on this profile"
        description="Its maturity level is above the current profile limit. Switch profiles to browse episodes."
        onAction={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero */}
      <div className="relative w-full h-[55vh] md:h-[70vh]">
        {show.backdrop_path && (
          <img src={tmdbOriginal(show.backdrop_path)} alt={show.name} className="w-full h-full object-cover object-top" />
        )}
        <div className="absolute inset-0 gradient-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      <div className="relative z-10 -mt-48 md:-mt-64 px-4 md:px-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="hidden md:block flex-shrink-0">
            <div className="w-48 rounded-lg overflow-hidden shadow-2xl border border-white/10">
              {show.poster_path ? (
                <img src={tmdbW500(show.poster_path)} alt={show.name} className="w-full" />
              ) : (
                <div className="w-full aspect-[2/3] bg-[#1a1a1a] flex items-center justify-center">
                  <span className="text-gray-500 text-sm">{show.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 max-w-3xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#E50914] text-white text-xs font-bold px-2 py-0.5 rounded">SERIES</span>
              {show.status === "Returning Series" && (
                <span className="bg-green-600/20 text-green-400 text-xs border border-green-600/40 px-2 py-0.5 rounded">Returning</span>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">{show.name}</h1>

            <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
              {rating && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-yellow-400" />
                  <span className="font-bold">{rating}</span>
                </div>
              )}
              {year && <span className="text-gray-300">{year}</span>}
              {show.number_of_seasons && (
                <span className="text-gray-300">{show.number_of_seasons} Season{show.number_of_seasons > 1 ? "s" : ""}</span>
              )}
              {show.number_of_episodes && (
                <span className="text-gray-300">{show.number_of_episodes} Episodes</span>
              )}
              {show.genres?.slice(0, 3).map((g) => (
                <span key={g.id} className="bg-[#E50914]/20 text-[#E50914] text-xs px-2 py-0.5 rounded border border-[#E50914]/30">
                  {g.name}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => navigate(`/watch/tv/${id}?season=1&episode=1`)}
                className="flex items-center gap-2 bg-white text-black font-bold px-8 py-3 rounded hover:bg-gray-200 transition-colors text-sm"
              >
                <Play className="w-5 h-5 fill-black" /> Play S1:E1
              </button>
              <button
                onClick={handleWatchlist}
                className="flex items-center gap-2 bg-gray-600/80 text-white font-semibold px-6 py-3 rounded hover:bg-gray-500/80 transition-colors text-sm"
              >
                {inList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {inList ? "In My List" : "My List"}
              </button>
              {trailerUrl && (
                <button onClick={() => setShowTrailer(true)} className="border border-gray-500 text-white font-semibold px-6 py-3 rounded hover:border-white transition-colors text-sm">
                  Trailer
                </button>
              )}
            </div>

            <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">{show.overview}</p>

            {/* Season Selector */}
            {show.seasons && show.seasons.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-semibold text-xl">Episodes</h2>
                  <div className="relative">
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="bg-[#1a1a1a] text-white border border-gray-600 rounded px-3 py-1.5 text-sm appearance-none pr-8 cursor-pointer"
                    >
                      {show.seasons
                        .filter((s) => s.season_number > 0)
                        .map((s) => (
                          <option key={s.id} value={s.season_number}>
                            Season {s.season_number}
                          </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Episode List */}
                {seasonData?.episodes ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-hide">
                    {seasonData.episodes.map((ep) => (
                      <div
                        key={ep.id}
                        onClick={() => navigate(`/watch/tv/${id}?season=${selectedSeason}&episode=${ep.episode_number}`)}
                        className="flex gap-3 p-3 rounded bg-[#141414] hover:bg-[#1f1f1f] cursor-pointer transition-colors group border border-transparent hover:border-white/10"
                      >
                        <div className="flex-shrink-0 w-8 text-center text-gray-500 text-sm pt-0.5 font-mono">
                          {ep.episode_number}
                        </div>
                        <div className="relative flex-shrink-0 w-28 aspect-video rounded overflow-hidden bg-[#1a1a1a]">
                          {ep.still_path ? (
                            <img src={tmdbW300(ep.still_path)} alt={ep.name} className="w-full h-full object-cover" />
                          ) : null}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <Play className="w-6 h-6 text-white fill-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-white text-sm font-medium line-clamp-1">{ep.name}</p>
                            {ep.runtime && <span className="text-gray-500 text-xs ml-2 flex-shrink-0">{ep.runtime}m</span>}
                          </div>
                          <p className="text-gray-400 text-xs line-clamp-2">{ep.overview}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Array(5).fill(0).map((_, i) => (
                      <div key={i} className="h-20 bg-[#1a1a1a] rounded animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            )}

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
                      <p className="text-white text-xs font-medium line-clamp-2">{person.name}</p>
                      <p className="text-gray-500 text-xs line-clamp-1">{person.character || person.roles?.[0]?.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {similar.length > 0 && (
          <div className="mt-8">
            <ContentRow title="More Like This" items={similar.map((t) => ({ ...t, media_type: "tv" }))} />
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailerUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl aspect-video">
            <button onClick={() => setShowTrailer(false)} className="absolute -top-10 right-0 text-white hover:text-gray-300">
              <X className="w-6 h-6" />
            </button>
            <iframe src={trailerUrl} className="w-full h-full rounded-lg" allow="autoplay; encrypted-media" allowFullScreen />
          </div>
        </div>
      )}
    </div>
  );
}
