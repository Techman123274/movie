"use client";

import Image from "next/image";
import Link from "next/link";
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { getImageUrl } from "@/lib/tmdb";
import type { MediaSummary } from "@/lib/types";
import { cn, formatMediaLabel, formatYear } from "@/lib/utils";

type LiveSearchProps = {
  initialQuery?: string;
  placeholder: string;
  variant?: "compact" | "full";
};

function buildSearchHref(query: string) {
  const trimmed = query.trim();

  if (!trimmed) {
    return "/search";
  }

  return `/search?q=${encodeURIComponent(trimmed)}`;
}

export function LiveSearch({ initialQuery = "", placeholder, variant = "compact" }: LiveSearchProps) {
  const router = useRouter();
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<MediaSummary[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const trimmedDeferredQuery = deferredQuery.trim();
  const supportsQuickResults = true;

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) {
        clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!supportsQuickResults) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (trimmedDeferredQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(trimmedDeferredQuery)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Suggestion request failed.");
        }

        const payload = (await response.json()) as { results?: MediaSummary[] };
        setResults(payload.results ?? []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [supportsQuickResults, trimmedDeferredQuery]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsOpen(false);
    router.push(buildSearchHref(query), { scroll: false });
  }

  function handleFocus() {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }

    setIsOpen(true);
  }

  function handleBlur() {
    blurTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 140);
  }

  const showDropdown = supportsQuickResults && isOpen && trimmedDeferredQuery.length >= 2;
  const dropdownClassName =
    variant === "compact"
      ? "theme-menu-panel absolute left-0 right-0 top-full z-[130] mt-3 overflow-hidden rounded-[26px]"
      : "theme-menu-panel mt-4 overflow-hidden rounded-[26px]";

  return (
    <div
      className={cn(
        "relative isolate",
        showDropdown ? "z-[120]" : "z-0",
        variant === "compact" ? "w-full max-w-[22rem]" : "w-full",
      )}
    >
      <form
        onSubmit={handleSubmit}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={cn(
          "flex items-center gap-3",
          variant === "compact"
            ? "theme-input-shell min-h-11 rounded-full px-4"
            : "theme-input-shell min-h-14 rounded-full px-5",
        )}
      >
        <Search size={variant === "compact" ? 16 : 18} className="shrink-0 text-[var(--color-text-muted)]" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-[var(--color-text-muted)]"
        />
        {variant === "full" ? (
          <button className="theme-button-primary rounded-full px-6 py-3 text-sm font-semibold">
            Search
          </button>
        ) : null}
      </form>

      {showDropdown ? (
        <div className={dropdownClassName}>
          <div className="border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">
            {variant === "compact" ? "Quick results" : "Suggestions"}
          </div>
          {isLoading ? (
            <div className="flex items-center gap-3 px-4 py-4 text-sm text-[var(--color-text-muted)]">
              <LoaderCircle size={16} className="animate-spin" />
              Looking up titles...
            </div>
          ) : results.length ? (
            <div className="max-h-[24rem] overflow-y-auto p-2">
              {results.map((item) => {
                const image = getImageUrl(item.posterPath, "w342");

                return (
                  <Link
                    key={`${item.mediaType}-${item.id}`}
                    href={`/${item.mediaType}/${item.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-[20px] px-3 py-3 transition hover:bg-white/8"
                  >
                    <div className="relative h-16 w-11 overflow-hidden rounded-[14px] bg-white/6">
                      {image ? (
                        <Image src={image} alt={item.title} fill sizes="44px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-white">{item.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                        <span>{formatMediaLabel(item.mediaType)}</span>
                        <span className="h-1 w-1 rounded-full bg-white/40" />
                        <span>{formatYear(item.releaseDate)}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-[var(--color-text-muted)]">
              No quick matches yet. Press enter to search the full catalog.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
