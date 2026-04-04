import Link from "next/link";
import { MediaRail } from "@/components/media-rail";
import type { HouseholdSocialState } from "@/lib/social";

type HouseholdPulseProps = {
  state: HouseholdSocialState | null;
  profileId?: string | null;
  watchlistKeys?: string[];
};

export function HouseholdPulse({ state, profileId = null, watchlistKeys = [] }: HouseholdPulseProps) {
  if (!state) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-strong rounded-[30px] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Household pulse</p>
          <h2 className="display-font mt-4 max-w-3xl text-4xl text-white sm:text-5xl">{state.headline}</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{state.description}</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Shared queue</p>
              <p className="mt-3 text-3xl text-white">{state.sharedQueueCount}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Crew likes</p>
              <p className="mt-3 text-3xl text-white">{state.totalLikes}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Active lanes</p>
              <p className="mt-3 text-3xl text-white">{state.activeProfiles}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          {state.profileHighlights.map((profile) => (
            <article key={profile.id} className="surface rounded-[26px] p-5">
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-semibold text-[#07111f]"
                  style={{ backgroundColor: profile.accent }}
                >
                  {profile.avatar}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                    profile.isActive
                      ? "border border-[rgba(214,179,109,0.34)] bg-[rgba(214,179,109,0.1)] text-[var(--color-brand-strong)]"
                      : "border border-white/10 bg-black/20 text-[var(--color-text-muted)]"
                  }`}
                >
                  {profile.isActive ? "Active now" : "Available"}
                </span>
              </div>
              <h3 className="display-font mt-5 text-3xl text-white">{profile.name}</h3>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                <span className="rounded-full border border-white/10 px-3 py-1">{profile.watchlistCount} queued</span>
                <span className="rounded-full border border-white/10 px-3 py-1">{profile.likedCount} likes</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">{profile.note}</p>
              {profile.latestHref ? (
                <Link href={profile.latestHref} className="mt-5 inline-flex text-sm text-[var(--color-brand-strong)]">
                  {profile.latestTitle ? `Open ${profile.latestTitle}` : "Open latest title"}
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      {state.spotlightTitles.length ? (
        <MediaRail
          rail={{
            id: "household-spotlight",
            title: "Household Spotlight",
            eyebrow: "Social discovery",
            description: "The titles most likely to bring your profiles together right now.",
            variant: "editorial",
            items: state.spotlightTitles,
          }}
          profileId={profileId}
          watchlistKeys={watchlistKeys}
        />
      ) : null}
    </section>
  );
}
