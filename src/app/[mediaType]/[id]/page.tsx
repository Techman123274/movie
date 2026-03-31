import { notFound } from "next/navigation";
import { CastStrip } from "@/components/cast-strip";
import { DetailHero } from "@/components/detail-hero";
import { EpisodeBrowser } from "@/components/episode-browser";
import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { ProviderBadges } from "@/components/provider-badges";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getResumeTarget, isInWatchlist } from "@/lib/persistence";
import { getMediaDetail, getSeasonEpisodes } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";
import { parsePositiveInt, resolveSeasonSelection } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";

type DetailPageProps = {
  params: Promise<{
    mediaType: string;
    id: string;
  }>;
  searchParams: Promise<{
    season?: string;
  }>;
};

export default async function DetailPage({ params, searchParams }: DetailPageProps) {
  const [{ mediaType, id }, query] = await Promise.all([params, searchParams]);

  if (mediaType !== "movie" && mediaType !== "tv") {
    notFound();
  }

  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const detail = await getMediaDetail(mediaType as MediaType, Number(id), viewer.providerRegion);

  if (!detail) {
    return (
      <PageFrame activeHref={mediaType === "movie" ? "/movies" : "/shows"}>
        <UnavailablePanel
          title="Title details are unavailable."
          message="This page now depends on live TMDB metadata only. Verify the TMDB configuration or the title ID and try again."
        />
      </PageFrame>
    );
  }

  const [inWatchlist, resumeTarget] = viewer.activeProfile
    ? await Promise.all([
        isInWatchlist(viewer.activeProfile.id, detail.id, detail.mediaType),
        getResumeTarget(viewer.activeProfile.id, detail.id, detail.mediaType),
      ])
    : [false, null];
  const selectedSeasonNumber =
    mediaType === "tv"
      ? resolveSeasonSelection({
          seasons: detail.seasons,
          requestedSeasonNumber: parsePositiveInt(query.season),
          resumeSeasonNumber: resumeTarget?.seasonNumber,
        })
      : undefined;
  const season =
    mediaType === "tv" && selectedSeasonNumber
      ? await getSeasonEpisodes(detail.id, selectedSeasonNumber)
      : undefined;

  return (
    <PageFrame activeHref={mediaType === "movie" ? "/movies" : "/shows"}>
      <DetailHero
        item={detail}
        profileId={viewer.activeProfile?.id ?? null}
        inWatchlist={inWatchlist}
        resumeTarget={resumeTarget}
      />
      <ProviderBadges providers={detail.providers} />
      {season && detail.seasons ? (
        <EpisodeBrowser
          tvId={detail.id}
          seasons={detail.seasons}
          selectedSeason={season}
          resumeTarget={resumeTarget}
        />
      ) : null}
      <CastStrip cast={detail.cast} />
      <MediaRail
        rail={{
          id: "related",
          title: "You may also like",
          eyebrow: "More from the vault",
          items: detail.related,
        }}
      />
    </PageFrame>
  );
}
