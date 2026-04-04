import { ProfileAvatar } from "@/components/profile-avatar";

type AccountOverviewProps = {
  activeProfile: {
    name: string;
    avatar: string;
    accent: string;
    maturityRating: string;
    providerRegion: string;
  };
  stats: {
    profiles: number;
    continueWatching: number;
    recentlyWatched: number;
    watchlist: number;
  };
};

export function AccountOverview({ activeProfile, stats }: AccountOverviewProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="surface-strong overflow-hidden rounded-[30px] p-7 sm:p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">My Profile</p>
        <h1 className="display-font max-w-3xl text-4xl text-white sm:text-5xl">
          A cleaner account hub with your profile, progress, and saved titles.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
          Built more like a premium streaming account page, with the active profile up front and the rest of the page
          focused on what you actually want to open next.
        </p>

        <div className="mt-7 rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.22))] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <ProfileAvatar
                avatar={activeProfile.avatar}
                name={activeProfile.name}
                accent={activeProfile.accent}
                className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-[24px]"
                textClassName="text-3xl"
                sizes="72px"
              />
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.26em] text-[var(--color-text-muted)]">Current profile</p>
                <h2 className="display-font mt-2 truncate text-3xl text-white sm:text-4xl">{activeProfile.name}</h2>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              <span className="rounded-full border border-white/12 bg-black/20 px-3 py-2">{activeProfile.maturityRating}</span>
              <span className="rounded-full border border-white/12 bg-black/20 px-3 py-2">{activeProfile.providerRegion}</span>
              <span className="theme-chip rounded-full px-3 py-2 text-[var(--color-brand-strong)]">Active</span>
            </div>
          </div>
        </div>
      </section>

      <section className="surface rounded-[30px] p-6 sm:p-7">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Account snapshot</p>
        <div className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-black/20 px-4 py-4">
            <span className="text-[var(--color-text-muted)]">Profiles on this account</span>
            <span className="text-lg text-white">{stats.profiles}</span>
          </div>
          <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-black/20 px-4 py-4">
            <span className="text-[var(--color-text-muted)]">Continue watching</span>
            <span className="text-lg text-white">{stats.continueWatching}</span>
          </div>
          <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-black/20 px-4 py-4">
            <span className="text-[var(--color-text-muted)]">Recently watched</span>
            <span className="text-lg text-white">{stats.recentlyWatched}</span>
          </div>
          <div className="flex items-center justify-between rounded-[20px] border border-white/10 bg-black/20 px-4 py-4">
            <span className="text-[var(--color-text-muted)]">My List</span>
            <span className="text-lg text-white">{stats.watchlist}</span>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/4 px-4 py-4 text-sm leading-6 text-[var(--color-text-muted)]">
            This page now stays focused on profile identity, saved titles, and resume picks instead of extra social panels.
          </div>
        </div>
      </section>
    </div>
  );
}
