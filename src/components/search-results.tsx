import Image from "next/image";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { MediaCard } from "@/components/media-card";
import { getImageUrl } from "@/lib/tmdb";
import type { PersonSummary, SearchExperienceResult } from "@/lib/types";

type SearchResultsProps = {
  query: string;
  results: SearchExperienceResult;
  selectedType: "all" | "movie" | "tv" | "person";
  profileId?: string | null;
  watchlistKeys?: string[];
};

function PersonResultCard({ person }: { person: PersonSummary }) {
  const image = getImageUrl(person.profilePath, "w342");

  return (
    <article className="surface rounded-[28px] p-4">
      <div className="flex gap-4">
        <div className="relative h-24 w-[4.5rem] min-w-[4.5rem] overflow-hidden rounded-[18px] bg-white/6">
          {image ? <Image src={image} alt={person.name} fill sizes="72px" className="object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-brand-strong)]">
            {person.knownForDepartment || "Cast"}
          </p>
          <h3 className="mt-2 text-xl font-medium text-white">{person.name}</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
            {person.knownFor.slice(0, 3).map((item) => (
              <Link
                key={`${person.id}-${item.mediaType}-${item.id}`}
                href={`/search?q=${encodeURIComponent(person.name)}&person=${person.id}`}
                className="rounded-full border border-white/10 px-3 py-1 transition hover:border-[rgba(214,179,109,0.35)] hover:text-white"
              >
                {item.title}
              </Link>
            ))}
          </div>
          <Link
            href={`/search?q=${encodeURIComponent(person.name)}&person=${person.id}`}
            className="mt-4 inline-flex rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[#07111f]"
          >
            Browse credits
          </Link>
        </div>
      </div>
    </article>
  );
}

export function SearchResults({
  query,
  results,
  selectedType,
  profileId = null,
  watchlistKeys = [],
}: SearchResultsProps) {
  if (!query) {
    return (
      <div className="surface rounded-[30px] p-8 text-center text-[var(--color-text-muted)]">
        Search for a title, actor, or mood to surface movies, series, and cast matches.
      </div>
    );
  }

  const hasPeople = selectedType === "all" || selectedType === "person";
  const noTitleMatches = results.titles.length === 0;
  const noPeopleMatches = !hasPeople || results.people.length === 0;

  if (noTitleMatches && noPeopleMatches) {
    return (
      <div className="surface rounded-[30px] p-8 text-center">
        <SearchX className="mx-auto mb-4 text-[var(--color-brand-strong)]" size={36} />
        <p className="text-lg text-white">
          No matches for &quot;
          {query}
          &quot;.
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Try a broader title, shorter phrase, or a lead actor instead of a full cast list.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {hasPeople && results.people.length ? (
        <section className="space-y-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Cast matches</p>
            <h2 className="display-font text-3xl text-white">People related to your search</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {results.people.map((person) => (
              <PersonResultCard key={person.id} person={person} />
            ))}
          </div>
        </section>
      ) : null}

      {results.titles.length ? (
        <section className="space-y-4">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Title results</p>
            <h2 className="display-font text-3xl text-white">
              {selectedType === "person" ? "Credits worth opening" : "Movies and series worth opening"}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {results.titles.map((item) => (
              <MediaCard
                key={`${item.mediaType}-${item.id}`}
                item={item}
                profileId={profileId}
                inWatchlist={watchlistKeys.includes(`${item.mediaType}-${item.id}`)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
