import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/page-frame";
import { ProviderGate } from "@/components/provider-gate";
import { SeasonPicker } from "@/components/season-picker";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { WatchStatePanel } from "@/components/watch-state-panel";
import { getResumeTarget } from "@/lib/persistence";
import { resolvePlaybackOptions } from "@/lib/playback";
import { getMediaDetail, getSeasonEpisodes } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";
import { buildWatchHref, formatEpisodeLabel, parsePositiveInt, resolveSeasonSelection } from "@/lib/utils";
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
  const detail = await getMediaDetail(mediaType as MediaType, Number(id), viewer.providerRegion);

  if (!detail) {
    return (
      <PageFrame>
        <UnavailablePanel
          title="Watch data is unavailable."
          message="Playback pages still use the validated playback providers, but the title metadata now comes from live TMDB only."
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

  return (
    <PageFrame>
      <section className="surface-strong rounded-[34px] p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">Watch</p>
        <h1 className="display-font text-5xl text-white">{detail.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
          {mediaType === "tv"
            ? `Season ${season?.seasonNumber ?? seasonNumber ?? 1}, episode ${currentEpisode?.episodeNumber ?? episodeNumber}. This player now records resume state for the active profile so browse, account, and detail pages can bring you back here quickly.`
            : "This distraction-free watch shell now updates profile resume state automatically so you can jump back in from the rest of the app."}
        </p>
      </section>

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
                  className="surface inline-flex min-h-11 items-center rounded-full px-4 text-sm text-white transition hover:bg-white/10"
                >
                  Previous episode
                </Link>
              ) : null}
              {nextEpisodeHref ? (
                <Link
                  href={nextEpisodeHref}
                  className="inline-flex min-h-11 items-center rounded-full bg-[var(--color-brand)] px-4 text-sm font-semibold text-[#07111f]"
                >
                  Next episode
                </Link>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      <WatchStatePanel
        profileId={viewer.activeProfile?.id ?? null}
        mediaId={detail.id}
        mediaType={mediaType as MediaType}
        seasonNumber={mediaType === "tv" ? seasonNumber : undefined}
        episodeNumber={mediaType === "tv" ? episodeNumber : undefined}
      />

      <ProviderGate providers={providers} />

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
                    ? "border-[rgba(214,179,109,0.45)] bg-[rgba(214,179,109,0.12)] text-white"
                    : "border-white/10 bg-black/20 text-[var(--color-text-muted)] hover:border-[rgba(214,179,109,0.35)] hover:text-white"
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
