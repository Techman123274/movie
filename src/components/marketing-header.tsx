"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";

const navItems = [
  { href: "/browse", label: "Browse" },
  { href: "/sports", label: "Sports" },
  { href: "/providers", label: "Providers" },
];

export function MarketingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[rgba(5,11,19,0.68)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="gold-ring flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(214,179,109,0.12)] text-sm font-semibold tracking-[0.32em] text-[var(--color-brand-strong)]">
            L
          </div>
          <div>
            <p className="display-font text-2xl leading-none">Luma</p>
            <p className="text-[11px] uppercase tracking-[0.32em] text-[var(--color-text-muted)]">Cinema + Sports</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-[var(--color-text-muted)] transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="hidden surface rounded-full px-4 py-2 text-sm text-[var(--color-text-muted)] transition hover:text-white sm:block"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                className="hidden rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[#07111f] transition hover:bg-[var(--color-brand-strong)] sm:block"
              >
                Start watching
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link href="/browse" className="hidden rounded-full bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-[#07111f] sm:block">
              Open app
            </Link>
          </Show>
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            className="surface flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-muted)] transition hover:text-white md:hidden"
            aria-label="Toggle landing navigation menu"
            aria-expanded={isMenuOpen}
            aria-controls="marketing-mobile-nav"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="md:hidden">
          <button
            type="button"
            aria-label="Close landing navigation menu"
            className="fixed inset-0 top-[72px] z-40 bg-[rgba(2,6,12,0.62)] backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="absolute inset-x-0 top-full z-50 border-t border-white/8 bg-[rgba(5,11,19,0.98)] px-4 py-4 shadow-2xl">
            <nav id="marketing-mobile-nav" className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="surface rounded-2xl px-4 py-3 text-sm text-[var(--color-text-muted)] transition hover:text-white"
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
                    Start watching
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link
                  href="/browse"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-2xl bg-[var(--color-brand)] px-4 py-3 text-sm font-semibold text-[#07111f]"
                >
                  Open app
                </Link>
              </Show>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
