import { registerAs } from "@nestjs/config";

export interface MailConfig {
  // Gmail API over HTTPS (Render blocks SMTP ports). Used when all three are set.
  gmail: { clientId: string; clientSecret: string; refreshToken: string } | null;
  // SMTP, for hosts that allow it. Used when Gmail isn't set up.
  host?: string;
  port: number;
  user?: string;
  pass?: string;
  from: string;
}

function gmailFromEnv(): MailConfig["gmail"] {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();
  return clientId && clientSecret && refreshToken ? { clientId, clientSecret, refreshToken } : null;
}

export const mailConfig = registerAs("mail", (): MailConfig => ({
  gmail: gmailFromEnv(),
  host: process.env.SMTP_HOST || undefined,
  port: Number(process.env.SMTP_PORT ?? 587),
  user: process.env.SMTP_USER || undefined,
  pass: process.env.SMTP_PASS || undefined,
  // Gmail only sends as the signed-in account, so MAIL_FROM must use that address.
  from:
    process.env.MAIL_FROM ||
    (process.env.SMTP_USER ? `QuickHotels24/7 <${process.env.SMTP_USER}>` : "QuickHotels24/7 <no-reply@example.com>"),
}));
