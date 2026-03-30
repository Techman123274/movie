import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getCatalogRail } from "@/lib/tmdb";
import { getViewerContext } from "@/lib/viewer";

export default async function ShowsPage() {
  await getViewerContext({ redirectToOnboarding: true });
  const rails = await getCatalogRail("tv");

  if (!rails) {
    return (
      <PageFrame activeHref="/shows">
        <UnavailablePanel
          title="Series are unavailable right now."
          message="This page now depends on live TMDB responses only. Verify the TMDB keys and try again."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/shows">
      <PageHero
        eyebrow="Series"
        title="Season-spanning drama, thrillers, and prestige television."
        description="Scroll through TV discovery shelves with cleaner spacing and a stronger streaming-style browsing rhythm."
        backdropPath={rails[0]?.items[0]?.backdropPath ?? null}
      />
      {rails.map((rail) => (
        <MediaRail key={rail.id} rail={rail} />
      ))}
    </PageFrame>
  );
}
