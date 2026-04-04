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
  }>;
};

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const viewer = await getViewerContext({ redirectToOnboarding: true });
  const params = await searchParams;
  const genreId = parsePositiveInt(params.genre);
  const genreOptions = getGenreOptions("movie");
  const [rails, watchlist] = await withMinimumDelay(
    Promise.all([
      getCatalogRail("movie", {
        genreId,
      }),
      viewer.activeProfile ? getWatchlist(viewer.activeProfile.id) : Promise.resolve([]),
    ]),
  );
  const watchlistKeys = watchlist.map((record) => buildMediaKey(record.mediaType, record.mediaId));
  const activeGenreLabel = genreOptions.find((genre) => genre.id === genreId)?.label ?? null;
  const featured = rails?.find((rail) => rail.items.length)?.items[0] ?? null;
  const featuredBackdrop = getImageUrl(featured?.backdropPath ?? null, "w1280");

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
        title="Movies built like a premium catalog, not a crowded grid."
        description="Drop straight into the biggest film picks, sharpen the collection by genre, and keep the page focused on what actually looks worth pressing play on."
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
            <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Browse filters</p>
            <h2 className="display-font mt-3 text-3xl text-white">Quick ways into the catalog.</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/movies"
                className={cn("theme-nav-link rounded-full px-4 py-2 text-sm", !genreId && "theme-nav-link-active")}
              >
                All movies
              </Link>
              {genreOptions.slice(0, 8).map((genre) => (
                <Link
                  key={genre.id}
                  href={`/movies?genre=${genre.id}`}
                  className={cn("theme-nav-link rounded-full px-4 py-2 text-sm", genreId === genre.id && "theme-nav-link-active")}
                >
                  {genre.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="surface rounded-[30px] p-6">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">Catalog pulse</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Active filter</p>
                <p className="mt-2 text-xl text-white">{activeGenreLabel ?? "Everything"}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Curated rails</p>
                <p className="mt-2 text-xl text-white">{rails.length}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
              Movies stays focused on discovery, while search and profile tools already live in the header where they are easier to reach.
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
