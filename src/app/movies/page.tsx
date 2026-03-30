import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getCatalogRail } from "@/lib/tmdb";
import { getViewerContext } from "@/lib/viewer";

export default async function MoviesPage() {
  await getViewerContext({ redirectToOnboarding: true });
  const rails = await getCatalogRail("movie");

  if (!rails) {
    return (
      <PageFrame activeHref="/movies">
        <UnavailablePanel
          title="Movies are unavailable right now."
          message="This page no longer uses filler titles. Verify the live TMDB configuration and try again."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/movies">
      <PageHero
        eyebrow="Movies"
        title="Big-screen stories, surfaced like a premium service."
        description="Move through live TMDB movie rails with the same shelf system used across the rest of the app."
        backdropPath={rails[0]?.items[0]?.backdropPath ?? null}
      />
      {rails.map((rail) => (
        <MediaRail key={rail.id} rail={rail} />
      ))}
    </PageFrame>
  );
}
