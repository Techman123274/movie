import Link from "next/link";
import { Play } from "lucide-react";
import { MediaRail } from "@/components/media-rail";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { withMinimumDelay } from "@/lib/loading";
import { getWatchlist } from "@/lib/persistence";
import { getCatalogRail, getGenreOptions, getImageUrl } from "@/lib/tmdb";
import { buildMediaKey, cn, formatRating, formatYear, parsePositiveInt } from "@/lib/utils";
import { getViewerContext } from "@/lib/viewer";

type MoviesPageProps = {
  searchParams: Promise<{
    genre?: string;
    sort?: string;
  }>;
};

const MOVIE_SORT_OPTIONS = [
  { key: "popular", label: "Popular", sort: "popularity.desc" as const },
  { key: "top-rated", label: "Top rated", sort: "vote_average.desc" as const },
  { key: "new", label: "Newest", sort: "primary_release_date.desc" as const },
];

function parseMovieSort(sortParam?: string) {
  return MOVIE_SORT_OPTIONS.find((option) => option.key === sortParam) ?? MOVIE_SORT_OPTIONS[0];
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const params = await searchParams;
  const genreId = parsePositiveInt(params.genre);
  const activeSort = parseMovieSort(params.sort);
  const genreOptions = getGenreOptions("movie");
  const [rails, watchlist] = await withMinimumDelay(
    Promise.all([
      getCatalogRail("movie", {
        genreId,
        sort: activeSort.sort,
      }),
      viewer.activeProfile ? getWatchlist(viewer.activeProfile.id) : Promise.resolve([]),
    ]),
  );
  const watchlistKeys = watchlist.map((record) => buildMediaKey(record.mediaType, record.mediaId));
  const activeGenreLabel = genreOptions.find((genre) => genre.id === genreId)?.label ?? null;
  const featured = rails?.find((rail) => rail.items.length)?.items[0] ?? null;
  const featuredBackdrop = getImageUrl(featured?.backdropPath ?? null, "w1280");
  const buildBrowseHref = (options: { genreId?: number; sort?: string }) => {
    const hrefParams = new URLSearchParams();

    if (options.genreId) {
      hrefParams.set("genre", String(options.genreId));
    }

    if (options.sort && options.sort !== MOVIE_SORT_OPTIONS[0].key) {
      hrefParams.set("sort", options.sort);
    }

    const query = hrefParams.toString();
    return query ? `/movies?${query}` : "/movies";
  };

  if (!rails) {
    return (
      <PageFrame activeHref="/movies">
        <UnavailablePanel
          title="Movies are unavailable right now."
          message="The movie collection could not be loaded right now. Please try again in a moment."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/movies">
      <PageHero
        eyebrow="Movies"
        title="Movies built for cleaner browsing and stronger picks."
        description="Home stays light, so Movies can do the deeper work with sharper filters, a stronger spotlight, and rails that feel worth scanning."
        backdropPath={rails[0]?.items[0]?.backdropPath ?? null}
        actions={
          <>
            {featured ? (
              <Link
                href={`/${featured.mediaType}/${featured.id}/watch`}
                className="theme-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold"
              >
                <Play size={16} fill="currentColor" />
                Play featured
              </Link>
            ) : null}
            <Link href="/account" className="theme-button-secondary inline-flex rounded-full px-6 py-3 text-sm text-white">
              My Profile
            </Link>
          </>
        }
      />
      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <article
          className="relative min-h-[360px] overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(10,10,12,0.95)] shadow-[0_26px_80px_rgba(0,0,0,0.44)]"
          style={
            featuredBackdrop
              ? {
                  backgroundImage: `linear-gradient(90deg, rgba(8,8,10,0.95) 0%, rgba(8,8,10,0.76) 48%, rgba(8,8,10,0.28) 100%), url(${featuredBackdrop})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.2),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-end p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.34em] text-[var(--color-brand-strong)]">Movie spotlight</p>
            <h2 className="display-font mt-3 max-w-2xl text-4xl leading-none text-white sm:text-5xl">
              {featured?.title ?? "The film night starts here."}
            </h2>
            {featured ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)] sm:text-sm">
                {featured.releaseDate ? <span>{formatYear(featured.releaseDate)}</span> : null}
                {featured.voteAverage ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/35" />
                    <span>{formatRating(featured.voteAverage)}</span>
                  </>
                ) : null}
                {featured.genreNames.slice(0, 2).map((genre) => (
                  <span key={genre} className="rounded-full border border-white/12 px-3 py-1">
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
              {featured?.overview || "A cleaner film catalog with stronger artwork, better category entry points, and less noise between you and the next watch."}
            </p>
            {featured ? (
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/${featured.mediaType}/${featured.id}/watch`}
                  className="theme-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold"
                >
                  <Play size={16} fill="currentColor" />
                  Watch now
                </Link>
                <Link
                  href={`/${featured.mediaType}/${featured.id}`}
                  className="theme-button-secondary inline-flex rounded-full px-5 py-3 text-sm text-white"
                >
                  View details
                </Link>
              </div>
            ) : null}
          </div>
        </article>

        <div className="grid gap-4">
          <section className="surface-strong rounded-[30px] p-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Browse modes</p>
            <h2 className="display-font mt-3 text-3xl text-white">Pick the lane you want first.</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {MOVIE_SORT_OPTIONS.map((option) => (
                <Link
                  key={option.key}
                  href={buildBrowseHref({ genreId, sort: option.key })}
                  className={cn(
                    "theme-nav-link rounded-full px-4 py-2 text-sm",
                    activeSort.key === option.key && "theme-nav-link-active",
                  )}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
              {activeGenreLabel
                ? `${activeGenreLabel} movies sorted by ${activeSort.label.toLowerCase()}.`
                : `All movies sorted by ${activeSort.label.toLowerCase()}.`}
            </p>
          </section>

          <section className="surface rounded-[30px] p-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Genres</p>
            <h2 className="display-font mt-3 text-3xl text-white">Jump straight into a mood.</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={buildBrowseHref({ sort: activeSort.key })}
                className={cn("theme-nav-link rounded-full px-4 py-2 text-sm", !genreId && "theme-nav-link-active")}
              >
                All movies
              </Link>
              {genreOptions.map((genre) => (
                <Link
                  key={genre.id}
                  href={buildBrowseHref({ genreId: genre.id, sort: activeSort.key })}
                  className={cn("theme-nav-link rounded-full px-4 py-2 text-sm", genreId === genre.id && "theme-nav-link-active")}
                >
                  {genre.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
              The main page no longer doubles as a giant movie shelf, so this is where the fuller film discovery flow lives.
            </p>
          </section>
        </div>
      </section>
      {rails.map((rail) => (
        <MediaRail
          key={rail.id}
          rail={rail}
          profileId={viewer.activeProfile?.id ?? null}
          watchlistKeys={watchlistKeys}
        />
      ))}
    </PageFrame>
  );
}
