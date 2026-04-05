import { FeaturedCarousel } from "@/components/featured-carousel";
import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { withMinimumDelay } from "@/lib/loading";
import { getWatchlist } from "@/lib/persistence";
import { getHomePageData } from "@/lib/tmdb";
import { buildMediaKey } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";
import { getPersonalizedRails } from "@/lib/watch-state";

export default async function BrowsePage() {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const [data, personalized, watchlist] = await withMinimumDelay(
    Promise.all([
      getHomePageData(),
      viewer.activeProfile ? getPersonalizedRails(viewer.activeProfile.id) : Promise.resolve(null),
      viewer.activeProfile ? getWatchlist(viewer.activeProfile.id) : Promise.resolve([]),
    ]),
  );
  const watchlistKeys = watchlist.map((record) => buildMediaKey(record.mediaType, record.mediaId));
  const homeRails = data?.rails.filter((rail) => rail.id === "new-this-week" || rail.id === "trending") ?? [];

  if (!data) {
    return (
      <PageFrame activeHref="/browse">
        <UnavailablePanel
          title="Catalog data is unavailable."
          message="The catalog could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/browse">
      <FeaturedCarousel items={data.featuredSlides} />
      {personalized?.continueWatchingRail ? (
        <MediaRail
          rail={personalized.continueWatchingRail}
          profileId={viewer.activeProfile?.id ?? null}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
      {personalized?.becauseYouWatchedRail ? (
        <MediaRail
          rail={personalized.becauseYouWatchedRail}
          profileId={viewer.activeProfile?.id ?? null}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
      {personalized?.genreAffinityRail ? (
        <MediaRail
          rail={personalized.genreAffinityRail}
          profileId={viewer.activeProfile?.id ?? null}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
      {personalized?.favoriteFormatRail ? (
        <MediaRail
          rail={personalized.favoriteFormatRail}
          profileId={viewer.activeProfile?.id ?? null}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
      {personalized?.languageAffinityRail ? (
        <MediaRail
          rail={personalized.languageAffinityRail}
          profileId={viewer.activeProfile?.id ?? null}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
      {personalized?.recentlyWatchedRail ? (
        <MediaRail
          rail={personalized.recentlyWatchedRail}
          profileId={viewer.activeProfile?.id ?? null}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
      {personalized?.watchlistPicksRail ? (
        <MediaRail
          rail={personalized.watchlistPicksRail}
          profileId={viewer.activeProfile?.id ?? null}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
      <div className="space-y-12">
        {homeRails.map((rail) => (
          <MediaRail
            key={rail.id}
            rail={rail}
            profileId={viewer.activeProfile?.id ?? null}
            watchlistKeys={watchlistKeys}
          />
        ))}
      </div>
    </PageFrame>
  );
}
