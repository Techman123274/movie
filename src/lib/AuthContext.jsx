import React, { createContext, useContext, useEffect, useMemo } from "react";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/clerk-react";
import { mapClerkUser, setAuthAdapter } from "@/lib/auth-adapter";
import { isAdminEmail } from "@/lib/env";

const AuthContext = createContext();

const normalizeRedirectUrl = (value, fallback) => {
  if (typeof window === "undefined") {
    return fallback;
  }

  const safeFallback = fallback || window.location.href;

  try {
    const target = new URL(value || safeFallback, window.location.origin);
    return target.origin === window.location.origin ? target.href : safeFallback;
  } catch {
    return safeFallback;
  }
};

export const AuthProvider = ({ children }) => {
  const clerk = useClerk();
  const { getToken, isLoaded: isAuthLoaded, isSignedIn } = useClerkAuth();
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();

  const user = useMemo(() => {
    const nextUser = mapClerkUser(clerkUser);
    if (!nextUser) {
      return null;
    }

    return {
      ...nextUser,
      is_admin: isAdminEmail(nextUser.email),
    };
  }, [clerkUser]);
  const isLoaded = isAuthLoaded && isUserLoaded;
  const isAuthenticated = Boolean(isSignedIn && user);
  const isAdmin = Boolean(user?.is_admin);
  const isLoadingAuth = !isLoaded;
  const authError = isLoaded && !isAuthenticated
    ? {
        type: "auth_required",
        message: "Authentication required",
      }
    : null;

  useEffect(() => {
    setAuthAdapter({
      getToken,
      isLoaded,
      openSignIn: (redirectUrl = window.location.href) =>
        clerk.openSignIn({
          fallbackRedirectUrl: normalizeRedirectUrl(redirectUrl, window.location.href),
          forceRedirectUrl: normalizeRedirectUrl(redirectUrl, window.location.href),
        }),
      signOut: (redirectUrl = window.location.origin) =>
        clerk.signOut({ redirectUrl: normalizeRedirectUrl(redirectUrl, window.location.origin) }),
      user,
    });
  }, [clerk, getToken, isLoaded, user]);

  const logout = (shouldRedirect = true) =>
    shouldRedirect
      ? clerk.signOut({ redirectUrl: window.location.origin })
      : clerk.signOut();

  const navigateToLogin = (redirectUrl = window.location.href) =>
    clerk.openSignIn({
      fallbackRedirectUrl: normalizeRedirectUrl(redirectUrl, window.location.href),
      forceRedirectUrl: normalizeRedirectUrl(redirectUrl, window.location.href),
    });

  return (
    <AuthContext.Provider
      value={{
        appPublicSettings: null,
        authError,
        checkAppState: async () => {},
        isAuthenticated,
        isAdmin,
        isLoadingAuth,
        isLoadingPublicSettings: false,
        logout,
        navigateToLogin,
        user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
