import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Info, Play, Plus } from "lucide-react";
import { tmdbOriginal, tmdbW300 } from "@/lib/tmdb";
import { base44 } from "@/api/base44Client";
import { getMatchPercentage } from "@/lib/recommendations";
import { buildWatchPath, getResumeLabel } from "@/lib/playback";
import PlaybackProgressBar from "@/components/ui/PlaybackProgressBar";
import { useAppTheme } from "@/lib/theme";
import { useBooleanPreference } from "@/hooks/use-boolean-preference";

export default function HeroBanner({ items = [] }) {
  const [current, setCurrent] = useState(0);
  const [inList, setInList] = useState(false);
  const navigate = useNavigate();
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.heroVariant === "hulu";
  const autoplayPreviews = useBooleanPreference("subflix_autoplay_previews", true);

  const item = items[current];

  useEffect(() => {
    if (!items.length || !autoplayPreviews) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrent((index) => (index + 1) % Math.min(items.length, 5));
    }, isHulu ? 9000 : 8000);

    return () => window.clearInterval(timer);
  }, [isHulu, items.length, autoplayPreviews]);

  useEffect(() => {
    setInList(false);
  }, [current]);

  if (!item) {
    return (
      <div className={`flex w-full items-center justify-center ${isHulu ? "px-4 pb-8 pt-24 md:px-12 md:pt-28" : "h-[86svh] min-h-[560px] bg-[var(--app-bg)] md:h-screen"}`}>
        <div className={`flex items-center justify-center ${isHulu ? "min-h-[520px] w-full rounded-[24px] border border-white/8 bg-[#0e1511]" : "w-full"}`}>
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
        </div>
      </div>
    );
  }

  const title = item.title || item.name || "";
  const mediaType = item.media_type || (item.title ? "movie" : "tv");
  const overview = item.overview || "";
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const rating = item.vote_average ? Math.round(item.vote_average * 10) : null;
  const matchPercentage = item.match_percentage || getMatchPercentage(item);
  const progressPercent = Math.max(0, Math.min(100, Math.round(Number(item.progress_percent) || 0)));
  const playPath = item.resume_path || buildWatchPath({
    mediaType,
    tmdbId: item.tmdb_id ?? item.id,
    seasonNumber: item.season_number,
    episodeNumber: item.episode_number,
  });
  const spotlightItems = items.slice(0, 4);

  const handlePlay = () => navigate(playPath);
  const handleDetails = () => navigate(`/${mediaType}/${item.id}`);

  const handleWatchlist = async () => {
    try {
      const user = await base44.auth.me();
      if (!user) {
        base44.auth.redirectToLogin();
        return;
      }

      if (inList) {
        const existing = await base44.entities.Watchlist.filter({ tmdb_id: item.id, created_by: user.email });
        if (existing.length > 0) {
          await base44.entities.Watchlist.delete(existing[0].id);
        }
        setInList(false);
      } else {
        await base44.entities.Watchlist.create({
          tmdb_id: item.id,
          media_type: mediaType,
          title,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average,
          overview,
          release_date: item.release_date || item.first_air_date,
          genre_ids: item.genre_ids,
        });
        setInList(true);
      }
    } catch {
      base44.auth.redirectToLogin();
    }
  };

  if (isHulu) {
    return (
      <section className="px-4 pb-8 pt-24 md:px-12 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[26px] border border-white/8 bg-[#0f1713] shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0 overflow-hidden">
              {item.backdrop_path ? (
                <img
                  src={tmdbOriginal(item.backdrop_path)}
                  alt={title}
                  className="h-full w-full object-cover object-center"
                  style={{ transition: "opacity 0.8s ease" }}
                />
              ) : (
                <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,#113524_0%,#09110d_60%,#050806_100%)]" />
              )}
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,10,8,0.96)_0%,rgba(8,14,11,0.78)_42%,rgba(8,14,11,0.3)_100%)]" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,8,6,0.08)_0%,rgba(5,8,6,0.72)_100%)]" />
            </div>

            <div className="relative grid min-h-[520px] md:grid-cols-[minmax(0,1fr)_300px]">
              <div className="flex flex-col justify-end p-6 md:p-10">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[rgba(29,231,144,0.24)] bg-[rgba(29,231,144,0.12)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">
                    Editor&apos;s Pick
                  </span>
                  {mediaType === "tv" && (
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75">
                      Series
                    </span>
                  )}
                </div>

                <h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-white md:text-6xl">
                  {title}
                </h1>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/70">
                  {matchPercentage && <span className="font-semibold text-[var(--brand)]">{matchPercentage}% Match</span>}
                  {!matchPercentage && rating && <span className="font-semibold text-[var(--brand)]">{rating}% Rating</span>}
                  {year && <span>{year}</span>}
                  <span>{mediaType === "tv" ? "Series" : "Movie"}</span>
                </div>

                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
                  {overview}
                </p>

                {progressPercent > 0 && (
                  <div className="mt-5 max-w-lg">
                    <div className="mb-2 flex items-center justify-between text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
                      <span>{getResumeLabel(item, mediaType)}</span>
                      <span>{progressPercent}% watched</span>
                    </div>
                    <PlaybackProgressBar progress={progressPercent} className="h-1.5 bg-white/15" />
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={handlePlay}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-bold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)]"
                  >
                    <Play className="h-4 w-4 fill-[var(--brand-contrast)]" />
                    {getResumeLabel(item, mediaType)}
                  </button>
                  <button
                    onClick={handleDetails}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1]"
                  >
                    <Info className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={handleWatchlist}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.1]"
                  >
                    {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    {inList ? "Saved" : "My Stuff"}
                  </button>
                </div>
              </div>

              <div className="hidden flex-col justify-end gap-3 border-l border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.01)_100%)] p-5 md:flex">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-white/45">
                  Next Up
                </p>
                {spotlightItems.map((spotlightItem, index) => {
                  const isActive = index === current;
                  return (
                    <button
                      key={`${spotlightItem.id}-${index}`}
                      type="button"
                      onClick={() => setCurrent(index)}
                      className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                        isActive
                          ? "border-[rgba(29,231,144,0.28)] bg-[rgba(29,231,144,0.12)]"
                          : "border-white/8 bg-white/[0.03] hover:bg-white/[0.07]"
                      }`}
                    >
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-[#101714]">
                        {spotlightItem.backdrop_path || spotlightItem.poster_path ? (
                          <img
                            src={tmdbW300(spotlightItem.backdrop_path || spotlightItem.poster_path)}
                            alt={spotlightItem.title || spotlightItem.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-1 text-sm font-semibold text-white">
                          {spotlightItem.title || spotlightItem.name}
                        </p>
                        <p className="mt-1 text-xs text-white/55">
                          {(spotlightItem.media_type || (spotlightItem.title ? "movie" : "tv")) === "tv" ? "Series" : "Movie"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="relative h-[86svh] min-h-[560px] w-full md:h-screen md:max-h-[900px] md:min-h-[600px]">
      <div className="absolute inset-0 overflow-hidden">
        {item.backdrop_path ? (
          <img
            src={tmdbOriginal(item.backdrop_path)}
            alt={title}
            className="h-full w-full object-cover object-center"
            style={{ transition: "opacity 0.8s ease" }}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-gray-900 to-black" />
        )}
        <div className="absolute inset-0 gradient-overlay" />
        <div className="absolute inset-0 gradient-bottom" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex h-full max-w-2xl flex-col justify-end px-4 pb-8 md:px-16 md:pb-24">
        <div className="mb-3 flex items-center gap-3">
          {mediaType === "tv" && (
            <span className="rounded bg-[#E50914] px-2 py-0.5 text-xs font-bold text-white">SERIES</span>
          )}
          {matchPercentage && (
            <span className="text-sm font-bold text-green-400">{matchPercentage}% Match</span>
          )}
          {!matchPercentage && rating && (
            <span className="text-sm font-bold text-green-400">{rating}% Rating</span>
          )}
          {year && <span className="text-sm text-gray-300">{year}</span>}
        </div>

        <h1 className="mb-4 text-3xl font-black leading-tight tracking-tight text-white drop-shadow-lg sm:text-4xl md:text-6xl">
          {title}
        </h1>

        <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-200 drop-shadow md:text-base">
          {overview}
        </p>

        {progressPercent > 0 && (
          <div className="mb-5 max-w-md">
            <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.16em] text-white/65">
              <span>{getResumeLabel(item, mediaType)}</span>
              <span>{progressPercent}% watched</span>
            </div>
            <PlaybackProgressBar progress={progressPercent} className="h-2 bg-white/20" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePlay}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-white px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-gray-200 sm:flex-none sm:px-6 md:text-base"
          >
            <Play className="h-5 w-5 fill-black" /> {getResumeLabel(item, mediaType)}
          </button>
          <button
            onClick={handleDetails}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-gray-600/80 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-gray-500/80 sm:flex-none sm:px-6 md:text-base"
          >
            <Info className="h-5 w-5" /> More Info
          </button>
          <button
            onClick={handleWatchlist}
            className="ml-1 flex h-11 w-11 items-center justify-center rounded-full border-2 border-gray-400 transition-colors hover:border-white"
          >
            {inList ? <Check className="h-5 w-5 text-white" /> : <Plus className="h-5 w-5 text-white" />}
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 z-10 flex gap-1.5">
        {items.slice(0, 5).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-0.5 rounded-full transition-all duration-300 ${
              index === current ? "w-6 bg-white" : "w-3 bg-gray-500"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
