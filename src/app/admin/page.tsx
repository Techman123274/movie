import { Activity, AlertTriangle, Gauge, Lock, RadioTower, ShieldCheck, TerminalSquare, Users } from "lucide-react";
import { updateSiteControlAction } from "@/app/actions";
import { PageFrame } from "@/components/page-frame";
import { RouteLinkRow } from "@/components/route-link-row";
import { env, hasClerkCredentials, hasSupabaseAdminCredentials, hasSupabaseCredentials, hasTmdbCredentials } from "@/lib/env";
import { getSiteAnalyticsSummary } from "@/lib/site-analytics";
import { getSiteControlState, requireAdminAccess } from "@/lib/site-control";
import { getViewerContext } from "@/lib/viewer";

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime()) || date.getTime() === 0) {
    return "No changes yet";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
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

export default async function AdminPage() {
  const admin = await requireAdminAccess();
  const [viewer, siteControl, analytics] = await Promise.all([
    getViewerContext(),
    getSiteControlState(),
    getSiteAnalyticsSummary(),
  ]);
  const topRoute = analytics.routeViews[0] ?? null;

  const terminalLines = [
    `$ whoami -> ${admin.email ?? admin.userId}`,
    `$ site.status -> ${siteControl.maintenanceMode ? "maintenance" : "live"}`,
    `$ traffic.total -> ${formatCount(analytics.totals.totalVisits)} visits`,
    `$ traffic.today -> ${formatCount(analytics.totals.todayVisits)} visits`,
    `$ traffic.signed_in -> ${formatCount(analytics.totals.signedInVisits)} visits`,
    `$ accounts.made -> ${formatCount(analytics.totals.accountsMade)}`,
    `$ profiles.created -> ${formatCount(analytics.totals.profilesCreated)}`,
    `$ watch.events -> ${formatCount(analytics.totals.watchEvents)}`,
    `$ saved.titles -> ${formatCount(analytics.totals.savedTitles)}`,
    `$ top.route -> ${topRoute ? `${topRoute.path} (${formatCount(topRoute.count)})` : "no traffic yet"}`,
    `$ tmdb.health -> ${hasTmdbCredentials() ? "ready" : "missing credentials"}`,
    `$ auth.health -> ${hasClerkCredentials() ? "ready" : "missing credentials"}`,
    `$ data.health -> ${hasSupabaseCredentials() && hasSupabaseAdminCredentials() ? "ready" : "degraded"}`,
    `$ playback.providers -> ${env.playback.enabledProviders.join(", ") || "none"}`,
    `$ active.profile -> ${viewer.activeProfile?.name ?? "none"}`,
  ];

  return (
    <PageFrame bypassSiteLock analyticsPath="/admin">
      <section className="surface-strong rounded-[34px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-[var(--color-brand-strong)]">Admin terminal</p>
        <h1 className="display-font mt-4 text-4xl text-white sm:text-6xl">Run the site and watch the room fill up.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
          This console now keeps the essentials in one place: live traffic, account growth, watch activity, and a quick
          way to flip the site into maintenance mode when you need breathing room.
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Total visits",
            value: formatCount(analytics.totals.totalVisits),
            icon: Activity,
            tone: analytics.totals.totalVisits > 0,
          },
          {
            title: "Signed-in visits",
            value: formatCount(analytics.totals.signedInVisits),
            icon: Users,
            tone: analytics.totals.signedInVisits > 0,
          },
          {
            title: "Today",
            value: formatCount(analytics.totals.todayVisits),
            icon: RadioTower,
            tone: analytics.totals.todayVisits > 0,
          },
          {
            title: "Accounts made",
            value: formatCount(analytics.totals.accountsMade),
            icon: ShieldCheck,
            tone: analytics.totals.accountsMade !== null,
          },
          {
            title: "Profiles created",
            value: formatCount(analytics.totals.profilesCreated),
            icon: Gauge,
            tone: analytics.totals.profilesCreated !== null,
          },
          {
            title: "Saved titles",
            value: formatCount(analytics.totals.savedTitles),
            icon: AlertTriangle,
            tone: analytics.totals.savedTitles !== null,
          },
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
