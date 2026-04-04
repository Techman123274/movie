import Link from "next/link";
import { Film, PlayCircle, Tv, Trophy } from "lucide-react";
import { CinematicGallery } from "@/components/cinematic-gallery";
import { MarketingHeader } from "@/components/marketing-header";
import { SocialShowcase } from "@/components/social-showcase";
import type { MediaSummary } from "@/lib/types";

type LandingPageProps = {
  featuredItems: MediaSummary[];
};

export function LandingPage({ featuredItems }: LandingPageProps) {
  return (
    <div className="page-shell">
      <MarketingHeader />
      <main className="relative overflow-hidden">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="animate-[fade-rise_800ms_ease-out]">
              <p className="mb-4 text-xs uppercase tracking-[0.36em] text-[var(--color-brand-strong)]">
                Subflix
              </p>
              <h1 className="display-font text-5xl leading-none text-white sm:text-7xl lg:text-8xl">
                One cinematic front door for tonight&apos;s watchlist and the people picking it.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-muted)] sm:mt-6 sm:text-lg sm:leading-8">
                Subflix brings movies, series, and live sports into one polished streaming experience with faster discovery, richer details, a more social household pulse, and a cleaner way to press play.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/browse" className="theme-button-primary rounded-full px-6 py-3 text-center text-sm font-semibold">
                  Browse now
                </Link>
                <Link href="/sports" className="theme-button-secondary rounded-full px-6 py-3 text-center text-sm text-white">
                  Explore sports
                </Link>
              </div>
            </div>
            <CinematicGallery
              items={featuredItems}
              eyebrow="Featured artwork"
              title="The catalog should feel premium before a single click."
              description="A stronger visual lead, richer artwork, and sharper presentation make the experience feel premium from the first moment."
            />
          </div>
        </section>

        <SocialShowcase />

        <section className="mx-auto max-w-7xl px-4 py-2 sm:px-8 sm:py-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: Film, title: "Movies", copy: "Hero sliders, rich detail pages, and premium discovery rails." },
              { icon: Tv, title: "Series", copy: "Follow season arcs, episode guides, and beautifully organized watch pages." },
              { icon: Trophy, title: "Sports", copy: "Dedicated league hubs and live-event discovery keep the action separate and easy to follow." },
              { icon: PlayCircle, title: "Social Discovery", copy: "Profiles, reactions, and shared queue energy help groups land on the right title faster." },
            ].map((item, index) => (
              <article
                key={item.title}
                className="surface animate-[fade-rise_700ms_ease-out] rounded-[28px] p-6"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <item.icon className="mb-4 text-[var(--color-brand-strong)]" size={28} />
                <h2 className="display-font text-3xl text-white">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              "A cinematic homepage built to help you choose faster.",
              "Clear paths into movies, series, and the services you already use.",
              "Separate sports surfaces so movies and live events always feel intentional.",
            ].map((item) => (
              <div key={item} className="surface rounded-[26px] p-6 text-sm leading-7 text-[var(--color-text-muted)]">
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
