"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { PlaybackFrame } from "@/components/playback-frame";
import {
  PREFERRED_PROVIDER_STORAGE_KEY,
  readAutoplayNextPreference,
  writeAutoplayNextPreference,
} from "@/lib/playback-preferences";
import { resolvePlaybackOptions } from "@/lib/playback";
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
  autoplaySequence?: Array<{
    seasonNumber: number;
    episodeNumber: number;
    href: string;
  }>;
};

export function ProviderGate({
  providers,
  title,
  profileId,
  mediaId,
  mediaType,
  seasonNumber,
  episodeNumber,
  nextEpisodeHref,
  autoplaySequence,
}: ProviderGateProps) {
  const [statusState, setStatusState] = useState<{ watchKey: string; message: string | null }>({
    watchKey: "",
    message: null,
  });
  const [selectedState, setSelectedState] = useState<{ watchKey: string; providerName: string | null }>({
    watchKey: "",
    providerName: null,
  });
  const [failedState, setFailedState] = useState<{ watchKey: string; providers: string[] }>({
    watchKey: "",
    providers: [],
  });
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(readAutoplayNextPreference);
  const [playbackSequenceState, setPlaybackSequenceState] = useState(() => ({
    mediaId,
    mediaType,
    sequence: autoplaySequence ?? [],
    index: 0,
  }));

  const activeSequence =
    playbackSequenceState.mediaId === mediaId && playbackSequenceState.mediaType === mediaType
      ? playbackSequenceState.sequence
      : autoplaySequence ?? [];
  const activeSequenceIndex =
    playbackSequenceState.mediaId === mediaId && playbackSequenceState.mediaType === mediaType
      ? playbackSequenceState.index
      : 0;
  const activeTarget = activeSequence[activeSequenceIndex];
  const activeSeasonNumber = activeTarget?.seasonNumber ?? seasonNumber;
  const activeEpisodeNumber = activeTarget?.episodeNumber ?? episodeNumber;
  const activeNextTarget = activeSequence[activeSequenceIndex + 1];
  const activeNextEpisodeHref = activeNextTarget?.href ?? nextEpisodeHref;
  const activeProviders = activeTarget
    ? resolvePlaybackOptions({
        mediaType,
        tmdbId: mediaId,
        seasonNumber: activeSeasonNumber,
        episodeNumber: activeEpisodeNumber,
      })
    : providers;
  const enabledProviders = useMemo(
    () => activeProviders.filter((provider) => provider.availability === "enabled"),
    [activeProviders],
  );
  const primaryEnabledProviders = useMemo(() => {
    const providersWithoutVidLink = enabledProviders.filter((provider) => provider.provider !== "vidlink");
    return providersWithoutVidLink.length ? providersWithoutVidLink : enabledProviders;
  }, [enabledProviders]);
  const activeWatchKey = `${mediaType}-${mediaId}-${activeSeasonNumber ?? 0}-${activeEpisodeNumber ?? 0}`;
  const selectedProviderName = selectedState.watchKey === activeWatchKey ? selectedState.providerName : null;
  const statusMessage = statusState.watchKey === activeWatchKey ? statusState.message : null;
  const failedProviderNames = failedState.watchKey === activeWatchKey ? failedState.providers : [];
  const storedProvider =
    typeof window !== "undefined" ? window.localStorage.getItem(PREFERRED_PROVIDER_STORAGE_KEY) : null;
  const hiddenByDefaultProviderCount = Math.max(0, enabledProviders.length - primaryEnabledProviders.length);
  const storedPreferredProvider =
    enabledProviders.find(
      (provider) =>
        provider.provider === storedProvider &&
        primaryEnabledProviders.some((entry) => entry.provider === provider.provider),
    ) ?? null;
  const selectedProvider =
    enabledProviders.find((provider) => provider.provider === selectedProviderName) ??
    storedPreferredProvider ??
    primaryEnabledProviders[0] ??
    enabledProviders[0];
  const visibleProviders = useMemo(() => {
    if (showAllProviders || hiddenByDefaultProviderCount === 0) {
      return enabledProviders;
    }

    const providersToShow = [...primaryEnabledProviders];

    if (selectedProvider && !providersToShow.some((provider) => provider.provider === selectedProvider.provider)) {
      providersToShow.push(selectedProvider);
    }

    return providersToShow;
  }, [enabledProviders, hiddenByDefaultProviderCount, primaryEnabledProviders, selectedProvider, showAllProviders]);
  const autoplaySupported =
    selectedProvider?.provider === "vidlink" && mediaType === "tv" && Boolean(activeNextEpisodeHref);

  function switchProvider(nextProviderName: string, reason?: string) {
    setSelectedState({ watchKey: activeWatchKey, providerName: nextProviderName });
    setFailedState({ watchKey: activeWatchKey, providers: [] });
    if (typeof window !== "undefined") {
      window.localStorage.setItem(PREFERRED_PROVIDER_STORAGE_KEY, nextProviderName);
    }
    if (reason) {
      setStatusState({ watchKey: activeWatchKey, message: reason });
    }
  }

  function handleProviderUnresponsive(providerName: string) {
    if (failedProviderNames.includes(providerName)) {
      return;
    }

    const nextFailed = [...failedProviderNames, providerName];
    setFailedState({ watchKey: activeWatchKey, providers: nextFailed });
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

    setStatusState({ watchKey: activeWatchKey, message: "No automatic fallback is available right now. Try another server." });
  }

  function handleAutoplayToggle() {
    const nextValue = !autoplayEnabled;
    setAutoplayEnabled(nextValue);
    writeAutoplayNextPreference(nextValue);
    setStatusState({
      watchKey: activeWatchKey,
      message: nextValue
        ? "Autoplay next is on. Supported episodes will roll forward automatically."
        : "Autoplay next is off. Subflix will stay on the current episode when it ends.",
    });
  }

  function handleAdvanceToNextEpisode() {
    if (!activeNextTarget) {
      return;
    }

    const nextIndex = activeSequenceIndex + 1;
    const nextWatchKey = `${mediaType}-${mediaId}-${activeNextTarget.seasonNumber}-${activeNextTarget.episodeNumber}`;

    setPlaybackSequenceState({
      mediaId,
      mediaType,
      sequence: activeSequence,
      index: nextIndex,
    });
    setSelectedState({
      watchKey: nextWatchKey,
      providerName: selectedProvider?.provider ?? null,
    });
    setStatusState({
      watchKey: nextWatchKey,
      message: `Autoplay moved to S${activeNextTarget.seasonNumber} E${activeNextTarget.episodeNumber} while keeping the player open.`,
    });

    if (typeof window !== "undefined") {
      window.history.replaceState(window.history.state, "", activeNextTarget.href);
    }
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
              {hiddenByDefaultProviderCount > 0
                ? "Subflix keeps extra fallback servers tucked away by default, and if one stalls it will still try the next available option."
                : "Choose the playback path that works best for you, and if one stalls, Subflix will try the next available option."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${
                  autoplaySupported && autoplayEnabled
                    ? "theme-chip"
                    : "border border-white/10 bg-black/20 text-[var(--color-text-muted)]"
                }`}
              >
                {autoplaySupported ? (autoplayEnabled ? "Autoplay next on" : "Autoplay next off") : "Autoplay unavailable"}
              </span>
              <button
                type="button"
                onClick={handleAutoplayToggle}
                disabled={!autoplaySupported}
                className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  autoplayEnabled ? "theme-button-primary font-semibold" : "theme-button-secondary text-white"
                }`}
              >
                {autoplayEnabled ? "Turn autoplay off" : "Turn autoplay on"}
              </button>
              {!autoplaySupported ? (
                <span className="text-sm text-[var(--color-text-muted)]">
                  Use VidLink on a TV episode with a next episode available.
                </span>
              ) : null}
            </div>
          </div>
          {statusMessage ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(214,179,109,0.12)] px-4 py-2 text-sm text-[var(--color-brand-strong)]">
              <RotateCcw size={16} />
              {statusMessage}
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {visibleProviders.map((provider) => {
            const isSelected = selectedProvider?.provider === provider.provider;
            const isHiddenFallback =
              hiddenByDefaultProviderCount > 0 &&
              !primaryEnabledProviders.some((entry) => entry.provider === provider.provider);

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
                      {isHiddenFallback ? (
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                          Fallback
                        </span>
                      ) : null}
                      {provider.provider === "vidlink" && mediaType === "tv" && activeNextEpisodeHref ? (
                        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                          {autoplayEnabled ? "Autoplay active" : "Autoplay available"}
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

        {hiddenByDefaultProviderCount > 0 ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAllProviders((current) => !current)}
              className="theme-button-secondary inline-flex min-h-10 items-center rounded-full px-4 text-sm text-white"
            >
              {showAllProviders
                ? "Hide extra servers"
                : `Show ${hiddenByDefaultProviderCount} more server${hiddenByDefaultProviderCount === 1 ? "" : "s"}`}
            </button>
            {!showAllProviders ? (
              <span className="text-sm text-[var(--color-text-muted)]">
                Extra servers stay hidden until you ask for them.
              </span>
            ) : null}
          </div>
        ) : null}

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
          seasonNumber={activeSeasonNumber}
          episodeNumber={activeEpisodeNumber}
          nextEpisodeHref={activeNextEpisodeHref}
          autoplayEnabled={autoplayEnabled}
          autoplaySupported={autoplaySupported}
          onAutoplayToggle={handleAutoplayToggle}
          onAdvanceToNextEpisode={handleAdvanceToNextEpisode}
          onProviderUnresponsive={handleProviderUnresponsive}
        />
      ) : null}
    </section>
  );
}
