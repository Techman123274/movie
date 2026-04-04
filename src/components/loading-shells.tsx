import type { ReactNode } from "react";
import { PageFrame } from "@/components/page-frame";
import { cn } from "@/lib/utils";

type LoadingIntroVariant =
  | "landing"
  | "browse"
  | "movies"
  | "shows"
  | "search"
  | "account"
  | "profiles"
  | "settings"
  | "providers"
  | "provider"
  | "onboarding"
  | "detail"
  | "watch"
  | "sports"
  | "sportsLeague"
  | "sportsEvent"
  | "auth";

type LoadingIntroConfig = {
  eyebrow: string;
  title: string;
  copy: string;
  status: string;
  chips: string[];
  marquee:
    | "posters"
    | "frames"
    | "episodes"
    | "search"
    | "profiles"
    | "providers"
    | "sports"
    | "spotlight"
    | "auth";
};

const LOADING_INTRO_CONFIG: Record<LoadingIntroVariant, LoadingIntroConfig> = {
  landing: {
    eyebrow: "Opening night",
    title: "SUBFLIX",
    copy: "Loading the cinematic front door with bold picks, polished rails, and a better first impression.",
    status: "Warming up the lobby",
    chips: ["Welcome", "Featured", "Premieres"],
    marquee: "posters",
  },
  browse: {
    eyebrow: "Home feed",
    title: "HOME",
    copy: "Pulling together the fastest yes for tonight with a sharper hero and cleaner rails underneath.",
    status: "Stacking home picks",
    chips: ["Continue", "Trending", "Tonight"],
    marquee: "posters",
  },
  movies: {
    eyebrow: "Catalog focus",
    title: "MOVIES",
    copy: "Spinning up the film catalog with stronger spotlights, bigger posters, and less clutter between picks.",
    status: "Projecting the movie wall",
    chips: ["Cinema", "Franchises", "Critics"],
    marquee: "frames",
  },
  shows: {
    eyebrow: "Binge mode",
    title: "SERIES",
    copy: "Lining up the next binge with episode-ready lanes, cleaner filters, and better show discovery.",
    status: "Cueing the next season",
    chips: ["Episodes", "Binge", "Spotlight"],
    marquee: "episodes",
  },
  search: {
    eyebrow: "Catalog sweep",
    title: "SEARCH",
    copy: "Scanning titles, people, and fast matches so the right result lands without the extra noise.",
    status: "Sweeping the catalog",
    chips: ["Titles", "Cast", "Mood"],
    marquee: "search",
  },
  account: {
    eyebrow: "Your profile",
    title: "PROFILE",
    copy: "Loading saved titles, history, and your household pulse so the personal side feels as polished as the catalog.",
    status: "Syncing your space",
    chips: ["Watchlist", "History", "Pulse"],
    marquee: "profiles",
  },
  profiles: {
    eyebrow: "Household switch",
    title: "PROFILES",
    copy: "Bringing in every household identity with a cleaner handoff between who is watching tonight.",
    status: "Refreshing the lineup",
    chips: ["Household", "Switch", "Sync"],
    marquee: "profiles",
  },
  settings: {
    eyebrow: "Fine tuning",
    title: "SETTINGS",
    copy: "Loading the controls for region, profile behavior, and the small choices that keep the experience feeling right.",
    status: "Dialing in preferences",
    chips: ["Region", "Playback", "Controls"],
    marquee: "profiles",
  },
  providers: {
    eyebrow: "Where to watch",
    title: "PROVIDERS",
    copy: "Lining up streaming services so each one can feel like its own premium destination when it opens.",
    status: "Lighting up services",
    chips: ["Netflix", "Disney+", "Max"],
    marquee: "providers",
  },
  provider: {
    eyebrow: "Service library",
    title: "CHANNEL",
    copy: "Opening the provider catalog with fuller movie and series lists instead of cramming everything on one page.",
    status: "Loading the service shelf",
    chips: ["Movies", "Series", "Library"],
    marquee: "providers",
  },
  onboarding: {
    eyebrow: "First setup",
    title: "SETUP",
    copy: "Building the first profile so region, accent, and saved titles start with a little more personality.",
    status: "Preparing your profile",
    chips: ["Profile", "Region", "Accent"],
    marquee: "profiles",
  },
  detail: {
    eyebrow: "Title view",
    title: "DETAILS",
    copy: "Loading the full title card with cast, trailers, and watch options in a more cinematic frame.",
    status: "Unfolding the title page",
    chips: ["Cast", "Trailers", "Providers"],
    marquee: "spotlight",
  },
  watch: {
    eyebrow: "Playback ready",
    title: "PLAYBACK",
    copy: "Setting the watch room so the player, controls, and next clicks feel fast and dramatic.",
    status: "Bringing up the screen",
    chips: ["Player", "Fullscreen", "Next up"],
    marquee: "spotlight",
  },
  sports: {
    eyebrow: "Game night",
    title: "SPORTS",
    copy: "Loading live lanes, event cards, and a scoreboard-style view that feels built for game time.",
    status: "Filling the arena",
    chips: ["Live", "Scores", "Tonight"],
    marquee: "sports",
  },
  sportsLeague: {
    eyebrow: "League slate",
    title: "LEAGUE",
    copy: "Stacking the latest fixtures and matchups with a cleaner, broadcast-style loading pulse.",
    status: "Posting the schedule",
    chips: ["Fixtures", "Standings", "Matchups"],
    marquee: "sports",
  },
  sportsEvent: {
    eyebrow: "Event page",
    title: "MATCHUP",
    copy: "Loading the event view with the energy of a scoreboard and a cleaner path into the matchup details.",
    status: "Rolling in the matchup",
    chips: ["Kickoff", "Live", "Arena"],
    marquee: "sports",
  },
  auth: {
    eyebrow: "Welcome back",
    title: "WELCOME",
    copy: "Preparing sign in and sign up with a more premium arrival moment instead of a generic wait screen.",
    status: "Opening the front door",
    chips: ["Sign in", "Join", "Start"],
    marquee: "auth",
  },
};

function StreamingLoadingIntro({ variant }: { variant: LoadingIntroVariant }) {
  const config = LOADING_INTRO_CONFIG[variant];

  return (
    <section className={cn("subflix-loader", `subflix-loader--${variant}`)} aria-label={`${config.title} loading screen`}>
      <div className="subflix-loader__ambient" />
      <div className="subflix-loader__grid" />
      <div className="subflix-loader__flare" />
      <div className="subflix-loader__center">
        <div className="subflix-loader__label-row">
          <span className="subflix-loader__brand">Subflix</span>
          <div className="subflix-loader__chips">
            {config.chips.map((chip, index) => (
              <span
                key={`${variant}-chip-${chip}`}
                className={cn("subflix-loader__chip", index === 0 && "subflix-loader__chip--accent")}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
        <div className="subflix-loader__mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="subflix-loader__eyebrow">{config.eyebrow}</p>
        <h1 className="display-font subflix-loader__wordmark">{config.title}</h1>
        <p className="subflix-loader__copy">{config.copy}</p>
        <div className="subflix-loader__status-row">
          <span className="subflix-loader__status-pill">{config.status}</span>
        </div>
        <div className="subflix-loader__progress" aria-hidden="true">
          <span />
        </div>
      </div>
      <div className={cn("subflix-loader__marquee", `subflix-loader__marquee--${config.marquee}`)} aria-hidden="true">
        {Array.from({ length: config.marquee === "profiles" ? 6 : config.marquee === "search" ? 6 : 8 }).map((_, index) => (
          <div key={`loader-poster-${index}`} className="subflix-loader__poster" style={{ animationDelay: `${index * 110}ms` }} />
        ))}
      </div>
    </section>
  );
}

function LoadingScreenFrame({
  children,
  variant = "landing",
}: {
  children: ReactNode;
  variant?: LoadingIntroVariant;
}) {
  return (
    <div className="loading-screen-stack">
      <StreamingLoadingIntro variant={variant} />
      <div className="loading-screen-stack__shell">{children}</div>
    </div>
  );
}

function SkeletonLine({ className }: { className: string }) {
  return <div className={`skeleton-block ${className}`} />;
}

function SkeletonPillRow({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonLine key={`pill-${index}`} className="h-11 w-28 rounded-full" />
      ))}
    </div>
  );
}

function SkeletonRail({
  titleWidth = "w-64",
  detailWidth = "max-w-xl",
  cards = 6,
}: {
  titleWidth?: string;
  detailWidth?: string;
  cards?: number;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <SkeletonLine className="h-3 w-28 rounded-full" />
          <SkeletonLine className={`h-9 rounded-full ${titleWidth}`} />
          <SkeletonLine className={`h-4 w-full rounded-full ${detailWidth}`} />
        </div>
        <div className="hidden gap-2 md:flex">
          <SkeletonLine className="h-11 w-11 rounded-full" />
          <SkeletonLine className="h-11 w-11 rounded-full" />
        </div>
      </div>
      <div className="hide-scrollbar flex gap-4 overflow-hidden pb-4">
        {Array.from({ length: cards }).map((_, index) => (
          <SkeletonLine
            key={`rail-card-${index}`}
            className="aspect-[2/3] w-[176px] min-w-[176px] rounded-[28px] sm:w-[192px] sm:min-w-[192px] lg:w-[214px] lg:min-w-[214px]"
          />
        ))}
      </div>
    </section>
  );
}

function SkeletonHero({
  className = "rounded-[34px] p-6 sm:p-8",
  showPills = false,
}: {
  className?: string;
  showPills?: boolean;
}) {
  return (
    <section className={`surface-strong overflow-hidden ${className}`}>
      <div className="space-y-4">
        <SkeletonLine className="h-3 w-28 rounded-full" />
        <SkeletonLine className="h-12 w-full max-w-2xl rounded-full" />
        <SkeletonLine className="h-4 w-full max-w-3xl rounded-full" />
        <SkeletonLine className="h-4 w-full max-w-2xl rounded-full" />
      </div>
      {showPills ? (
        <div className="mt-6">
          <SkeletonPillRow count={3} />
        </div>
      ) : null}
    </section>
  );
}

function SkeletonHouseholdPanel() {
  return (
    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="surface-strong rounded-[30px] p-6 sm:p-8">
        <div className="space-y-4">
          <SkeletonLine className="h-3 w-32 rounded-full" />
          <SkeletonLine className="h-11 w-full max-w-2xl rounded-full" />
          <SkeletonLine className="h-4 w-full max-w-3xl rounded-full" />
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`household-stat-${index}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <SkeletonLine className="h-3 w-24 rounded-full" />
              <SkeletonLine className="mt-3 h-8 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`household-card-${index}`} className="surface rounded-[26px] p-5">
            <div className="flex items-start justify-between gap-3">
              <SkeletonLine className="h-14 w-14 rounded-2xl" />
              <SkeletonLine className="h-8 w-20 rounded-full" />
            </div>
            <SkeletonLine className="mt-5 h-9 w-32 rounded-full" />
            <SkeletonLine className="mt-3 h-4 w-full rounded-full" />
            <SkeletonLine className="mt-2 h-4 w-3/4 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingLoadingShell() {
  return (
    <LoadingScreenFrame variant="landing">
      <div className="page-shell">
        <main className="relative overflow-hidden">
          <section className="mx-auto max-w-7xl px-4 py-12 sm:px-8 sm:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-4">
                <SkeletonLine className="h-3 w-24 rounded-full" />
                <SkeletonLine className="h-14 w-full max-w-2xl rounded-full" />
                <SkeletonLine className="h-14 w-full max-w-xl rounded-full" />
                <SkeletonLine className="h-4 w-full max-w-2xl rounded-full" />
                <SkeletonLine className="h-4 w-full max-w-xl rounded-full" />
                <div className="pt-2">
                  <SkeletonPillRow count={2} />
                </div>
              </div>
              <SkeletonLine className="min-h-[440px] rounded-[34px] border border-white/8 sm:min-h-[520px]" />
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-2 sm:px-8 sm:py-4">
            <div className="grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
              <div className="surface-strong rounded-[30px] p-6 sm:p-8">
                <SkeletonLine className="h-3 w-32 rounded-full" />
                <SkeletonLine className="mt-4 h-11 w-full max-w-2xl rounded-full" />
                <SkeletonLine className="mt-3 h-4 w-full max-w-3xl rounded-full" />
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={`landing-stat-${index}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                      <SkeletonLine className="h-3 w-20 rounded-full" />
                      <SkeletonLine className="mt-3 h-8 w-14 rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`landing-social-${index}`} className="surface rounded-[26px] p-5">
                    <SkeletonLine className="h-3 w-24 rounded-full" />
                    <SkeletonLine className="mt-4 h-9 w-full max-w-40 rounded-full" />
                    <SkeletonLine className="mt-3 h-4 w-full rounded-full" />
                    <SkeletonLine className="mt-2 h-4 w-3/4 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`feature-card-${index}`} className="surface rounded-[28px] p-6">
                  <SkeletonLine className="h-10 w-10 rounded-2xl" />
                  <SkeletonLine className="mt-5 h-10 w-28 rounded-full" />
                  <SkeletonLine className="mt-4 h-4 w-full rounded-full" />
                  <SkeletonLine className="mt-2 h-4 w-4/5 rounded-full" />
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </LoadingScreenFrame>
  );
}

export function BrowseLoadingShell() {
  return (
    <LoadingScreenFrame variant="browse">
      <PageFrame activeHref="/browse">
        <SkeletonLine className="min-h-[470px] rounded-[42px] border border-white/8 sm:min-h-[520px]" />
        <SkeletonRail titleWidth="w-72" />
        <SkeletonRail titleWidth="w-64" />
        <SkeletonRail titleWidth="w-56" />
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function CatalogLoadingShell({ activeHref }: { activeHref: "/movies" | "/shows" }) {
  return (
    <LoadingScreenFrame variant={activeHref === "/movies" ? "movies" : "shows"}>
      <PageFrame activeHref={activeHref}>
        <SkeletonHero showPills />
        <section className="surface rounded-[24px] p-4">
          <SkeletonPillRow count={7} />
        </section>
        <SkeletonRail />
        <SkeletonRail titleWidth="w-72" />
        <SkeletonRail titleWidth="w-60" />
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function SearchLoadingShell() {
  return (
    <LoadingScreenFrame variant="search">
      <PageFrame activeHref="/search">
        <SkeletonHero />
        <section className="surface rounded-[30px] p-6 sm:p-8">
          <SkeletonLine className="h-14 w-full rounded-[24px]" />
        </section>
        <section className="surface rounded-[24px] p-4">
          <SkeletonPillRow count={4} />
        </section>
        <SkeletonRail titleWidth="w-56" />
        <SkeletonRail titleWidth="w-72" />
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function AccountLoadingShell() {
  return (
    <LoadingScreenFrame variant="account">
      <PageFrame activeHref="/account">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="surface-strong rounded-[30px] p-8">
            <SkeletonLine className="h-3 w-28 rounded-full" />
            <SkeletonLine className="mt-4 h-12 w-full max-w-2xl rounded-full" />
            <SkeletonLine className="mt-4 h-4 w-full max-w-3xl rounded-full" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={`account-stat-${index}`} className="rounded-[24px] border border-white/10 bg-black/20 p-4">
                  <SkeletonLine className="h-3 w-24 rounded-full" />
                  <SkeletonLine className="mt-3 h-8 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </section>
          <section className="surface rounded-[30px] p-8">
            <SkeletonLine className="h-6 w-32 rounded-full" />
            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 p-5">
              <div className="flex items-start gap-4">
                <SkeletonLine className="h-16 w-16 rounded-2xl" />
                <div className="w-full space-y-3">
                  <SkeletonLine className="h-9 w-40 rounded-full" />
                  <SkeletonLine className="h-4 w-32 rounded-full" />
                </div>
              </div>
            </div>
          </section>
        </div>
        <SkeletonHouseholdPanel />
        <section className="surface rounded-[24px] p-4">
          <SkeletonPillRow count={3} />
        </section>
        <SkeletonRail titleWidth="w-56" />
        <SkeletonRail titleWidth="w-60" />
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function ProfilesLoadingShell() {
  return (
    <LoadingScreenFrame variant="profiles">
      <PageFrame activeHref="/profiles">
        <SkeletonHero />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`profile-card-${index}`} className="surface rounded-[28px] p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <SkeletonLine className="h-16 w-16 rounded-2xl" />
                <SkeletonLine className="h-8 w-[4.5rem] rounded-full" />
              </div>
              <SkeletonLine className="h-10 w-40 rounded-full" />
              <SkeletonLine className="mt-3 h-4 w-32 rounded-full" />
              <SkeletonLine className="mt-4 h-4 w-full rounded-full" />
              <SkeletonLine className="mt-2 h-4 w-3/4 rounded-full" />
              <SkeletonLine className="mt-6 h-11 w-40 rounded-full" />
            </div>
          ))}
        </div>
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function ProvidersLoadingShell() {
  return (
    <LoadingScreenFrame variant="providers">
      <PageFrame activeHref="/providers">
        <SkeletonHero />
        <section className="surface rounded-[28px] p-6">
          <SkeletonLine className="h-3 w-28 rounded-full" />
          <SkeletonLine className="mt-4 h-14 w-full rounded-[22px]" />
        </section>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={`provider-card-${index}`} className="surface-strong rounded-[30px] p-5">
              <SkeletonLine className="h-3 w-28 rounded-full" />
              <SkeletonLine className="mt-5 h-10 w-32 rounded-full" />
              <SkeletonLine className="mt-5 h-4 w-full rounded-full" />
              <SkeletonLine className="mt-2 h-4 w-4/5 rounded-full" />
              <div className="mt-5 flex gap-2">
                <SkeletonLine className="h-8 w-20 rounded-full" />
                <SkeletonLine className="h-8 w-24 rounded-full" />
              </div>
              <SkeletonLine className="mt-6 h-24 w-full rounded-[22px]" />
              <SkeletonLine className="mt-4 h-4 w-28 rounded-full" />
            </div>
          ))}
        </section>
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function ProviderCatalogLoadingShell() {
  return (
    <LoadingScreenFrame variant="provider">
      <PageFrame activeHref="/providers">
        <section className="surface rounded-[28px] p-6">
          <SkeletonLine className="h-3 w-28 rounded-full" />
          <SkeletonLine className="mt-4 h-14 w-full rounded-[22px]" />
        </section>
        <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <SkeletonLine className="min-h-[360px] rounded-[32px]" />
          <section className="surface-strong rounded-[30px] p-6">
            <SkeletonLine className="h-3 w-32 rounded-full" />
            <SkeletonLine className="mt-4 h-10 w-64 rounded-full" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonLine key={`provider-metric-${index}`} className="h-24 rounded-[22px]" />
              ))}
            </div>
          </section>
        </section>
        <section className="space-y-4">
          <SkeletonLine className="h-3 w-28 rounded-full" />
          <SkeletonLine className="h-10 w-64 rounded-full" />
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonLine
                key={`provider-movie-card-${index}`}
                className="aspect-[2/3] w-[176px] min-w-[176px] rounded-[28px] sm:w-[192px] sm:min-w-[192px] lg:w-[214px] lg:min-w-[214px]"
              />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <SkeletonLine className="h-3 w-28 rounded-full" />
          <SkeletonLine className="h-10 w-64 rounded-full" />
          <div className="flex flex-wrap gap-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <SkeletonLine
                key={`provider-series-card-${index}`}
                className="aspect-[2/3] w-[176px] min-w-[176px] rounded-[28px] sm:w-[192px] sm:min-w-[192px] lg:w-[214px] lg:min-w-[214px]"
              />
            ))}
          </div>
        </section>
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function SettingsLoadingShell() {
  return (
    <LoadingScreenFrame variant="settings">
      <PageFrame activeHref="/settings">
        <SkeletonHero />
        <section className="surface rounded-[24px] p-4">
          <SkeletonPillRow count={3} />
        </section>
        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <section className="surface rounded-[28px] p-6">
              <SkeletonLine className="h-3 w-28 rounded-full" />
              <SkeletonLine className="mt-4 h-14 w-full rounded-[22px]" />
            </section>
            <section className="surface rounded-[28px] p-6">
              <SkeletonLine className="h-3 w-32 rounded-full" />
              <SkeletonLine className="mt-4 h-8 w-48 rounded-full" />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <SkeletonLine className="h-28 rounded-[22px]" />
                <SkeletonLine className="h-28 rounded-[22px]" />
              </div>
            </section>
          </div>
          <div className="space-y-4">
            <section className="surface rounded-[28px] p-6">
              <SkeletonLine className="h-3 w-28 rounded-full" />
              <div className="mt-4 flex items-start gap-4">
                <SkeletonLine className="h-14 w-14 rounded-2xl" />
                <div className="w-full space-y-3">
                  <SkeletonLine className="h-8 w-36 rounded-full" />
                  <SkeletonLine className="h-4 w-28 rounded-full" />
                </div>
              </div>
            </section>
            <section className="surface rounded-[28px] p-6">
              <SkeletonLine className="h-3 w-32 rounded-full" />
              <SkeletonLine className="mt-4 h-8 w-52 rounded-full" />
              <div className="mt-4 space-y-3">
                <SkeletonLine className="h-24 rounded-[22px]" />
                <SkeletonLine className="h-24 rounded-[22px]" />
                <SkeletonLine className="h-24 rounded-[22px]" />
              </div>
            </section>
          </div>
        </section>
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function OnboardingLoadingShell() {
  return (
    <LoadingScreenFrame variant="onboarding">
      <PageFrame>
        <SkeletonHero />
        <section className="surface rounded-[32px] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={`onboarding-field-${index}`} className="space-y-4">
                <SkeletonLine className="h-4 w-24 rounded-full" />
                <SkeletonLine className="h-14 w-full rounded-[20px]" />
              </div>
            ))}
          </div>
          <SkeletonLine className="mt-8 h-12 w-48 rounded-full" />
        </section>
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function DetailLoadingShell({ activeHref }: { activeHref?: "/movies" | "/shows" }) {
  return (
    <LoadingScreenFrame variant="detail">
      <PageFrame activeHref={activeHref}>
        <SkeletonHero className="rounded-[36px] px-6 py-14 sm:px-10" showPills />
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonLine className="h-56 rounded-[28px]" />
          <SkeletonLine className="h-56 rounded-[28px]" />
        </div>
        <SkeletonLine className="h-44 rounded-[28px]" />
        <SkeletonLine className="h-56 rounded-[28px]" />
        <SkeletonRail titleWidth="w-56" />
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function WatchLoadingShell() {
  return (
    <LoadingScreenFrame variant="watch">
      <PageFrame>
        <SkeletonHero className="rounded-[34px] px-8 py-8" showPills />
        <section className="surface rounded-[24px] p-4">
          <SkeletonPillRow count={3} />
        </section>
        <SkeletonLine className="h-64 rounded-[30px]" />
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <SkeletonLine className="h-[520px] rounded-[30px]" />
          <SkeletonLine className="h-[520px] rounded-[30px]" />
        </div>
        <SkeletonLine className="h-56 rounded-[30px]" />
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function SportsHomeLoadingShell() {
  return (
    <LoadingScreenFrame variant="sports">
      <PageFrame activeHref="/sports">
        <SkeletonHero />
        <div className="grid gap-6">
          {Array.from({ length: 2 }).map((_, groupIndex) => (
            <section key={`sports-group-${groupIndex}`} className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-3">
                  <SkeletonLine className="h-3 w-20 rounded-full" />
                  <SkeletonLine className="h-10 w-64 rounded-full" />
                  <SkeletonLine className="h-4 w-full max-w-2xl rounded-full" />
                </div>
                <SkeletonLine className="h-8 w-24 rounded-full" />
              </div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, cardIndex) => (
                  <SkeletonLine key={`sports-card-${groupIndex}-${cardIndex}`} className="h-48 rounded-[28px]" />
                ))}
              </div>
            </section>
          ))}
        </div>
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function SportsLeagueLoadingShell() {
  return (
    <LoadingScreenFrame variant="sportsLeague">
      <PageFrame activeHref="/sports">
        <SkeletonHero />
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonLine key={`league-card-${index}`} className="h-48 rounded-[28px]" />
          ))}
        </div>
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function SportsEventLoadingShell() {
  return (
    <LoadingScreenFrame variant="sportsEvent">
      <PageFrame activeHref="/sports">
        <SkeletonHero />
        <section className="surface rounded-[24px] p-4">
          <SkeletonPillRow count={2} />
        </section>
        <SkeletonLine className="h-72 rounded-[30px]" />
      </PageFrame>
    </LoadingScreenFrame>
  );
}

export function AuthLoadingShell() {
  return (
    <LoadingScreenFrame variant="auth">
      <main className="relative mx-auto grid min-h-screen w-full max-w-7xl items-center gap-8 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1.02fr)_430px]">
        <SkeletonLine className="min-h-[440px] rounded-[34px] border border-white/8 sm:min-h-[520px]" />
        <section className="surface-strong w-full rounded-[32px] p-6 sm:p-8">
          <SkeletonLine className="h-3 w-28 rounded-full" />
          <SkeletonLine className="mt-4 h-11 w-full max-w-64 rounded-full" />
          <SkeletonLine className="mt-4 h-4 w-full rounded-full" />
          <SkeletonLine className="mt-2 h-4 w-4/5 rounded-full" />
          <div className="mt-8 space-y-4">
            <SkeletonLine className="h-12 w-full rounded-[18px]" />
            <SkeletonLine className="h-12 w-full rounded-[18px]" />
            <SkeletonLine className="h-12 w-full rounded-[18px]" />
            <SkeletonLine className="h-48 w-full rounded-[24px]" />
          </div>
        </section>
      </main>
    </LoadingScreenFrame>
  );
}
