import { notFound } from "next/navigation";
import { CastStrip } from "@/components/cast-strip";
import { DetailHero } from "@/components/detail-hero";
import { EpisodeBrowser } from "@/components/episode-browser";
import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { ProviderBadges } from "@/components/provider-badges";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { isInWatchlist } from "@/lib/persistence";
import { getMediaDetail, getSeasonEpisodes } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";
import { getViewerContext } from "@/lib/viewer";

type DetailPageProps = {
  params: Promise<{
    mediaType: string;
    id: string;
  }>;
};

export default async function DetailPage({ params }: DetailPageProps) {
  const { mediaType, id } = await params;

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

  const inWatchlist = viewer.activeProfile
    ? await isInWatchlist(viewer.activeProfile.id, detail.id, detail.mediaType)
    : false;
  const season =
    mediaType === "tv" && detail.seasons?.[0]
      ? await getSeasonEpisodes(detail.id, detail.seasons[0].seasonNumber)
      : undefined;

  return (
    <PageFrame activeHref={mediaType === "movie" ? "/movies" : "/shows"}>
      <DetailHero item={detail} profileId={viewer.activeProfile?.id ?? null} inWatchlist={inWatchlist} />
      <ProviderBadges providers={detail.providers} />
      {season ? <EpisodeBrowser tvId={detail.id} selectedSeason={season} /> : null}
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
