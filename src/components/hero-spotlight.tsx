import Link from "next/link";
import { Play, Plus } from "lucide-react";
import type { MediaSummary } from "@/lib/types";
import { getImageUrl } from "@/lib/tmdb";
import { formatRating, formatYear } from "@/lib/utils";

type HeroSpotlightProps = {
  item: MediaSummary;
};

export function HeroSpotlight({ item }: HeroSpotlightProps) {
  const background = getImageUrl(item.backdropPath, "w1280");

  return (
    <section
      className="relative overflow-hidden rounded-[40px] border border-white/10 px-6 py-16 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:px-10 lg:px-14 lg:py-24"
      style={{
        backgroundImage: background
          ? `linear-gradient(90deg, rgba(8,8,10,0.94) 0%, rgba(8,8,10,0.76) 38%, rgba(8,8,10,0.24) 100%), url(${background})`
          : "linear-gradient(135deg, rgba(229,9,20,0.2), rgba(8,8,10,0.95))",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.22),transparent_28%)]" />
      <div className="relative max-w-3xl">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-[var(--color-brand-strong)]">
          Featured tonight
        </p>
        <h1 className="display-font max-w-2xl text-5xl leading-none text-white sm:text-6xl lg:text-7xl">
          {item.title}
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <span>{formatYear(item.releaseDate)}</span>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <span>{formatRating(item.voteAverage)}</span>
          {item.genreNames.slice(0, 3).map((genre) => (
            <span key={genre} className="rounded-full border border-white/12 px-3 py-1">
              {genre}
            </span>
          ))}
        </div>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--color-text-muted)] sm:text-lg">
          {item.overview}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/${item.mediaType}/${item.id}/watch`}
            className="theme-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
          >
            <Play size={16} fill="currentColor" /> Watch now
          </Link>
          <Link
            href={`/${item.mediaType}/${item.id}`}
            className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm text-white"
          >
            <Plus size={16} /> View details
          </Link>
        </div>
      </div>
    </section>
  );
}
