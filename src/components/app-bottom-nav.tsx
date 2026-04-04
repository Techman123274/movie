"use client";

import Link from "next/link";
import { Film, Home, Trophy, Tv, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/browse", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/shows", label: "Series", icon: Tv },
  { href: "/sports", label: "Sports", icon: Trophy },
  { href: "/account", label: "Profile", icon: UserRound },
];

type AppBottomNavProps = {
  activeHref?: string;
};

export function AppBottomNav({ activeHref }: AppBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[linear-gradient(180deg,rgba(14,14,16,0.96),rgba(8,8,10,0.96))] px-3 py-2 shadow-[0_-16px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] text-[var(--color-text-muted)] transition",
              activeHref === item.href && "theme-nav-link-active text-white",
            )}
          >
            <item.icon size={18} className={activeHref === item.href ? "text-[var(--color-brand-strong)]" : ""} />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
