"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { LoaderCircle, ShieldCheck, SkipForward } from "lucide-react";
import { useRouter } from "next/navigation";
import { PlaybackActions } from "@/components/playback-actions";
import { postWatchState } from "@/lib/watch-state-client";
import type { MediaType, PlaybackProviderResult } from "@/lib/types";

type PlaybackFrameProps = {
  provider: PlaybackProviderResult;
  title: string;
  profileId: string | null;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
  nextEpisodeHref?: string | null;
  onProviderUnresponsive?: (providerName: string) => void;
};

type ProviderPlayerEvent = {
  event?: string;
  mediaType?: string;
  season?: number | string;
  episode?: number | string;
};

function parseProviderNumber(value: number | string | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function PlaybackFrame({
  provider,
  title,
  profileId,
  mediaId,
  mediaType,
  seasonNumber,
  episodeNumber,
  nextEpisodeHref,
  onProviderUnresponsive,
}: PlaybackFrameProps) {
  const router = useRouter();
  const [autoAdvanceState, setAutoAdvanceState] = useState<"idle" | "advancing" | "complete" | "error">("idle");
  const [fullscreenMessage, setFullscreenMessage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlayerControls, setShowPlayerControls] = useState(true);
  const [loadedProviderKey, setLoadedProviderKey] = useState("");
  const [isPending, startTransition] = useTransition();
  const handledCompletionRef = useRef(false);
  const controlsHideTimeoutRef = useRef<number | null>(null);
  const playerShellRef = useRef<HTMLDivElement>(null);
  const canAutoAdvance = provider.provider === "vidlink" && mediaType === "tv" && Boolean(nextEpisodeHref);
  const providerKey = `${provider.provider}-${provider.embedUrl}`;
  const frameLoaded = loadedProviderKey === providerKey;

  useEffect(() => {
    if (nextEpisodeHref) {
      void router.prefetch(nextEpisodeHref);
    }
  }, [router, nextEpisodeHref]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (loadedProviderKey !== providerKey) {
        onProviderUnresponsive?.(provider.provider);
      }
    }, 12000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [provider.provider, providerKey, loadedProviderKey, onProviderUnresponsive]);

  useEffect(() => {
    if (provider.provider !== "vidlink") {
      return;
    }

    function handleMessage(event: MessageEvent<{ type?: string; data?: ProviderPlayerEvent }>) {
      if (event.origin !== "https://vidlink.pro") {
        return;
      }

      if (event.data?.type !== "PLAYER_EVENT" || event.data.data?.event !== "ended") {
        return;
      }

      const payload = event.data.data;
      const payloadSeason = parseProviderNumber(payload.season);
      const payloadEpisode = parseProviderNumber(payload.episode);

      if (payload.mediaType && payload.mediaType !== mediaType) {
        return;
      }

      if (mediaType === "tv") {
        if (seasonNumber !== undefined && payloadSeason !== undefined && payloadSeason !== seasonNumber) {
          return;
        }

        if (episodeNumber !== undefined && payloadEpisode !== undefined && payloadEpisode !== episodeNumber) {
          return;
        }
      }

      if (handledCompletionRef.current) {
        return;
      }

      handledCompletionRef.current = true;
      setAutoAdvanceState(nextEpisodeHref ? "advancing" : "complete");

      if (profileId) {
        void postWatchState({
          profileId,
          mediaId,
          mediaType,
          seasonNumber,
          episodeNumber,
          event: "complete",
        }).catch(() => {
          if (!nextEpisodeHref) {
            setAutoAdvanceState("error");
            handledCompletionRef.current = false;
          }
        });
      }

      if (nextEpisodeHref) {
        startTransition(() => {
          router.push(nextEpisodeHref, { scroll: false });
        });
      }
    }

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [router, provider.provider, profileId, mediaId, mediaType, seasonNumber, episodeNumber, nextEpisodeHref]);

  useEffect(() => {
    type FullscreenDocument = Document & {
      webkitFullscreenElement?: Element;
    };

    const fullscreenDocument = document as FullscreenDocument;
    const syncFullscreenState = () => {
      setIsFullscreen(Boolean(document.fullscreenElement || fullscreenDocument.webkitFullscreenElement));
    };

    syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState as EventListener);

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState as EventListener);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (controlsHideTimeoutRef.current !== null) {
        window.clearTimeout(controlsHideTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!frameLoaded) {
      if (controlsHideTimeoutRef.current !== null) {
        window.clearTimeout(controlsHideTimeoutRef.current);
        controlsHideTimeoutRef.current = null;
      }
      return;
    }

    controlsHideTimeoutRef.current = window.setTimeout(() => {
      setShowPlayerControls(false);
      controlsHideTimeoutRef.current = null;
    }, 1800);

    return () => {
      if (controlsHideTimeoutRef.current !== null) {
        window.clearTimeout(controlsHideTimeoutRef.current);
        controlsHideTimeoutRef.current = null;
      }
    };
  }, [frameLoaded, providerKey]);

  function revealPlayerControls() {
    setShowPlayerControls(true);

    if (controlsHideTimeoutRef.current !== null) {
      window.clearTimeout(controlsHideTimeoutRef.current);
    }

    if (!frameLoaded) {
      controlsHideTimeoutRef.current = null;
      return;
    }

    controlsHideTimeoutRef.current = window.setTimeout(() => {
      setShowPlayerControls(false);
      controlsHideTimeoutRef.current = null;
    }, 1800);
  }

  function hidePlayerControls() {
    if (controlsHideTimeoutRef.current !== null) {
      window.clearTimeout(controlsHideTimeoutRef.current);
      controlsHideTimeoutRef.current = null;
    }

    if (frameLoaded) {
      setShowPlayerControls(false);
    }
  }

  function handleFrameLoad() {
    setLoadedProviderKey(providerKey);
    setShowPlayerControls(true);
  }

  async function handleToggleFullscreen() {
    type FullscreenElement = HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    type FullscreenDocument = Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      webkitFullscreenElement?: Element;
    };

    const playerShell = playerShellRef.current as FullscreenElement | null;
    const fullscreenDocument = document as FullscreenDocument;

    if (!playerShell) {
      return;
    }

    setFullscreenMessage(null);

    try {
      if (document.fullscreenElement || fullscreenDocument.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          return;
        }

        if (fullscreenDocument.webkitExitFullscreen) {
          await fullscreenDocument.webkitExitFullscreen();
          return;
        }
      }

      if (playerShell.requestFullscreen) {
        await playerShell.requestFullscreen();
        return;
      }

      if (playerShell.webkitRequestFullscreen) {
        await playerShell.webkitRequestFullscreen();
        return;
      }

      setFullscreenMessage("Fullscreen is unavailable in this browser.");
    } catch {
      setFullscreenMessage("Fullscreen was blocked here. Open the player in its own tab if needed.");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">
            Now playing
          </p>
          <h2 className="display-font text-4xl text-white">Watching via {provider.label}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">{provider.description}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="surface min-h-11 rounded-full px-4 text-sm text-white transition hover:bg-white/10"
          >
            {isFullscreen ? "Exit fullscreen" : "Subflix fullscreen"}
          </button>
          <div className="rounded-full border border-[rgba(214,179,109,0.35)] px-4 py-2 text-sm text-[var(--color-brand-strong)]">
            Ready to watch
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
        <p>If the provider&apos;s own fullscreen button throws an error, use Subflix fullscreen or open the player in its own tab.</p>
        {fullscreenMessage ? <p className="text-[var(--color-brand-strong)]">{fullscreenMessage}</p> : null}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3 rounded-[28px] border border-white/10 bg-black/20 px-5 py-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Playback mode</p>
          <p className="text-sm leading-6 text-[var(--color-text-muted)]">
            {canAutoAdvance
              ? "Next episode is ready to roll automatically when this one ends."
              : "Playback continues in a dedicated viewer designed to keep the watch experience simple and steady."}
          </p>
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
        </div>
        {canAutoAdvance || !frameLoaded ? (
          <div className="flex min-h-11 items-center gap-2 rounded-full bg-[rgba(214,179,109,0.14)] px-4 text-sm text-[var(--color-brand-strong)]">
            {autoAdvanceState === "advancing" || isPending ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : !frameLoaded ? (
              <ShieldCheck size={16} />
            ) : (
              <SkipForward size={16} />
            )}
            {autoAdvanceState === "advancing" || isPending
              ? "Loading next episode"
              : !frameLoaded
                ? "Checking server responsiveness"
                : "Next episode armed"}
          </div>
        ) : null}
      </div>

      <PlaybackActions embedUrl={provider.embedUrl} title={title} />

      <div
        ref={playerShellRef}
        onMouseMove={revealPlayerControls}
        onMouseEnter={revealPlayerControls}
        onMouseLeave={hidePlayerControls}
        onTouchStart={revealPlayerControls}
        className={`relative overflow-hidden border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)] ${
          isFullscreen ? "flex h-full w-full items-center justify-center border-0 rounded-none" : "rounded-[32px]"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-4 transition duration-300 ${
            showPlayerControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="pointer-events-auto flex flex-wrap items-center gap-2 rounded-full border border-white/10 bg-[rgba(6,12,20,0.78)] px-3 py-3 shadow-lg backdrop-blur-xl">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="surface min-h-10 rounded-full px-4 text-sm text-white transition hover:bg-white/10"
            >
              {isFullscreen ? "Exit fullscreen" : "Subflix fullscreen"}
            </button>
            <a
              href={provider.embedUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white"
            >
              Open player
            </a>
          </div>
        </div>
        {!frameLoaded ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[linear-gradient(180deg,rgba(6,12,20,0.92),rgba(6,12,20,0.82))]">
            <div className="rounded-[24px] border border-white/10 bg-[rgba(6,12,20,0.74)] px-6 py-5 text-center shadow-xl backdrop-blur-xl">
              <LoaderCircle size={20} className="mx-auto animate-spin text-[var(--color-brand-strong)]" />
              <p className="mt-3 text-sm font-medium text-white">Preparing your player</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--color-text-muted)]">
                {provider.label} is loading in the watch shell. If it takes too long, Subflix will offer another server.
              </p>
            </div>
          </div>
        ) : null}
        <iframe
          key={providerKey}
          src={provider.embedUrl}
          title="Playback"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; remote-playback; display-capture"
          allowFullScreen
          className={isFullscreen ? "h-full w-full" : "aspect-video w-full"}
          referrerPolicy="origin"
          onLoad={handleFrameLoad}
        />
      </div>
    </section>
  );
}
