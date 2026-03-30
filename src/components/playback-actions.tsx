"use client";

import { useState } from "react";
import { Cast, Copy, ExternalLink } from "lucide-react";

type PlaybackActionsProps = {
  embedUrl: string;
  title: string;
};

export function PlaybackActions({ embedUrl, title }: PlaybackActionsProps) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleShare() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${title} on Subflix`,
          text: "Open the player in your browser, then use your device's cast or screen-share controls.",
          url: embedUrl,
        });
        setMessage("Player link shared.");
        return;
      }

      await navigator.clipboard.writeText(embedUrl);
      setMessage("Player link copied. Open it on the device you want to cast from.");
    } catch {
      setMessage("Sharing was canceled or unavailable on this device.");
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(embedUrl);
      setMessage("Player link copied.");
    } catch {
      setMessage("Clipboard access is unavailable on this device.");
    }
  }

  return (
    <div className="surface rounded-[28px] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Cast And Share</p>
          <h3 className="text-lg font-medium text-white">Open the player on the device you want to cast from</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
            These providers run inside an external iframe, so the most reliable casting flow is to open the player in
            its own tab and use your browser or device cast controls there.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={embedUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-brand)] px-4 text-sm font-semibold text-[#07111f]"
          >
            <ExternalLink size={16} />
            Open Player
          </a>
          <button
            type="button"
            onClick={handleShare}
            className="surface flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-white transition hover:bg-white/10"
          >
            <Cast size={16} />
            Share / Cast
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="surface flex min-h-11 items-center gap-2 rounded-full px-4 text-sm text-white transition hover:bg-white/10"
          >
            <Copy size={16} />
            Copy Link
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
        <span className="flex items-center gap-2">
          <Cast size={14} className="text-[var(--color-brand-strong)]" />
          AirPlay, Chromecast, and browser tab casting work best after opening the provider directly
        </span>
        {message ? <span className="text-[var(--color-brand-strong)]">{message}</span> : null}
      </div>
    </div>
  );
}
