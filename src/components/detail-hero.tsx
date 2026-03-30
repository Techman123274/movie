import Link from "next/link";
import { Play } from "lucide-react";
import { WatchlistButton } from "@/components/watchlist-button";
import { getImageUrl } from "@/lib/tmdb";
import type { MediaDetail, ResumeTarget } from "@/lib/types";
import { formatEpisodeLabel, formatMediaLabel, formatRating, formatRuntime, formatYear } from "@/lib/utils";

type DetailHeroProps = {
  item: MediaDetail;
  profileId: string | null;
  inWatchlist: boolean;
  resumeTarget: ResumeTarget | null;
};

export function DetailHero({ item, profileId, inWatchlist, resumeTarget }: DetailHeroProps) {
  const background = getImageUrl(item.backdropPath, "w1280");
  const episodeLabel = formatEpisodeLabel(resumeTarget?.seasonNumber, resumeTarget?.episodeNumber);

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
          </p>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={resumeTarget?.watchHref ?? `/${item.mediaType}/${item.id}/watch`}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-[#07111f]"
          >
            <Play size={16} fill="currentColor" /> {resumeTarget ? "Resume Watching" : "Start Watching"}
          </Link>
          <WatchlistButton
            profileId={profileId}
            mediaId={item.id}
            mediaType={item.mediaType}
            returnTo={`/${item.mediaType}/${item.id}`}
            inWatchlist={inWatchlist}
          />
        </div>
      </div>
    </section>
  );
}
