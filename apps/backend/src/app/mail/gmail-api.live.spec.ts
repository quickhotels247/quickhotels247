import { describe, expect, it } from "vitest";
import { testEmail } from "./templates/test.template.js";
import { welcomeEmail } from "./templates/welcome.template.js";
import { GmailApiTransport } from "./transports/gmail-api.transport.js";

// Sends real emails through Gmail. Runs only when asked:
//   MAIL_LIVE_TO=you@example.com yarn workspace @quickhotels/backend vitest run src/app/mail/gmail-api.live.spec.ts
const to = process.env.MAIL_LIVE_TO;
const { GMAIL_CLIENT_ID: clientId, GMAIL_CLIENT_SECRET: clientSecret, GMAIL_REFRESH_TOKEN: refreshToken, MAIL_FROM: from } = process.env;

describe.skipIf(!to || !clientId || !clientSecret || !refreshToken)("Gmail API (live)", () => {
  it("sends the test and welcome emails", async () => {
    const transport = new GmailApiTransport({ clientId: clientId!, clientSecret: clientSecret!, refreshToken: refreshToken! });
    const sender = from || "QuickHotels24/7 <quickhotels247@gmail.com>";
    expect(await transport.send({ from: sender, ...testEmail(to!) })).toBeTruthy();
    expect(await transport.send({ from: sender, ...welcomeEmail(to!, "Ankarao") })).toBeTruthy();
  }, 30_000);
});
