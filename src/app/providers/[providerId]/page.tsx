import { notFound } from "next/navigation";
import { ProviderCatalog } from "@/components/provider-catalog";
import { PageFrame } from "@/components/page-frame";
import { RegionForm } from "@/components/region-form";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { withMinimumDelay } from "@/lib/loading";
import { getWatchlist } from "@/lib/persistence";
import { getProviderCatalog, getProviderRails } from "@/lib/tmdb";
import { buildMediaKey, parsePositiveInt } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";

type ProviderPageProps = {
  params: Promise<{
    providerId: string;
  }>;
};

export default async function ProviderPage({ params }: ProviderPageProps) {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const { providerId: providerIdParam } = await params;
  const providerId = parsePositiveInt(providerIdParam);

  if (!providerId) {
    notFound();
  }

  const [catalog, watchlist] = await withMinimumDelay(
    Promise.all([
      getProviderCatalog(providerId, viewer.providerRegion),
      viewer.activeProfile ? getWatchlist(viewer.activeProfile.id) : Promise.resolve([]),
    ]),
  );

  if (!catalog) {
    const rails = await getProviderRails(viewer.providerRegion);

    if (rails && !rails.some((rail) => rail.provider.providerId === providerId)) {
      notFound();
    }

    return (
      <PageFrame activeHref="/providers">
        <UnavailablePanel
          title="This provider page is unavailable right now."
          message="The provider catalog could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  const watchlistKeys = watchlist.map((record) => buildMediaKey(record.mediaType, record.mediaId));

  return (
    <PageFrame activeHref="/providers">
      {viewer.activeProfile ? (
        <RegionForm profile={viewer.activeProfile} returnTo={`/providers/${providerId}`} />
      ) : null}
      <ProviderCatalog
        catalog={catalog}
        profileId={viewer.activeProfile?.id ?? null}
        watchlistKeys={watchlistKeys}
      />
    </PageFrame>
  );
}
