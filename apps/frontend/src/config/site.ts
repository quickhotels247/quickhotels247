export const SITE_NAME = "QuickHotels24/7";
// The public address of the site (canonical links, sitemap, share previews).
// A deployment setting: NEXT_PUBLIC_SITE_URL at build time, e.g. the
// workers.dev address until the own domain is live.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://quickhotels247.com").replace(/\/+$/, "");
// Default share image (Open Graph / Twitter).
export const SITE_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&h=630&q=80";
export const CONTACT_EMAIL = "quickhotels247@gmail.com";
// The terms version customers accept at checkout. Keep in step with the
// backend's TERMS_VERSION (features/checkout/checkout.service.ts).
export const TERMS_VERSION = "2026-11-05";
