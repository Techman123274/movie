import type { ReactNode } from "react";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHero({ eyebrow, title, description, actions }: PageHeroProps) {
  return (
    <section className="surface-strong rounded-[34px] p-6 sm:p-8">
      <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">{eyebrow}</p>
      <h1 className="display-font text-4xl text-white sm:text-5xl">{title}</h1>
      {description ? (
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{description}</p>
      ) : null}
      {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
