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
        description="Search stays simple for v1: one focused results page, better spacing, and clearer empty states."
      />
      <section className="surface rounded-[30px] p-6 sm:p-8">
        <form className="flex flex-col gap-3 sm:flex-row" action="/search">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search titles from TMDB..."
            className="surface min-h-14 flex-1 rounded-full px-5 text-base text-white outline-none placeholder:text-[var(--color-text-muted)]"
          />
          <button className="rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-[#07111f]">
            Search
          </button>
        </form>
      </section>
      <SearchResults query={query} results={results} />
    </PageFrame>
  );
}
