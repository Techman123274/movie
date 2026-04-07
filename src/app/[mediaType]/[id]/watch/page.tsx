import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/page-frame";
import { ProviderGate } from "@/components/provider-gate";
import { SeasonPicker } from "@/components/season-picker";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { WatchStatePanel } from "@/components/watch-state-panel";
import { withMinimumDelay } from "@/lib/loading";
import { getResumeTarget } from "@/lib/persistence";
import { resolvePlaybackOptions } from "@/lib/playback";
import { getMediaDetail, getSeasonEpisodes } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";
import { buildWatchHref, formatEpisodeLabel, formatRuntime, parsePositiveInt, resolveSeasonSelection } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";

type WatchPageProps = {
  params: Promise<{
    mediaType: string;
    id: string;
  }>;
  searchParams: Promise<{
    season?: string;
    episode?: string;
  }>;
};

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const [{ mediaType, id }, query] = await Promise.all([params, searchParams]);

  if (mediaType !== "movie" && mediaType !== "tv") {
    notFound();
  }

  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const detail = await withMinimumDelay(getMediaDetail(mediaType as MediaType, Number(id), viewer.providerRegion));

  if (!detail) {
    return (
      <PageFrame analyticsPath="/watch">
        <UnavailablePanel
          title="Watch data is unavailable."
          message="This watch page could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  const resumeTarget =
    mediaType === "tv" && viewer.activeProfile
      ? await getResumeTarget(viewer.activeProfile.id, detail.id, detail.mediaType)
      : null;
  const seasonNumber =
    mediaType === "tv"
      ? resolveSeasonSelection({
          seasons: detail.seasons,
          requestedSeasonNumber: parsePositiveInt(query.season),
          resumeSeasonNumber: resumeTarget?.seasonNumber,
        })
      : undefined;
  const season =
    mediaType === "tv" && seasonNumber ? await getSeasonEpisodes(detail.id, seasonNumber) : undefined;
  const requestedEpisodeNumber = parsePositiveInt(query.episode);
  const resolvedEpisodeNumber =
    mediaType === "tv" && season?.episodes?.length
      ? season.episodes.find((episode) => episode.episodeNumber === requestedEpisodeNumber)?.episodeNumber ??
        (requestedEpisodeNumber === undefined &&
        resumeTarget !== null &&
        resumeTarget?.seasonNumber === seasonNumber &&
        season.episodes.some((episode) => episode.episodeNumber === resumeTarget.episodeNumber)
          ? resumeTarget.episodeNumber
          : season.episodes[0]?.episodeNumber)
      : requestedEpisodeNumber;
  const episodeNumber = resolvedEpisodeNumber ?? 1;
  const currentEpisode =
    mediaType === "tv" && season?.episodes?.length
      ? season.episodes.find((episode) => episode.episodeNumber === episodeNumber) ?? season.episodes[0]
      : null;
  const providers = resolvePlaybackOptions({
    mediaType: mediaType as MediaType,
    tmdbId: detail.id,
    seasonNumber,
    episodeNumber,
  });
  const selectedSeasonIndex =
    mediaType === "tv" && seasonNumber
      ? detail.seasons?.findIndex((entry) => entry.seasonNumber === seasonNumber) ?? -1
      : -1;
  const previousSeason =
    selectedSeasonIndex > 0 && detail.seasons ? detail.seasons[selectedSeasonIndex - 1] : undefined;
  const nextSeason =
    selectedSeasonIndex >= 0 && detail.seasons && selectedSeasonIndex < detail.seasons.length - 1
      ? detail.seasons[selectedSeasonIndex + 1]
      : undefined;
  const currentEpisodeIndex =
    currentEpisode && season?.episodes ? season.episodes.findIndex((entry) => entry.id === currentEpisode.id) : -1;
  const previousEpisodeHref =
    mediaType === "tv" && season && season.episodes?.length && currentEpisodeIndex >= 0
      ? currentEpisodeIndex > 0
        ? buildWatchHref("tv", detail.id, season.seasonNumber, season.episodes[currentEpisodeIndex - 1].episodeNumber)
        : previousSeason && previousSeason.episodeCount > 0
          ? buildWatchHref("tv", detail.id, previousSeason.seasonNumber, previousSeason.episodeCount)
          : null
      : null;
  const nextEpisodeHref =
    mediaType === "tv" && season && season.episodes?.length && currentEpisodeIndex >= 0
      ? currentEpisodeIndex < season.episodes.length - 1
        ? buildWatchHref("tv", detail.id, season.seasonNumber, season.episodes[currentEpisodeIndex + 1].episodeNumber)
        : nextSeason
          ? buildWatchHref("tv", detail.id, nextSeason.seasonNumber, 1)
          : null
      : null;
  const nextSeasonEpisodes =
    mediaType === "tv" && nextSeason ? await getSeasonEpisodes(detail.id, nextSeason.seasonNumber) : undefined;
  const nextSeasonAutoplayItems = nextSeasonEpisodes
    ? (nextSeasonEpisodes.episodes ?? []).map((episode) => ({
        seasonNumber: nextSeasonEpisodes.seasonNumber,
        episodeNumber: episode.episodeNumber,
        href: buildWatchHref("tv", detail.id, nextSeasonEpisodes.seasonNumber, episode.episodeNumber),
      }))
    : [];
  const autoplaySequence =
    mediaType === "tv" && season?.episodes?.length && currentEpisodeIndex >= 0
      ? [
          ...season.episodes.slice(currentEpisodeIndex).map((episode) => ({
            seasonNumber: season.seasonNumber,
            episodeNumber: episode.episodeNumber,
            href: buildWatchHref("tv", detail.id, season.seasonNumber, episode.episodeNumber),
          })),
          ...nextSeasonAutoplayItems,
        ]
      : undefined;
  const enabledProviderCount = providers.filter((provider) => provider.availability === "enabled").length;
  const resumeMinutes =
    resumeTarget?.progressSeconds && resumeTarget.progressSeconds > 0
      ? `${Math.max(1, Math.floor(resumeTarget.progressSeconds / 60))}m saved`
      : null;
  const episodeLabel =
    mediaType === "tv"
      ? formatEpisodeLabel(season?.seasonNumber, currentEpisode?.episodeNumber) ?? "Episode ready"
      : null;

  return (
    <PageFrame analyticsPath="/watch">
      <section className="surface rounded-[30px] p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <Link
              href={`/${mediaType}/${detail.id}`}
              className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm text-[var(--color-text-muted)] transition hover:border-white/20 hover:text-white"
            >
              Back to details
            </Link>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Watch</p>
              <h1 className="display-font mt-2 text-3xl text-white sm:text-4xl">{detail.title}</h1>
              {mediaType === "tv" && currentEpisode ? (
                <p className="mt-2 text-base text-white">
                  {episodeLabel}
                  {currentEpisode.name ? ` - ${currentEpisode.name}` : ""}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
                {enabledProviderCount} servers ready
              </span>
              {resumeMinutes ? (
                <span className="theme-chip rounded-full px-3 py-2 text-[var(--color-brand-strong)]">{resumeMinutes}</span>
              ) : null}
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-2">
                {mediaType === "tv" ? episodeLabel : formatRuntime(detail.runtime)}
              </span>
            </div>
          </div>

          {mediaType === "tv" && season && detail.seasons ? (
            <div className="flex w-full flex-col gap-3 xl:max-w-xl xl:items-end">
              <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                <SeasonPicker
                  tvId={detail.id}
                  seasons={detail.seasons}
                  selectedSeasonNumber={season.seasonNumber}
                  routeMode="watch"
                />
                {previousEpisodeHref ? (
                  <Link
                    href={previousEpisodeHref}
                    className="theme-button-secondary inline-flex min-h-11 items-center rounded-full px-4 text-sm text-white"
                  >
                    Previous
                  </Link>
                ) : null}
                {nextEpisodeHref ? (
                  <Link
                    href={nextEpisodeHref}
                    className="theme-button-primary inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
              {currentEpisode?.overview ? (
                <p className="max-w-xl text-sm leading-6 text-[var(--color-text-muted)] xl:text-right">
                  {currentEpisode.overview}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <ProviderGate
        providers={providers}
        title={detail.title}
        profileId={viewer.activeProfile?.id ?? null}
        mediaId={detail.id}
        mediaType={mediaType as MediaType}
        seasonNumber={mediaType === "tv" ? seasonNumber : undefined}
        episodeNumber={mediaType === "tv" ? episodeNumber : undefined}
        nextEpisodeHref={nextEpisodeHref}
        autoplaySequence={autoplaySequence}
      />

      <details className="surface rounded-[28px] p-5">
        <summary className="cursor-pointer list-none text-sm font-medium text-white">
          <span className="flex items-center justify-between gap-3">
            <span>Watch progress</span>
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              Expand
            </span>
          </span>
        </summary>
        <div className="mt-4">
          <WatchStatePanel
            profileId={viewer.activeProfile?.id ?? null}
            mediaId={detail.id}
            mediaType={mediaType as MediaType}
            seasonNumber={mediaType === "tv" ? seasonNumber : undefined}
            episodeNumber={mediaType === "tv" ? episodeNumber : undefined}
          />
        </div>
      </details>

      {season?.episodes?.length ? (
        <details className="surface rounded-[28px] p-5">
          <summary className="cursor-pointer list-none text-sm font-medium text-white">
            <span className="flex items-center justify-between gap-3">
              <span>
                {season.name} episodes
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                {season.episodes.length} total
              </span>
            </span>
          </summary>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {season.episodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/tv/${detail.id}/watch?season=${season.seasonNumber}&episode=${episode.episodeNumber}`}
                className={`rounded-[22px] border px-4 py-4 text-sm transition ${
                  episode.episodeNumber === episodeNumber
                    ? "border-[var(--color-brand-line)] bg-[var(--color-brand-soft)] text-white"
                    : "border-white/10 bg-black/20 text-[var(--color-text-muted)] hover:border-[var(--color-brand-line)] hover:text-white"
                }`}
              >
                <p className="font-medium">Episode {episode.episodeNumber}: {episode.name}</p>
                {episode.episodeNumber === episodeNumber ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--color-brand-strong)]">
                    Now playing
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </details>
      ) : null}
    </PageFrame>
  );
}
