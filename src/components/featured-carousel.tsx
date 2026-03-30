"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import type { MediaSummary } from "@/lib/types";
import { getImageUrl } from "@/lib/tmdb";
import { formatRating, formatYear } from "@/lib/utils";

type FeaturedCarouselProps = {
  items: MediaSummary[];
};

export function FeaturedCarousel({ items }: FeaturedCarouselProps) {
  const [index, setIndex] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (items.length < 2) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 6000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [items.length]);

  if (!items.length) {
    return null;
  }

  const activeItem = items[index];
  const background = getImageUrl(activeItem.backdropPath, "w1280");

  function moveTo(nextIndex: number) {
    const wrapped = (nextIndex + items.length) % items.length;
    setIndex(wrapped);
    setDragOffset(0);
  }

  return (
    <section
      className="group relative overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:rounded-[42px]"
      onPointerDown={(event) => setDragStart(event.clientX)}
      onPointerMove={(event) => {
        if (dragStart !== null) {
          setDragOffset(event.clientX - dragStart);
        }
      }}
      onPointerUp={() => {
        if (dragOffset > 80) {
          moveTo(index - 1);
        } else if (dragOffset < -80) {
          moveTo(index + 1);
        } else {
          setDragOffset(0);
        }
        setDragStart(null);
      }}
      onPointerLeave={() => {
        setDragStart(null);
        setDragOffset(0);
      }}
    >
      <div
        className="relative min-h-[460px] px-4 py-12 transition-all duration-700 sm:min-h-[500px] sm:px-10 sm:py-16 lg:px-14 lg:py-24"
        style={{
          backgroundImage: background
            ? `linear-gradient(90deg, rgba(4,8,14,0.94) 0%, rgba(4,8,14,0.72) 38%, rgba(4,8,14,0.25) 100%), url(${background})`
            : "linear-gradient(135deg, rgba(214,179,109,0.18), rgba(6,12,20,0.96))",
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: dragOffset ? `translateX(${dragOffset * 0.08}px)` : undefined,
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,179,109,0.18),transparent_28%)]" />
        <div className="relative max-w-3xl animate-[fade-rise_700ms_ease-out]">
          <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[var(--color-brand-strong)]">
            Featured lineup
          </p>
          <h1 className="display-font max-w-2xl text-4xl leading-none text-white sm:text-6xl lg:text-7xl">
            {activeItem.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)] sm:mt-5 sm:gap-3 sm:text-sm">
            <span>{formatYear(activeItem.releaseDate)}</span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span>{formatRating(activeItem.voteAverage)}</span>
            {activeItem.genreNames.slice(0, 3).map((genre) => (
              <span key={genre} className="rounded-full border border-white/12 px-3 py-1">
                {genre}
              </span>
            ))}
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] sm:mt-6 sm:text-lg sm:leading-7">
            {activeItem.overview}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Link
              href={`/${activeItem.mediaType}/${activeItem.id}/watch`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-[#07111f] transition hover:bg-[var(--color-brand-strong)]"
            >
              <Play size={16} fill="currentColor" /> Watch now
            </Link>
            <Link
              href={`/${activeItem.mediaType}/${activeItem.id}`}
              className="surface inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm text-white transition hover:bg-white/10"
            >
              View details
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 sm:bottom-5 sm:left-5 sm:right-5 sm:gap-4">
        <div className="flex min-w-0 items-center gap-2 overflow-hidden">
          {items.map((item, dotIndex) => (
            <button
              key={`${item.mediaType}-${item.id}`}
              onClick={() => moveTo(dotIndex)}
              className={`h-2.5 rounded-full transition-all ${dotIndex === index ? "w-10 bg-[var(--color-brand)]" : "w-2.5 bg-white/35"}`}
              aria-label={`Go to slide ${dotIndex + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => moveTo(index - 1)}
            className="surface flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 sm:h-11 sm:w-11"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => moveTo(index + 1)}
            className="surface flex h-10 w-10 items-center justify-center rounded-full text-white transition hover:bg-white/10 sm:h-11 sm:w-11"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}
