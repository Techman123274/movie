import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Star, Trash2, Users } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  deleteComment,
  getTitleSocialSummary,
  saveComment,
  SOCIAL_CHANGED_EVENT,
} from "@/lib/social";

const getInitial = (value) => String(value || "S").trim().charAt(0).toUpperCase();

const formatDate = (value) => {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

export default function TitleSocialPanel({ item, mediaType, activeProfile }) {
  const [summary, setSummary] = useState({
    activities: [],
    comments: [],
    ratings: [],
    averageRating: 0,
    ratingCount: 0,
    commentCount: 0,
  });
  const [commentText, setCommentText] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const tmdbId = Number(item?.tmdb_id ?? item?.id);

  const title = item?.title || item?.name || "this title";
  const roundedAverage = summary.averageRating ? summary.averageRating.toFixed(1) : "0.0";
  const recentRatings = useMemo(() => summary.ratings.slice(0, 6), [summary.ratings]);
  const recentComments = useMemo(() => summary.comments.slice(0, 8), [summary.comments]);

  const loadSocial = async () => {
    if (!tmdbId || !mediaType) {
      return;
    }

    setLoading(true);
    const [user, nextSummary] = await Promise.all([
      base44.auth.me().catch(() => null),
      getTitleSocialSummary({ tmdbId, mediaType }).catch(() => null),
    ]);

    setCurrentUser(user);
    if (nextSummary) {
      setSummary(nextSummary);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSocial();

    const handleSocialChange = () => {
      loadSocial();
    };

    window.addEventListener(SOCIAL_CHANGED_EVENT, handleSocialChange);
    return () => window.removeEventListener(SOCIAL_CHANGED_EVENT, handleSocialChange);
  }, [tmdbId, mediaType]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!commentText.trim()) {
      return;
    }

    const user = currentUser || await base44.auth.me().catch(() => null);
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    try {
      setSaving(true);
      await saveComment({
        user,
        profile: activeProfile,
        item,
        mediaType,
        commentText,
      });
      setCommentText("");
      await loadSocial();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteComment(id);
    await loadSocial();
  };

  return (
    <section className="mt-8 rounded-2xl border border-white/10 bg-[#111111] p-4 md:p-6">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.25em] text-[#E50914]">Social</p>
          <h2 className="text-2xl font-bold text-white">What everyone thinks</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400">
            Ratings and comments are saved to the database for everyone on Subflix.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center sm:min-w-[260px]">
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center justify-center gap-1 text-yellow-400">
              <Star className="h-4 w-4 fill-yellow-400" />
              <span className="text-lg font-black">{roundedAverage}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">{summary.ratingCount} rating{summary.ratingCount === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center justify-center gap-1 text-white">
              <MessageCircle className="h-4 w-4" />
              <span className="text-lg font-black">{summary.commentCount}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">comments</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-5 rounded-xl border border-white/10 bg-black/20 p-3">
        <label className="mb-2 block text-sm font-semibold text-white">Comment on {title}</label>
        <textarea
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          placeholder="Share a quick thought..."
          rows={3}
          className="w-full resize-none rounded-lg border border-white/10 bg-[#181818] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-gray-600 focus:border-[#E50914]"
        />
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving || !commentText.trim()}
            className="min-h-11 w-full rounded-lg bg-[#E50914] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#c40812] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Post Comment
          </button>
        </div>
      </form>

      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array(4).fill(0).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <MessageCircle className="h-4 w-4 text-[#E50914]" />
              Comments
            </div>
            <div className="space-y-3">
              {recentComments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-500">
                  No comments yet. Be first.
                </div>
              ) : (
                recentComments.map((comment) => (
                  <div key={comment.id} className="rounded-xl border border-white/10 bg-black/20 px-4 py-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {comment.actor_avatar_url ? (
                          <img
                            src={comment.actor_avatar_url}
                            alt={comment.actor_name || comment.created_by || "Subflix Member"}
                            className="h-9 w-9 shrink-0 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E50914] text-sm font-black text-white">
                            {getInitial(comment.actor_name || comment.created_by)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {comment.actor_name || comment.created_by || "Subflix Member"}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(comment.updated_at)}</p>
                        </div>
                      </div>
                      {currentUser?.email && comment.created_by === currentUser.email && (
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:border-white/20 hover:text-white"
                          aria-label="Delete comment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed text-gray-300">{comment.comment_text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
              <Users className="h-4 w-4 text-[#E50914]" />
              Shared Ratings
            </div>
            <div className="space-y-3">
              {recentRatings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-500">
                  No shared ratings yet.
                </div>
              ) : (
                recentRatings.map((rating) => (
                  <div key={rating.id} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {rating.profile_name || rating.created_by || "Subflix Member"}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(rating.updated_at)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-yellow-400" />
                        <span className="text-sm font-black">{rating.rating_value}/5</span>
                      </div>
                    </div>
                    {rating.review_text && (
                      <p className="mt-2 text-sm text-gray-400">{rating.review_text}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
