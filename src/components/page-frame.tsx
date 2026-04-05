import type { ReactNode } from "react";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { SiteMaintenanceScreen } from "@/components/site-maintenance-screen";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getAdminContext, getSiteControlState } from "@/lib/site-control";

type PageFrameProps = {
  children: ReactNode;
  activeHref?: string;
  bypassSiteLock?: boolean;
};

export async function PageFrame({ children, activeHref, bypassSiteLock = false }: PageFrameProps) {
  const siteControl = await getSiteControlState();

  if (siteControl.maintenanceMode && !bypassSiteLock) {
    const admin = await getAdminContext();

    return (
      <SiteMaintenanceScreen
        message={siteControl.maintenanceMessage}
        updatedAt={siteControl.updatedAt}
        showAdminLink={admin.isAdmin}
      />
    );
  }

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
