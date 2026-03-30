import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { ProfileGrid } from "@/components/profile-grid";
import { EmptyState } from "@/components/empty-state";
import { getViewerContext } from "@/lib/viewer";

export default async function ProfilesPage() {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const profiles = viewer.profiles;

  return (
    <PageFrame activeHref="/profiles">
      <PageHero
        eyebrow="Profiles"
        title="Multiple moods, separate rails, one account."
        description="Each profile keeps its own watchlist, continue-watching flow, and provider region without turning v1 into a full recommendation engine."
      />
      {profiles.length ? (
        <ProfileGrid profiles={profiles} activeProfileId={viewer.activeProfile?.id ?? null} />
      ) : (
        <EmptyState
          title="No profiles yet"
          message="Create your first profile to unlock region-aware providers, watchlist syncing, and continue watching."
        />
      )}
    </PageFrame>
  );
}
