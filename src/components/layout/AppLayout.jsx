import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useAuth } from "@/lib/AuthContext";

export default function AppLayout({ activeProfile, onSwitchProfile }) {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-24 text-white md:pb-0">
      <Navbar user={user} activeProfile={activeProfile} onSwitchProfile={onSwitchProfile} />
      <main>
        <Outlet context={{ user, activeProfile, onSwitchProfile, isAdmin }} />
      </main>
      <Footer />
    </div>
  );
}
