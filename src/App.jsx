import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AppThemeProvider } from '@/lib/theme';

// Layout
import AppLayout from '@/components/layout/AppLayout';

// Pages
import { useEffect, useState } from 'react';
import NetflixLoadingScreen from '@/components/auth/NetflixLoadingScreen';
import ProfileSelector from '@/components/auth/ProfileSelector';
import SignIn from '@/pages/SignIn';
import Home from '@/pages/Home';
import Browse from '@/pages/Browse';
import MovieDetail from '@/pages/MovieDetail';
import TVDetail from '@/pages/TVDetail';
import Player from '@/pages/Player';
import Search from '@/pages/Search';
import MyList from '@/pages/MyList';
import History from '@/pages/History';
import SettingsPage from '@/pages/Settings';
import SocialHub from '@/pages/SocialHub';
import AdminPage from '@/pages/Admin';
import SupportPage from '@/pages/SupportPage';
import SpeedTestPage from '@/pages/SpeedTestPage';
import {
  ACTIVE_PROFILE_CHANGED_EVENT,
  readActiveProfile,
  saveActiveProfile,
} from '@/lib/preferences';
import { fetchPublicSiteSettings, getDefaultSiteSettings } from '@/lib/admin-config';
import { getSupportPageByPath, SUPPORT_PAGES } from '@/lib/support-pages';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, user, isAdmin } = useAuth();
  const location = useLocation();
  const [loadingDone, setLoadingDone] = useState(false);
  const [profileSelected, setProfileSelected] = useState(() => Boolean(readActiveProfile()));
  const [activeProfile, setActiveProfile] = useState(() => readActiveProfile());
  const [siteSettings, setSiteSettings] = useState(getDefaultSiteSettings());
  const [siteSettingsReady, setSiteSettingsReady] = useState(false);
  const publicSupportPage = getSupportPageByPath(location.pathname);
  const isAdminRoute = location.pathname.startsWith("/admin");
  const updateModeEnabled = String(siteSettings.update_mode_enabled).toLowerCase() === "true";

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleProfileChange = (event) => {
      const nextProfile = event.detail?.profile ?? readActiveProfile();
      setActiveProfile(nextProfile);
      setProfileSelected(Boolean(nextProfile));
    };

    window.addEventListener(ACTIVE_PROFILE_CHANGED_EVENT, handleProfileChange);
    return () => window.removeEventListener(ACTIVE_PROFILE_CHANGED_EVENT, handleProfileChange);
  }, []);

  useEffect(() => {
    let active = true;

    const loadSiteSettings = async () => {
      try {
        const nextSettings = await fetchPublicSiteSettings();
        if (!active) {
          return;
        }
        setSiteSettings(nextSettings);
      } catch {
        if (!active) {
          return;
        }
        setSiteSettings(getDefaultSiteSettings());
      } finally {
        if (active) {
          setSiteSettingsReady(true);
        }
      }
    };

    loadSiteSettings();
    const interval = window.setInterval(loadSiteSettings, 1000 * 60);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const handleProfileSelect = (profile) => {
    setActiveProfile(profile);
    saveActiveProfile(profile);
    setProfileSelected(true);
  };

  const handleSwitchProfile = () => {
    saveActiveProfile(null);
    setProfileSelected(false);
    setActiveProfile(null);
  };

  if (isLoadingPublicSettings || isLoadingAuth || !loadingDone || !siteSettingsReady) {
    return <NetflixLoadingScreen onComplete={() => setLoadingDone(true)} />;
  }

  if (updateModeEnabled && !isAdmin && !isAdminRoute) {
    return (
      <UpdateModeScreen
        title={siteSettings.update_mode_title}
        message={siteSettings.update_mode_message}
      />
    );
  }

  if (authError) {
    if (authError.type === 'auth_required') {
      if (location.pathname === '/speed-test') {
        return <SpeedTestPage standalone />;
      }
      if (publicSupportPage) {
        return <SupportPage page={publicSupportPage} standalone />;
      }
      return <SignIn />;
    }
  }

  if (!profileSelected && !isAdminRoute) {
    return (
      <ProfileSelector
        user={user}
        onProfileSelect={handleProfileSelect}
      />
    );
  }

  return (
    <Routes>
      <Route path="/admin" element={<AdminPage />} />

      {/* Player - fullscreen, no layout */}
      <Route path="/watch/:type/:id" element={<Player />} />

      {/* All other pages with layout */}
      <Route element={<AppLayout activeProfile={activeProfile} onSwitchProfile={handleSwitchProfile} />}>
        <Route path="/" element={<Home />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/tv/:id" element={<TVDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/history" element={<History />} />
        <Route path="/social" element={<SocialHub />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/setup" element={<SettingsPage />} />
        <Route path="/speed-test" element={<SpeedTestPage />} />
        {SUPPORT_PAGES.filter((page) => page.path !== '/speed-test').map((page) => (
          <Route key={page.path} path={page.path} element={<SupportPage page={page} />} />
        ))}
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AppThemeProvider>
    </AuthProvider>
  )
}

function UpdateModeScreen({ title, message }) {
  return (
    <div className="min-h-[var(--app-viewport-height)] bg-[var(--app-bg)] text-white">
      <div className="flex min-h-[var(--app-viewport-height)] items-center justify-center px-6">
        <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[var(--card-bg)] p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.45)] md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[var(--brand)]">Subflix Update Mode</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">
            {title || "Subflix is updating"}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-white/70 md:text-lg">
            {message || "We are rolling out a fresh update right now. Please check back in a few minutes."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App
