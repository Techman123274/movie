import { hasClerkCredentials, hasSupabaseCredentials } from "@/lib/env";

type AccountOverviewProps = {
  stats: {
    profiles: number;
    continueWatching: number;
    recentlyWatched: number;
    watchlist: number;
  };
};

export function AccountOverview({ stats }: AccountOverviewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="surface-strong rounded-[30px] p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Account system</p>
        <h1 className="display-font text-5xl text-white">Real auth, profile-aware data, and provider-region control.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
          Clerk handles sign-in, while Supabase stores profiles, watchlist items, progress, history, and the region
          used for provider-specific discovery like Netflix, Hulu, Prime Video, and Max.
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
        <h2 className="mb-5 text-lg font-medium text-white">Integration status</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3">
            <span>Clerk</span>
            <span className={hasClerkCredentials() ? "text-emerald-300" : "text-amber-300"}>
              {hasClerkCredentials() ? "Connected" : "Needs keys"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-black/20 px-4 py-3">
            <span>Supabase</span>
            <span className={hasSupabaseCredentials() ? "text-emerald-300" : "text-amber-300"}>
              {hasSupabaseCredentials() ? "Connected" : "Needs keys"}
            </span>
          </div>
          <div className="rounded-2xl bg-black/20 px-4 py-4 text-[var(--color-text-muted)]">
            Profiles, regions, continue watching, watch history, and watchlist tables are backed by the SQL schema in
            <code className="ml-1 rounded bg-black/40 px-2 py-1">supabase/schema.sql</code>.
          </div>
        </div>
      </section>
    </div>
  );
}
