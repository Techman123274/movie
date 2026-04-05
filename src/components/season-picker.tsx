"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SeasonSummary } from "@/lib/types";

type SeasonPickerProps = {
  tvId: number;
  seasons: SeasonSummary[];
  selectedSeasonNumber: number;
  routeMode: "detail" | "watch";
};

export function SeasonPicker({ tvId, seasons, selectedSeasonNumber, routeMode }: SeasonPickerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSeasonChange(nextSeasonNumber: number) {
    const href =
      routeMode === "detail"
        ? `/tv/${tvId}?season=${nextSeasonNumber}`
        : `/tv/${tvId}/watch?season=${nextSeasonNumber}&episode=1`;

    startTransition(() => {
      router.push(href, { scroll: false });
    });
  }

  return (
    <label className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
      <span className="whitespace-nowrap uppercase tracking-[0.22em]">Season</span>
      <select
        value={selectedSeasonNumber}
        onChange={(event) => handleSeasonChange(Number(event.target.value))}
        disabled={isPending}
        className="theme-select surface min-h-11 rounded-full px-4 text-sm text-white outline-none disabled:opacity-70"
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.seasonNumber}>
            {season.name}
          </option>
        ))}
      </select>
    </label>
  );
}
