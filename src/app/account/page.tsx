import { AccountOverview } from "@/components/account-overview";
import { EmptyState } from "@/components/empty-state";
import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { RouteLinkRow } from "@/components/route-link-row";
import { RegionForm } from "@/components/region-form";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getWatchlist } from "@/lib/persistence";
import { getMediaSummariesByIds } from "@/lib/tmdb";
import { getViewerContext } from "@/lib/viewer";
import { getPersonalizedRails } from "@/lib/watch-state";

export default async function AccountPage() {
  const viewer = await getViewerContext({ redirectToOnboarding: true });

  if (viewer.readinessIssue === "missing-supabase-config" || viewer.readinessIssue === "missing-service-role") {
    return (
      <PageFrame>
        <UnavailablePanel
          title="Account data is unavailable."
          message="This page now relies on real Supabase-backed user records only. Add the missing Supabase credentials and try again."
        />
      </PageFrame>
    );
  }

  if (!viewer.activeProfile) {
    return (
      <PageFrame>
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

  const watchlistRail = {
    id: "watchlist",
    title: "My Watchlist",
    eyebrow: "Saved for later",
    items: watchlistItems,
  };

  return (
    <PageFrame>
      <AccountOverview
        stats={{
          profiles: viewer.profiles.length,
          continueWatching: personalized.continueWatchingCount,
          recentlyWatched: personalized.recentlyWatchedCount,
          watchlist: watchlistItems.length,
        }}
      />
      <RouteLinkRow
        items={[
          { href: "/profiles", label: "Switch Profiles" },
          { href: "/settings", label: "Settings" },
          { href: "/providers", label: "Providers" },
        ]}
      />
      <RegionForm profile={viewer.activeProfile} returnTo="/account" />
      {personalized.continueWatchingRail ? <MediaRail rail={personalized.continueWatchingRail} /> : null}
      {personalized.recentlyWatchedRail ? <MediaRail rail={personalized.recentlyWatchedRail} /> : null}
      {!personalized.continueWatchingRail && !personalized.recentlyWatchedRail ? (
        <EmptyState
          title="No watch activity yet"
          message="Start any movie or episode and this account view will begin surfacing resume picks and recent activity for the active profile."
        />
      ) : null}
      {watchlistItems.length ? (
        <MediaRail rail={watchlistRail} />
      ) : (
        <EmptyState
          title="Watchlist is empty"
          message="Save titles from a detail page to build this rail with real TMDB-backed artwork and metadata."
        />
      )}
    </PageFrame>
  );
}
