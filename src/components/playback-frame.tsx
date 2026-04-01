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
  const [loadedProviderKey, setLoadedProviderKey] = useState("");
  const [isPending, startTransition] = useTransition();
  const handledCompletionRef = useRef(false);
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
        <div className="rounded-full border border-[rgba(214,179,109,0.35)] px-4 py-2 text-sm text-[var(--color-brand-strong)]">
          Ready to watch
        </div>
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

      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
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
          className="aspect-video w-full"
          referrerPolicy="origin"
          onLoad={() => setLoadedProviderKey(providerKey)}
        />
      </div>
    </section>
  );
}
