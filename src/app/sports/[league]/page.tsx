import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/components/page-frame";
import { UnavailablePanel } from "@/components/unavailable-panel";
import { getSportsLeagueData } from "@/lib/sports";
import type { SportsLeague } from "@/lib/types";

type SportsLeaguePageProps = {
  params: Promise<{
    league: string;
  }>;
};

export default async function SportsLeaguePage({ params }: SportsLeaguePageProps) {
  const { league } = await params;

  if (!["nfl", "nba", "mlb", "nhl", "epl"].includes(league)) {
    notFound();
  }

  const group = await getSportsLeagueData(league as SportsLeague);

  if (!group) {
    return (
      <PageFrame activeHref="/sports">
        <UnavailablePanel
          title="League data is unavailable."
          message="This league hub needs the live sports event feed to respond before watch cards can be shown."
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame activeHref="/sports">
      <section className="surface-strong rounded-[34px] p-8">
        <p className="mb-3 text-xs uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">{group.league}</p>
        <h1 className="display-font text-5xl text-white">{group.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--color-text-muted)]">{group.description}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {group.events.map((event) => (
          <Link
            key={event.id}
            href={`/sports/${group.league}/${event.id}`}
            className="surface rounded-[28px] p-5 transition hover:-translate-y-1 hover:border-[rgba(214,179,109,0.35)]"
          >
            <p className="text-xs uppercase tracking-[0.26em] text-[var(--color-brand-strong)]">{event.status}</p>
            <h2 className="mt-3 text-xl font-medium text-white">{event.subtitle}</h2>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">{new Date(event.startTime).toLocaleString()}</p>
            <p className="mt-4 text-sm leading-6 text-[var(--color-text-muted)]">
              {event.venue || event.competitors.join(" vs ")}
            </p>
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}
