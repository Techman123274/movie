import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { MediaCard } from "@/components/media-card";
import { getProviderPresentation } from "@/lib/provider-branding";
import { getImageUrl } from "@/lib/tmdb";
import type { MediaSummary, ProviderCatalog as ProviderCatalogData } from "@/lib/types";

type ProviderCatalogProps = {
  catalog: ProviderCatalogData;
  profileId?: string | null;
  watchlistKeys?: string[];
};

type ProviderSection = {
  key: "movies" | "series";
  eyebrow: string;
  title: string;
  description: string;
  items: MediaSummary[];
};

export function ProviderCatalog({ catalog, profileId = null, watchlistKeys = [] }: ProviderCatalogProps) {
  const presentation = getProviderPresentation(catalog.provider.name);
  const providerLogo = getImageUrl(catalog.provider.logoPath, "w342");
  const featured = catalog.movies[0] ?? catalog.series[0] ?? null;
  const featuredBackdrop = getImageUrl(featured?.backdropPath ?? featured?.posterPath ?? null, "w1280");
  const sections = [
    {
      key: "movies",
      eyebrow: "Movie lineup",
      title: `${presentation.label} movies`,
      description: `The fuller movie list currently surfacing under ${presentation.label}.`,
      items: catalog.movies,
    },
    {
      key: "series",
      eyebrow: "Series lineup",
      title: `${presentation.label} series`,
      description: `The fuller show list currently surfacing under ${presentation.label}.`,
      items: catalog.series,
    },
  ] satisfies ProviderSection[];
  const populatedSections = sections.filter((section) => section.items.length > 0);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <article
          className="relative min-h-[360px] overflow-hidden rounded-[32px] border border-white/10 shadow-[0_26px_80px_rgba(0,0,0,0.44)]"
          style={{
            backgroundImage: featuredBackdrop
              ? `linear-gradient(90deg, rgba(8,8,10,0.95) 0%, rgba(8,8,10,0.8) 42%, rgba(8,8,10,0.3) 100%), url(${featuredBackdrop})`
              : presentation.gradient,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(circle at top left, ${presentation.glow}, transparent 32%)` }}
          />
          <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
            <div className="flex flex-wrap gap-3">
              <Link href="/providers" className="theme-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white">
                <ArrowLeft size={16} />
                All providers
              </Link>
              {featured ? (
                <Link
                  href={`/${featured.mediaType}/${featured.id}/watch`}
                  className="theme-button-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                >
                  <Play size={15} fill="currentColor" />
                  Play featured
                </Link>
              ) : null}
            </div>

            <div className="mt-10">
              <p className="text-[10px] uppercase tracking-[0.34em] text-[var(--color-brand-strong)]">Provider spotlight</p>
              {providerLogo ? (
                <div className="relative mt-4 h-12 w-44">
                  <Image src={providerLogo} alt={catalog.provider.name} fill sizes="176px" className="object-contain object-left" />
                </div>
              ) : (
                <h2 className="display-font mt-3 text-5xl text-white">{presentation.label}</h2>
              )}
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/78">{presentation.tagline}</p>
              {featured ? (
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">
                  {featured.overview}
                </p>
              ) : null}
            </div>
          </div>
        </article>

        <section className="surface-strong rounded-[30px] p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Catalog pulse</p>
          <h2 className="display-font mt-3 text-3xl text-white">A dedicated page for this service.</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Region</p>
              <p className="mt-2 text-xl text-white">{catalog.region}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Loaded titles</p>
              <p className="mt-2 text-xl text-white">{catalog.movies.length + catalog.series.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Movies</p>
              <p className="mt-2 text-xl text-white">{catalog.movies.length}</p>
            </div>
            <div className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Series</p>
              <p className="mt-2 text-xl text-white">{catalog.series.length}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
            The provider cards now stay on the landing page, and each service opens its own title library here so the flow feels cleaner.
          </p>
        </section>
      </section>

      {populatedSections.map((section) => (
        <section key={section.key} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.28em] text-[var(--color-brand-strong)]">{section.eyebrow}</p>
              <h2 className="display-font text-3xl text-white">{section.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">{section.description}</p>
            </div>
            <span className="rounded-full border border-white/12 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-white/70">
              {section.items.length} loaded
            </span>
          </div>

          <div className="flex flex-wrap gap-4">
            {section.items.map((item) => (
              <MediaCard
                key={`${section.key}-${item.mediaType}-${item.id}`}
                item={item}
                profileId={profileId}
                inWatchlist={watchlistKeys.includes(`${item.mediaType}-${item.id}`)}
              />
            ))}
          </div>
        </section>
      ))}

      {!populatedSections.length ? (
        <section className="surface rounded-[28px] p-6">
          <p className="text-sm text-[var(--color-text-muted)]">
            No movie or series cards are available for this provider in the selected region right now.
          </p>
        </section>
      ) : null}
    </div>
  );
}
