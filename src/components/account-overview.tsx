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
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="surface-strong rounded-[30px] p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">My Profile</p>
        <h1 className="display-font text-5xl text-white">Your profile, progress, and next picks in one place.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
          Keep every profile separate, jump back into what you were watching, and let the household pulse reveal where your queues and reactions are starting to overlap.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Profiles</p>
            <p className="mt-2 text-3xl text-white">{stats.profiles}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Resume queue</p>
            <p className="mt-2 text-3xl text-white">{stats.continueWatching}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Recent titles</p>
            <p className="mt-2 text-3xl text-white">{stats.recentlyWatched}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Watchlist</p>
            <p className="mt-2 text-3xl text-white">{stats.watchlist}</p>
          </div>
        </div>
      </section>

      <section className="surface rounded-[30px] p-8">
        <h2 className="mb-5 text-lg font-medium text-white">Active profile</h2>
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-semibold text-white"
              style={{ backgroundColor: activeProfile.accent }}
            >
              {activeProfile.avatar}
            </div>
            <div className="min-w-0">
              <p className="display-font text-3xl text-white">{activeProfile.name}</p>
              <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                {activeProfile.maturityRating} / {activeProfile.providerRegion}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-2xl bg-white/4 px-4 py-3">
              <span>Profiles available</span>
              <span className="text-white">{stats.profiles}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/4 px-4 py-3">
              <span>Watchlist status</span>
              <span className="text-emerald-300">{stats.watchlist > 0 ? "Active" : "Needs picks"}</span>
            </div>
            <div className="rounded-2xl bg-white/4 px-4 py-4 text-[var(--color-text-muted)]">
              Switch profiles in one tap, adjust playback region in Settings, and let this space surface the titles most likely to matter next for both you and the rest of the room.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
