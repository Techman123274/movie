import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/tmdb";
import { getProviderPresentation } from "@/lib/provider-branding";
import type { ProviderRail } from "@/lib/types";
import { cn } from "@/lib/utils";

type ProviderRailListProps = {
  rails: ProviderRail[];
};

export function ProviderRailList({ rails }: ProviderRailListProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {rails.map((rail) => {
        const presentation = getProviderPresentation(rail.provider.name);
        const logo = getImageUrl(rail.provider.logoPath, "w342");
        const moviesCount = rail.items.filter((item) => item.mediaType === "movie").length;
        const seriesCount = rail.items.filter((item) => item.mediaType === "tv").length;

        return (
          <Link
            key={rail.id}
            href={`/providers/${rail.provider.providerId}`}
            className={cn(
              "group relative overflow-hidden rounded-[30px] border border-white/10 p-5 transition duration-300 hover:-translate-y-1 hover:border-white/18",
            )}
            style={{ backgroundImage: presentation.gradient }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100"
              style={{
                background: `radial-gradient(circle at top right, ${presentation.glow}, transparent 36%)`,
              }}
            />
            <div className="relative flex h-full min-h-[250px] flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/60">Streaming service</p>
                  {logo ? (
                    <div className="relative mt-4 h-10 w-36">
                      <Image src={logo} alt={rail.provider.name} fill sizes="144px" className="object-contain object-left" />
                    </div>
                  ) : (
                    <h2 className="display-font mt-3 text-4xl text-white">{presentation.label}</h2>
                  )}
                </div>
                <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/76">
                  Open
                </span>
              </div>

              <p className="mt-5 max-w-xs text-sm leading-6 text-white/76">{presentation.tagline}</p>

              <div className="mt-5 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-white/64">
                <span className="rounded-full border border-white/12 px-3 py-1">{rail.region}</span>
                <span className="rounded-full border border-white/12 px-3 py-1">{moviesCount} movies</span>
                <span className="rounded-full border border-white/12 px-3 py-1">{seriesCount} series</span>
              </div>

              <div className="mt-auto pt-6">
                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-white/54">Inside this lane</p>
                  <p className="mt-2 text-sm leading-6 text-white/74">
                    Open {presentation.label} for a fuller list of titles instead of stacking the catalog on this page.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-white">
                  <span>Browse {presentation.label}</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
