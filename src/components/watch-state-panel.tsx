"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, Clock3, LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { postWatchState } from "@/lib/watch-state-client";
import type { MediaType } from "@/lib/types";

type WatchStatePanelProps = {
  profileId: string | null;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
};

export function WatchStatePanel({
  profileId,
  mediaId,
  mediaType,
  seasonNumber,
  episodeNumber,
}: WatchStatePanelProps) {
  const router = useRouter();
  const [syncState, setSyncState] = useState<"idle" | "synced" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [trackedSeconds, setTrackedSeconds] = useState(0);
  const [isPending, startTransition] = useTransition();
  const lastStartedKeyRef = useRef<string | null>(null);
  const lastProgressSentRef = useRef(0);
  const watchKey = `${profileId ?? "guest"}-${mediaType}-${mediaId}-${seasonNumber ?? 0}-${episodeNumber ?? 0}`;

  useEffect(() => {
    if (!profileId || lastStartedKeyRef.current === watchKey) {
      return;
    }

    let isCanceled = false;
    lastStartedKeyRef.current = watchKey;

    void postWatchState({
      profileId,
      mediaId,
      mediaType,
      seasonNumber,
      episodeNumber,
      event: "start",
    })
      .then(() => {
        if (!isCanceled) {
          setSyncState("synced");
          setMessage(null);
        }
      })
      .catch(() => {
        if (!isCanceled) {
          lastStartedKeyRef.current = null;
          setSyncState("error");
          setMessage("Resume sync is temporarily unavailable.");
        }
      });

    return () => {
      isCanceled = true;
    };
  }, [watchKey, profileId, mediaId, mediaType, seasonNumber, episodeNumber]);

  useEffect(() => {
    if (!profileId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      setTrackedSeconds((current) => current + 5);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [profileId]);

  useEffect(() => {
    if (!profileId || trackedSeconds < 15 || trackedSeconds - lastProgressSentRef.current < 15) {
      return;
    }

    let isCanceled = false;

    void postWatchState({
      profileId,
      mediaId,
      mediaType,
      seasonNumber,
      episodeNumber,
      progressSeconds: trackedSeconds,
      event: "progress",
    })
      .then(() => {
        if (!isCanceled) {
          lastProgressSentRef.current = trackedSeconds;
          setSyncState("synced");
        }
      })
      .catch(() => {
        if (!isCanceled) {
          setSyncState("error");
          setMessage("Progress sync is temporarily unavailable.");
        }
      });

    return () => {
      isCanceled = true;
    };
  }, [trackedSeconds, profileId, mediaId, mediaType, seasonNumber, episodeNumber]);

  async function handleMarkWatched() {
    if (!profileId) {
      return;
    }

    setMessage(null);

    try {
      await postWatchState({
        profileId,
        mediaId,
        mediaType,
        seasonNumber,
        episodeNumber,
        event: "complete",
      });
      setSyncState("synced");
      setMessage("Marked as watched for this profile.");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setSyncState("error");
      setMessage("We couldn't update watch state right now.");
    }
  }

  if (!profileId) {
    return (
      <section className="surface rounded-[28px] p-5">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Watch state</p>
        <h3 className="text-lg font-medium text-white">Sign in to save resume state and recent activity</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
          Keep your place, save recent activity, and jump back in from home, details, or My Profile.
        </p>
        <div className="mt-4">
          <Link
            href="/sign-in"
            className="theme-button-primary inline-flex min-h-11 items-center rounded-full px-5 text-sm font-semibold"
          >
            Sign in to sync
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="surface rounded-[28px] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Watch state</p>
          <h3 className="text-lg font-medium text-white">Resume tracking is active for this profile</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            Your progress is saved as you watch so Continue Watching stays helpful and easy to trust.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkWatched}
          disabled={isPending}
          className="theme-button-primary inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
          Mark watched
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
        <span className="flex items-center gap-2">
          {syncState === "error" ? (
            <RotateCcw size={14} className="text-[var(--color-danger)]" />
          ) : (
            <CheckCircle2 size={14} className="text-[var(--color-brand-strong)]" />
          )}
          {syncState === "error"
            ? "Sync needs another try"
            : syncState === "idle"
              ? "Resume state saving in background"
              : "Resume state synced"}
        </span>
        <span className="flex items-center gap-2">
          <Clock3 size={14} className="text-[var(--color-brand-strong)]" />
          {Math.max(0, Math.floor(trackedSeconds / 60))}m tracked this session
        </span>
        {message ? <span className="text-[var(--color-brand-strong)]">{message}</span> : null}
      </div>
    </section>
  );
}
