import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Menu, Search, Sparkles, UserCircle2 } from "lucide-react";
import { LiveSearch } from "@/components/live-search";
import { ProfileAvatar } from "@/components/profile-avatar";
import { getViewerContext } from "@/lib/viewer";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/browse", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/shows", label: "Series" },
  { href: "/sports", label: "Sports" },
  { href: "/providers", label: "Where to Watch" },
];

type SiteHeaderProps = {
  activeHref?: string;
};

export async function SiteHeader({ activeHref }: SiteHeaderProps) {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);
  const viewer = isSignedIn ? await getViewerContext() : null;
  const activeProfile = viewer?.activeProfile ?? null;

  return (
    <header className="theme-header sticky top-0 z-[90] overflow-visible">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-8 md:flex md:items-center md:justify-between">
        <Link href="/browse" className="flex min-w-0 items-center gap-3 overflow-hidden md:flex-1">
          <div className="theme-logo-mark relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
            <Image src="/brand/subflix-mark.svg" alt="Subflix logo" fill sizes="40px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="display-font truncate text-xl leading-none sm:text-2xl">Subflix</p>
            <p className="truncate text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-muted)] sm:text-[11px] sm:tracking-[0.32em]">
              Stream beautifully
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "theme-nav-link rounded-full px-4 py-2 text-sm",
                activeHref === item.href && "theme-nav-link-active",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-20 flex shrink-0 items-center gap-2 pointer-events-auto sm:gap-3">
          <div className="hidden lg:block">
            <LiveSearch placeholder="Search movies and series..." />
          </div>
          <Link
            href="/search"
            className="theme-button-secondary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] lg:hidden"
          >
            <Search size={18} />
          </Link>
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="theme-button-secondary hidden items-center gap-2 rounded-full px-4 py-2 text-sm text-[var(--color-text-muted)] sm:flex"
              >
                <UserCircle2 size={18} />
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="theme-button-primary hidden rounded-full px-4 py-2 text-sm font-semibold sm:block"
              >
                Sign up
              </Link>
            </>
          ) : null}
          {isSignedIn ? (
            <Link
              href="/account"
              className={cn(
                "theme-button-secondary hidden items-center gap-3 rounded-full px-2.5 py-2 text-white md:flex",
                activeHref === "/account" && "theme-nav-link-active",
              )}
            >
              {activeProfile ? (
                <>
                  <ProfileAvatar
                    avatar={activeProfile.avatar}
                    name={activeProfile.name}
                    accent={activeProfile.accent}
                    className="h-9 w-9 rounded-full"
                    textClassName="text-sm"
                    sizes="36px"
                  />
                  <span className="max-w-28 truncate text-sm">{activeProfile.name}</span>
                </>
              ) : (
                <>
                  <UserCircle2 size={18} />
                  <span className="text-sm">My Profile</span>
                </>
              )}
            </Link>
          ) : null}
          <details className="group relative md:hidden">
            <summary
              className="theme-button-secondary relative z-20 flex h-10 w-10 shrink-0 list-none touch-manipulation items-center justify-center rounded-full text-[var(--color-text-muted)] [&::-webkit-details-marker]:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu size={18} />
            </summary>
            <div className="theme-menu-panel absolute right-0 top-full z-50 mt-3 w-[min(23rem,calc(100vw-1.25rem))] overflow-hidden rounded-[28px]">
              <div className="border-b border-white/8 px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">Mobile Menu</p>
                <div className="theme-input-shell mt-3 rounded-[22px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="display-font text-2xl text-white">Subflix</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                        Jump back into movies, series, sports, and your profile from one place.
                      </p>
                    </div>
                    <Sparkles size={18} className="mt-1 shrink-0 text-[var(--color-brand-strong)]" />
                  </div>
                  {!isSignedIn ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href="/sign-in"
                        className="theme-button-secondary flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-medium text-white"
                      >
                        Log in
                      </Link>
                      <Link
                        href="/sign-up"
                        className="theme-button-primary flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
                      >
                        Join now
                      </Link>
                    </div>
                  ) : null}
                  {isSignedIn ? (
                    <Link href="/account" className="theme-input-shell mt-4 flex items-center gap-3 rounded-2xl px-4 py-3">
                      {activeProfile ? (
                        <>
                          <ProfileAvatar
                            avatar={activeProfile.avatar}
                            name={activeProfile.name}
                            accent={activeProfile.accent}
                            className="h-11 w-11 rounded-full"
                            textClassName="text-sm"
                            sizes="44px"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{activeProfile.name}</p>
                            <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Open My Profile</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-white">Signed in</p>
                          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Account ready</p>
                        </>
                      )}
                    </Link>
                  ) : null}
                </div>
              </div>
              <div className="border-b border-white/8 px-4 py-4 md:hidden">
                <LiveSearch placeholder="Search movies and series..." />
              </div>
              <nav id="site-mobile-nav" className="grid gap-2 px-4 py-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "theme-nav-link flex items-center justify-between rounded-2xl px-4 py-3 text-sm",
                      activeHref === item.href && "theme-nav-link-active text-white",
                    )}
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={16} className="text-[var(--color-brand-strong)]" />
                  </Link>
                ))}
                {!isSignedIn ? (
                  <div className="theme-input-shell rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]">
                    Use <span className="text-white">Log in</span> above to unlock profiles, continue watching, and your full profile area.
                  </div>
                ) : null}
                {isSignedIn ? (
                  <Link href="/account" className="theme-nav-link flex items-center justify-between rounded-2xl px-4 py-3 text-sm">
                    <span>My Profile</span>
                    <ArrowRight size={16} className="text-[var(--color-brand-strong)]" />
                  </Link>
                ) : null}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
