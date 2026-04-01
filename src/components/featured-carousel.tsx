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

const ROTATION_INTERVAL_MS = 6000;

export function FeaturedCarousel({ items }: FeaturedCarouselProps) {
  const [index, setIndex] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (items.length < 2 || isPaused) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, ROTATION_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [items.length, isPaused]);

  if (!items.length) {
    return null;
  }

  const activeItem = items[index];
  const background = getImageUrl(activeItem.backdropPath, "w1280");
  const upcomingItems = items.length > 1 ? [items[(index + 1) % items.length], items[(index + 2) % items.length]].filter(Boolean) : [];

  function moveTo(nextIndex: number) {
    const wrapped = (nextIndex + items.length) % items.length;
    setIndex(wrapped);
    setDragOffset(0);
  }

  return (
    <section
      className="group relative overflow-hidden rounded-[28px] border border-white/10 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:rounded-[42px]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}
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
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 animate-[hero-drift_16s_ease-in-out_infinite_alternate] bg-cover bg-center transition duration-700"
          style={{
            backgroundImage: background
              ? `url(${background})`
              : "linear-gradient(135deg, rgba(214,179,109,0.18), rgba(6,12,20,0.96))",
            transform: dragOffset ? `translateX(${dragOffset * 0.08}px)` : undefined,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,8,14,0.95)_0%,rgba(4,8,14,0.74)_40%,rgba(4,8,14,0.24)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,179,109,0.2),transparent_28%)]" />
        <div className="absolute -right-16 top-16 h-56 w-56 rounded-full bg-[rgba(214,179,109,0.08)] blur-3xl animate-[ambient-float_8s_ease-in-out_infinite_alternate]" />
      </div>

      <div className="relative min-h-[470px] px-4 py-12 sm:min-h-[520px] sm:px-10 sm:py-16 lg:px-14 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div key={`${activeItem.mediaType}-${activeItem.id}`} className="max-w-3xl animate-[fade-rise_700ms_ease-out]">
            <div className="mb-5 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">
              <span>Featured lineup</span>
              <span className="rounded-full border border-[rgba(214,179,109,0.24)] bg-[rgba(214,179,109,0.08)] px-3 py-1 text-[10px] tracking-[0.22em] text-white">
                {isPaused ? "Paused" : "Auto rotating"}
              </span>
            </div>
            <h1 className="display-font max-w-2xl text-4xl leading-none text-white sm:text-6xl lg:text-7xl">
              {activeItem.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)] sm:gap-3 sm:text-sm">
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

          <div className="hidden lg:grid lg:gap-3">
            <div className="rounded-[28px] border border-white/10 bg-[rgba(6,12,20,0.56)] p-5 backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Tonight&apos;s pick</p>
              <p className="mt-3 text-2xl font-medium text-white">{activeItem.title}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
                Start here for the cinematic lead, then drop into more tailored rails below.
              </p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-[rgba(6,12,20,0.56)] p-5 backdrop-blur-xl">
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Coming up next</p>
              <div className="mt-3 space-y-3">
                {upcomingItems.map((item, offset) => (
                  <div
                    key={`${item.mediaType}-${item.id}`}
                    className="rounded-[20px] border border-white/8 bg-black/20 px-4 py-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
                      Up next {offset + 1}
                    </p>
                    <p className="mt-1 text-base text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">{formatYear(item.releaseDate)}</p>
                  </div>
                ))}
              </div>
            </div>
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

      {items.length > 1 ? (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div
            key={`${activeItem.id}-${isPaused}`}
            className={`h-full bg-[linear-gradient(90deg,var(--color-brand),var(--color-brand-strong))] ${
              isPaused ? "w-1/3" : "animate-[carousel-progress_6000ms_linear_forwards]"
            }`}
          />
        </div>
      ) : null}
    </section>
  );
}
