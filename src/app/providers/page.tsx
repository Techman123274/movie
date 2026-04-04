import { EmptyState } from "@/components/empty-state";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { ProviderRailList } from "@/components/provider-rail-list";
import { RegionForm } from "@/components/region-form";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { withMinimumDelay } from "@/lib/loading";
import { getProviderRails } from "@/lib/tmdb";
import { getViewerContext } from "@/lib/viewer";

export default async function ProvidersPage() {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const rails = await withMinimumDelay(getProviderRails(viewer.providerRegion));

  if (!rails) {
    return (
      <PageFrame activeHref="/providers">
        <UnavailablePanel
          title="Where to watch is unavailable."
          message="Availability information could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/providers">
      <PageHero
        eyebrow="Where to Watch"
        title="Pick a streaming service first, then open its own catalog page."
        description="Keep this screen focused on the recognizable brands. Netflix, Hulu, Disney+, Max, Apple TV+, Crunchyroll, and more now open into their own provider pages with fuller title lists."
        backdropPath={rails[0]?.items[0]?.backdropPath ?? null}
      />

      {viewer.activeProfile ? <RegionForm profile={viewer.activeProfile} returnTo="/providers" /> : null}

      {rails.length ? (
        <ProviderRailList rails={rails} />
      ) : (
        <EmptyState
          title="No services found for this region"
          message="Try a different region on your active profile to refresh availability."
        />
      )}
    </PageFrame>
  );
}
