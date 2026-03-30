import { AccountOverview } from "@/components/account-overview";
import { EmptyState } from "@/components/empty-state";
import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { RouteLinkRow } from "@/components/route-link-row";
import { RegionForm } from "@/components/region-form";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getContinueWatching, getWatchlist } from "@/lib/persistence";
import { getMediaSummariesByIds } from "@/lib/tmdb";
import { getViewerContext } from "@/lib/viewer";

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

  const [continueWatching, watchlist] = await Promise.all([
    getContinueWatching(viewer.activeProfile.id),
    getWatchlist(viewer.activeProfile.id),
  ]);
  const [continueWatchingItems, watchlistItems] = await Promise.all([
    getMediaSummariesByIds(
      continueWatching.map((record) => ({ mediaType: record.mediaType, mediaId: record.mediaId })),
    ),
    getMediaSummariesByIds(watchlist.map((record) => ({ mediaType: record.mediaType, mediaId: record.mediaId }))),
  ]);

  const continueWatchingRail = {
    id: "continue-watching",
    title: "Continue Watching",
    eyebrow: "Profile aware",
    items: continueWatchingItems,
  };

  const watchlistRail = {
    id: "watchlist",
    title: "My Watchlist",
    eyebrow: "Saved for later",
    items: watchlistItems,
  };

  return (
    <PageFrame>
      <AccountOverview />
      <RouteLinkRow
        items={[
          { href: "/profiles", label: "Switch Profiles" },
          { href: "/settings", label: "Settings" },
          { href: "/providers", label: "Providers" },
        ]}
      />
      <RegionForm profile={viewer.activeProfile} returnTo="/account" />
      {continueWatchingItems.length ? (
        <MediaRail rail={continueWatchingRail} />
      ) : (
        <EmptyState
          title="Nothing in continue watching"
          message="Once this profile has watch progress records in Supabase, titles will appear here with live TMDB metadata."
        />
      )}
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
