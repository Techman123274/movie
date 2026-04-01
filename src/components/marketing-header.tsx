import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ArrowRight, Menu, Sparkles } from "lucide-react";

const navItems = [
  { href: "/browse", label: "Browse" },
  { href: "/sports", label: "Sports" },
  { href: "/providers", label: "Providers" },
];

export async function MarketingHeader() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <header className="sticky top-0 z-[90] overflow-visible border-b border-white/8 bg-[rgba(5,11,19,0.68)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-8 md:flex md:items-center md:justify-between">
        <Link href="/" className="flex min-w-0 items-center gap-3 overflow-hidden md:flex-1">
          <div className="gold-ring flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(214,179,109,0.12)] text-sm font-semibold tracking-[0.32em] text-[var(--color-brand-strong)]">
            S
          </div>
          <div className="min-w-0">
            <p className="display-font truncate text-2xl leading-none">Subflix</p>
            <p className="truncate text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">subflix.tech</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-[var(--color-text-muted)] transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-20 flex shrink-0 items-center gap-3 pointer-events-auto">
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="hidden surface rounded-full px-4 py-2 text-sm text-[var(--color-text-muted)] transition hover:text-white sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="hidden rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[#07111f] transition hover:bg-[var(--color-brand-strong)] sm:block"
              >
                Start watching
              </Link>
            </>
          ) : null}
          {isSignedIn ? (
            <Link href="/browse" className="hidden rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[#07111f] sm:block">
              Open app
            </Link>
          ) : null}
          <details className="group relative md:hidden">
            <summary
              className="surface relative z-20 flex h-10 w-10 shrink-0 list-none touch-manipulation items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:text-white [&::-webkit-details-marker]:hidden"
              aria-label="Toggle landing navigation menu"
            >
              <Menu size={18} />
            </summary>
            <div className="absolute right-0 top-full z-50 mt-3 w-[min(23rem,calc(100vw-1.25rem))] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,21,35,0.98),rgba(5,11,19,0.98))] shadow-2xl">
              <div className="border-b border-white/8 px-5 py-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--color-brand-strong)]">Get Started</p>
                <div className="mt-3 rounded-[22px] border border-white/8 bg-white/4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="display-font text-2xl text-white">Subflix</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                        Open the catalog, explore live sports, and sign in without leaving mobile.
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
                        Start now
                      </Link>
                    </div>
                  ) : null}
                  {isSignedIn ? (
                    <Link
                      href="/browse"
                      className="mt-4 flex items-center justify-between rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-[#07111f]"
                    >
                      <span>Open app</span>
                      <ArrowRight size={16} />
                    </Link>
                  ) : null}
                </div>
              </div>
              <nav id="marketing-mobile-nav" className="grid gap-2 px-4 py-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-[var(--color-text-muted)] transition hover:bg-white/8 hover:text-white"
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={16} className="text-[var(--color-brand-strong)]" />
                  </Link>
                ))}
                {!isSignedIn ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm leading-6 text-[var(--color-text-muted)]">
                    Sign in from the top of this menu to save progress and unlock your profiles.
                  </div>
                ) : null}
                {isSignedIn ? (
                  <Link
                    href="/browse"
                    className="flex items-center justify-between rounded-2xl border border-[rgba(214,179,109,0.35)] bg-[rgba(214,179,109,0.12)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(214,179,109,0.18)]"
                  >
                    <span>Open app</span>
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
