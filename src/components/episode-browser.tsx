import Link from "next/link";
import { getImageUrl } from "@/lib/tmdb";
import type { SeasonSummary } from "@/lib/types";
import { formatRuntime } from "@/lib/utils";

type EpisodeBrowserProps = {
  tvId: number;
  selectedSeason: SeasonSummary;
};

export function EpisodeBrowser({ tvId, selectedSeason }: EpisodeBrowserProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">
            Season guide
          </p>
          <h2 className="display-font text-3xl text-white">{selectedSeason.name}</h2>
        </div>
        <p className="text-sm text-[var(--color-text-muted)]">
          {selectedSeason.episodeCount} episodes available
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {selectedSeason.episodes?.map((episode) => {
          const still = getImageUrl(episode.stillPath, "w780");

          return (
            <Link
              key={episode.id}
              href={`/tv/${tvId}/watch?season=${selectedSeason.seasonNumber}&episode=${episode.episodeNumber}`}
              className="surface group rounded-[28px] p-4 transition hover:border-[rgba(214,179,109,0.35)] hover:bg-white/8"
            >
              <div
                className="mb-4 aspect-video rounded-[20px] bg-cover bg-center"
                style={{
                  backgroundImage: still
                    ? `linear-gradient(180deg, rgba(6,12,20,0.12), rgba(6,12,20,0.8)), url(${still})`
                    : "linear-gradient(135deg, rgba(214,179,109,0.16), rgba(6,12,20,0.95))",
                }}
              />
              <div className="mb-2 flex items-center justify-between gap-4">
                <h3 className="text-lg font-medium text-white">
                  Episode {episode.episodeNumber}: {episode.name}
                </h3>
                <span className="text-sm text-[var(--color-text-muted)]">{formatRuntime(episode.runtime)}</span>
              </div>
              <p className="text-sm leading-6 text-[var(--color-text-muted)]">{episode.overview}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
