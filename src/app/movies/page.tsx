import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { RouteLinkRow } from "@/components/route-link-row";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getWatchlist } from "@/lib/persistence";
import { getCatalogRail, getGenreOptions } from "@/lib/tmdb";
import { buildMediaKey, parsePositiveInt } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";

type MoviesPageProps = {
  searchParams: Promise<{
    genre?: string;
  }>;
};

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const params = await searchParams;
  const genreId = parsePositiveInt(params.genre);
  const genreOptions = getGenreOptions("movie");
  const [rails, watchlist] = await Promise.all([
    getCatalogRail("movie", {
      genreId,
    }),
    viewer.activeProfile ? getWatchlist(viewer.activeProfile.id) : Promise.resolve([]),
  ]);
  const watchlistKeys = watchlist.map((record) => buildMediaKey(record.mediaType, record.mediaId));

  if (!rails) {
    return (
      <PageFrame activeHref="/movies">
        <UnavailablePanel
          title="Movies are unavailable right now."
          message="The movie collection could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/movies">
      <PageHero
        eyebrow="Movies"
        title="Big-screen stories, surfaced with a premium feel."
        description="Browse by genre, follow what is rising, and move through movies with less scrolling and better context."
        backdropPath={rails[0]?.items[0]?.backdropPath ?? null}
      />
      <RouteLinkRow
        items={[
          { href: "/browse", label: "For You" },
          { href: "/search", label: "Search" },
          ...genreOptions.slice(0, 6).map((genre) => ({
            href: `/movies?genre=${genre.id}`,
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
