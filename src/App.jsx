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
import { Suspense, lazy, useEffect, useState } from 'react';
import NetflixLoadingScreen from '@/components/auth/NetflixLoadingScreen';
import ProfileSelector from '@/components/auth/ProfileSelector';
import {
  ACTIVE_PROFILE_CHANGED_EVENT,
  readActiveProfile,
  saveActiveProfile,
} from '@/lib/preferences';
import { fetchPublicSiteSettings, getDefaultSiteSettings } from '@/lib/admin-config';
import { getSupportPageByPath, SUPPORT_PAGES } from '@/lib/support-pages';

const SignIn = lazy(() => import('@/pages/SignIn'));
const Home = lazy(() => import('@/pages/Home'));
const Browse = lazy(() => import('@/pages/Browse'));
const MovieDetail = lazy(() => import('@/pages/MovieDetail'));
const TVDetail = lazy(() => import('@/pages/TVDetail'));
const Player = lazy(() => import('@/pages/Player'));
const Search = lazy(() => import('@/pages/Search'));
const MyList = lazy(() => import('@/pages/MyList'));
const History = lazy(() => import('@/pages/History'));
const SettingsPage = lazy(() => import('@/pages/Settings'));
const SocialHub = lazy(() => import('@/pages/SocialHub'));
const AdminPage = lazy(() => import('@/pages/Admin'));
const SupportPage = lazy(() => import('@/pages/SupportPage'));
const SpeedTestPage = lazy(() => import('@/pages/SpeedTestPage'));

const SuspendedRoute = ({ children }) => (
  <Suspense fallback={<RouteLoadingFallback />}>
    {children}
  </Suspense>
);

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
        return (
          <SuspendedRoute>
            <SpeedTestPage standalone />
          </SuspendedRoute>
        );
      }
      if (publicSupportPage) {
        return (
          <SuspendedRoute>
            <SupportPage page={publicSupportPage} standalone />
          </SuspendedRoute>
        );
      }
      return (
        <SuspendedRoute>
          <SignIn />
        </SuspendedRoute>
      );
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
      <Route path="/admin" element={<SuspendedRoute><AdminPage /></SuspendedRoute>} />

      {/* Player - fullscreen, no layout */}
      <Route path="/watch/:type/:id" element={<SuspendedRoute><Player /></SuspendedRoute>} />

      {/* All other pages with layout */}
      <Route element={<AppLayout activeProfile={activeProfile} onSwitchProfile={handleSwitchProfile} />}>
        <Route path="/" element={<SuspendedRoute><Home /></SuspendedRoute>} />
        <Route path="/browse" element={<SuspendedRoute><Browse /></SuspendedRoute>} />
        <Route path="/movie/:id" element={<SuspendedRoute><MovieDetail /></SuspendedRoute>} />
        <Route path="/tv/:id" element={<SuspendedRoute><TVDetail /></SuspendedRoute>} />
        <Route path="/search" element={<SuspendedRoute><Search /></SuspendedRoute>} />
        <Route path="/my-list" element={<SuspendedRoute><MyList /></SuspendedRoute>} />
        <Route path="/history" element={<SuspendedRoute><History /></SuspendedRoute>} />
        <Route path="/social" element={<SuspendedRoute><SocialHub /></SuspendedRoute>} />
        <Route path="/settings" element={<SuspendedRoute><SettingsPage /></SuspendedRoute>} />
        <Route path="/setup" element={<SuspendedRoute><SettingsPage /></SuspendedRoute>} />
        <Route path="/speed-test" element={<SuspendedRoute><SpeedTestPage /></SuspendedRoute>} />
        {SUPPORT_PAGES.filter((page) => page.path !== '/speed-test').map((page) => (
          <Route key={page.path} path={page.path} element={<SuspendedRoute><SupportPage page={page} /></SuspendedRoute>} />
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
    <div className="min-h-screen bg-[var(--app-bg)] text-white">
      <div className="flex min-h-screen items-center justify-center px-6">
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

function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[var(--card-bg)] p-8 text-center shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--brand)]">Loading</p>
          <h2 className="mt-4 text-2xl font-black tracking-tight">Preparing your next screen</h2>
          <p className="mt-3 text-sm text-white/65">
            We&apos;re streaming in just the code this page needs.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App
