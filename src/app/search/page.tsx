import { LiveSearch } from "@/components/live-search";
import { PageHero } from "@/components/page-hero";
import { PageFrame } from "@/components/page-frame";
import { SearchResults } from "@/components/search-results";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { searchCatalog } from "@/lib/tmdb";
import { getViewerContext } from "@/lib/viewer";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  await getViewerContext({ redirectToOnboarding: true });
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const results = await searchCatalog(query);

  if (results === null) {
    return (
      <PageFrame activeHref="/search">
        <UnavailablePanel
          title="Search is unavailable."
          message="Search now runs exclusively on live TMDB data. Verify the TMDB configuration and try again."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/search">
      <PageHero
        eyebrow="Search"
        title="Find a film, series, or tonight's next obsession."
        description="Search now suggests movies and series while you type, then opens the full results page when you want to dig deeper."
      />
      <section className="surface rounded-[30px] p-6 sm:p-8">
        <LiveSearch initialQuery={query} placeholder="Search titles from TMDB..." variant="full" />
      </section>
      <SearchResults query={query} results={results} />
    </PageFrame>
  );
}
