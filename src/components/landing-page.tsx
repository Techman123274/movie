import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Film, PlayCircle, Tv, Trophy } from "lucide-react";
import { CinematicGallery } from "@/components/cinematic-gallery";
import { MarketingHeader } from "@/components/marketing-header";
import { SiteMaintenanceScreen } from "@/components/site-maintenance-screen";
import { SocialShowcase } from "@/components/social-showcase";
import { recordSiteVisit } from "@/lib/site-analytics";
import { getAdminContext, getSiteControlState } from "@/lib/site-control";
import type { MediaSummary } from "@/lib/types";

type LandingPageProps = {
  featuredItems: MediaSummary[];
};

export async function LandingPage({ featuredItems }: LandingPageProps) {
  const [siteControl, { userId }] = await Promise.all([getSiteControlState(), auth()]);
  await recordSiteVisit({ path: "/", signedIn: Boolean(userId) });

  if (siteControl.maintenanceMode) {
    const admin = await getAdminContext();

    return (
      <SiteMaintenanceScreen
        message={siteControl.maintenanceMessage}
        updatedAt={siteControl.updatedAt}
        showAdminLink={admin.isAdmin}
      />
    );
  }

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
                Subflix brings movies, series, live sports, and provider discovery into one sleek streaming home built to get you from browsing to pressing play faster.
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
              title="A premium catalog wall from the very first frame."
              description="Hero artwork, sharper presentation, and bolder spotlighting make the whole service feel ready for prime time before you even open a title."
            />
          </div>
        </section>

        <SocialShowcase />

        <section className="mx-auto max-w-7xl px-4 py-2 sm:px-8 sm:py-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: Film, title: "Movies", copy: "Bigger spotlights, cleaner filters, and stronger rails keep film night feeling premium." },
              { icon: Tv, title: "Series", copy: "Episode guides, binge-ready shelves, and a smoother path back into your next season." },
              { icon: Trophy, title: "Sports", copy: "Dedicated sports surfaces keep live matchups fast to find without crowding the catalog." },
              { icon: PlayCircle, title: "Profiles", copy: "Personal picks, saved titles, and return-to-watch momentum shape the service around each viewer." },
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
              "A cinematic homepage tuned for faster yes-or-no decisions.",
              "Cleaner paths into movies, series, providers, and the next thing worth watching.",
              "A sharper streaming shell that keeps discovery polished on desktop and mobile.",
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
