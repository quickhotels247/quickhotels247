import { describe, expect, it } from "vitest";
import { checkProductionEnv } from "./production-env.js";

const base = {
  NODE_ENV: "production",
  CORS_ORIGINS: "https://quickhotels247.com",
  FRONTEND_URL: "https://quickhotels247.com",
  DATABASE_URL: "postgresql://example",
  SMTP_HOST: "smtp.example.com",
};

describe("checkProductionEnv", () => {
  it("refuses the sample hotel supplier in production", () => {
    expect(checkProductionEnv({ ...base }).missing).toContain("HOTEL_SUPPLIER=tripjack");
  });

  it("needs a TripJack key when TripJack is the supplier", () => {
    expect(checkProductionEnv({ ...base, HOTEL_SUPPLIER: "tripjack" }).missing).toContain("TRIPJACK_API_KEY");
  });

  it("passes with TripJack configured", () => {
    expect(checkProductionEnv({ ...base, HOTEL_SUPPLIER: "tripjack", TRIPJACK_API_KEY: "key" }).missing).toEqual([]);
  });

  it("starts without email, with a warning until SMTP or Gmail is set", () => {
    const { SMTP_HOST: _smtp, ...noMail } = base;
    const ready = { ...noMail, HOTEL_SUPPLIER: "tripjack", TRIPJACK_API_KEY: "key" };
    expect(checkProductionEnv(ready).missing).toEqual([]);
    expect(checkProductionEnv(ready).warnings).toContain("no email sending configured (GMAIL_* or SMTP_HOST)");
    const gmail = { GMAIL_CLIENT_ID: "id", GMAIL_CLIENT_SECRET: "secret", GMAIL_REFRESH_TOKEN: "token" };
    expect(checkProductionEnv({ ...ready, ...gmail }).warnings).not.toContain("no email sending configured (GMAIL_* or SMTP_HOST)");
  });

  it("checks nothing outside production", () => {
    expect(checkProductionEnv({ NODE_ENV: "development" }).missing).toEqual([]);
  });
});
