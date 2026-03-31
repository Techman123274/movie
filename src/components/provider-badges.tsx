import Image from "next/image";
import { getImageUrl } from "@/lib/tmdb";
import type { TitleProviderAvailability } from "@/lib/types";

const GROUP_LABELS: Record<TitleProviderAvailability["groups"][number]["label"], string> = {
  stream: "Stream Now",
  free: "Free To Watch",
  ads: "With Ads",
  rent: "Rent",
  buy: "Buy",
};

type ProviderBadgesProps = {
  providers?: TitleProviderAvailability;
};

export function ProviderBadges({ providers }: ProviderBadgesProps) {
  if (!providers?.groups.length) {
    return (
      <section className="surface rounded-[28px] p-6">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">
          Provider availability
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          No provider data is available for the selected region right now.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">
          Available in {providers.region}
        </p>
        <h2 className="display-font text-3xl text-white">Where To Watch</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {providers.groups.map((group) => (
          <div
            key={group.label}
            className={`${group.label === "stream" ? "surface-strong lg:col-span-2" : "surface"} rounded-[24px] p-5`}
          >
            <p className="mb-4 text-xs uppercase tracking-[0.26em] text-[var(--color-text-muted)]">
              {GROUP_LABELS[group.label]}
            </p>
            <div className="flex flex-wrap gap-3">
              {group.providers.map((provider) => {
                const logo = getImageUrl(provider.logoPath, "w342");

                return (
                  <div
                    key={`${group.label}-${provider.providerId}`}
                    className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                  >
                    <div className="flex items-center gap-2">
                      {logo ? (
                        <Image
                          src={logo}
                          alt={provider.name}
                          width={20}
                          height={20}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : null}
                      <span>{provider.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
