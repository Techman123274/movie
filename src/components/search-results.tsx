import { SearchX } from "lucide-react";
import type { MediaSummary } from "@/lib/types";
import { MediaCard } from "@/components/media-card";

type SearchResultsProps = {
  query: string;
  results: MediaSummary[];
};

export function SearchResults({ query, results }: SearchResultsProps) {
  if (!query) {
    return (
      <div className="surface rounded-[30px] p-8 text-center text-[var(--color-text-muted)]">
        Search for a title, actor, or mood to surface movies and series from TMDB.
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="surface rounded-[30px] p-8 text-center">
        <SearchX className="mx-auto mb-4 text-[var(--color-brand-strong)]" size={36} />
        <p className="text-lg text-white">
          No matches for &quot;
          {query}
          &quot;.
        </p>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Try a broader title, shorter phrase, or a more common franchise name.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {results.map((item) => (
        <MediaCard key={`${item.mediaType}-${item.id}`} item={item} />
      ))}
    </div>
  );
}
