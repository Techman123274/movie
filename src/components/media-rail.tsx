"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaRail as MediaRailType } from "@/lib/types";
import { MediaCard } from "@/components/media-card";

type MediaRailProps = {
  rail: MediaRailType;
  profileId?: string | null;
  watchlistKeys?: string[];
};

export function MediaRail({ rail, profileId = null, watchlistKeys = [] }: MediaRailProps) {
  const railRef = useRef<HTMLDivElement>(null);

  if (!rail.items.length) {
    return null;
  }

  function scrollRail(direction: "left" | "right") {
    const railNode = railRef.current;

    if (!railNode) {
      return;
    }

    const amount = Math.max(railNode.clientWidth * 0.82, 320);
    railNode.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          {rail.eyebrow ? (
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">
              {rail.eyebrow}
            </p>
          ) : null}
          <h2 className="display-font text-3xl text-white sm:text-4xl">{rail.title}</h2>
          {rail.description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">{rail.description}</p>
          ) : null}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => scrollRail("left")}
            className="surface flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            aria-label={`Scroll ${rail.title} left`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scrollRail("right")}
            className="surface flex h-11 w-11 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            aria-label={`Scroll ${rail.title} right`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div
        ref={railRef}
        className="hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1"
      >
        {rail.items.map((item) => (
          <MediaCard
            key={`${rail.id}-${item.id}`}
            item={item}
            variant={rail.variant ?? "default"}
            profileId={profileId}
            inWatchlist={watchlistKeys.includes(`${item.mediaType}-${item.id}`)}
          />
        ))}
      </div>
    </section>
  );
}
