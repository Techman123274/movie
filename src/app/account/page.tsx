import { AccountOverview } from "@/components/account-overview";
import { EmptyState } from "@/components/empty-state";
import { HouseholdPulse } from "@/components/household-pulse";
import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { RouteLinkRow } from "@/components/route-link-row";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getWatchlist } from "@/lib/persistence";
import { getHouseholdSocialState } from "@/lib/social";
import { getMediaSummariesByIds } from "@/lib/tmdb";
import { buildMediaKey } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";
import { getPersonalizedRails } from "@/lib/watch-state";

export default async function AccountPage() {
  const viewer = await getViewerContext({ redirectToOnboarding: true });

  if (viewer.readinessIssue === "missing-supabase-config" || viewer.readinessIssue === "missing-service-role") {
    return (
      <PageFrame activeHref="/account">
        <UnavailablePanel
          title="Account data is unavailable."
          message="Your account details could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  if (!viewer.activeProfile) {
    return (
      <PageFrame activeHref="/account">
        <EmptyState
          title="No active profile"
          message="Choose or create a profile before using watchlist and continue watching."
        />
      </PageFrame>
    );
  }

  const [personalized, watchlist] = await Promise.all([
    getPersonalizedRails(viewer.activeProfile.id),
    getWatchlist(viewer.activeProfile.id),
  ]);
  const watchlistItems = await getMediaSummariesByIds(
    watchlist.map((record) => ({ mediaType: record.mediaType, mediaId: record.mediaId })),
  );
  const watchlistKeys = watchlist.map((record) => buildMediaKey(record.mediaType, record.mediaId));
  const householdPulse = await getHouseholdSocialState(viewer.profiles, viewer.activeProfile.id);

  const watchlistRail = {
    id: "watchlist",
    title: "My Watchlist",
    eyebrow: "Saved for later",
    items: watchlistItems,
  };

  return (
    <PageFrame activeHref="/account">
      <AccountOverview
        activeProfile={{
          name: viewer.activeProfile.name,
          avatar: viewer.activeProfile.avatar,
          accent: viewer.activeProfile.accent,
          maturityRating: viewer.activeProfile.maturityRating,
          providerRegion: viewer.activeProfile.providerRegion,
        }}
        stats={{
          profiles: viewer.profiles.length,
          continueWatching: personalized.continueWatchingCount,
          recentlyWatched: personalized.recentlyWatchedCount,
          watchlist: watchlistItems.length,
        }}
      />
      <HouseholdPulse state={householdPulse} profileId={viewer.activeProfile.id} watchlistKeys={watchlistKeys} />
      <RouteLinkRow
        items={[
          { href: "/profiles", label: "Switch Profiles" },
          { href: "/settings", label: "Settings" },
          { href: "/providers", label: "Where to Watch" },
        ]}
      />
      {personalized.continueWatchingRail ? (
        <MediaRail
          rail={personalized.continueWatchingRail}
          profileId={viewer.activeProfile.id}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
      {personalized.becauseYouWatchedRail ? (
        <MediaRail
          rail={personalized.becauseYouWatchedRail}
          profileId={viewer.activeProfile.id}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
      {personalized.recentlyWatchedRail ? (
        <MediaRail
          rail={personalized.recentlyWatchedRail}
          profileId={viewer.activeProfile.id}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
      {!personalized.continueWatchingRail && !personalized.recentlyWatchedRail ? (
        <EmptyState
          title="No watch activity yet"
          message="Start any movie or episode and this account view will begin surfacing resume picks and recent activity for the active profile."
        />
      ) : null}
      {watchlistItems.length ? (
        <MediaRail rail={watchlistRail} profileId={viewer.activeProfile.id} watchlistKeys={watchlistKeys} />
      ) : (
        <EmptyState
          title="Watchlist is empty"
          message="Save titles from any details page to build a queue you can come back to anytime."
        />
      )}
    </PageFrame>
  );
}
