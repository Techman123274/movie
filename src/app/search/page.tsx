import { LiveSearch } from "@/components/live-search";
import { PageHero } from "@/components/page-hero";
import { PageFrame } from "@/components/page-frame";
import { SearchFilterBar } from "@/components/search-filter-bar";
import { SearchResults } from "@/components/search-results";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { withMinimumDelay } from "@/lib/loading";
import { getWatchlist } from "@/lib/persistence";
import { searchCatalogExperience } from "@/lib/tmdb";
import { buildMediaKey, parsePositiveInt } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    sort?: string;
    person?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const selectedType =
    params.type === "movie" || params.type === "tv" || params.type === "person" ? params.type : "all";
  const selectedSort =
    params.sort === "rating" || params.sort === "popularity" || params.sort === "release_date"
      ? params.sort
      : "relevance";
  const personId = parsePositiveInt(params.person);
  const [results, watchlist] = await withMinimumDelay(
    Promise.all([
      searchCatalogExperience({
        query,
        type: selectedType,
        sort: selectedSort,
        personId,
      }),
      viewer.activeProfile ? getWatchlist(viewer.activeProfile.id) : Promise.resolve([]),
    ]),
  );
  const watchlistKeys = watchlist.map((record) => buildMediaKey(record.mediaType, record.mediaId));

  if (results === null) {
    return (
      <PageFrame activeHref="/search">
        <UnavailablePanel
          title="Search is unavailable."
          message="Search could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/search">
      <PageHero
        eyebrow="Search"
        title="Find a film, series, or tonight's next obsession."
        description="Search by title, cast, or mood, then narrow the results quickly with cleaner filters and better ranking."
      />
      <section className="surface rounded-[30px] p-6 sm:p-8">
        <LiveSearch initialQuery={query} placeholder="Search movies, series, or cast..." variant="full" />
      </section>
      <SearchFilterBar
        query={query}
        selectedType={selectedType}
        selectedSort={selectedSort}
        selectedPersonId={personId}
      />
      <SearchResults
        query={query}
        results={results}
        selectedType={selectedType}
        profileId={viewer.activeProfile?.id ?? null}
        watchlistKeys={watchlistKeys}
      />
    </PageFrame>
  );
}
