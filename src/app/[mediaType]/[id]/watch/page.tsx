import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/page-frame";
import { ProviderGate } from "@/components/provider-gate";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { resolvePlaybackOptions } from "@/lib/playback";
import { getMediaDetail, getSeasonEpisodes } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";
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

  const seasonNumber = Number(query.season || detail.seasons?.[0]?.seasonNumber || 1);
  const episodeNumber = Number(query.episode || 1);
  const season =
    mediaType === "tv" && detail.seasons?.length ? await getSeasonEpisodes(detail.id, seasonNumber) : undefined;
  const providers = resolvePlaybackOptions({
    mediaType: mediaType as MediaType,
    tmdbId: detail.id,
    seasonNumber,
    episodeNumber,
  });

  return (
    <PageFrame>
      <section className="surface-strong rounded-[34px] p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">Watch</p>
        <h1 className="display-font text-5xl text-white">{detail.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
          {mediaType === "tv"
            ? `Season ${seasonNumber}, episode ${episodeNumber}. Continue watching is profile-aware and ready for persisted progress once Supabase is configured.`
            : "This distraction-free watch shell is designed to keep the surrounding experience premium and uncluttered."}
        </p>
      </section>

      <ProviderGate providers={providers} />

      {season?.episodes?.length ? (
        <section className="surface rounded-[30px] p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-medium text-white">Episode picks</h2>
            <Link href={`/tv/${detail.id}`} className="text-sm text-[var(--color-brand-strong)]">
              Back to series detail
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {season.episodes.map((episode) => (
              <Link
                key={episode.id}
                href={`/tv/${detail.id}/watch?season=${season.seasonNumber}&episode=${episode.episodeNumber}`}
                className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm text-[var(--color-text-muted)] transition hover:border-[rgba(214,179,109,0.35)] hover:text-white"
              >
                Episode {episode.episodeNumber}: {episode.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </PageFrame>
  );
}
