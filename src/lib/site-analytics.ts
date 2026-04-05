import { promises as fs } from "node:fs";
import path from "node:path";
import { connection } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

type SiteAnalyticsState = {
  totalVisits: number;
  signedInVisits: number;
  guestVisits: number;
  lastVisitAt: string;
  routeViews: Record<string, number>;
  dailyViews: Record<string, number>;
};

type RecordSiteVisitOptions = {
  path: string;
  signedIn: boolean;
};

type CountedStat = {
  label: string;
  value: number | null;
};

export type SiteAnalyticsSummary = {
  totals: {
    totalVisits: number;
    signedInVisits: number;
    guestVisits: number;
    todayVisits: number;
    accountsMade: number | null;
    profilesCreated: number | null;
    watchEvents: number | null;
    savedTitles: number | null;
  };
  routeViews: Array<{ path: string; count: number }>;
  dailyViews: Array<{ date: string; count: number }>;
  countedStats: CountedStat[];
};

const SITE_ANALYTICS_PATH = path.join(process.cwd(), "data", "site-analytics.json");

const DEFAULT_SITE_ANALYTICS_STATE: SiteAnalyticsState = {
  totalVisits: 0,
  signedInVisits: 0,
  guestVisits: 0,
  lastVisitAt: new Date(0).toISOString(),
  routeViews: {},
  dailyViews: {},
};

function normalizePath(value: string) {
  if (!value.trim()) {
    return "/";
  }

  const normalized = value.startsWith("/") ? value : `/${value}`;
  return normalized.length > 1 ? normalized.replace(/\/+$/, "") : normalized;
}

async function ensureSiteAnalyticsFile() {
  await fs.mkdir(path.dirname(SITE_ANALYTICS_PATH), { recursive: true });

  try {
    await fs.access(SITE_ANALYTICS_PATH);
  } catch {
    await fs.writeFile(SITE_ANALYTICS_PATH, `${JSON.stringify(DEFAULT_SITE_ANALYTICS_STATE, null, 2)}\n`, "utf8");
  }
}

async function readSiteAnalyticsStateFromDisk(): Promise<SiteAnalyticsState> {
  await ensureSiteAnalyticsFile();

  try {
    const raw = await fs.readFile(SITE_ANALYTICS_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteAnalyticsState>;

    return {
      totalVisits: typeof parsed.totalVisits === "number" ? parsed.totalVisits : 0,
      signedInVisits: typeof parsed.signedInVisits === "number" ? parsed.signedInVisits : 0,
      guestVisits: typeof parsed.guestVisits === "number" ? parsed.guestVisits : 0,
      lastVisitAt: parsed.lastVisitAt || DEFAULT_SITE_ANALYTICS_STATE.lastVisitAt,
      routeViews: parsed.routeViews ?? {},
      dailyViews: parsed.dailyViews ?? {},
    };
  } catch {
    return DEFAULT_SITE_ANALYTICS_STATE;
  }
}

async function writeSiteAnalyticsState(state: SiteAnalyticsState) {
  await ensureSiteAnalyticsFile();
  await fs.writeFile(SITE_ANALYTICS_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function getTableCount(table: string) {
  const client = getSupabaseAdminClient();

  if (!client) {
    return null;
  }

  const { count, error } = await client.from(table).select("*", { count: "exact", head: true });

  if (error) {
    return null;
  }

  return count ?? 0;
}

export async function recordSiteVisit({ path: pathname, signedIn }: RecordSiteVisitOptions) {
  const state = await readSiteAnalyticsStateFromDisk();
  const path = normalizePath(pathname);
  const currentDate = new Date().toISOString().slice(0, 10);

  const nextState: SiteAnalyticsState = {
    ...state,
    totalVisits: state.totalVisits + 1,
    signedInVisits: state.signedInVisits + (signedIn ? 1 : 0),
    guestVisits: state.guestVisits + (signedIn ? 0 : 1),
    lastVisitAt: new Date().toISOString(),
    routeViews: {
      ...state.routeViews,
      [path]: (state.routeViews[path] ?? 0) + 1,
    },
    dailyViews: {
      ...state.dailyViews,
      [currentDate]: (state.dailyViews[currentDate] ?? 0) + 1,
    },
  };

  await writeSiteAnalyticsState(nextState);
  return nextState;
}

export async function getSiteAnalyticsSummary(): Promise<SiteAnalyticsSummary> {
  await connection();

  const [state, accountsMade, profilesCreated, watchEvents, savedTitles] = await Promise.all([
    readSiteAnalyticsStateFromDisk(),
    getTableCount("users"),
    getTableCount("profiles"),
    getTableCount("watch_history"),
    getTableCount("watchlists"),
  ]);

  const routeViews = Object.entries(state.routeViews)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([path, count]) => ({ path, count }));

  const dailyViews = Object.entries(state.dailyViews)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, count]) => ({ date, count }));

  return {
    totals: {
      totalVisits: state.totalVisits,
      signedInVisits: state.signedInVisits,
      guestVisits: state.guestVisits,
      todayVisits: state.dailyViews[new Date().toISOString().slice(0, 10)] ?? 0,
      accountsMade,
      profilesCreated,
      watchEvents,
      savedTitles,
    },
    routeViews,
    dailyViews,
    countedStats: [
      { label: "Accounts made", value: accountsMade },
      { label: "Profiles created", value: profilesCreated },
      { label: "Watch events", value: watchEvents },
      { label: "Saved titles", value: savedTitles },
    ],
  };
}
