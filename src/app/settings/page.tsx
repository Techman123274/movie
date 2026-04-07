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
import { SettingsAccountActions } from "@/components/settings-account-actions";
import { SettingsCacheTools } from "@/components/settings-cache-tools";
import { env } from "@/lib/env";
import { getContinueWatching, getProfileFeedbackMap, getRecentWatchHistory, getWatchlist } from "@/lib/persistence";
import { getViewerContext } from "@/lib/viewer";

function formatProviderLabel(value: string) {
  return value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatJoinDate(value: Date | null | undefined) {
  if (!value) {
    return "Recently joined";
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(value);
}

export default async function SettingsPage() {
  const viewer = await getViewerContext();
  const user = await currentUser();

  if (!viewer.isSignedIn || !user) {
    redirect("/sign-in");
  }

  const enabledProviders = env.playback.enabledProviders.map(formatProviderLabel);
  const preferredProviders = env.playback.validatedProviders.map(formatProviderLabel);
  const activeProfile = viewer.activeProfile;
  const [continueWatching, recentHistory, watchlist, feedbackMap] = activeProfile
    ? await Promise.all([
        getContinueWatching(activeProfile.id),
        getRecentWatchHistory(activeProfile.id, 24),
        getWatchlist(activeProfile.id),
        getProfileFeedbackMap(activeProfile.id),
      ])
    : [[], [], [], new Map()];
  const likesCount = Array.from(feedbackMap.values()).filter((entry) => entry.value === "like").length;
  const dislikesCount = Array.from(feedbackMap.values()).filter((entry) => entry.value === "dislike").length;
  const accountEmail = user.emailAddresses[0]?.emailAddress ?? "Signed in";

  return (
    <PageFrame activeHref="/settings">
      <PageHero
        eyebrow="Settings"
        title="A real account center for privacy, security, data, and control."
        description="Manage sign-in security, review what this profile stores, clear cached playback preferences, and handle logout or account switching without digging around the app."
      />

      <RouteLinkRow
        items={[
          { href: "/account", label: "Back to My Profile" },
          { href: "/profiles", label: "Profiles" },
          { href: "/providers", label: "Where to Watch" },
        ]}
      />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <section className="surface rounded-[28px] p-6">
            <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Security</p>
            <h2 className="text-xl font-medium text-white">Email, password, devices, and sign-in protection</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              These controls are powered by the account system directly, so changes to your email address, password, sessions, and verification happen for real.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="theme-chip rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em]">Email</span>
              <span className="theme-chip rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em]">Password</span>
              <span className="theme-chip rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em]">Devices</span>
              <span className="theme-chip rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em]">Verification</span>
            </div>
          </section>

          <AccountAccessSettings />

          {activeProfile ? (
            <>
            <section className="surface rounded-[28px] p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Privacy</p>
              <h2 className="text-xl font-medium text-white">How Subflix uses your viewing data</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">Personal recommendations</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                    Watch history, likes, saves, and active progress are used to shape what shows up on Home, Movies, and Series.
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">Profile-based availability</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                    Region and playback preference stay tied to the active profile so provider surfaces stay closer to how that person watches.
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">What stays private</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                    Account security stays in Clerk, while profile activity and saved titles remain inside your signed-in Subflix account.
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm font-medium text-white">Local device cache</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                    The browser only keeps lightweight playback choices locally, and you can clear them below anytime.
                  </p>
                </div>
              </div>
            </section>

            <RegionForm profile={activeProfile} returnTo="/settings" />
            <ProfileAvatarSettingsForm
              profileId={activeProfile.id}
              currentAvatar={activeProfile.avatar}
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

          <SettingsCacheTools />
        </div>

        <div className="space-y-4">
          <section className="surface rounded-[28px] p-6">
            <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Account</p>
            <h2 className="text-xl font-medium text-white">{accountEmail}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
              Member since {formatJoinDate(user.createdAt ? new Date(user.createdAt) : null)}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Profiles</p>
                <p className="mt-3 text-2xl text-white">{viewer.profiles.length}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Active profile</p>
                <p className="mt-3 text-2xl text-white">{activeProfile?.name ?? "None"}</p>
              </div>
            </div>
          </section>

          {activeProfile ? (
            <>
            <section className="surface rounded-[28px] p-6">
              <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Active profile</p>
              <div className="flex items-start gap-4">
                <ProfileAvatar
                  avatar={activeProfile.avatar}
                  name={activeProfile.name}
                  accent={activeProfile.accent}
                  className="h-14 w-14 shrink-0 rounded-2xl"
                  textClassName="text-xl"
                  sizes="56px"
                />
                <div>
                  <h2 className="text-2xl font-medium text-white">{activeProfile.name}</h2>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                    {activeProfile.maturityRating} / {activeProfile.providerRegion}
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
              <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">My data</p>
              <h2 className="text-xl font-medium text-white">What this profile has stored so far</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Continue watching</p>
                  <p className="mt-3 text-2xl text-white">{continueWatching.length}</p>
                </div>
                <div className="rounded-[22px] bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Recently watched</p>
                  <p className="mt-3 text-2xl text-white">{recentHistory.length}</p>
                </div>
                <div className="rounded-[22px] bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">My List</p>
                  <p className="mt-3 text-2xl text-white">{watchlist.length}</p>
                </div>
                <div className="rounded-[22px] bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Likes / dislikes</p>
                  <p className="mt-3 text-2xl text-white">
                    {likesCount} / {dislikesCount}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-[22px] bg-black/20 px-4 py-4 text-sm leading-6 text-[var(--color-text-muted)]">
                This profile currently stores watch progress, recent activity, saved titles, reactions, avatar choice, and region-based provider preference.
              </div>
            </section>

            </>
          ) : null}

          <SettingsAccountActions />
        </div>
      </section>
    </PageFrame>
  );
}
