import { getImageUrl } from "@/lib/tmdb";
import type { CastMember } from "@/lib/types";

type CastStripProps = {
  cast: CastMember[];
};

export function CastStrip({ cast }: CastStripProps) {
  return (
    <section className="space-y-4">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">
          On screen
        </p>
        <h2 className="display-font text-3xl text-white">Cast & Characters</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cast.map((person) => {
          const image = getImageUrl(person.profilePath, "w342");

          return (
            <article key={person.id} className="surface rounded-[28px] p-4">
              <div
                className="mb-4 aspect-[4/5] rounded-[22px] bg-cover bg-center"
                style={{
                  backgroundImage: image
                    ? `linear-gradient(180deg, rgba(6,12,20,0.08), rgba(6,12,20,0.85)), url(${image})`
                    : "linear-gradient(180deg, rgba(214,179,109,0.16), rgba(6,12,20,0.94))",
                }}
              />
              <h3 className="text-lg font-medium text-white">{person.name}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {person.character || "Featured role"}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
