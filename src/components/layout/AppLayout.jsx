import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "@/lib/AuthContext";
import { startPresenceHeartbeat, stopPresenceHeartbeat } from "@/lib/presence";

export default function AppLayout({ activeProfile, onSwitchProfile }) {
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    if (!user || isAdmin || !activeProfile) {
      void stopPresenceHeartbeat();
      return undefined;
    }

    void startPresenceHeartbeat({ activeProfile });
    return () => {
      void stopPresenceHeartbeat();
    };
  }, [activeProfile?.id, isAdmin, user?.id]);

  return (
    <div className="min-h-[var(--app-viewport-height)] bg-[var(--app-bg)] text-[var(--text-primary)]">
      <Navbar user={user} activeProfile={activeProfile} onSwitchProfile={onSwitchProfile} />
      <main>
        <Outlet context={{ user, activeProfile, onSwitchProfile, isAdmin }} />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
