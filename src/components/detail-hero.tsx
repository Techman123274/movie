import Link from "next/link";
import { Play, Sparkles } from "lucide-react";
import { TitleFeedbackActions } from "@/components/title-feedback-actions";
import { WatchlistButton } from "@/components/watchlist-button";
import { getImageUrl } from "@/lib/tmdb";
import type { FeedbackValue, MediaDetail, ResumeTarget } from "@/lib/types";
import { formatEpisodeLabel, formatMediaLabel, formatRating, formatRuntime, formatYear } from "@/lib/utils";

type DetailHeroProps = {
  item: MediaDetail;
  profileId: string | null;
  inWatchlist: boolean;
  resumeTarget: ResumeTarget | null;
  feedback: FeedbackValue | null;
};

export function DetailHero({ item, profileId, inWatchlist, resumeTarget, feedback }: DetailHeroProps) {
  const background = getImageUrl(item.backdropPath, "w1280");
  const episodeLabel = formatEpisodeLabel(resumeTarget?.seasonNumber, resumeTarget?.episodeNumber);
  const resumeMinutes =
    resumeTarget?.progressSeconds && resumeTarget.progressSeconds > 0
      ? `${Math.max(1, Math.floor(resumeTarget.progressSeconds / 60))}m in`
      : null;

  return (
    <section
      className="relative overflow-hidden rounded-[36px] border border-white/10 px-6 py-14 sm:px-10"
      style={{
        backgroundImage: background
          ? `linear-gradient(90deg, rgba(6,12,20,0.93) 0%, rgba(6,12,20,0.72) 45%, rgba(6,12,20,0.3) 100%), url(${background})`
          : "linear-gradient(135deg, rgba(214,179,109,0.18), rgba(6,12,20,0.96))",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,179,109,0.18),transparent_30%)]" />
      <div className="relative max-w-3xl">
        <p className="mb-4 text-xs uppercase tracking-[0.34em] text-[var(--color-brand-strong)]">
          {formatMediaLabel(item.mediaType)}
        </p>
        <h1 className="display-font text-5xl text-white sm:text-6xl">{item.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--color-text-muted)]">
          <span>{formatYear(item.releaseDate)}</span>
          <span>{formatRuntime(item.runtime)}</span>
          <span>{formatRating(item.voteAverage)}</span>
          {item.numberOfSeasons ? <span>{item.numberOfSeasons} seasons</span> : null}
        </div>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">{item.overview}</p>
        {resumeTarget ? (
          <p className="mt-4 text-sm uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
            {episodeLabel ? `Ready to resume ${episodeLabel}` : "Ready to resume this title"}
            {resumeMinutes ? ` · ${resumeMinutes}` : ""}
          </p>
        ) : null}
        {item.tagline ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(214,179,109,0.24)] bg-[rgba(214,179,109,0.08)] px-4 py-2 text-sm text-white">
            <Sparkles size={16} className="text-[var(--color-brand-strong)]" />
            <span>{item.tagline}</span>
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={resumeTarget?.watchHref ?? `/${item.mediaType}/${item.id}/watch`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-[#07111f]"
          >
            <Play size={16} fill="currentColor" /> {resumeTarget ? "Resume Watching" : "Start Watching"}
          </Link>
          {item.heroTrailer ? (
            <a href="#trailers" className="surface inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm text-white">
              Watch trailer
            </a>
          ) : null}
          <WatchlistButton
            profileId={profileId}
            mediaId={item.id}
            mediaType={item.mediaType}
            returnTo={`/${item.mediaType}/${item.id}`}
            inWatchlist={inWatchlist}
          />
        </div>
        <div className="mt-4">
          <TitleFeedbackActions
            profileId={profileId}
            mediaId={item.id}
            mediaType={item.mediaType}
            returnTo={`/${item.mediaType}/${item.id}`}
            currentFeedback={feedback}
          />
        </div>
      </div>
    </section>
  );
}
