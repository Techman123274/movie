import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import type { MediaSummary } from "@/lib/types";
import { formatMediaLabel, formatRating, formatYear } from "@/lib/utils";

type MediaCardProps = {
  item: MediaSummary;
};

export function MediaCard({ item }: MediaCardProps) {
  const image = getImageUrl(item.posterPath, "w342");
  const href = item.hrefOverride ?? `/${item.mediaType}/${item.id}`;

  return (
    <Link
      href={href}
      className="group relative block w-[170px] min-w-[170px] snap-start overflow-hidden rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.03)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(214,179,109,0.4)] hover:shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:w-[185px] sm:min-w-[185px] lg:w-[205px] lg:min-w-[205px]"
    >
      <div
        className="aspect-[2/3] bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
        style={{
          backgroundImage: image
            ? `linear-gradient(180deg, rgba(6,12,20,0.08), rgba(6,12,20,0.85)), url(${image})`
            : "linear-gradient(180deg, rgba(214,179,109,0.25), rgba(4,9,18,0.95))",
        }}
      />
      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,rgba(4,9,18,0.02),rgba(4,9,18,0.96))] p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)] sm:text-[11px]">
          <span>{formatMediaLabel(item.mediaType)}</span>
          <span className="h-1 w-1 rounded-full bg-white/40" />
          <span>{formatYear(item.releaseDate)}</span>
          {item.contextLabel ? (
            <>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span>{item.contextLabel}</span>
            </>
          ) : null}
        </div>
        <h3 className="display-font line-clamp-2 text-xl leading-5 text-white sm:text-2xl sm:leading-6">{item.title}</h3>
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-muted)] sm:text-sm">
          <span>{formatRating(item.voteAverage)}</span>
          <span className="inline-flex items-center gap-1 text-[var(--color-brand-strong)]">
            {item.actionLabel ?? "Open"} <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
