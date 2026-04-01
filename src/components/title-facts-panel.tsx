import type { MediaDetail } from "@/lib/types";
import { formatMediaLabel, formatRuntime, formatYear } from "@/lib/utils";

type TitleFactsPanelProps = {
  item: MediaDetail;
};

export function TitleFactsPanel({ item }: TitleFactsPanelProps) {
  const facts = [
    { label: "Format", value: formatMediaLabel(item.mediaType) },
    { label: "Released", value: formatYear(item.releaseDate) },
    { label: "Runtime", value: formatRuntime(item.runtime) },
    { label: "Status", value: item.status || "Available" },
    { label: "Language", value: item.spokenLanguages[0] || item.originalLanguage?.toUpperCase() || "Unknown" },
    { label: "Genres", value: item.genreNames.slice(0, 3).join(", ") || "Unlisted" },
  ];

  return (
    <section className="surface rounded-[30px] p-6">
      <p className="mb-3 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Title guide</p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.label} className="rounded-[22px] border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-text-muted)]">{fact.label}</p>
            <p className="mt-2 text-sm leading-6 text-white">{fact.value}</p>
          </div>
        ))}
      </div>
      {item.tagline ? (
        <div className="mt-5 rounded-[24px] border border-[rgba(214,179,109,0.24)] bg-[rgba(214,179,109,0.08)] px-5 py-4 text-sm italic text-[var(--color-text)]">
          {item.tagline}
        </div>
      ) : null}
    </section>
  );
}
