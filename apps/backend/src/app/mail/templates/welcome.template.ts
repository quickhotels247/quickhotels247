import type { MailMessage } from "../mail.service.js";
import { escapeHtml, renderEmail } from "./layout.js";

// Sent once, when a customer's account is created (email or Google sign-up).
export function welcomeEmail(to: string, firstName: string): MailMessage {
  const site = process.env.FRONTEND_URL?.split(",")[0]?.trim() || "https://quickhotels247.com";
  const name = firstName.trim() || "there";
  return {
    to,
    subject: `Welcome to QuickHotels24/7, ${name}`,
    text: [
      `Hi ${name},`,
      "",
      "Welcome to QuickHotels24/7. Your account is ready.",
      "Search hotels and flights, save the hotels you like, and keep your trips in one place.",
      "",
      `Start exploring: ${site}`,
      "",
      "If you didn't create this account, reply to this email and we'll help.",
    ].join("\n"),
    html: renderEmail({
      preheader: "Your account is ready. Find your next stay.",
      heading: `Welcome, ${name}!`,
      paragraphs: [
        "Your QuickHotels24/7 account is ready.",
        "Search hotels and flights across India and abroad, save the hotels you like with the heart, and add the people you travel with to book faster.",
      ],
      button: { label: "Find your stay", url: site },
      note: `You're getting this because an account was created for ${escapeHtml(to)}. If that wasn't you, reply to this email.`,
    }),
  };
}
