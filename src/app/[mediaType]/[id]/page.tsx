import { notFound } from "next/navigation";
import { CastStrip } from "@/components/cast-strip";
import { DetailHero } from "@/components/detail-hero";
import { EpisodeBrowser } from "@/components/episode-browser";
import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { ProviderBadges } from "@/components/provider-badges";
import { TitleFactsPanel } from "@/components/title-facts-panel";
import { TitleTrailerPanel } from "@/components/title-trailer-panel";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getProfileFeedback, getResumeTarget, getWatchlist } from "@/lib/persistence";
import { getMediaDetail, getSeasonEpisodes } from "@/lib/tmdb";
import type { MediaType } from "@/lib/types";
import { buildMediaKey, parsePositiveInt, resolveSeasonSelection } from "@/lib/utils";
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
          message="The details for this title could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  const [watchlist, resumeTarget] = viewer.activeProfile
    ? await Promise.all([
        getWatchlist(viewer.activeProfile.id),
        getResumeTarget(viewer.activeProfile.id, detail.id, detail.mediaType),
      ])
    : [[], null];
  const watchlistKeys = watchlist.map((record) => buildMediaKey(record.mediaType, record.mediaId));
  const inWatchlist = watchlistKeys.includes(buildMediaKey(detail.mediaType, detail.id));
  const feedback = viewer.activeProfile
    ? await getProfileFeedback(viewer.activeProfile.id, detail.id, detail.mediaType)
    : null;
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
        feedback={feedback?.value ?? null}
      />
      <TitleFactsPanel item={detail} />
      <TitleTrailerPanel trailers={detail.trailers} />
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
          description: "Close the loop with related titles while this story is still top of mind.",
          items: detail.related,
        }}
        profileId={viewer.activeProfile?.id ?? null}
        watchlistKeys={watchlistKeys}
      />
    </PageFrame>
  );
}
