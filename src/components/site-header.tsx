import Image from "next/image";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Search, UserCircle2 } from "lucide-react";
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
        <Link href="/browse" className="theme-logo-link flex min-w-0 items-center gap-3 overflow-hidden md:flex-1">
          <div className="theme-logo-mark relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full">
            <Image src="/brand/subflix-mark.svg" alt="Subflix logo" fill sizes="40px" className="theme-logo-image object-cover" />
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
        </div>
      </div>
    </header>
  );
}
