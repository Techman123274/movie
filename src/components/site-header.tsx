"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Menu, Search, UserCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/browse", label: "Browse" },
  { href: "/movies", label: "Movies" },
  { href: "/shows", label: "Series" },
  { href: "/sports", label: "Sports" },
  { href: "/providers", label: "Providers" },
  { href: "/search", label: "Search" },
  { href: "/profiles", label: "Profiles" },
];

type SiteHeaderProps = {
  activeHref?: string;
};

export function SiteHeader({ activeHref }: SiteHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[rgba(5,11,19,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link href="/browse" className="flex min-w-0 items-center gap-3">
          <div className="gold-ring flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(214,179,109,0.12)] text-sm font-semibold tracking-[0.32em] text-[var(--color-brand-strong)]">
            L
          </div>
          <div className="min-w-0">
            <p className="display-font truncate text-xl leading-none sm:text-2xl">Luma</p>
            <p className="truncate text-[10px] uppercase tracking-[0.28em] text-[var(--color-text-muted)] sm:text-[11px] sm:tracking-[0.32em]">
              Ad-free cinema
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm text-[var(--color-text-muted)] transition hover:text-white",
                activeHref === item.href && "bg-white/8 text-white",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/search"
            className="surface flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:text-white"
          >
            <Search size={18} />
          </Link>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="hidden surface items-center gap-2 rounded-full px-4 py-2 text-sm text-[var(--color-text-muted)] transition hover:text-white sm:flex"
              >
                <UserCircle2 size={18} />
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="hidden rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[#07111f] transition hover:bg-[var(--color-brand-strong)] sm:block"
              >
                Sign up
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <div className="hidden surface items-center gap-3 rounded-full px-3 py-2 sm:flex">
              <Link href="/account" className="text-sm text-[var(--color-text-muted)] transition hover:text-white">
                Account
              </Link>
              <UserButton />
            </div>
          </Show>
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="surface flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:text-white md:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="site-mobile-nav"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 top-[72px] z-40 bg-[rgba(2,6,12,0.62)] backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute inset-x-0 top-full z-50 border-t border-white/8 bg-[rgba(5,11,19,0.98)] px-4 py-4 shadow-2xl">
            <nav id="site-mobile-nav" className="grid gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "surface rounded-2xl px-4 py-3 text-sm text-[var(--color-text-muted)] transition hover:text-white",
                  activeHref === item.href && "bg-white/8 text-white",
                )}
              >
                {item.label}
              </Link>
            ))}
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="surface rounded-2xl px-4 py-3 text-left text-sm text-[var(--color-text-muted)] transition hover:text-white"
                >
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-left text-sm font-semibold text-[#07111f]"
                >
                  Sign up
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/account"
                onClick={() => setIsMenuOpen(false)}
                className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-text-muted)] transition hover:text-white"
              >
                Account
              </Link>
            </Show>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
