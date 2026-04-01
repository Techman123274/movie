import type { ReactNode } from "react";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type PageFrameProps = {
  children: ReactNode;
  activeHref?: string;
};

export function PageFrame({ children, activeHref }: PageFrameProps) {
  return (
    <div className="page-shell">
      <SiteHeader activeHref={activeHref} />
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-6 pb-28 sm:gap-12 sm:px-8 sm:py-10 sm:pb-32 md:pb-10">
        {children}
      </main>
      <SiteFooter />
      <AppBottomNav activeHref={activeHref} />
    </div>
  );
}
