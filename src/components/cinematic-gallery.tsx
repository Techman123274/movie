import Image from "next/image";
import { Star, Ticket } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import type { MediaSummary } from "@/lib/types";
import { formatYear } from "@/lib/utils";

type CinematicGalleryProps = {
  items: MediaSummary[];
  eyebrow: string;
  title: string;
  description: string;
};

export function CinematicGallery({ items, eyebrow, title, description }: CinematicGalleryProps) {
  const [hero, first, second] = items;

  if (!hero) {
    return null;
  }

  const heroBackdrop = getImageUrl(hero.backdropPath, "w1280");
  const firstPoster = first ? getImageUrl(first.posterPath, "w342") : null;
  const secondPoster = second ? getImageUrl(second.posterPath, "w342") : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_220px]">
      <article className="relative min-h-[340px] overflow-hidden rounded-[34px] border border-white/10 bg-[rgba(10,10,12,0.94)] shadow-[0_28px_90px_rgba(0,0,0,0.48)]">
        {heroBackdrop ? (
          <Image
            src={heroBackdrop}
            alt={hero.title}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            preload
            loading="eager"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,8,10,0.14),rgba(8,8,10,0.86)_60%,rgba(8,8,10,0.98))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.24),transparent_28%)]" />
        <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
          <p className="text-[10px] uppercase tracking-[0.34em] text-[var(--color-brand-strong)]">{eyebrow}</p>
          <h2 className="display-font mt-3 max-w-xl text-4xl leading-none text-white sm:text-5xl">{title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">{description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            <span className="flex items-center gap-2">
              <Star size={14} className="text-[var(--color-brand-strong)]" />
              Rich cinematic artwork
            </span>
            <span className="flex items-center gap-2">
              <Ticket size={14} className="text-[var(--color-brand-strong)]" />
              {hero.title} {hero.releaseDate ? `· ${formatYear(hero.releaseDate)}` : ""}
            </span>
          </div>
        </div>
      </article>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {[first, second].map((item, index) => {
          const poster = index === 0 ? firstPoster : secondPoster;

          if (!item) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[164px] rounded-[28px] border border-dashed border-white/10 bg-[rgba(255,255,255,0.03)]"
              />
            );
          }

          return (
            <article
              key={`${item.mediaType}-${item.id}`}
              className="relative min-h-[164px] overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(10,10,12,0.94)]"
            >
              {poster ? (
                <Image
                  src={poster}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 220px"
                  className="object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,8,10,0.04),rgba(8,8,10,0.92))]" />
              <div className="relative flex h-full flex-col justify-end p-4">
                <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">
                  {item.mediaType === "movie" ? "Movie" : "Series"}
                </p>
                <h3 className="display-font mt-2 text-2xl leading-none text-white">{item.title}</h3>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                  {item.releaseDate ? formatYear(item.releaseDate) : "Now streaming"}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
