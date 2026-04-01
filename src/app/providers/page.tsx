import { EmptyState } from "@/components/empty-state";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { ProviderRailList } from "@/components/provider-rail-list";
import { RegionForm } from "@/components/region-form";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getProviderRails } from "@/lib/tmdb";
import { getViewerContext } from "@/lib/viewer";

export default async function ProvidersPage() {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const rails = await getProviderRails(viewer.providerRegion);

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
        title="See where movies and series are available across your favorite services."
        description="Browse streaming availability by service and keep discovery separate from the watch experience."
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
