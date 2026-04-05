import Link from "next/link";
import { HeartHandshake, MessageCircleMore, Users } from "lucide-react";

const socialCards = [
  {
    icon: Users,
    eyebrow: "Household lanes",
    title: "Profiles that still feel connected.",
    copy: "Separate tastes stay personal, while Subflix still highlights the movies and shows crossing over between your crew.",
  },
  {
    icon: HeartHandshake,
    eyebrow: "Shared queue",
    title: "Build momentum around what everyone is saving.",
    copy: "Watchlists, recent picks, and favorites become a softer social signal so movie night starts faster.",
  },
  {
    icon: MessageCircleMore,
    eyebrow: "Reaction-ready",
    title: "Taste signals shape the room.",
    copy: "Quick reactions and recent activity help the home screen surface better picks for the people actually watching.",
  },
];

export function SocialShowcase() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-2 sm:px-8 sm:py-4">
      <div className="grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
        <div className="surface-strong rounded-[30px] p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">Social viewing</p>
          <h2 className="display-font mt-4 max-w-3xl text-4xl text-white sm:text-5xl">
            Premium streaming, but with a pulse from the people watching.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">
            Subflix leans into the social side of the living room with shared queues, profile energy, and a more communal way to land on tonight&apos;s pick without losing that premium streaming feel.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Shared watch nights", value: "Built in" },
              { label: "Reaction-led curation", value: "Profile aware" },
              { label: "Crew-ready discovery", value: "Always on" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">{stat.label}</p>
                <p className="mt-3 text-xl text-white">{stat.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/profiles"
              className="theme-button-primary rounded-full px-5 py-3 text-sm font-semibold"
            >
              Explore profiles
            </Link>
            <Link href="/account" className="theme-button-secondary rounded-full px-5 py-3 text-sm text-white">
              Open My Profile
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {socialCards.map((card) => (
            <article key={card.title} className="surface rounded-[26px] p-5">
              <card.icon className="text-[var(--color-brand-strong)]" size={24} />
              <p className="mt-5 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">{card.eyebrow}</p>
              <h3 className="display-font mt-3 text-3xl text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">{card.copy}</p>
            </article>
          ))}
          <article className="surface rounded-[26px] p-5 sm:col-span-2">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Why it matters</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--color-text-muted)]">
              The catalog still feels curated and cinematic, but the discovery layer now acknowledges that choosing what to watch is often a group decision. That balance is where the premium feel really lands.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
