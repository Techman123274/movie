import Link from "next/link";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getSportsHomeData } from "@/lib/sports";

export default async function SportsPage() {
  const groups = await getSportsHomeData();

  if (!groups) {
    return (
      <PageFrame activeHref="/sports">
        <UnavailablePanel
          title="Sports discovery is unavailable."
          message="Sports events are loaded from a separate live source and linked into StreamCenter watch pages. Try again in a moment."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/sports">
      <PageHero
        eyebrow="Sports"
        title="Live league hubs with direct StreamCenter watch paths."
        description="Sports stays separate from movies and series. Pick a league, browse today's events, and open the dedicated watch flow."
      />

      <div className="grid gap-6">
        {groups.map((group, groupIndex) => (
          <section
            key={group.league}
            className="animate-[fade-rise_700ms_ease-out] space-y-4"
            style={{ animationDelay: `${groupIndex * 100}ms` }}
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[var(--color-brand-strong)]">{group.league}</p>
                <h2 className="display-font text-4xl text-white">{group.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">{group.description}</p>
              </div>
              <Link href={`/sports/${group.league}`} className="text-sm text-[var(--color-brand-strong)]">
                Open league
              </Link>
            </div>
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {group.events.map((event) => (
                <Link
                  key={event.id}
                  href={`/sports/${group.league}/${event.id}`}
                  className="surface rounded-[28px] p-5 transition hover:-translate-y-1 hover:border-[rgba(214,179,109,0.35)]"
                >
                  <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-brand-strong)]">{event.status}</p>
                  <h3 className="mt-3 text-xl font-medium text-white">{event.subtitle}</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-muted)]">{new Date(event.startTime).toLocaleString()}</p>
                  <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
                    {event.venue || event.competitors.join(" vs ")}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageFrame>
  );
}
