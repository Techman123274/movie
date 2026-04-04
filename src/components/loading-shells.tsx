import { PageFrame } from "@/components/page-frame";

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
  );
}

export function BrowseLoadingShell() {
  return (
    <PageFrame activeHref="/browse">
      <SkeletonLine className="min-h-[470px] rounded-[42px] border border-white/8 sm:min-h-[520px]" />
      <section className="surface rounded-[28px] p-6">
        <SkeletonLine className="h-3 w-32 rounded-full" />
        <SkeletonLine className="mt-4 h-10 w-full max-w-xl rounded-full" />
        <SkeletonLine className="mt-3 h-4 w-full max-w-2xl rounded-full" />
      </section>
      <SkeletonHouseholdPanel />
      <SkeletonRail titleWidth="w-72" />
      <SkeletonRail titleWidth="w-64" />
      <SkeletonRail titleWidth="w-56" />
    </PageFrame>
  );
}

export function CatalogLoadingShell({ activeHref }: { activeHref: "/movies" | "/shows" }) {
  return (
    <PageFrame activeHref={activeHref}>
      <SkeletonHero showPills />
      <section className="surface rounded-[24px] p-4">
        <SkeletonPillRow count={7} />
      </section>
      <SkeletonRail />
      <SkeletonRail titleWidth="w-72" />
      <SkeletonRail titleWidth="w-60" />
    </PageFrame>
  );
}

export function SearchLoadingShell() {
  return (
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
  );
}

export function AccountLoadingShell() {
  return (
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
  );
}

export function ProfilesLoadingShell() {
  return (
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
  );
}

export function ProvidersLoadingShell() {
  return (
    <PageFrame activeHref="/providers">
      <SkeletonHero />
      <section className="surface rounded-[28px] p-6">
        <SkeletonLine className="h-3 w-28 rounded-full" />
        <SkeletonLine className="mt-4 h-14 w-full rounded-[22px]" />
      </section>
      <SkeletonRail titleWidth="w-56" />
      <SkeletonRail titleWidth="w-64" />
    </PageFrame>
  );
}

export function SettingsLoadingShell() {
  return (
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
  );
}

export function OnboardingLoadingShell() {
  return (
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
  );
}

export function DetailLoadingShell({ activeHref }: { activeHref?: "/movies" | "/shows" }) {
  return (
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
  );
}

export function WatchLoadingShell() {
  return (
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
  );
}

export function SportsHomeLoadingShell() {
  return (
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
  );
}

export function SportsLeagueLoadingShell() {
  return (
    <PageFrame activeHref="/sports">
      <SkeletonHero />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonLine key={`league-card-${index}`} className="h-48 rounded-[28px]" />
        ))}
      </div>
    </PageFrame>
  );
}

export function SportsEventLoadingShell() {
  return (
    <PageFrame activeHref="/sports">
      <SkeletonHero />
      <section className="surface rounded-[24px] p-4">
        <SkeletonPillRow count={2} />
      </section>
      <SkeletonLine className="h-72 rounded-[30px]" />
    </PageFrame>
  );
}

export function AuthLoadingShell() {
  return (
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
  );
}
