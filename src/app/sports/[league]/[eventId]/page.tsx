import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/page-frame";
import { PageHero } from "@/components/page-hero";
import { RouteLinkRow } from "@/components/route-link-row";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getSportsLeagueData } from "@/lib/sports";
import type { SportsLeague } from "@/lib/types";

type SportsEventPageProps = {
  params: Promise<{
    league: string;
    eventId: string;
  }>;
};

export default async function SportsEventPage({ params }: SportsEventPageProps) {
  const { league, eventId } = await params;

  if (!["nfl", "nba", "mlb", "nhl", "epl"].includes(league)) {
    notFound();
  }

  const group = await getSportsLeagueData(league as SportsLeague);

  if (!group) {
    return (
      <PageFrame activeHref="/sports">
        <UnavailablePanel
          title="Sports watch page is unavailable."
          message="The live sports feed could not be loaded, so the event watch surface cannot be built right now."
        />
      </PageFrame>
    );
  }

  const event = group.events.find((entry) => entry.id === eventId);

  if (!event) {
    notFound();
  }

  return (
    <PageFrame activeHref="/sports">
      <PageHero
        eyebrow={`${group.title} watch`}
        title={event.subtitle}
        description={`${event.status} • ${new Date(event.startTime).toLocaleString()}${event.venue ? ` • ${event.venue}` : ""}`}
      />
      <RouteLinkRow
        items={[
          { href: "/sports", label: "All Sports" },
          { href: `/sports/${group.league}`, label: "Back to League" },
        ]}
      />

      <section className="surface rounded-[30px] p-8">
        <h2 className="mb-4 text-2xl font-medium text-white">Open in StreamCenter</h2>
        <p className="max-w-3xl text-sm leading-7 text-[var(--color-text-muted)]">
          Sports watch pages are intentionally kept separate from movie playback. This page routes you to StreamCenter
          for the live watch destination while preserving league and event context inside Subflix.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={group.streamcenterUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-[var(--color-brand)] px-6 py-3 text-sm font-semibold text-[#07111f]"
          >
            Open StreamCenter
          </a>
          <Link href={`/sports/${group.league}`} className="surface rounded-full px-6 py-3 text-sm text-white">
            Back to league
          </Link>
        </div>
      </section>
    </PageFrame>
  );
}
