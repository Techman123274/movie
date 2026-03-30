import Link from "next/link";
import { switchActiveProfileAction } from "@/app/actions";
import type { ProfileRecord } from "@/lib/types";

type ProfileGridProps = {
  profiles: ProfileRecord[];
  activeProfileId: string | null;
};

export function ProfileGrid({ profiles, activeProfileId }: ProfileGridProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => (
          <article key={profile.id} className="surface group rounded-[28px] p-6 transition hover:-translate-y-1">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-semibold text-[#07111f]"
                style={{ backgroundColor: profile.accent }}
              >
                {profile.avatar}
              </div>
              {activeProfileId === profile.id ? (
                <span className="rounded-full border border-[rgba(214,179,109,0.35)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--color-brand-strong)]">
                  Active
                </span>
              ) : null}
            </div>
            <h3 className="display-font text-3xl text-white">{profile.name}</h3>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
              {profile.maturityRating} • {profile.providerRegion}
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
              Personal watchlist, continue watching, and provider rails all flow through the active profile.
            </p>
            <form action={switchActiveProfileAction} className="mt-6">
              <input type="hidden" name="profileId" value={profile.id} />
              <input type="hidden" name="returnTo" value="/profiles" />
              <button className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[#07111f]">
                {activeProfileId === profile.id ? "Current profile" : "Switch profile"}
              </button>
            </form>
          </article>
        ))}
      </div>
      <Link
        href="/onboarding"
        className="surface inline-flex rounded-full px-5 py-3 text-sm text-white transition hover:bg-white/10"
      >
        Add another profile
      </Link>
    </div>
  );
}
