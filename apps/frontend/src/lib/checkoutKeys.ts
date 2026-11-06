// Each checkout opens only with a random key this browser made when the
// visitor pressed Reserve. Kept in sessionStorage: it lasts for the tab and
// goes when the tab closes, like the 15-minute checkout itself. Storage can be
// blocked, so every access is guarded; without it, a reload means starting again.

const PREFIX = "quickhotels.checkout.";

function newKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const read = (name: string) => {
  try {
    return sessionStorage.getItem(PREFIX + name);
  } catch {
    return null;
  }
};

const write = (name: string, value: string) => {
  try {
    sessionStorage.setItem(PREFIX + name, value);
  } catch {
    // The key still works for this page view.
  }
};

// The key for starting a checkout of this choice (a hotel rate, or a set of
// flights): the same one on a retry or reload, so the backend returns the
// same checkout instead of a second one.
export function startKey(...choice: string[]) {
  const name = `start.${choice.join(".")}`;
  const existing = read(name);
  if (existing) return existing;
  const key = newKey();
  write(name, key);
  return key;
}

export const rememberCheckout = (checkoutId: string, key: string) => write(`id.${checkoutId}`, key);
export const checkoutKeyFor = (checkoutId: string) => read(`id.${checkoutId}`);
