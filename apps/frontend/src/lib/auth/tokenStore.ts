// The QuickHotels24/7 session token, kept across visits in this browser.
// Storage can throw (private mode, blocked site data), so every access is
// guarded: without it the session lasts until the page reloads.
const TOKEN_KEY = "quickhotels.token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // The session still works until the page reloads.
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};
