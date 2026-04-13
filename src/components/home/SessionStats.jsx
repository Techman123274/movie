import { useMemo } from "react";
import { Clock3, Sparkles, Users } from "lucide-react";
import { useAppTheme } from "@/lib/theme";

const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;
const NEW_RELEASE_WINDOW_DAYS = 45;

const formatStat = (value, suffix) => {
  if (!value) {
    return `0${suffix ? ` ${suffix}` : ""}`;
  }

  return `${value}${suffix ? ` ${suffix}` : ""}`;
};

/**
 * @param {{ historyEntries?: Array<Record<string, any>>, myList?: Array<Record<string, any>>, friendActivityItems?: Array<Record<string, any>> }} props
 */
export default function SessionStats({ historyEntries = [], myList = [], friendActivityItems = [] }) {
  const { themeDefinition } = useAppTheme();
  const isHulu = themeDefinition.shellVariant === "hulu";

  const stats = useMemo(() => {
    const cutoff = Date.now() - WEEK_IN_MS;
    const latestByTitle = new Map();

    historyEntries.forEach((entry) => {
      const key = `${entry.media_type || "movie"}:${entry.tmdb_id || entry.id}`;
      const previous = latestByTitle.get(key);
      if (!previous || String(entry.updated_at || "").localeCompare(String(previous.updated_at || "")) > 0) {
        latestByTitle.set(key, entry);
      }
    });

    const minutesWatched = Math.round(
      [...latestByTitle.values()]
        .filter((entry) => {
          const updatedAt = new Date(entry.updated_at || entry.updated_date || 0).getTime();
          return Number.isFinite(updatedAt) && updatedAt >= cutoff;
        })
        .reduce((total, entry) => total + Number(entry.progress_seconds || 0), 0) / 60
    );

    const releaseCutoff = new Date();
    releaseCutoff.setDate(releaseCutoff.getDate() - NEW_RELEASE_WINDOW_DAYS);
    const newDrops = myList.filter((entry) => {
      if (!entry?.release_date) {
        return false;
      }
      const releaseDate = new Date(entry.release_date);
      return !Number.isNaN(releaseDate.getTime()) && releaseDate >= releaseCutoff;
    }).length;

    const activeFriends = new Set(
      friendActivityItems.flatMap((entry) => entry.social_actor_names || []).filter(Boolean)
    ).size;

    return {
      minutesWatched,
      newDrops,
      activeFriends,
    };
  }, [friendActivityItems, historyEntries, myList]);

  const statCards = [
    {
      id: "minutes",
      label: "Minutes watched this week",
      value: formatStat(stats.minutesWatched, "min"),
      icon: Clock3,
      helper: stats.minutesWatched > 0 ? "Pulled from your recent playback history." : "Your weekly playback tally will show up here.",
    },
    {
      id: "drops",
      label: "New drops in My List",
      value: formatStat(stats.newDrops),
      icon: Sparkles,
      helper: stats.newDrops > 0 ? "Fresh releases already saved in your queue." : "Add a recent release to My List to track it here.",
    },
    {
      id: "friends",
      label: "Friends active",
      value: formatStat(stats.activeFriends),
      icon: Users,
      helper: stats.activeFriends > 0 ? "Friends with fresh activity across your social feed." : "Friend activity will appear once your circle starts watching.",
    },
  ];

  return (
    <section className={`relative z-20 mx-auto max-w-7xl px-4 ${isHulu ? "-mt-6 pb-6 md:px-12" : "-mt-10 pb-6 md:px-12"}`}>
      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="flex flex-col gap-2 border-b border-white/8 px-5 py-4 md:flex-row md:items-end md:justify-between md:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand)]">Session Snapshot</p>
            <h2 className="mt-2 text-xl font-semibold text-white md:text-2xl">Your evening at a glance</h2>
          </div>
          <p className="max-w-xl text-sm text-white/58">
            A quick read on watch progress, fresh saves, and who&apos;s active in your orbit.
          </p>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-3 md:p-5">
          {statCards.map(({ id, label, value, icon: Icon, helper }) => (
            <div
              key={id}
              className={`rounded-[24px] border border-white/8 px-4 py-4 ${
                isHulu
                  ? "bg-[linear-gradient(180deg,rgba(9,20,15,0.92)_0%,rgba(9,20,15,0.58)_100%)]"
                  : "bg-[linear-gradient(180deg,rgba(24,24,24,0.95)_0%,rgba(12,12,12,0.7)_100%)]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white/72">{label}</p>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-[var(--brand)]">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-black tracking-tight text-white">{value}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/52">{helper}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
