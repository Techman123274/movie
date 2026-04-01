import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { RegionForm } from "@/components/region-form";
import { RouteLinkRow } from "@/components/route-link-row";
import { env } from "@/lib/env";
import { getViewerContext } from "@/lib/viewer";

function formatProviderLabel(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function SettingsPage() {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const enabledProviders = env.playback.enabledProviders.map(formatProviderLabel);
  const preferredProviders = env.playback.validatedProviders.map(formatProviderLabel);

  return (
    <PageFrame activeHref="/settings">
      <PageHero
        eyebrow="Settings"
        title="Control the way Subflix feels for this account."
        description="Manage playback region, switch profiles, and review the watch experience without digging through the rest of the app."
      />

      <RouteLinkRow
        items={[
          { href: "/account", label: "Back to My Space" },
          { href: "/profiles", label: "Profiles" },
          { href: "/providers", label: "Where to Watch" },
        ]}
      />

      {viewer.activeProfile ? (
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <RegionForm profile={viewer.activeProfile} returnTo="/settings" />

            <section className="surface rounded-[28px] p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">
                Playback behavior
              </p>
              <h2 className="text-xl font-medium text-white">How playback works right now</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
                Subflix automatically favors the smoothest available playback path first, then lets you switch servers from the watch page if something stalls or fails.
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Ready now</p>
                  <p className="mt-2 text-base text-white">
                    {enabledProviders.length ? enabledProviders.join(", ") : "No playback paths configured"}
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Preferred order</p>
                  <p className="mt-2 text-base text-white">
                    {preferredProviders.length ? preferredProviders.join(", ") : "Automatic ranking"}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="surface rounded-[28px] p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Active profile</p>
              <div className="flex items-start gap-4">
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold text-[#07111f]"
                  style={{ backgroundColor: viewer.activeProfile.accent }}
                >
                  {viewer.activeProfile.avatar}
                </div>
                <div>
                  <h2 className="text-2xl font-medium text-white">{viewer.activeProfile.name}</h2>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                    {viewer.activeProfile.maturityRating} / {viewer.activeProfile.providerRegion}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
                Region and playback discovery are stored per profile, so switching profiles can change what surfaces across details pages and where-to-watch panels.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/profiles"
                  className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[#07111f]"
                >
                  Switch profile
                </Link>
                <Link
                  href="/account"
                  className="surface rounded-full px-4 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Open My Space
                </Link>
              </div>
            </section>

            <section className="surface rounded-[28px] p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Watch experience</p>
              <h2 className="text-xl font-medium text-white">What these settings affect</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-text-muted)]">
                <div className="rounded-[22px] bg-black/20 px-4 py-4">
                  Region changes affect where titles appear to be available and which storefronts surface first.
                </div>
                <div className="rounded-[22px] bg-black/20 px-4 py-4">
                  Watch progress, recent activity, and saved titles remain tied to the active profile.
                </div>
                <div className="rounded-[22px] bg-black/20 px-4 py-4">
                  Server selection happens on the watch page, where you can switch playback paths without leaving the player.
                </div>
              </div>
            </section>
          </div>
        </section>
      ) : (
        <EmptyState
          title="No active profile"
          message="Create or switch to a profile first so playback region and account preferences have a home."
        />
      )}
    </PageFrame>
  );
}
