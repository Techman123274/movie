"use client";

import { startTransition, useState } from "react";
import { RefreshCw, Trash2 } from "lucide-react";
import { AUTOPLAY_NEXT_STORAGE_KEY, PREFERRED_PROVIDER_STORAGE_KEY } from "@/lib/playback-preferences";

const APP_STORAGE_KEYS = [PREFERRED_PROVIDER_STORAGE_KEY, AUTOPLAY_NEXT_STORAGE_KEY];

export function SettingsCacheTools() {
  const [status, setStatus] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  async function clearCache() {
    setIsClearing(true);
    setStatus(null);

    try {
      APP_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));

      if ("sessionStorage" in window) {
        window.sessionStorage.clear();
      }

      if ("caches" in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
      }

      startTransition(() => {
        setStatus("Subflix cache cleared. Reloading the page now.");
      });

      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch {
      startTransition(() => {
        setStatus("Cache could not be fully cleared on this browser.");
      });
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <section className="surface rounded-[28px] p-6">
      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Cache and refresh</p>
      <h2 className="text-xl font-medium text-white">Reset stored playback choices</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
        Clear the local Subflix cache if provider preference, embedded playback, or stale page data starts feeling stuck.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={clearCache}
          disabled={isClearing}
          className="theme-button-secondary inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm text-white disabled:cursor-wait disabled:opacity-70"
        >
          <Trash2 size={16} />
          {isClearing ? "Clearing cache..." : "Clear cache"}
        </button>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="theme-button-primary inline-flex min-h-12 items-center gap-2 rounded-full px-5 text-sm font-semibold"
        >
          <RefreshCw size={16} />
          Reload app
        </button>
      </div>
      {status ? (
        <p className="mt-4 rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-[var(--color-text-muted)]">
          {status}
        </p>
      ) : null}
    </section>
  );
}
