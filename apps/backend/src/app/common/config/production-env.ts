// In production, a missing setting must stop the server at startup instead of
// letting it run half-broken (website calls to localhost). Development keeps working with defaults.
const REQUIRED_IN_PRODUCTION = ["CORS_ORIGINS", "FRONTEND_URL", "DATABASE_URL"];

// Worth a warning, but the server works without them.
const RECOMMENDED_IN_PRODUCTION = ["CLERK_SECRET_KEY", "TRUST_PROXY"];

export function checkProductionEnv(env: NodeJS.ProcessEnv = process.env) {
  const missing: string[] = [];
  const warnings: string[] = [];
  if (env.NODE_ENV !== "production") return { missing, warnings };

  const value = (name: string) => env[name]?.trim() ?? "";
  for (const name of REQUIRED_IN_PRODUCTION) if (!value(name)) missing.push(name);
  // The sample supplier's made-up hotels must never reach real customers.
  if (value("HOTEL_SUPPLIER") !== "tripjack") missing.push("HOTEL_SUPPLIER=tripjack");
  else if (!value("TRIPJACK_API_KEY")) missing.push("TRIPJACK_API_KEY");

  for (const name of RECOMMENDED_IN_PRODUCTION) {
    if (!value(name)) warnings.push(`${name} is not set`);
  }
  // Sign-up codes come from Clerk, so the site runs without email; our own
  // emails need SMTP (blocked on Render) or the Gmail API settings.
  const gmail = ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"].every((name) => value(name));
  if (!value("SMTP_HOST") && !gmail) warnings.push("no email sending configured (GMAIL_* or SMTP_HOST)");
  for (const name of ["CORS_ORIGINS", "FRONTEND_URL"]) {
    if (/localhost|127\.0\.0\.1/.test(value(name))) warnings.push(`${name} points at localhost`);
  }
  if (value("FRONTEND_URL").includes(",")) {
    warnings.push("FRONTEND_URL should be one URL; put multiple website origins in CORS_ORIGINS");
  }
  return { missing, warnings };
}
