import { hasClerkCredentials, hasSupabaseCredentials } from "@/lib/env";

export function AccountOverview() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="surface-strong rounded-[30px] p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Account system</p>
        <h1 className="display-font text-5xl text-white">Real auth, profile-aware data, and provider-region control.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
          Clerk handles sign-in, while Supabase stores profiles, watchlist items, progress, history, and the region
          used for provider-specific discovery like Netflix, Hulu, Prime Video, and Max.
        </p>
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
