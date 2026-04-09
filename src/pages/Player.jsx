import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, SkipForward, List } from "lucide-react";
import { getMovieDetails, getTVDetails, getTVSeason } from "@/lib/tmdb";
import { getMovieEmbedUrl, getTVEmbedUrl, DEFAULT_PLAYER_OPTIONS } from "@/lib/vidlink";
import { base44 } from "@/api/base44Client";
import ProfileRestrictionNotice from "@/components/profile/ProfileRestrictionNotice";
import { isAllowedForProfile, readActiveProfile } from "@/lib/preferences";

export default function Player() {
  const { type, id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeProfile = readActiveProfile();

  const season = parseInt(searchParams.get("season") || "1", 10);
  const episode = parseInt(searchParams.get("episode") || "1", 10);

  const [content, setContent] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [showEpisodeList, setShowEpisodeList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [embedUrl, setEmbedUrl] = useState("");

  useEffect(() => {
    loadContent();
  }, [type, id]);

  useEffect(() => {
    if (type === "tv" && content) {
      getTVSeason(id, season).then(setSeasonData).catch(() => setSeasonData(null));
    }
  }, [type, id, season, content]);

  useEffect(() => {
    if (!content) {
      return;
    }

    if (!isAllowedForProfile(content, activeProfile)) {
      setEmbedUrl("");
      return;
    }

    if (type === "movie") {
      setEmbedUrl(getMovieEmbedUrl(id, DEFAULT_PLAYER_OPTIONS));
    } else {
      setEmbedUrl(getTVEmbedUrl(id, season, episode, DEFAULT_PLAYER_OPTIONS));
    }
    logWatchHistory();
  }, [type, id, season, episode, content]);

  const loadContent = async () => {
    setLoading(true);
    const data = type === "movie"
      ? await getMovieDetails(id).catch(() => null)
      : await getTVDetails(id).catch(() => null);
    setContent(data);
    setLoading(false);
  };

  const logWatchHistory = async () => {
    if (!content) {
      return;
    }

    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return;
    }

    const title = content.title || content.name || "";
    const existing = await base44.entities.WatchHistory
      .filter({ tmdb_id: Number(id), created_by: user.email })
      .catch(() => []);

    const payload = {
      tmdb_id: Number(id),
      media_type: type,
      title,
      poster_path: content.poster_path,
      backdrop_path: content.backdrop_path,
      vote_average: content.vote_average,
      release_date: content.release_date || content.first_air_date,
      genre_ids: content.genres?.map((genre) => genre.id),
      season_number: type === "tv" ? season : undefined,
      episode_number: type === "tv" ? episode : undefined,
      progress_percent: 0,
    };

    if (existing.length > 0) {
      await base44.entities.WatchHistory.update(existing[0].id, payload).catch(() => {});
    } else {
      await base44.entities.WatchHistory.create(payload).catch(() => {});
    }
  };

  const goToEpisode = (nextSeason, nextEpisode) => {
    setSearchParams({ season: String(nextSeason), episode: String(nextEpisode) });
    setShowEpisodeList(false);
  };

  const goNextEpisode = () => {
    if (!seasonData) {
      return;
    }

    const maxEpisode = seasonData.episodes?.length || 1;
    if (episode < maxEpisode) {
      goToEpisode(season, episode + 1);
    } else if (content?.number_of_seasons && season < content.number_of_seasons) {
      goToEpisode(season + 1, 1);
    }
  };

  const title = content?.title || content?.name || "Loading...";
  const episodeName = type === "tv"
    ? seasonData?.episodes?.find((item) => item.episode_number === episode)?.name
    : null;
  const isAllowed = !content || isAllowedForProfile(content, activeProfile);

  if (!loading && content && !isAllowed) {
    return (
      <ProfileRestrictionNotice
        profile={activeProfile}
        title="Playback is locked on this profile"
        description="This title is outside the maturity limit for the active profile, so playback has been blocked."
        onAction={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col" style={{ zIndex: 100 }}>
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <p className="text-white font-semibold text-sm">{title}</p>
            {type === "tv" && (
              <p className="text-gray-400 text-xs">
                S{String(season).padStart(2, "0")}:E{String(episode).padStart(2, "0")}
                {episodeName ? ` - ${episodeName}` : ""}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {type === "tv" && (
            <>
              <button
                onClick={goNextEpisode}
                className="flex items-center gap-1.5 text-white hover:text-gray-300 text-sm transition-colors"
              >
                <SkipForward className="w-5 h-5" /> Next
              </button>
              <button
                onClick={() => setShowEpisodeList(!showEpisodeList)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <List className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#E50914] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : embedUrl ? (
        <iframe
          src={embedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          title={title}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <p className="text-white text-xl font-semibold mb-2">Content not available</p>
            <p className="text-gray-400 text-sm mb-6">This title cannot be played at this time.</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-[#E50914] text-white px-6 py-2 rounded font-semibold hover:bg-[#c40812] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {showEpisodeList && type === "tv" && (
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-black/95 border-l border-white/10 z-30 flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Episodes</h3>
            <button
              onClick={() => setShowEpisodeList(false)}
              className="text-gray-400 hover:text-white"
            >
              x
            </button>
          </div>

          {content?.seasons && (
            <div className="px-4 py-3 border-b border-white/10">
              <select
                value={season}
                onChange={(event) => {
                  goToEpisode(Number(event.target.value), 1);
                }}
                className="bg-[#1a1a1a] text-white border border-gray-600 rounded px-3 py-1.5 text-sm w-full"
              >
                {content.seasons.filter((item) => item.season_number > 0).map((item) => (
                  <option key={item.id} value={item.season_number}>
                    Season {item.season_number}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {seasonData?.episodes?.map((item) => (
              <div
                key={item.id}
                onClick={() => goToEpisode(season, item.episode_number)}
                className={`flex gap-3 p-3 cursor-pointer transition-colors border-b border-white/5 ${
                  item.episode_number === episode
                    ? "bg-[#E50914]/20 border-l-2 border-l-[#E50914]"
                    : "hover:bg-white/5"
                }`}
              >
                <span className="text-gray-500 text-sm w-6 text-center pt-0.5 flex-shrink-0 font-mono">
                  {item.episode_number}
                </span>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium line-clamp-1 ${
                      item.episode_number === episode ? "text-[#E50914]" : "text-white"
                    }`}
                  >
                    {item.name}
                  </p>
                  {item.runtime && <p className="text-gray-500 text-xs">{item.runtime}m</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
