import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Menu, Search, Sparkles, UserCircle2 } from "lucide-react";
import { LiveSearch } from "@/components/live-search";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/browse", label: "Home" },
  { href: "/movies", label: "Movies" },
  { href: "/shows", label: "Series" },
  { href: "/sports", label: "Sports" },
  { href: "/providers", label: "Where to Watch" },
  { href: "/search", label: "Search" },
  { href: "/account", label: "My Space" },
];

type SiteHeaderProps = {
  activeHref?: string;
};

export async function SiteHeader({ activeHref }: SiteHeaderProps) {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <header className="sticky top-0 z-[90] overflow-visible border-b border-white/8 bg-[rgba(5,11,19,0.82)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:px-8 md:flex md:items-center md:justify-between">
        <Link href="/browse" className="flex min-w-0 items-center gap-3 overflow-hidden md:flex-1">
          <div className="gold-ring flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(214,179,109,0.12)] text-sm font-semibold tracking-[0.32em] text-[var(--color-brand-strong)]">
            S
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
                "rounded-full px-4 py-2 text-sm text-[var(--color-text-muted)] transition hover:bg-white/6 hover:text-white",
                activeHref === item.href && "bg-white/8 text-white",
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
            className="surface flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:text-white lg:hidden"
          >
            <Search size={18} />
          </Link>
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="hidden surface items-center gap-2 rounded-full px-4 py-2 text-sm text-[var(--color-text-muted)] transition hover:text-white sm:flex"
              >
                <UserCircle2 size={18} />
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="hidden rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[#07111f] transition hover:bg-[var(--color-brand-strong)] sm:block"
              >
                Sign up
              </Link>
            </>
          ) : null}
          {isSignedIn ? (
            <div className="hidden surface items-center gap-3 rounded-full px-3 py-2 sm:flex">
              <Link href="/account" className="text-sm text-[var(--color-text-muted)] transition hover:text-white">
                My Space
              </Link>
            </div>
          ) : null}
          <details className="group relative md:hidden">
            <summary
              className="surface relative z-20 flex h-10 w-10 shrink-0 list-none touch-manipulation items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:text-white [&::-webkit-details-marker]:hidden"
              aria-label="Toggle navigation menu"
            >
              <Menu size={18} />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-3 w-[min(23rem,calc(100vw-1.25rem))] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,21,35,0.98),rgba(5,11,19,0.98))] shadow-2xl">
              <div className="border-b border-white/8 px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">Mobile Menu</p>
                <div className="mt-3 rounded-[22px] border border-white/8 bg-white/4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="display-font text-2xl text-white">Subflix</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                        Jump back into movies, series, sports, and your account from one place.
                      </p>
                    </div>
                    <Sparkles size={18} className="mt-1 shrink-0 text-[var(--color-brand-strong)]" />
                  </div>
                  {!isSignedIn ? (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <Link
                        href="/sign-in"
                        className="surface flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-medium text-white transition hover:bg-white/10"
                      >
                        Log in
                      </Link>
                      <Link
                        href="/sign-up"
                        className="flex min-h-11 items-center justify-center rounded-2xl bg-[var(--color-brand)] px-4 text-sm font-semibold text-[#07111f] transition hover:bg-[var(--color-brand-strong)]"
                      >
                        Join now
                      </Link>
                    </div>
                  ) : null}
                  {isSignedIn ? (
                    <div className="mt-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
                      <p className="text-sm font-medium text-white">Signed in</p>
                      <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-text-muted)]">Account ready</p>
                    </div>
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
                      "flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/8 hover:text-white",
                      activeHref === item.href && "border-[rgba(214,179,109,0.35)] bg-[rgba(214,179,109,0.12)] text-white",
                    )}
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={16} className="text-[var(--color-brand-strong)]" />
                  </Link>
                ))}
                {!isSignedIn ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]">
                    Use <span className="text-white">Log in</span> above to unlock profiles, continue watching, and the full My Space area.
                  </div>
                ) : null}
                {isSignedIn ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]">
                    Profile switching stays in <span className="text-white">My Space</span> so mobile navigation feels simpler and faster.
                  </div>
                ) : null}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
