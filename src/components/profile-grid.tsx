import Link from "next/link";
import { switchActiveProfileAction } from "@/app/actions";
import { ProfileAvatar } from "@/components/profile-avatar";
import type { ProfileRecord } from "@/lib/types";

type ProfileGridProps = {
  profiles: ProfileRecord[];
  activeProfileId: string | null;
};

export function ProfileGrid({ profiles, activeProfileId }: ProfileGridProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {profiles.map((profile) => (
          <article
            key={profile.id}
            className="surface group rounded-[28px] p-5 transition duration-200 hover:-translate-y-1 hover:border-white/16"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <ProfileAvatar
                avatar={profile.avatar}
                name={profile.name}
                accent={profile.accent}
                className="h-[3.75rem] w-[3.75rem] rounded-[22px]"
                textClassName="text-2xl"
                sizes="60px"
              />
              {activeProfileId === profile.id ? (
                <span className="theme-chip rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
                  Active
                </span>
              ) : null}
            </div>
            <h3 className="display-font text-3xl text-white">{profile.name}</h3>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              <span className="rounded-full border border-white/10 px-3 py-1">{profile.maturityRating}</span>
              <span className="rounded-full border border-white/10 px-3 py-1">{profile.providerRegion}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
              Keep watch history, saved titles, and recommendations separate for each person using the account.
            </p>
            <form action={switchActiveProfileAction} className="mt-6">
              <input type="hidden" name="profileId" value={profile.id} />
              <input type="hidden" name="returnTo" value="/profiles" />
              <button className="theme-button-primary rounded-full px-4 py-2 text-sm font-semibold">
                {activeProfileId === profile.id ? "Current profile" : "Switch profile"}
              </button>
            </form>
          </article>
        ))}
      </div>
      <Link
        href="/onboarding"
        className="theme-button-secondary inline-flex rounded-full px-5 py-3 text-sm text-white"
      >
        Add another profile
      </Link>
    </div>
  );
}
