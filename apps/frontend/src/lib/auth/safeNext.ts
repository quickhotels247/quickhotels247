// Where to go after signing in. Only paths on this site are allowed, so a
// crafted link can't send someone to another site after they log in.
export function safeNext(next: string | null | undefined, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  // Never back into the sign-in pages themselves.
  if (/^\/(login|signup|sso-callback)(\/|\?|$)/.test(next)) return fallback;
  return next;
}
