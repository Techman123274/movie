"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle2, LoaderCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import type { MediaType, WatchStateEvent } from "@/lib/types";

type WatchStatePanelProps = {
  profileId: string | null;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
};

async function postWatchState(payload: {
  profileId: string | null;
  mediaId: number;
  mediaType: MediaType;
  seasonNumber?: number;
  episodeNumber?: number;
  event: WatchStateEvent;
}) {
  const response = await fetch("/api/watch-state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Watch state request failed.");
  }
}

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
  const [isPending, startTransition] = useTransition();
  const lastStartedKeyRef = useRef<string | null>(null);
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
          Watch history and continue watching stay tied to your active profile, so you can pick up later from browse,
          account, and detail pages.
        </p>
        <div className="mt-4">
          <Link
            href="/sign-in"
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--color-brand)] px-5 text-sm font-semibold text-[#07111f]"
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
            Opening this player updates your resume queue automatically. When you finish, mark it watched to clear it
            from continue watching and keep it in recent history.
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkWatched}
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-5 text-sm font-semibold text-[#07111f] disabled:cursor-not-allowed disabled:opacity-70"
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
        {message ? <span className="text-[var(--color-brand-strong)]">{message}</span> : null}
      </div>
    </section>
  );
}
