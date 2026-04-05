import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

const navItems = [
  { href: "/browse", label: "Browse" },
  { href: "/sports", label: "Sports" },
  { href: "/providers", label: "Providers" },
];

export async function MarketingHeader() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <header className="theme-header sticky top-0 z-[90] overflow-visible">
      <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:px-8 md:flex md:items-center md:justify-between">
        <Link href="/" className="theme-logo-link flex min-w-0 items-center gap-3 overflow-hidden md:flex-1">
          <div className="theme-logo-mark relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
            <Image src="/brand/subflix-mark.svg" alt="Subflix logo" fill sizes="40px" className="theme-logo-image object-cover" />
          </div>
          <div className="min-w-0">
            <p className="display-font truncate text-2xl leading-none">Subflix</p>
            <p className="truncate text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">subflix.tech</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="theme-nav-link rounded-full px-4 py-2 text-sm">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-20 flex shrink-0 items-center gap-3 pointer-events-auto">
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="theme-button-secondary hidden rounded-full px-4 py-2 text-sm text-[var(--color-text-muted)] sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="theme-button-primary rounded-full px-4 py-2 text-sm font-semibold"
              >
                Start watching
              </Link>
            </>
          ) : null}
          {isSignedIn ? (
            <Link href="/browse" className="theme-button-primary rounded-full px-4 py-2 text-sm font-semibold">
              Open app
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
