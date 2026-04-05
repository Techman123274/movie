import Link from "next/link";
import {
  Activity,
  Clock3,
  Gauge,
  Heart,
  ListChecks,
  Lock,
  RadioTower,
  Search,
  ShieldCheck,
  TerminalSquare,
  Users,
} from "lucide-react";
import { updateSiteControlAction } from "@/app/actions";
import { PageFrame } from "@/components/page-frame";
import { ProfileAvatar } from "@/components/profile-avatar";
import { RouteLinkRow } from "@/components/route-link-row";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { hasClerkCredentials, hasSupabaseAdminCredentials, hasSupabaseCredentials, hasTmdbCredentials } from "@/lib/env";
import { getAdminSupportAccounts, getAdminSupportProfileDetail } from "@/lib/persistence";
import { getSiteAnalyticsSummary } from "@/lib/site-analytics";
import { getSiteControlState, requireAdminAccess } from "@/lib/site-control";
import { getMediaSummariesByIds } from "@/lib/tmdb";
import type { AdminSupportAccountSummary, MediaSummary, MediaType } from "@/lib/types";
import { buildMediaKey, buildWatchHref, formatEpisodeLabel, formatMediaLabel } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";

type AdminPageProps = {
  searchParams: Promise<{
    q?: string;
    user?: string;
    profile?: string;
  }>;
};

type SupportListEntry = {
  key: string;
  title: string;
  meta: string;
  timestamp: string;
  actionHref: string;
  actionLabel: string;
  detailHref: string;
  badge?: string;
};

function formatTimestamp(value: string | null | undefined, fallback = "No changes yet") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatShortDate(value: string | null | undefined, fallback = "No activity yet") {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

function formatCount(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function formatRouteLabel(value: string) {
  const labels: Record<string, string> = {
    "/": "Landing",
    "/account": "Profile",
    "/admin": "Admin",
    "/app": "Other app pages",
    "/browse": "Home",
    "/movies": "Movies",
    "/onboarding": "Onboarding",
    "/providers": "Providers",
    "/search": "Search",
    "/settings": "Settings",
    "/shows": "Series",
    "/sign-in": "Sign in",
    "/sign-up": "Sign up",
    "/sports": "Sports",
    "/watch": "Watch",
  };

  return labels[value] ?? value;
}

function buildAdminHref(options: { query?: string; userId?: string; profileId?: string }) {
  const searchParams = new URLSearchParams();

  if (options.query) {
    searchParams.set("q", options.query);
  }

  if (options.userId) {
    searchParams.set("user", options.userId);
  }

  if (options.profileId) {
    searchParams.set("profile", options.profileId);
  }

  const query = searchParams.toString();
  return query ? `/admin?${query}` : "/admin";
}

function matchesAccountQuery(account: AdminSupportAccountSummary, query: string) {
  const needle = query.trim().toLowerCase();

  if (!needle) {
    return true;
  }

  return (
    account.userId.toLowerCase().includes(needle) ||
    account.email?.toLowerCase().includes(needle) ||
    account.profiles.some(
      (profile) =>
        profile.name.toLowerCase().includes(needle) ||
        profile.providerRegion.toLowerCase().includes(needle) ||
        profile.maturityRating.toLowerCase().includes(needle),
    )
  );
}

function createMediaMap(items: MediaSummary[]) {
  return new Map(items.map((item) => [buildMediaKey(item.mediaType, item.id), item]));
}

function resolveMediaSummary(mediaMap: Map<string, MediaSummary>, mediaType: MediaType, mediaId: number) {
  return mediaMap.get(buildMediaKey(mediaType, mediaId)) ?? null;
}

function buildProgressEntries(
  mediaMap: Map<string, MediaSummary>,
  records: NonNullable<Awaited<ReturnType<typeof getAdminSupportProfileDetail>>["detail"]>["continueWatching"],
): SupportListEntry[] {
  return records.map((record) => {
    const summary = resolveMediaSummary(mediaMap, record.mediaType, record.mediaId);
    const episodeLabel = formatEpisodeLabel(record.seasonNumber, record.episodeNumber);
    const progressMinutes = Math.max(1, Math.floor(record.progressSeconds / 60));

    return {
      key: `progress-${record.mediaType}-${record.mediaId}-${record.updatedAt}`,
      title: summary?.title ?? `${formatMediaLabel(record.mediaType)} #${record.mediaId}`,
      meta: [formatMediaLabel(record.mediaType), episodeLabel, `${progressMinutes}m saved`].filter(Boolean).join(" · "),
      timestamp: formatTimestamp(record.updatedAt, "Progress saved recently"),
      actionHref: buildWatchHref(record.mediaType, record.mediaId, record.seasonNumber, record.episodeNumber),
      actionLabel: "Resume",
      detailHref: `/${record.mediaType}/${record.mediaId}`,
    };
  });
}

function buildWatchlistEntries(
  mediaMap: Map<string, MediaSummary>,
  records: NonNullable<Awaited<ReturnType<typeof getAdminSupportProfileDetail>>["detail"]>["watchlist"],
): SupportListEntry[] {
  return records.map((record) => {
    const summary = resolveMediaSummary(mediaMap, record.mediaType, record.mediaId);

    return {
      key: `watchlist-${record.mediaType}-${record.mediaId}-${record.addedAt}`,
      title: summary?.title ?? `${formatMediaLabel(record.mediaType)} #${record.mediaId}`,
      meta: [formatMediaLabel(record.mediaType), summary?.genreNames[0] ?? null].filter(Boolean).join(" · "),
      timestamp: formatTimestamp(record.addedAt, "Saved recently"),
      actionHref: `/${record.mediaType}/${record.mediaId}`,
      actionLabel: "Open",
      detailHref: `/${record.mediaType}/${record.mediaId}`,
    };
  });
}

function buildHistoryEntries(
  mediaMap: Map<string, MediaSummary>,
  records: NonNullable<Awaited<ReturnType<typeof getAdminSupportProfileDetail>>["detail"]>["history"],
): SupportListEntry[] {
  return records.map((record) => {
    const summary = resolveMediaSummary(mediaMap, record.mediaType, record.mediaId);
    const episodeLabel = formatEpisodeLabel(record.seasonNumber, record.episodeNumber);

    return {
      key: `history-${record.mediaType}-${record.mediaId}-${record.watchedAt}`,
      title: summary?.title ?? `${formatMediaLabel(record.mediaType)} #${record.mediaId}`,
      meta: [formatMediaLabel(record.mediaType), episodeLabel].filter(Boolean).join(" · "),
      timestamp: formatTimestamp(record.watchedAt, "Watched recently"),
      actionHref: record.watchHref,
      actionLabel: "Watch",
      detailHref: `/${record.mediaType}/${record.mediaId}`,
    };
  });
}

function buildFeedbackEntries(
  mediaMap: Map<string, MediaSummary>,
  records: NonNullable<Awaited<ReturnType<typeof getAdminSupportProfileDetail>>["detail"]>["feedback"],
): SupportListEntry[] {
  return records.map((record) => {
    const summary = resolveMediaSummary(mediaMap, record.mediaType, record.mediaId);
    const badge =
      record.value === "like" ? "Liked" : record.value === "dislike" ? "Disliked" : "Not interested";

    return {
      key: `feedback-${record.mediaType}-${record.mediaId}-${record.updatedAt}`,
      title: summary?.title ?? `${formatMediaLabel(record.mediaType)} #${record.mediaId}`,
      meta: [formatMediaLabel(record.mediaType), summary?.genreNames[0] ?? null].filter(Boolean).join(" · "),
      timestamp: formatTimestamp(record.updatedAt, "Updated recently"),
      actionHref: `/${record.mediaType}/${record.mediaId}`,
      actionLabel: "Details",
      detailHref: `/${record.mediaType}/${record.mediaId}`,
      badge,
    };
  });
}

function SupportEntryList({
  eyebrow,
  title,
  description,
  items,
  emptyMessage,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: SupportListEntry[];
  emptyMessage: string;
}) {
  return (
    <section className="surface rounded-[28px] p-6">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">{eyebrow}</p>
      <div className="mt-3 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
          {formatCount(items.length)}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => (
            <article key={item.key} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-base font-medium text-white">{item.title}</p>
                    {item.badge ? (
                      <span className="theme-chip rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-strong)]">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">{item.meta}</p>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">{item.timestamp}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={item.actionHref}
                    className="theme-button-primary inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold"
                  >
                    {item.actionLabel}
                  </Link>
                  <Link
                    href={item.detailHref}
                    className="theme-button-secondary inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm text-white"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </article>
          ))
        ) : (
          <article className="rounded-[22px] border border-dashed border-white/10 bg-black/10 p-4 text-sm leading-6 text-[var(--color-text-muted)]">
            {emptyMessage}
          </article>
        )}
      </div>
    </section>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const admin = await requireAdminAccess();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const requestedUserId = params.user?.trim() || undefined;
  const requestedProfileId = params.profile?.trim() || undefined;

  const [viewer, siteControl, analytics, directoryLookup] = await Promise.all([
    getViewerContext(),
    getSiteControlState(),
    getSiteAnalyticsSummary(),
    getAdminSupportAccounts(),
  ]);
  const filteredAccounts = directoryLookup.accounts.filter((account) => matchesAccountQuery(account, query));
  const selectedAccountPreview =
    filteredAccounts.find((account) => account.userId === requestedUserId) ?? filteredAccounts[0] ?? null;
  const detailLookup = selectedAccountPreview
    ? await getAdminSupportProfileDetail(selectedAccountPreview.userId, requestedProfileId)
    : null;
  const selectedAccount = detailLookup?.account ?? selectedAccountPreview;
  const selectedProfileId = detailLookup?.detail?.selectedProfileId ?? null;
  const selectedProfile =
    selectedAccount && selectedProfileId
      ? selectedAccount.profiles.find((profile) => profile.id === selectedProfileId) ?? null
      : null;
  const supportError = directoryLookup.error ?? detailLookup?.error;
  const topRoute = analytics.routeViews[0] ?? null;

  const detailRefs = detailLookup?.detail
    ? Array.from(
        new Map(
          [
            ...detailLookup.detail.continueWatching,
            ...detailLookup.detail.watchlist,
            ...detailLookup.detail.history,
            ...detailLookup.detail.feedback,
          ].map((record) => [
            buildMediaKey(record.mediaType, record.mediaId),
            { mediaType: record.mediaType, mediaId: record.mediaId },
          ]),
        ).values(),
      )
    : [];
  const detailMedia = detailRefs.length ? await getMediaSummariesByIds(detailRefs) : [];
  const detailMediaMap = createMediaMap(detailMedia);
  const progressEntries = buildProgressEntries(detailMediaMap, detailLookup?.detail?.continueWatching ?? []);
  const watchlistEntries = buildWatchlistEntries(detailMediaMap, detailLookup?.detail?.watchlist ?? []);
  const historyEntries = buildHistoryEntries(detailMediaMap, detailLookup?.detail?.history ?? []);
  const feedbackEntries = buildFeedbackEntries(detailMediaMap, detailLookup?.detail?.feedback ?? []);

  const terminalLines = [
    `$ whoami -> ${admin.email ?? admin.userId}`,
    `$ site.status -> ${siteControl.maintenanceMode ? "maintenance" : "live"}`,
    `$ support.accounts -> ${formatCount(directoryLookup.accounts.length)}`,
    `$ support.filtered -> ${formatCount(filteredAccounts.length)}`,
    `$ traffic.total -> ${formatCount(analytics.totals.totalVisits)} visits`,
    `$ traffic.today -> ${formatCount(analytics.totals.todayVisits)} visits`,
    `$ accounts.made -> ${formatCount(analytics.totals.accountsMade)}`,
    `$ profiles.created -> ${formatCount(analytics.totals.profilesCreated)}`,
    `$ watch.events -> ${formatCount(analytics.totals.watchEvents)}`,
    `$ top.route -> ${topRoute ? `${topRoute.path} (${formatCount(topRoute.count)})` : "no traffic yet"}`,
    `$ tmdb.health -> ${hasTmdbCredentials() ? "ready" : "missing credentials"}`,
    `$ auth.health -> ${hasClerkCredentials() ? "ready" : "missing credentials"}`,
    `$ data.health -> ${hasSupabaseCredentials() && hasSupabaseAdminCredentials() ? "ready" : "degraded"}`,
    `$ active.profile -> ${viewer.activeProfile?.name ?? "none"}`,
  ];

  return (
    <PageFrame bypassSiteLock analyticsPath="/admin">
      <section className="surface-strong rounded-[34px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-[var(--color-brand-strong)]">Admin support center</p>
        <h1 className="display-font mt-4 text-4xl text-white sm:text-6xl">A real admin panel for accounts, not just numbers.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
          Search accounts, inspect real profiles, see saved titles and playback state, and keep maintenance and
          traffic controls close by when you need to help someone fast.
        </p>
      </section>

      <RouteLinkRow
        items={[
          { href: "/browse", label: "Back to Home" },
          { href: "/settings", label: "Settings" },
          { href: "/account", label: "My Profile" },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="surface overflow-hidden rounded-[30px]">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div className="flex items-center gap-3">
              <TerminalSquare size={18} className="text-[var(--color-brand-strong)]" />
              <p className="text-sm uppercase tracking-[0.24em] text-white">Terminal feed</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Live telemetry
            </span>
          </div>
          <div className="admin-terminal space-y-3 px-5 py-5">
            {terminalLines.map((line) => (
              <p key={line} className="font-mono text-sm leading-7 text-[#d4f7d0]">
                {line}
              </p>
            ))}
          </div>
        </section>

        <section className="surface rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Site mode</p>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(229,9,20,0.14)] text-[var(--color-brand-strong)]">
              {siteControl.maintenanceMode ? <Lock size={22} /> : <RadioTower size={22} />}
            </div>
            <div>
              <h2 className="text-2xl text-white">
                {siteControl.maintenanceMode ? "Under construction is on" : "Site is live"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Last changed {formatTimestamp(siteControl.updatedAt)}
              </p>
            </div>
          </div>
          <form action={updateSiteControlAction} className="mt-6 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm text-[var(--color-text-muted)]">Public message</span>
              <textarea
                name="maintenanceMessage"
                defaultValue={siteControl.maintenanceMessage}
                rows={4}
                className="surface min-h-32 w-full rounded-[22px] px-4 py-3 text-white outline-none"
                placeholder="Subflix is getting a quick polish. We'll be back shortly."
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                name="maintenanceMode"
                value="false"
                className="theme-button-secondary rounded-full px-5 py-3 text-sm text-white"
              >
                Set site live
              </button>
              <button
                type="submit"
                name="maintenanceMode"
                value="true"
                className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold"
              >
                Put under construction
              </button>
            </div>
          </form>
        </section>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Accounts", value: formatCount(directoryLookup.accounts.length), icon: Users, tone: directoryLookup.accounts.length > 0 },
          { title: "Filtered results", value: formatCount(filteredAccounts.length), icon: Search, tone: filteredAccounts.length > 0 || !query },
          { title: "Total visits", value: formatCount(analytics.totals.totalVisits), icon: Activity, tone: analytics.totals.totalVisits > 0 },
          { title: "Profiles created", value: formatCount(analytics.totals.profilesCreated), icon: ShieldCheck, tone: analytics.totals.profilesCreated !== null },
          { title: "Watch events", value: formatCount(analytics.totals.watchEvents), icon: Clock3, tone: analytics.totals.watchEvents !== null },
          { title: "Saved titles", value: formatCount(analytics.totals.savedTitles), icon: ListChecks, tone: analytics.totals.savedTitles !== null },
          { title: "Signed-in visits", value: formatCount(analytics.totals.signedInVisits), icon: Gauge, tone: analytics.totals.signedInVisits > 0 },
          { title: "Today's traffic", value: formatCount(analytics.totals.todayVisits), icon: RadioTower, tone: analytics.totals.todayVisits > 0 },
        ].map((item) => (
          <article key={item.title} className="surface rounded-[26px] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{item.title}</p>
              <item.icon size={18} className={item.tone ? "text-[var(--color-brand-strong)]" : "text-[var(--color-danger)]"} />
            </div>
            <p className="mt-3 text-2xl text-white">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.76fr_1.24fr]">
        <section className="surface rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Account directory</p>
              <h2 className="mt-3 text-2xl text-white">Find a user and open the real profile data</h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Support view
            </span>
          </div>

          <form method="get" className="mt-6 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <label className="block">
              <span className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Search by email, user ID, or profile name</span>
              <div className="mt-3 flex gap-3">
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="support@company.com"
                  className="surface min-h-12 w-full rounded-[18px] px-4 text-white outline-none"
                />
                <button type="submit" className="theme-button-primary rounded-full px-5 text-sm font-semibold">
                  Search
                </button>
              </div>
            </label>
            {query ? (
              <div className="mt-3">
                <Link href="/admin" className="text-sm text-[var(--color-brand-strong)] transition hover:text-white">
                  Clear search
                </Link>
              </div>
            ) : null}
          </form>

          {supportError ? (
            <div className="mt-6">
              <UnavailablePanel title="Support data is unavailable." message={supportError} />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filteredAccounts.length ? (
                filteredAccounts.map((account) => {
                  const accountHref = buildAdminHref({
                    query,
                    userId: account.userId,
                    profileId: account.profiles[0]?.id,
                  });
                  const isSelected = account.userId === selectedAccount?.userId;

                  return (
                    <Link
                      key={account.userId}
                      href={accountHref}
                      className={`block rounded-[24px] border p-4 transition ${
                        isSelected
                          ? "border-[var(--color-brand-line)] bg-[var(--color-brand-soft)]"
                          : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-base font-medium text-white">{account.email ?? "No synced email"}</p>
                          <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                            {account.userId}
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="theme-chip rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
                            Open
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Profiles</p>
                          <p className="mt-2 text-lg text-white">{formatCount(account.totals.profiles)}</p>
                        </div>
                        <div className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-3">
                          <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Last activity</p>
                          <p className="mt-2 text-sm text-white">{formatShortDate(account.lastActivityAt)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                        {account.profiles.slice(0, 3).map((profile) => (
                          <span key={profile.id} className="rounded-full border border-white/10 px-3 py-1">
                            {profile.name}
                          </span>
                        ))}
                        {account.profiles.length > 3 ? (
                          <span className="rounded-full border border-white/10 px-3 py-1">
                            +{account.profiles.length - 3} more
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <article className="rounded-[24px] border border-dashed border-white/10 bg-black/10 p-4 text-sm leading-6 text-[var(--color-text-muted)]">
                  No accounts matched this search yet. Try an email address, a Clerk user ID, or a profile name.
                </article>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          {selectedAccount ? (
            <>
              <section className="surface rounded-[30px] p-6">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Selected account</p>
                <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-3xl text-white">{selectedAccount.email ?? "No synced email"}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{selectedAccount.userId}</p>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
                      This is a read-only support mirror of the account data Subflix stores. Security settings still live in Clerk, but profile activity, saved titles, feedback, and playback state are shown here for support.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Joined</p>
                      <p className="mt-3 text-white">{formatShortDate(selectedAccount.createdAt, "Recently joined")}</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Last activity</p>
                      <p className="mt-3 text-white">{formatShortDate(selectedAccount.lastActivityAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Profiles", value: selectedAccount.totals.profiles },
                    { label: "Continue watching", value: selectedAccount.totals.continueWatching },
                    { label: "Saved titles", value: selectedAccount.totals.watchlist },
                    { label: "Watch history", value: selectedAccount.totals.history },
                  ].map((item) => (
                    <article key={item.label} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{item.label}</p>
                      <p className="mt-3 text-2xl text-white">{formatCount(item.value)}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="surface rounded-[30px] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Profiles</p>
                    <h3 className="mt-3 text-2xl text-white">Choose the profile you want to inspect</h3>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
                    {formatCount(selectedAccount.profiles.length)} profiles
                  </span>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {selectedAccount.profiles.map((profile) => {
                    const profileHref = buildAdminHref({
                      query,
                      userId: selectedAccount.userId,
                      profileId: profile.id,
                    });
                    const isSelected = profile.id === selectedProfile?.id;

                    return (
                      <Link
                        key={profile.id}
                        href={profileHref}
                        className={`block rounded-[24px] border p-4 transition ${
                          isSelected
                            ? "border-[var(--color-brand-line)] bg-[var(--color-brand-soft)]"
                            : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-black/30"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <ProfileAvatar
                            avatar={profile.avatar}
                            name={profile.name}
                            accent={profile.accent}
                            className="h-14 w-14 shrink-0 rounded-2xl"
                            textClassName="text-xl"
                            sizes="56px"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="truncate text-xl text-white">{profile.name}</h4>
                                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                                  {profile.maturityRating} · {profile.providerRegion}
                                </p>
                              </div>
                              {isSelected ? (
                                <span className="theme-chip rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
                                  Viewing
                                </span>
                              ) : null}
                            </div>

                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                              <div className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Saved</p>
                                <p className="mt-2 text-lg text-white">{formatCount(profile.counts.watchlist)}</p>
                              </div>
                              <div className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-3">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Activity</p>
                                <p className="mt-2 text-lg text-white">{formatCount(profile.counts.history)}</p>
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                              Last activity {formatShortDate(profile.lastActivityAt)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {selectedProfile ? (
                <>
                  <section className="surface rounded-[30px] p-6">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Profile support snapshot</p>
                    <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-center gap-4">
                        <ProfileAvatar
                          avatar={selectedProfile.avatar}
                          name={selectedProfile.name}
                          accent={selectedProfile.accent}
                          className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-[24px]"
                          textClassName="text-3xl"
                          sizes="72px"
                        />
                        <div>
                          <h3 className="text-3xl text-white">{selectedProfile.name}</h3>
                          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                            {selectedProfile.maturityRating} · {selectedProfile.providerRegion}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                        <span className="rounded-full border border-white/12 bg-black/20 px-3 py-2">
                          Created {formatShortDate(selectedProfile.createdAt, "Recently")}
                        </span>
                        <span className="rounded-full border border-white/12 bg-black/20 px-3 py-2">
                          Last active {formatShortDate(selectedProfile.lastActivityAt)}
                        </span>
                        <span className="theme-chip rounded-full px-3 py-2 text-[var(--color-brand-strong)]">
                          Support open
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        { label: "Continue watching", value: selectedProfile.counts.continueWatching, icon: Clock3 },
                        { label: "Saved titles", value: selectedProfile.counts.watchlist, icon: ListChecks },
                        { label: "Watch history", value: selectedProfile.counts.history, icon: Activity },
                        { label: "Likes / dislikes", value: `${formatCount(selectedProfile.counts.likes)} / ${formatCount(selectedProfile.counts.dislikes)}`, icon: Heart },
                      ].map((item) => (
                        <article key={item.label} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{item.label}</p>
                            <item.icon size={16} className="text-[var(--color-brand-strong)]" />
                          </div>
                          <p className="mt-3 text-2xl text-white">{item.value}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="grid gap-4 xl:grid-cols-2">
                    <SupportEntryList
                      eyebrow="Playback"
                      title="Continue Watching"
                      description="Resume points and saved playback state for this profile."
                      items={progressEntries}
                      emptyMessage="This profile does not have any active progress yet."
                    />
                    <SupportEntryList
                      eyebrow="Library"
                      title="Saved Titles"
                      description="Titles the user intentionally added to My List."
                      items={watchlistEntries}
                      emptyMessage="This profile has not saved any titles yet."
                    />
                    <SupportEntryList
                      eyebrow="Recent activity"
                      title="Watch History"
                      description="Latest watch events recorded for support investigation."
                      items={historyEntries}
                      emptyMessage="No watch history has been recorded for this profile yet."
                    />
                    <SupportEntryList
                      eyebrow="Preference signals"
                      title="Feedback"
                      description="Likes, dislikes, and not-interested signals attached to this profile."
                      items={feedbackEntries}
                      emptyMessage="This profile has not left any feedback yet."
                    />
                  </section>
                </>
              ) : (
                <section className="surface rounded-[30px] p-6">
                  <UnavailablePanel
                    title="No profile selected."
                    message="Choose a profile on the left to inspect watch state, saved titles, and feedback."
                  />
                </section>
              )}
            </>
          ) : (
            <section className="surface rounded-[30px] p-6">
              <UnavailablePanel
                title="No account selected."
                message="Pick an account from the directory to open the support workspace."
              />
            </section>
          )}
        </section>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.04fr_0.96fr]">
        <section className="surface rounded-[30px] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Traffic pulse</p>
              <h2 className="mt-3 text-2xl text-white">The last seven days</h2>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">
              Visits only
            </span>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {analytics.dailyViews.length ? (
              analytics.dailyViews.map((entry) => (
                <article key={entry.date} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{entry.date}</p>
                  <p className="mt-3 text-2xl text-white">{formatCount(entry.count)}</p>
                </article>
              ))
            ) : (
              <article className="rounded-[22px] border border-dashed border-white/10 bg-black/10 p-4 text-sm leading-6 text-[var(--color-text-muted)] sm:col-span-2 xl:col-span-4">
                Visit tracking has just been turned on, so this panel will fill up as real traffic lands on the site.
              </article>
            )}
          </div>
        </section>

        <section className="surface rounded-[30px] p-6">
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Top routes</p>
          <h2 className="mt-3 text-2xl text-white">Where people are spending time</h2>
          <div className="mt-6 space-y-3">
            {analytics.routeViews.length ? (
              analytics.routeViews.map((entry) => (
                <article key={entry.path} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-white">{formatRouteLabel(entry.path)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">{entry.path}</p>
                    </div>
                    <p className="text-xl text-white">{formatCount(entry.count)}</p>
                  </div>
                </article>
              ))
            ) : (
              <article className="rounded-[22px] border border-dashed border-white/10 bg-black/10 p-4 text-sm leading-6 text-[var(--color-text-muted)]">
                Route activity will show up here after a few real page visits across the app.
              </article>
            )}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {analytics.countedStats.map((item) => (
              <article key={item.label} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{item.label}</p>
                <p className="mt-3 text-xl text-white">{formatCount(item.value)}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </PageFrame>
  );
}
