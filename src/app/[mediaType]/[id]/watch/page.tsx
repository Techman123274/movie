import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/page-frame";
import { ProviderGate } from "@/components/provider-gate";
import { RouteLinkRow } from "@/components/route-link-row";
import { SeasonPicker } from "@/components/season-picker";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { WatchStatePanel } from "@/components/watch-state-panel";
import { withMinimumDelay } from "@/lib/loading";
import { getResumeTarget } from "@/lib/persistence";
import { resolvePlaybackOptions } from "@/lib/playback";
import { getImageUrl, getMediaDetail, getSeasonEpisodes } from "@/lib/tmdb";
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
      <PageFrame>
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
  const watchBackdrop = getImageUrl(detail.backdropPath, "w1280");
  const enabledProviderCount = providers.filter((provider) => provider.availability === "enabled").length;
  const resumeMinutes =
    resumeTarget?.progressSeconds && resumeTarget.progressSeconds > 0
      ? `${Math.max(1, Math.floor(resumeTarget.progressSeconds / 60))}m saved`
      : null;

  return (
    <PageFrame>
      <section
        className="relative overflow-hidden rounded-[34px] border border-white/10 px-8 py-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
        style={{
          backgroundImage: watchBackdrop
            ? `linear-gradient(90deg, rgba(8,8,10,0.95) 0%, rgba(8,8,10,0.82) 45%, rgba(8,8,10,0.42) 100%), url(${watchBackdrop})`
            : "linear-gradient(135deg, rgba(229,9,20,0.16), rgba(8,8,10,0.96))",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.18),transparent_32%)]" />
        <div className="relative">
          <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">Watch</p>
          <h1 className="display-font text-5xl text-white">{detail.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
            {mediaType === "tv"
              ? `Season ${season?.seasonNumber ?? seasonNumber ?? 1}, episode ${currentEpisode?.episodeNumber ?? episodeNumber}. Keep your place, move between servers, and stay ready for the next episode.`
              : "Pick up the movie, switch servers if needed, and keep your place without leaving the watch page."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2">
              {enabledProviderCount} servers ready
            </span>
            {resumeMinutes ? (
              <span className="theme-chip rounded-full px-4 py-2 text-[var(--color-brand-strong)]">
                {resumeMinutes}
              </span>
            ) : null}
            <span className="rounded-full border border-white/10 bg-black/20 px-4 py-2">
              {mediaType === "tv"
                ? formatEpisodeLabel(season?.seasonNumber, currentEpisode?.episodeNumber) ?? "Episode ready"
                : formatRuntime(detail.runtime)}
            </span>
          </div>
        </div>
      </section>

      <RouteLinkRow
        items={[
          { href: `/${mediaType}/${detail.id}`, label: "Back to details" },
          { href: "/browse", label: "For You" },
          { href: "/account", label: "My Profile" },
        ]}
      />

      {mediaType === "tv" && season && currentEpisode && detail.seasons ? (
        <section className="surface rounded-[30px] p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">
                Currently watching
              </p>
              <h2 className="display-font text-3xl text-white">
                {formatEpisodeLabel(season.seasonNumber, currentEpisode.episodeNumber)}
              </h2>
              <p className="mt-2 text-base text-white">{currentEpisode.name}</p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
                {currentEpisode.overview || "This episode is queued and ready to keep your binge session moving."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
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
                  Previous episode
                </Link>
              ) : null}
              {nextEpisodeHref ? (
                <Link
                  href={nextEpisodeHref}
                  className="theme-button-primary inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold"
                >
                  Next episode
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <ProviderGate
        providers={providers}
        title={detail.title}
        profileId={viewer.activeProfile?.id ?? null}
        mediaId={detail.id}
        mediaType={mediaType as MediaType}
        seasonNumber={mediaType === "tv" ? seasonNumber : undefined}
        episodeNumber={mediaType === "tv" ? episodeNumber : undefined}
        nextEpisodeHref={nextEpisodeHref}
      />

      <WatchStatePanel
        profileId={viewer.activeProfile?.id ?? null}
        mediaId={detail.id}
        mediaType={mediaType as MediaType}
        seasonNumber={mediaType === "tv" ? seasonNumber : undefined}
        episodeNumber={mediaType === "tv" ? episodeNumber : undefined}
      />

      {season?.episodes?.length ? (
        <section className="surface rounded-[30px] p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-medium text-white">{season.name}</h2>
            <Link href={`/tv/${detail.id}`} className="text-sm text-[var(--color-brand-strong)]">
              Back to series detail
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
        </section>
      ) : null}
    </PageFrame>
  );
}
