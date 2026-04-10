import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { MessageCircle, Play, RefreshCw, Star, Users } from "lucide-react";
import { tmdbW300 } from "@/lib/tmdb";
import { filterItemsForProfile } from "@/lib/preferences";
import { listGlobalSocialFeed, SOCIAL_CHANGED_EVENT } from "@/lib/social";
import { buildWatchPath } from "@/lib/playback";

const getActorName = (entry) =>
  entry.actor_name || entry.profile_name || entry.created_by || "Subflix Member";

const getActionCopy = (entry) => {
  switch (entry.activity_type) {
    case "liked":
      return "liked";
    case "rated":
      return `rated ${entry.rating_value || ""}/5`;
    case "watchlist_added":
      return "saved to My List";
    case "watch_started":
      return "started watching";
    case "commented":
    case "comment":
      return "commented";
    default:
      return "shared";
  }
};

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

export default function SocialHub() {
  const { activeProfile } = useOutletContext() || {};
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const visibleFeed = useMemo(() => {
    const normalized = feedItems.map((entry) => ({
      ...entry,
      adult: Boolean(entry.is_adult),
      id: entry.tmdb_id,
    }));

    return filterItemsForProfile(normalized, activeProfile);
  }, [feedItems, activeProfile]);

  const loadFeed = async () => {
    setLoading(true);
    const items = await listGlobalSocialFeed({ limit: 80 }).catch(() => []);
    setFeedItems(items);
    setLoading(false);
  };

  useEffect(() => {
    loadFeed();

    const handleSocialChange = () => {
      loadFeed();
    };

    window.addEventListener(SOCIAL_CHANGED_EVENT, handleSocialChange);
    return () => window.removeEventListener(SOCIAL_CHANGED_EVENT, handleSocialChange);
  }, []);

  const stats = useMemo(() => {
    const ratings = visibleFeed.filter((entry) => entry.activity_type === "rated");
    const comments = visibleFeed.filter((entry) => entry.activity_type === "comment" || entry.activity_type === "commented");
    const members = new Set(visibleFeed.map(getActorName).filter(Boolean));

    return {
      comments: comments.length,
      members: members.size,
      ratings: ratings.length,
    };
  }, [visibleFeed]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pb-28 pt-24 text-white md:px-12 md:pb-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.28em] text-[#E50914]">Community</p>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Social Hub</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400 md:text-base">
              Shared comments, ratings, watch starts, likes, and saves from the database.
            </p>
          </div>
          <button
            type="button"
            onClick={loadFeed}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08] md:w-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <MetricCard icon={Users} label="Members active" value={stats.members} />
          <MetricCard icon={Star} label="Ratings shared" value={stats.ratings} />
          <MetricCard icon={MessageCircle} label="Comments posted" value={stats.comments} />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array(6).fill(0).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : visibleFeed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
            <Users className="mx-auto mb-4 h-14 w-14 text-gray-700" />
            <h2 className="text-2xl font-bold text-white">No social activity yet</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
              Rate a title, leave a comment, like something, or start watching to fill this hub.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleFeed.map((entry, index) => (
              <article
                key={`${entry.feed_type || entry.activity_type}-${entry.id || entry.tmdb_id}-${entry.updated_at}-${index}`}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#111111]"
              >
                <button
                  type="button"
                  onClick={() => navigate(`/${entry.media_type}/${entry.tmdb_id}`)}
                  className="group flex w-full gap-4 p-4 text-left"
                >
                  <div className="h-32 w-24 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
                    {entry.poster_path ? (
                      <img
                        src={tmdbW300(entry.poster_path)}
                        alt={entry.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-gray-600">
                        {entry.title}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
                      <span className="rounded bg-white/10 px-2 py-1 uppercase text-gray-300">
                        {entry.media_type === "tv" ? "TV" : "Movie"}
                      </span>
                      <span>{formatDate(entry.updated_at)}</span>
                    </div>
                    <h2 className="line-clamp-2 text-lg font-bold leading-tight text-white">{entry.title}</h2>
                    <div className="mt-2 flex items-center gap-2">
                      {entry.actor_avatar_url ? (
                        <img
                          src={entry.actor_avatar_url}
                          alt={getActorName(entry)}
                          className="h-7 w-7 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#E50914] text-[11px] font-black text-white">
                          {String(getActorName(entry)).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <p className="min-w-0 text-sm text-gray-400">
                        <span className="font-semibold text-white">{getActorName(entry)}</span>{" "}
                        {getActionCopy(entry)}
                      </p>
                    </div>
                    {entry.rating_value && (
                      <div className="mt-3 flex items-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-yellow-400" />
                        <span className="text-sm font-black">{entry.rating_value}/5</span>
                      </div>
                    )}
                    {(entry.comment_text || entry.metadata?.comment_text) && (
                      <p className="mt-3 line-clamp-3 rounded-lg bg-black/20 px-3 py-2 text-sm leading-relaxed text-gray-300">
                        {entry.comment_text || entry.metadata.comment_text}
                      </p>
                    )}
                  </div>
                </button>

                <div className="flex gap-2 border-t border-white/10 p-3">
                  <button
                    type="button"
                    onClick={() => navigate(buildWatchPath({ mediaType: entry.media_type, tmdbId: entry.tmdb_id }))}
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-black transition-colors hover:bg-gray-200"
                  >
                    <Play className="h-4 w-4 fill-black" />
                    Watch
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/${entry.media_type}/${entry.tmdb_id}`)}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
                  >
                    Details
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] px-4 py-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] text-[#E50914]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-500">{label}</p>
    </div>
  );
}
