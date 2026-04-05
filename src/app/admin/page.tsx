import { AlertTriangle, Gauge, Lock, RadioTower, ShieldCheck, TerminalSquare } from "lucide-react";
import { PageFrame } from "@/components/page-frame";
import { RouteLinkRow } from "@/components/route-link-row";
import { env, hasClerkCredentials, hasSupabaseAdminCredentials, hasSupabaseCredentials, hasTmdbCredentials } from "@/lib/env";
import { getSiteControlState, requireAdminAccess } from "@/lib/site-control";
import { getViewerContext } from "@/lib/viewer";
import { updateSiteControlAction } from "@/app/actions";

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

export default async function AdminPage() {
  const admin = await requireAdminAccess();
  const viewer = await getViewerContext();
  const siteControl = await getSiteControlState();

  const terminalLines = [
    `$ whoami -> ${admin.email ?? admin.userId}`,
    `$ site.status -> ${siteControl.maintenanceMode ? "maintenance" : "live"}`,
    `$ tmdb.health -> ${hasTmdbCredentials() ? "ready" : "missing credentials"}`,
    `$ auth.health -> ${hasClerkCredentials() ? "ready" : "missing credentials"}`,
    `$ data.health -> ${hasSupabaseCredentials() && hasSupabaseAdminCredentials() ? "ready" : "degraded"}`,
    `$ playback.providers -> ${env.playback.enabledProviders.join(", ") || "none"}`,
    `$ active.profile -> ${viewer.activeProfile?.name ?? "none"}`,
  ];

  return (
    <PageFrame bypassSiteLock>
      <section className="surface-strong rounded-[34px] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-[var(--color-brand-strong)]">Admin terminal</p>
        <h1 className="display-font mt-4 text-4xl text-white sm:text-6xl">Control the site without leaving the app shell.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
          This console keeps the controls intentionally small: live status, maintenance mode, and the key health checks you would want before opening the doors again.
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
              Basic controls only
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
                placeholder="Subflix is getting a quick polish. We’ll be back shortly."
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
          {
            title: "TMDB",
            value: hasTmdbCredentials() ? "Ready" : "Missing",
            icon: Gauge,
            tone: hasTmdbCredentials(),
          },
          {
            title: "Auth",
            value: hasClerkCredentials() ? "Ready" : "Missing",
            icon: ShieldCheck,
            tone: hasClerkCredentials(),
          },
          {
            title: "Data",
            value: hasSupabaseCredentials() && hasSupabaseAdminCredentials() ? "Ready" : "Degraded",
            icon: AlertTriangle,
            tone: hasSupabaseCredentials() && hasSupabaseAdminCredentials(),
          },
          {
            title: "Profiles",
            value: String(viewer.profiles.length),
            icon: RadioTower,
            tone: viewer.profiles.length > 0,
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
    </PageFrame>
  );
}
