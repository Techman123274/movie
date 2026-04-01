"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";
import { Check, Clock3, Heart, Info, Play, Plus, Star } from "lucide-react";
import { toggleWatchlistAction } from "@/app/actions";
import { getImageUrl } from "@/lib/tmdb";
import type { MediaSummary } from "@/lib/types";
import { formatMediaLabel, formatRating, formatRuntime, formatYear } from "@/lib/utils";

type MediaCardProps = {
  item: MediaSummary;
  variant?: "default" | "continue" | "editorial";
  profileId?: string | null;
  inWatchlist?: boolean;
};

function estimateProgressPercent(item: MediaSummary) {
  if (!item.progressSeconds || item.progressSeconds <= 0) {
    return null;
  }

  const estimatedRuntimeMinutes = item.runtime ?? (item.mediaType === "tv" ? 42 : 110);
  const estimatedDurationSeconds = estimatedRuntimeMinutes * 60;
  const ratio = item.progressSeconds / estimatedDurationSeconds;
  return Math.min(94, Math.max(8, Math.round(ratio * 100)));
}

function getProgressLabel(item: MediaSummary) {
  if (!item.progressSeconds || item.progressSeconds <= 0) {
    return null;
  }

  const savedMinutes = Math.max(1, Math.floor(item.progressSeconds / 60));
  return `${savedMinutes}m saved`;
}

function CardWatchlistButton({
  profileId,
  mediaId,
  mediaType,
  returnTo,
  inWatchlist,
}: {
  profileId: string | null;
  mediaId: number;
  mediaType: "movie" | "tv";
  returnTo: string;
  inWatchlist: boolean;
}) {
  const { pending } = useFormStatus();

  if (!profileId) {
    return (
      <Link
        href="/account"
        aria-label="Open account to save titles"
        className="surface inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
      >
        <Plus size={16} />
      </Link>
    );
  }

  return (
    <>
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="mediaId" value={mediaId} />
      <input type="hidden" name="mediaType" value={mediaType} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button
        type="submit"
        disabled={pending}
        aria-label={inWatchlist ? "Remove from watchlist" : "Add to watchlist"}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition ${
          inWatchlist
            ? "bg-[rgba(214,179,109,0.16)] text-[var(--color-brand-strong)]"
            : "surface text-white hover:bg-white/10"
        } disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {inWatchlist ? <Check size={16} /> : <Plus size={16} />}
      </button>
    </>
  );
}

export function MediaCard({ item, variant = "default", profileId = null, inWatchlist = false }: MediaCardProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const returnTo = useMemo(
    () => (searchString ? `${pathname}?${searchString}` : pathname),
    [pathname, searchString],
  );

  const posterImage = getImageUrl(item.posterPath, "w342");
  const previewImage = getImageUrl(item.backdropPath ?? item.posterPath, "w780");
  const detailHref = `/${item.mediaType}/${item.id}`;
  const watchHref = item.hrefOverride ?? `/${item.mediaType}/${item.id}/watch`;
  const progressPercent = estimateProgressPercent(item);
  const progressLabel = getProgressLabel(item);
  const metadata = [
    item.runtime ? formatRuntime(item.runtime) : null,
    item.genreNames[0] ?? null,
    item.voteAverage ? formatRating(item.voteAverage) : null,
  ].filter(Boolean);
  const actionsVisibleClass =
    "translate-y-0 opacity-100 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100";
  const previewPanelClass =
    "opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100";
  const variantAccentClass =
    variant === "continue"
      ? "border-[rgba(214,179,109,0.22)] bg-[rgba(214,179,109,0.07)]"
      : "border-white/10 bg-[rgba(255,255,255,0.03)]";

  return (
    <article className="group relative z-0 w-[176px] min-w-[176px] snap-start overflow-visible sm:w-[192px] sm:min-w-[192px] lg:w-[214px] lg:min-w-[214px]">
      <div
        className={`relative origin-bottom overflow-hidden rounded-[26px] border transition duration-300 sm:group-hover:z-10 sm:group-hover:scale-[1.045] sm:group-focus-within:z-10 sm:group-focus-within:scale-[1.045] sm:group-hover:shadow-[0_30px_80px_rgba(0,0,0,0.55)] sm:group-focus-within:shadow-[0_30px_80px_rgba(0,0,0,0.55)] ${variantAccentClass}`}
      >
        <Link
          href={detailHref}
          className="block focus-visible:outline-none"
          aria-label={`Open details for ${item.title}`}
        >
          <div
            className="aspect-[2/3] bg-cover bg-center transition duration-500 sm:group-hover:scale-[1.06] sm:group-focus-within:scale-[1.06]"
            style={{
              backgroundImage: posterImage
                ? `linear-gradient(180deg, rgba(6,12,20,0.08), rgba(6,12,20,0.85)), url(${posterImage})`
                : "linear-gradient(180deg, rgba(214,179,109,0.25), rgba(4,9,18,0.95))",
            }}
          />
        </Link>

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-[rgba(6,12,20,0.72)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white">
              {formatMediaLabel(item.mediaType)}
            </span>
            <div className="flex items-center gap-2">
              {item.feedback === "like" ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(214,179,109,0.18)] text-[var(--color-brand-strong)]">
                  <Heart size={14} fill="currentColor" />
                </span>
              ) : null}
              {inWatchlist ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(214,179,109,0.18)] text-[var(--color-brand-strong)]">
                  <Check size={14} />
                </span>
              ) : null}
            </div>
          </div>

          <div
            className={`absolute inset-x-3 top-14 hidden rounded-[22px] border border-white/10 bg-[rgba(6,12,20,0.78)] p-3 text-xs leading-5 text-[var(--color-text-muted)] shadow-xl transition duration-300 sm:block ${previewPanelClass}`}
            style={{
              backgroundImage: previewImage
                ? `linear-gradient(180deg, rgba(6,12,20,0.86), rgba(6,12,20,0.94)), url(${previewImage})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <p className="line-clamp-2 text-white">{item.overview}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {metadata.slice(0, 3).map((label) => (
                <span
                  key={`${item.id}-${label}`}
                  className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(4,9,18,0.03),rgba(4,9,18,0.97))] p-3 sm:p-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)] sm:text-[11px]">
            <span>{formatYear(item.releaseDate)}</span>
            {item.genreNames[0] ? (
              <>
                <span className="h-1 w-1 rounded-full bg-white/40" />
                <span>{item.genreNames[0]}</span>
              </>
            ) : null}
            {item.contextLabel ? (
              <>
                <span className="h-1 w-1 rounded-full bg-white/40" />
                <span>{item.contextLabel}</span>
              </>
            ) : null}
          </div>

          <Link href={detailHref} className="focus-visible:outline-none">
            <h3 className="display-font line-clamp-2 text-xl leading-5 text-white sm:text-2xl sm:leading-6">
              {item.title}
            </h3>
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-muted)]">
            {item.voteAverage ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1">
                <Star size={12} className="text-[var(--color-brand-strong)]" />
                {formatRating(item.voteAverage)}
              </span>
            ) : null}
            {progressLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(214,179,109,0.24)] bg-[rgba(214,179,109,0.08)] px-2.5 py-1 text-[var(--color-brand-strong)]">
                <Clock3 size={12} />
                {progressLabel}
              </span>
            ) : null}
            {!progressLabel && item.runtime ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2.5 py-1">
                <Clock3 size={12} />
                {formatRuntime(item.runtime)}
              </span>
            ) : null}
          </div>

          {progressPercent ? (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-brand),var(--color-brand-strong))]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className={`mt-3 transition duration-300 ${actionsVisibleClass}`}>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
              <Link
                href={watchHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-4 text-sm font-semibold text-[#07111f] transition hover:bg-[var(--color-brand-strong)]"
              >
                <Play size={15} fill="currentColor" />
                {item.actionLabel ?? (variant === "continue" ? "Resume" : "Watch")}
              </Link>
              <form action={toggleWatchlistAction}>
                <CardWatchlistButton
                  profileId={profileId}
                  mediaId={item.id}
                  mediaType={item.mediaType}
                  returnTo={returnTo}
                  inWatchlist={inWatchlist}
                />
              </form>
              <Link
                href={detailHref}
                aria-label={`More info about ${item.title}`}
                className="surface inline-flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
              >
                <Info size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
