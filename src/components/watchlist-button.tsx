import Link from "next/link";
import { toggleWatchlistAction } from "@/app/actions";
import type { MediaType } from "@/lib/types";

type WatchlistButtonProps = {
  profileId: string | null;
  mediaId: number;
  mediaType: MediaType;
  returnTo: string;
  inWatchlist: boolean;
};

export function WatchlistButton({
  profileId,
  mediaId,
  mediaType,
  returnTo,
  inWatchlist,
}: WatchlistButtonProps) {
  if (!profileId) {
    return (
      <Link href="/account" className="surface inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm text-white">
        Save to watchlist
      </Link>
    );
  }

  return (
    <form action={toggleWatchlistAction}>
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="mediaId" value={mediaId} />
      <input type="hidden" name="mediaType" value={mediaType} />
      <input type="hidden" name="returnTo" value={returnTo} />
      <button className="surface inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm text-white">
        {inWatchlist ? "Remove from watchlist" : "Save to watchlist"}
      </button>
    </form>
  );
}
