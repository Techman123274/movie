import { env } from "@/lib/env";
import type { SportsEvent, SportsLeague, SportsLeagueGroup } from "@/lib/types";

const leagueConfig: Record<
  SportsLeague,
  {
    title: string;
    description: string;
    path: string;
    sport: string;
  }
> = {
  nfl: {
    title: "NFL",
    description: "Live pro football matchups and kickoff windows.",
    path: "football/nfl/scoreboard",
    sport: "football",
  },
  nba: {
    title: "NBA",
    description: "Tonight's basketball slate, from tipoff to final buzzer.",
    path: "basketball/nba/scoreboard",
    sport: "basketball",
  },
  mlb: {
    title: "MLB",
    description: "Daily baseball games and series momentum.",
    path: "baseball/mlb/scoreboard",
    sport: "baseball",
  },
  nhl: {
    title: "NHL",
    description: "Ice hockey matchups and puck-drop coverage.",
    path: "hockey/nhl/scoreboard",
    sport: "hockey",
  },
  epl: {
    title: "Premier League",
    description: "Top-flight football fixtures and matchday drama.",
    path: "soccer/eng.1/scoreboard",
    sport: "soccer",
  },
};

function parseEvent(league: SportsLeague, event: Record<string, unknown>): SportsEvent {
  const competitions = (event.competitions as Record<string, unknown>[] | undefined) ?? [];
  const competition = competitions[0] ?? {};
  const competitors = ((competition.competitors as Record<string, unknown>[] | undefined) ?? []).map((item) =>
    String((item.team as Record<string, unknown> | undefined)?.displayName || "Unknown"),
  );
  const venue = (competition.venue as Record<string, unknown> | undefined)?.fullName;

  return {
    id: String(event.id),
    league,
    title: String(event.name || competitors.join(" vs ")),
    subtitle: String(event.shortName || competitors.join(" vs ")),
    startTime: String(event.date || new Date().toISOString()),
    status: String(
      ((event.status as Record<string, unknown> | undefined)?.type as Record<string, unknown> | undefined)
        ?.description || "Scheduled",
    ),
    venue: venue ? String(venue) : undefined,
    competitors,
  };
}

async function fetchEspnLeague(league: SportsLeague): Promise<SportsLeagueGroup> {
  const config = leagueConfig[league];
  const url = `https://site.api.espn.com/apis/site/v2/sports/${config.path}`;
  const response = await fetch(url, { next: { revalidate: 300 } });

  if (!response.ok) {
    throw new Error(`Sports request failed: ${response.status}`);
  }

  const data = (await response.json()) as { events?: Record<string, unknown>[] };
  const events = (data.events ?? []).slice(0, 8).map((event) => parseEvent(league, event));

  return {
    league,
    title: config.title,
    description: config.description,
    streamcenterUrl: `${env.sports.streamcenterBaseUrl}?sport=${config.sport}`,
    events,
  };
}

export async function getSportsHomeData(): Promise<SportsLeagueGroup[] | null> {
  try {
    const groups = await Promise.all(
      (Object.keys(leagueConfig) as SportsLeague[]).map((league) => fetchEspnLeague(league)),
    );
    return groups;
  } catch {
    return null;
  }
}

export async function getSportsLeagueData(league: SportsLeague): Promise<SportsLeagueGroup | null> {
  try {
    return await fetchEspnLeague(league);
  } catch {
    return null;
  }
}
