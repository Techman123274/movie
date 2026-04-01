import Link from "next/link";
import { cn } from "@/lib/utils";

type SearchFilterBarProps = {
  query: string;
  selectedType: "all" | "movie" | "tv" | "person";
  selectedSort: "relevance" | "rating" | "popularity" | "release_date";
  selectedPersonId?: number;
};

const typeOptions: Array<{ value: SearchFilterBarProps["selectedType"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "Series" },
  { value: "person", label: "Cast" },
];

const sortOptions: Array<{ value: SearchFilterBarProps["selectedSort"]; label: string }> = [
  { value: "relevance", label: "Best Match" },
  { value: "rating", label: "Rating" },
  { value: "popularity", label: "Popularity" },
  { value: "release_date", label: "Latest" },
];

function buildHref(query: string, updates: Record<string, string>, selectedPersonId?: number) {
  const searchParams = new URLSearchParams({ q: query });

  Object.entries(updates).forEach(([key, value]) => {
    if (value === "all" || value === "relevance") {
      return;
    }
    searchParams.set(key, value);
  });

  if (selectedPersonId) {
    searchParams.set("person", String(selectedPersonId));
  }

  return `/search?${searchParams.toString()}`;
}

export function SearchFilterBar({ query, selectedType, selectedSort, selectedPersonId }: SearchFilterBarProps) {
  if (!query) {
    return null;
  }

  return (
    <section className="surface rounded-[28px] p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((option) => (
            <Link
              key={option.value}
              href={buildHref(query, { type: option.value, sort: selectedSort }, selectedPersonId)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition",
                selectedType === option.value
                  ? "bg-[rgba(214,179,109,0.16)] text-white"
                  : "surface text-[var(--color-text-muted)] hover:text-white",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <Link
              key={option.value}
              href={buildHref(query, { type: selectedType, sort: option.value }, selectedPersonId)}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition",
                selectedSort === option.value
                  ? "bg-white/10 text-white"
                  : "surface text-[var(--color-text-muted)] hover:text-white",
              )}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
