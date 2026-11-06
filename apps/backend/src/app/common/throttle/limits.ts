// Per-client-address limits for routes attackers aim at: password guessing,
// email sending (protects the SMTP quota) and searches (protect supplier quotas). Use as
// @Throttle(LIMITS.login). Everything else gets the global default.
const per = (limit: number, minutes: number) => ({
  default: { limit, ttl: minutes * 60_000 },
});

export const LIMITS = {
  // Password sign-in (users and admins).
  login: per(10, 1),
  // Sends an email.
  sendEmail: per(5, 10),
  // Other sign-up steps and account security changes.
  sensitive: per(20, 10),
  // Creating the first admin.
  setup: per(5, 60),
  // Hotel searches call the supplier, which has its own rate limits.
  search: per(30, 1),
  // Destination suggestions: one request per pause in typing; served from our database.
  suggest: per(120, 1),
};
