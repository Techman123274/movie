import { PlaybackActions } from "@/components/playback-actions";
import type { PlaybackProviderResult } from "@/lib/types";

type ProviderGateProps = {
  providers: PlaybackProviderResult[];
};

export function ProviderGate({ providers }: ProviderGateProps) {
  const availableProvider = providers.find((provider) => provider.availability === "enabled");

  if (!availableProvider) {
    return (
      <section className="surface-strong rounded-[32px] p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-danger)]">
          Playback disabled
        </p>
        <h2 className="display-font text-4xl text-white">Strict ad-free review is still blocking playback.</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
          The site is ready, but the embedded providers are treated as untrusted dependencies. Add a validated provider
          to <code className="rounded bg-black/30 px-2 py-1">NEXT_PUBLIC_VALIDATED_PLAYBACK_PROVIDERS</code> after
          verifying no ads, popups, or redirects on desktop and mobile.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {providers.map((provider) => (
            <div key={provider.provider} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-white">{provider.provider}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{provider.statusMessage}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">
            Provider validated
          </p>
          <h2 className="display-font text-4xl text-white">Watching via {availableProvider.provider}</h2>
        </div>
        <div className="rounded-full border border-[rgba(214,179,109,0.35)] px-4 py-2 text-sm text-[var(--color-brand-strong)]">
          No ads approved
        </div>
      </div>

      <PlaybackActions embedUrl={availableProvider.embedUrl} title={`Watching via ${availableProvider.provider}`} />

      <div className="overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        <iframe
          src={availableProvider.embedUrl}
          title="Playback"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; remote-playback; display-capture"
          allowFullScreen
          className="aspect-video w-full"
          referrerPolicy="origin"
        />
      </div>
    </section>
  );
}
