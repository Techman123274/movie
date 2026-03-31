import Link from "next/link";
import { SeasonPicker } from "@/components/season-picker";
import { getImageUrl } from "@/lib/tmdb";
import type { ResumeTarget, SeasonSummary } from "@/lib/types";
import { buildWatchHref, formatRuntime } from "@/lib/utils";

type EpisodeBrowserProps = {
  tvId: number;
  seasons: SeasonSummary[];
  selectedSeason: SeasonSummary;
  resumeTarget: ResumeTarget | null;
};

export function EpisodeBrowser({ tvId, seasons, selectedSeason, resumeTarget }: EpisodeBrowserProps) {
  const shouldResumeSeason =
    resumeTarget?.seasonNumber === selectedSeason.seasonNumber && resumeTarget.episodeNumber !== undefined;
  const seasonPlayHref = buildWatchHref(
    "tv",
    tvId,
    selectedSeason.seasonNumber,
    shouldResumeSeason ? resumeTarget.episodeNumber : 1,
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">
            Season guide
          </p>
          <h2 className="display-font text-3xl text-white">{selectedSeason.name}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SeasonPicker
            tvId={tvId}
            seasons={seasons}
            selectedSeasonNumber={selectedSeason.seasonNumber}
            routeMode="detail"
          />
          <Link
            href={seasonPlayHref}
            className="inline-flex min-h-11 items-center rounded-full bg-[var(--color-brand)] px-5 text-sm font-semibold text-[#07111f]"
          >
            {shouldResumeSeason ? "Resume Season" : "Play Season"}
          </Link>
          <p className="text-sm text-[var(--color-text-muted)]">{selectedSeason.episodeCount} episodes available</p>
        </div>
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
