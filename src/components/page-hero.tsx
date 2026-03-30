import type { ReactNode } from "react";
import { getImageUrl } from "@/lib/tmdb";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  backdropPath?: string | null;
};

export function PageHero({ eyebrow, title, description, actions, backdropPath }: PageHeroProps) {
  const background = getImageUrl(backdropPath ?? null, "w1280");

  return (
    <section
      className="surface-strong relative overflow-hidden rounded-[34px] p-6 sm:p-8"
      style={
        background
          ? {
              backgroundImage: `linear-gradient(100deg, rgba(4,8,14,0.94) 0%, rgba(4,8,14,0.78) 48%, rgba(4,8,14,0.24) 100%), url(${background})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      {background ? (
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,179,109,0.18),transparent_30%)]" />
      ) : null}
      <div className="relative">
        <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">{eyebrow}</p>
        <h1 className="display-font text-4xl text-white sm:text-5xl">{title}</h1>
        {description ? (
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{description}</p>
        ) : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
