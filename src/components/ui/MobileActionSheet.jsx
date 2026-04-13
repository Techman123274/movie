import { Check, Info, Play, Plus, ThumbsUp } from "lucide-react";
import PlaybackProgressBar from "@/components/ui/PlaybackProgressBar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { tmdbW300, tmdbW500 } from "@/lib/tmdb";

/**
 * @typedef {object} MobileActionSheetProps
 * @property {boolean} open
 * @property {(open: boolean) => void} onOpenChange
 * @property {Record<string, any>} item
 * @property {string} title
 * @property {"movie" | "tv"} mediaType
 * @property {string} year
 * @property {number | null} matchPercentage
 * @property {number | null} rating
 * @property {number} progressPercent
 * @property {string[]} genres
 * @property {string} socialReason
 * @property {boolean} inList
 * @property {boolean} liked
 * @property {(event?: Event) => void} onPlay
 * @property {(event?: Event) => void} onDetails
 * @property {(event?: Event) => void} onWatchlist
 * @property {(event?: Event) => void} onLike
 */

/**
 * @param {MobileActionSheetProps} props
 */
export default function MobileActionSheet({
  open,
  onOpenChange,
  item,
  title,
  mediaType,
  year,
  matchPercentage,
  rating,
  progressPercent,
  genres,
  socialReason,
  inList,
  liked,
  onPlay,
  onDetails,
  onWatchlist,
  onLike,
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="animate-mobile-sheet-rise max-h-[92svh] rounded-t-[30px] border-x-0 border-b-0 border-t border-white/10 bg-[var(--panel-bg)] px-0 pb-8 pt-0 text-white shadow-[0_-24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(var(--brand-rgb),0.3),transparent_68%)] opacity-80" />
        <div className="relative">
          <SheetHeader className="px-5 pb-2 pt-6 text-left">
            <SheetTitle className="text-xl text-white">{title}</SheetTitle>
            <SheetDescription className="text-white/60">
              {[
                year || null,
                mediaType === "tv" ? "Series" : "Movie",
                matchPercentage ? `${matchPercentage}% Match` : rating ? `${rating}% Rating` : null,
              ].filter(Boolean).join(" / ")}
            </SheetDescription>
          </SheetHeader>

          <div className="px-5">
            <div className="relative mb-4 aspect-video overflow-hidden rounded-[24px] border border-white/8 bg-[#141414] shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
              {item.backdrop_path ? (
                <img
                  src={tmdbW500(item.backdrop_path)}
                  alt={title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  sizes="100vw"
                />
              ) : item.poster_path ? (
                <img
                  src={tmdbW300(item.poster_path)}
                  alt={title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  sizes="100vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-gray-500">
                  {title}
                </div>
              )}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_5%,rgba(0,0,0,0.86)_100%)]" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(var(--brand-rgb),0.16),transparent_48%)]" />
              {progressPercent > 0 && (
                <div className="absolute inset-x-4 bottom-4">
                  <PlaybackProgressBar progress={progressPercent} className="bg-white/20" />
                </div>
              )}
            </div>

            {socialReason && (
              <p className="mb-3 text-sm font-medium leading-relaxed text-[#86efac]">
                {socialReason}
              </p>
            )}

            {item.overview && (
              <p className="mb-4 text-sm leading-relaxed text-white/72">
                {item.overview}
              </p>
            )}

            {genres.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                {genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/58"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <div className="grid gap-2">
              <button
                onClick={onPlay}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-[var(--brand-contrast)] transition-colors hover:bg-[var(--brand-strong)]"
              >
                <Play className="h-4 w-4 fill-[var(--brand-contrast)]" />
                Play Now
              </button>
              <button
                onClick={onDetails}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
              >
                <Info className="h-4 w-4" />
                View Details
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onWatchlist}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                >
                  {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {inList ? "In My List" : "My List"}
                </button>
                <button
                  onClick={onLike}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-colors ${
                    liked
                      ? "border-[var(--brand)] bg-[rgba(var(--brand-rgb),0.14)] text-[var(--brand)]"
                      : "border-white/12 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <ThumbsUp className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
                  {liked ? "Liked" : "Like"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
