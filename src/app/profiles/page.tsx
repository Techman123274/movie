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
        title="Who&apos;s watching?"
        description="Keep each profile simple, separate, and ready to jump back into its own saved titles, continue watching, and region-based catalog."
      />
      {profiles.length ? (
        <ProfileGrid profiles={profiles} activeProfileId={viewer.activeProfile?.id ?? null} />
      ) : (
        <EmptyState
          title="No profiles yet"
          message="Create your first profile to unlock saved titles, continue watching, and a more personalized home."
        />
      )}
    </PageFrame>
  );
}
