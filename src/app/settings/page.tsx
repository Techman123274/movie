import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AccountAccessSettings } from "@/components/account-access-settings";
import { EmptyState } from "@/components/empty-state";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ProfileAvatarSettingsForm } from "@/components/profile-avatar-settings-form";
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

function formatDate(value: Date | number | string | null | undefined) {
  if (!value) {
    return "Unavailable";
  }

  const resolvedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(resolvedDate.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(resolvedDate);
}

export default async function SettingsPage() {
  const viewer = await getViewerContext();
  const user = await currentUser();

  if (!viewer.isSignedIn || !user) {
    redirect("/sign-in");
  }

  const enabledProviders = env.playback.enabledProviders.map(formatProviderLabel);
  const preferredProviders = env.playback.validatedProviders.map(formatProviderLabel);
  const primaryEmail = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "No email found";

  return (
    <PageFrame activeHref="/settings">
      <PageHero
        eyebrow="Settings"
        title="Settings that feel closer to a real streaming account."
        description="Update account access, email, password, sessions, and security in one place, then fine-tune the active Subflix profile underneath it."
      />

      <RouteLinkRow
        items={[
          { href: "/account", label: "Back to My Profile" },
          { href: "/profiles", label: "Profiles" },
          { href: "/providers", label: "Where to Watch" },
          { href: "/admin", label: "Admin" },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <section className="surface rounded-[28px] p-6">
            <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Account access</p>
            <h2 className="text-xl font-medium text-white">Email, password, sessions, and sign-in security</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              These controls are powered by the account system directly, so changes to your email address, password, and login security happen for real.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Primary email</p>
                <p className="mt-2 break-all text-base text-white">{primaryEmail}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Member since</p>
                <p className="mt-2 text-base text-white">{formatDate(user.createdAt)}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Last sign in</p>
                <p className="mt-2 text-base text-white">{formatDate(user.lastSignInAt)}</p>
              </div>
            </div>
          </section>

          <AccountAccessSettings />

          {viewer.activeProfile ? (
            <>
            <RegionForm profile={viewer.activeProfile} returnTo="/settings" />
            <ProfileAvatarSettingsForm
              profileId={viewer.activeProfile.id}
              currentAvatar={viewer.activeProfile.avatar}
            />

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
            </>
          ) : (
            <EmptyState
              title="No active profile yet"
              message="Your account security settings are ready above. Create a profile when you want Subflix-specific region, avatar, and playback preferences."
            />
          )}
        </div>

        <div className="space-y-4">
          <section className="surface rounded-[28px] p-6">
            <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Settings guide</p>
            <h2 className="text-xl font-medium text-white">What lives where now</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-text-muted)]">
              <div className="rounded-[22px] bg-black/20 px-4 py-4">
                Email, password, active devices, and verification live in the account section.
              </div>
              <div className="rounded-[22px] bg-black/20 px-4 py-4">
                Avatar, playback region, and personalized discovery stay tied to the active Subflix profile.
              </div>
              <div className="rounded-[22px] bg-black/20 px-4 py-4">
                Playback provider switching still happens from the watch page so it stays close to the player.
              </div>
            </div>
          </section>

          {viewer.activeProfile ? (
            <>
            <section className="surface rounded-[28px] p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Active profile</p>
              <div className="flex items-start gap-4">
                <ProfileAvatar
                  avatar={viewer.activeProfile.avatar}
                  name={viewer.activeProfile.name}
                  accent={viewer.activeProfile.accent}
                  className="h-14 w-14 shrink-0 rounded-2xl"
                  textClassName="text-xl"
                  sizes="56px"
                />
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
                  className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white"
                >
                  Switch profile
                </Link>
                <Link
                  href="/account"
                  className="surface rounded-full px-4 py-2 text-sm text-white transition hover:bg-white/10"
                >
                  Open My Profile
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
            </>
          ) : null}
        </div>
      </section>
    </PageFrame>
  );
}
