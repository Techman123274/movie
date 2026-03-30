import Link from "next/link";
import { Film, PlayCircle, Tv, Trophy } from "lucide-react";
import { MarketingHeader } from "@/components/marketing-header";

export function LandingPage() {
  return (
    <div className="page-shell">
      <MarketingHeader />
      <main className="relative overflow-hidden">
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-[fade-rise_800ms_ease-out]">
              <p className="mb-4 text-xs uppercase tracking-[0.36em] text-[var(--color-brand-strong)]">
                Stream movies, series, and sports
              </p>
              <h1 className="display-font text-5xl leading-none text-white sm:text-7xl lg:text-8xl">
                One cinematic front door for tonight&apos;s watchlist.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-text-muted)] sm:mt-6 sm:text-lg sm:leading-8">
                Discover premium movies and series with TMDB-powered browsing, then jump into a dedicated sports experience for live matchdays and league nights.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/browse" className="rounded-full bg-[var(--color-brand)] px-6 py-3 text-center text-sm font-semibold text-[#07111f]">
                  Browse now
                </Link>
                <Link href="/sports" className="surface rounded-full px-6 py-3 text-center text-sm text-white transition hover:bg-white/10">
                  Explore sports
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: Film, title: "Movies", copy: "Hero sliders, rich detail pages, and premium discovery rails." },
                { icon: Tv, title: "Series", copy: "Follow season arcs, episode lists, and provider availability." },
                { icon: Trophy, title: "Sports", copy: "Dedicated league hubs, live event cards, and StreamCenter watch access." },
                { icon: PlayCircle, title: "Ad-Gated Playback", copy: "External players stay behind explicit validation controls." },
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
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Slideshows for featured movies and shows instead of a single hero card.",
              "Provider-specific discovery for Netflix, Hulu, Prime Video, Max, and more.",
              "Separate sports watch surfaces so movies and live games never feel mashed together.",
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
