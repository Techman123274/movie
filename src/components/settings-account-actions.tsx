"use client";

import Link from "next/link";
import { SignOutButton } from "@clerk/nextjs";
import { ArrowRightLeft, LogOut, UserRound } from "lucide-react";

export function SettingsAccountActions() {
  return (
    <section className="surface rounded-[28px] p-6">
      <p className="mb-2 text-xs uppercase tracking-[0.24em] text-[var(--color-brand-strong)]">Account actions</p>
      <h2 className="text-xl font-medium text-white">Switch profile, switch account, or sign out</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
        Use profile switching when someone else in the house is watching, or switch accounts entirely when you need a different login.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Link
          href="/profiles"
          className="theme-button-secondary flex min-h-14 items-center justify-center gap-2 rounded-[22px] px-4 text-sm text-white"
        >
          <UserRound size={16} />
          Switch profile
        </Link>
        <SignOutButton redirectUrl="/sign-in">
          <button
            type="button"
            className="theme-button-secondary flex min-h-14 w-full items-center justify-center gap-2 rounded-[22px] px-4 text-sm text-white"
          >
            <ArrowRightLeft size={16} />
            Switch account
          </button>
        </SignOutButton>
        <SignOutButton redirectUrl="/">
          <button
            type="button"
            className="theme-button-primary flex min-h-14 w-full items-center justify-center gap-2 rounded-[22px] px-4 text-sm font-semibold"
          >
            <LogOut size={16} />
            Log out
          </button>
        </SignOutButton>
      </div>
    </section>
  );
}
