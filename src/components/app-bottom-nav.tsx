"use client";

import Link from "next/link";
import { Film, Home, Search, Tv, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/browse", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/shows", label: "Series", icon: Tv },
  { href: "/search", label: "Search", icon: Search },
  { href: "/account", label: "My Space", icon: UserRound },
];

type AppBottomNavProps = {
  activeHref?: string;
};

export function AppBottomNav({ activeHref }: AppBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[rgba(5,11,19,0.9)] px-3 py-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-3xl grid-cols-5 gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] text-[var(--color-text-muted)] transition",
              activeHref === item.href && "bg-[rgba(214,179,109,0.14)] text-white",
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
