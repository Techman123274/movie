/** @type {{
 *   isLoaded: boolean,
 *   user: null | {
 *     id: string,
 *     email: string,
 *     full_name: string,
 *     first_name: string,
 *     last_name: string,
 *     image_url: string,
 *     is_admin?: boolean,
 *   },
 *   getToken: ((options?: { template?: string }) => Promise<string | null>) | null,
 *   openSignIn: ((redirectUrl?: string) => unknown) | null,
 *   signOut: ((redirectUrl?: string) => unknown) | null,
 * }}
 */
let authState = {
  isLoaded: false,
  user: null,
  getToken: async (_options) => null,
  openSignIn: null,
  signOut: null,
};

const listeners = new Set();

export const mapClerkUser = (clerkUser) => {
  if (!clerkUser) {
    return null;
  }

  const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress || "";
  const fullName =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    primaryEmail ||
    "User";

  return {
    id: clerkUser.id,
    email: primaryEmail,
    full_name: fullName,
    first_name: clerkUser.firstName || "",
    last_name: clerkUser.lastName || "",
    image_url: clerkUser.imageUrl || "",
  };
};

export const setAuthAdapter = (nextState) => {
  authState = {
    ...authState,
    ...nextState,
  };

  listeners.forEach((listener) => listener(authState));
};

export const getAuthAdapter = () => authState;

export const waitForAuthLoaded = (timeoutMs = 15000) => {
  if (authState.isLoaded) {
    return Promise.resolve(authState);
  }

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      listeners.delete(handleChange);
      reject(new Error("Authentication did not finish loading in time."));
    }, timeoutMs);

    const handleChange = (nextState) => {
      if (!nextState.isLoaded) {
        return;
      }

      window.clearTimeout(timeout);
      listeners.delete(handleChange);
      resolve(nextState);
    };

    listeners.add(handleChange);
  });
};
