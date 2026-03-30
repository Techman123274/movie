import { PageFrame } from "@/components/page-frame";
import { EmptyState } from "@/components/empty-state";
import { PageHero } from "@/components/page-hero";
import { RegionForm } from "@/components/region-form";
import { env } from "@/lib/env";
import { getViewerContext } from "@/lib/viewer";

export default async function SettingsPage() {
  const viewer = await getViewerContext({ redirectToOnboarding: true });

  return (
    <PageFrame>
      <PageHero
        eyebrow="Settings"
        title="Launch controls for playback safety."
        description="Keep region preferences, playback validation, and account-level setup details in one calmer control surface."
      />

      <section className="grid gap-4 md:grid-cols-2">
        <div className="surface rounded-[28px] p-6">
          <h2 className="mb-4 text-xl font-medium text-white">Playback providers</h2>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Enabled: {env.playback.enabledProviders.join(", ") || "none"}
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Validated: {env.playback.validatedProviders.join(", ") || "none"}
          </p>
        </div>
        <div className="surface rounded-[28px] p-6">
          <h2 className="mb-4 text-xl font-medium text-white">Playback mode</h2>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            Strict review is {env.playback.strictAdFree ? "enabled" : "disabled"}.
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Recommended launch flow: validate provider behavior manually on desktop and mobile before marking it live.
          </p>
        </div>
      </section>

      {viewer.activeProfile ? (
        <RegionForm profile={viewer.activeProfile} returnTo="/settings" />
      ) : (
        <EmptyState
          title="No active profile"
          message="Create a profile first so provider region preferences can be stored and reused."
        />
      )}
    </PageFrame>
  );
}
