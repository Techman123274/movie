"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { PlaybackFrame } from "@/components/playback-frame";
import type { MediaType, PlaybackProviderResult } from "@/lib/types";

type ProviderGateProps = {
  providers: PlaybackProviderResult[];
  title: string;
  profileId: string | null;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
  nextEpisodeHref?: string | null;
};

const PREFERRED_PROVIDER_STORAGE_KEY = "subflix-preferred-playback-provider";

export function ProviderGate({
  providers,
  title,
  profileId,
  mediaId,
  mediaType,
  seasonNumber,
  episodeNumber,
  nextEpisodeHref,
}: ProviderGateProps) {
  const enabledProviders = useMemo(
    () => providers.filter((provider) => provider.availability === "enabled"),
    [providers],
  );
  const watchKey = `${mediaType}-${mediaId}-${seasonNumber ?? 0}-${episodeNumber ?? 0}`;
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<{ watchKey: string; providerName: string | null }>({
    watchKey: "",
    providerName: null,
  });
  const [failedState, setFailedState] = useState<{ watchKey: string; providers: string[] }>({
    watchKey: "",
    providers: [],
  });

  const selectedProviderName = selectedState.watchKey === watchKey ? selectedState.providerName : null;
  const failedProviderNames = failedState.watchKey === watchKey ? failedState.providers : [];
  const storedProvider =
    typeof window !== "undefined" ? window.localStorage.getItem(PREFERRED_PROVIDER_STORAGE_KEY) : null;
  const selectedProvider =
    enabledProviders.find((provider) => provider.provider === selectedProviderName) ??
    enabledProviders.find((provider) => provider.provider === storedProvider) ??
    enabledProviders[0];

  function switchProvider(nextProviderName: string, reason?: string) {
    setSelectedState({ watchKey, providerName: nextProviderName });
    setFailedState({ watchKey, providers: [] });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREFERRED_PROVIDER_STORAGE_KEY, nextProviderName);
    }
    if (reason) {
      setStatusMessage(reason);
    }
  }

  function handleProviderUnresponsive(providerName: string) {
    if (failedProviderNames.includes(providerName)) {
      return;
    }

    const nextFailed = [...failedProviderNames, providerName];
    setFailedState({ watchKey, providers: nextFailed });
    const fallback = enabledProviders.find(
      (provider) => provider.provider !== providerName && !nextFailed.includes(provider.provider),
    );

    if (fallback) {
      switchProvider(
        fallback.provider,
        `${providerName} did not finish loading, so Subflix switched you to ${fallback.label}.`,
      );
      return;
    }

    setStatusMessage("No automatic fallback is available right now. Try another server.");
  }

  if (!enabledProviders.length) {
    return (
      <section className="surface-strong rounded-[32px] p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-danger)]">
          Playback unavailable
        </p>
        <h2 className="display-font text-4xl text-white">Playback is not available for this title right now.</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-muted)]">
          Please try again shortly or choose another title while playback options refresh.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {providers.map((provider) => (
            <div key={provider.provider} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-white">{provider.label}</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{provider.statusMessage}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="surface rounded-[30px] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Playback servers</p>
            <h2 className="display-font text-3xl text-white">Switch servers without leaving the watch page</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-text-muted)]">
              Choose the playback path that works best for you, and if one stalls, Subflix will try the next available option.
            </p>
          </div>
          {statusMessage ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(214,179,109,0.12)] px-4 py-2 text-sm text-[var(--color-brand-strong)]">
              <RotateCcw size={16} />
              {statusMessage}
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {enabledProviders.map((provider) => {
            const isSelected = selectedProvider?.provider === provider.provider;

            return (
              <button
                key={provider.provider}
                type="button"
                onClick={() => switchProvider(provider.provider)}
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  isSelected
                    ? "border-[rgba(214,179,109,0.4)] bg-[rgba(214,179,109,0.12)]"
                    : "border-white/10 bg-black/20 hover:border-[rgba(214,179,109,0.24)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">{provider.label}</p>
                      {provider.recommended ? (
                        <span className="rounded-full bg-[rgba(214,179,109,0.18)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
                          Recommended
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{provider.description}</p>
                  </div>
                  {isSelected ? (
                    <CheckCircle2 size={18} className="mt-1 text-[var(--color-brand-strong)]" />
                  ) : null}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {provider.capabilities.map((capability) => (
                    <span
                      key={`${provider.provider}-${capability}`}
                      className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {failedProviderNames.length ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <AlertTriangle size={16} className="text-[var(--color-danger)]" />
            Tried servers: {failedProviderNames.join(", ")}
          </div>
        ) : null}
      </div>

      {selectedProvider ? (
        <PlaybackFrame
          provider={selectedProvider}
          title={title}
          profileId={profileId}
          mediaId={mediaId}
          mediaType={mediaType}
          seasonNumber={seasonNumber}
          episodeNumber={episodeNumber}
          nextEpisodeHref={nextEpisodeHref}
          onProviderUnresponsive={handleProviderUnresponsive}
        />
      ) : null}
    </section>
  );
}
