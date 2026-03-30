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
          title="Provider sections are unavailable."
          message="Provider rails now come directly from TMDB watch-provider data. Verify the TMDB configuration and try again."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/providers">
      <PageHero
        eyebrow="Providers"
        title="Browse Netflix, Hulu, Max, Prime Video, and every other TMDB provider rail."
        description="Provider discovery lives here now, separate from the playback providers used on watch pages."
      />

      {viewer.activeProfile ? <RegionForm profile={viewer.activeProfile} returnTo="/providers" /> : null}

      {rails.length ? (
        <ProviderRailList rails={rails} />
      ) : (
        <EmptyState
          title="No provider rails for this region"
          message="Try another two-letter region code on the active profile to refresh TMDB provider availability."
        />
      )}
    </PageFrame>
  );
}
