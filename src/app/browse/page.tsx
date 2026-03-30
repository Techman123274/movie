import { FeaturedCarousel } from "@/components/featured-carousel";
import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { RouteLinkRow } from "@/components/route-link-row";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getHomePageData } from "@/lib/tmdb";
import { getViewerContext } from "@/lib/viewer";

export default async function BrowsePage() {
  await getViewerContext({ redirectToOnboarding: true });
  const data = await getHomePageData();

  if (!data) {
    return (
      <PageFrame activeHref="/browse">
        <UnavailablePanel
          title="Catalog data is unavailable."
          message="Subflix now uses live TMDB data only. Add working TMDB credentials and try again."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/browse">
      <FeaturedCarousel items={data.featuredSlides} />
      <section className="surface rounded-[28px] p-6">
        <p className="mb-2 text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Browse next</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="display-font text-3xl text-white">Keep movies and shows front and center.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              Provider discovery stays on its own page now. Sports still has a dedicated lane when you want live events.
            </p>
          </div>
          <RouteLinkRow
            items={[
              { href: "/movies", label: "Movies" },
              { href: "/shows", label: "Series" },
              { href: "/sports", label: "Sports" },
            ]}
          />
        </div>
      </section>
      <div className="space-y-12">
        {data.rails.map((rail) => (
          <MediaRail key={rail.id} rail={rail} />
        ))}
      </div>
    </PageFrame>
  );
}
