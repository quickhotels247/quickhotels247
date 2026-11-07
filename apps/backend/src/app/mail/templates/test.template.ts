import type { MailMessage } from "../mail.service.js";
import { renderEmail } from "./layout.js";

// Admin console "Send test email": checks sending end to end.
export function testEmail(to: string): MailMessage {
  const sent = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });
  return {
    to,
    subject: "QuickHotels24/7 test email",
    text: `Email sending works. Sent ${sent} IST.`,
    html: renderEmail({
      preheader: "Email sending works.",
      heading: "Email sending works",
      paragraphs: [`This test email was sent from the admin console on ${sent} IST.`],
    }),
  };
}
