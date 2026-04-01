import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { RouteLinkRow } from "@/components/route-link-row";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getWatchlist } from "@/lib/persistence";
import { getGenreOptions, getShowCatalogRails } from "@/lib/tmdb";
import { buildMediaKey, parsePositiveInt } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";

type ShowsPageProps = {
  searchParams: Promise<{
    genre?: string;
  }>;
};

export default async function ShowsPage({ searchParams }: ShowsPageProps) {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const params = await searchParams;
  const genreId = parsePositiveInt(params.genre);
  const genreOptions = getGenreOptions("tv");
  const [rails, watchlist] = await Promise.all([
    getShowCatalogRails({
      genreId,
    }),
    viewer.activeProfile ? getWatchlist(viewer.activeProfile.id) : Promise.resolve([]),
  ]);
  const watchlistKeys = watchlist.map((record) => buildMediaKey(record.mediaType, record.mediaId));

  if (!rails) {
    return (
      <PageFrame activeHref="/shows">
        <UnavailablePanel
          title="Series are unavailable right now."
          message="The series collection could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/shows">
      <PageHero
        eyebrow="Series"
        title="Season-spanning stories and standout television."
        description="Browse by genre, keep pace with new episodes, and move into your next series without the clutter."
        backdropPath={rails[0]?.items[0]?.backdropPath ?? null}
      />
      <RouteLinkRow
        items={[
          { href: "/browse", label: "For You" },
          { href: "/search", label: "Search" },
          ...genreOptions.slice(0, 6).map((genre) => ({
            href: `/shows?genre=${genre.id}`,
            label: genreId === genre.id ? `${genre.label} / Active` : genre.label,
          })),
        ]}
      />
      {rails.map((rail) => (
        <MediaRail
          key={rail.id}
          rail={rail}
          profileId={viewer.activeProfile?.id ?? null}
          watchlistKeys={watchlistKeys}
        />
      ))}
    </PageFrame>
  );
}
