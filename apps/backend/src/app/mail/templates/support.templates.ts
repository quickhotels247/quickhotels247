import type { MailMessage } from "../mail.service.js";
import { escapeHtml, renderEmail } from "./layout.js";

const TOPICS: Record<string, string> = {
  booking: "A booking",
  cancellation: "Cancelling or changing a booking",
  payment: "Payment or refund",
  flight: "Flights",
  account: "My account",
  other: "Something else",
};
export const topicLabel = (topic: string) => TOPICS[topic] ?? topic;
const paragraphs = (text: string) => text.split(/\n{2,}/).map((part) => escapeHtml(part).replace(/\n/g, "<br>"));

// To the customer: we got your message.
export function ticketReceivedEmail(ticket: { reference: string; name: string; email: string; topic: string; message: string }): MailMessage {
  const name = ticket.name.trim() || "there";
  return {
    to: ticket.email,
    subject: `We've got your message (${ticket.reference})`,
    text: [
      `Hi ${name},`,
      "",
      `Thanks for contacting QuickHotels24/7. Your request number is ${ticket.reference}.`,
      "Our team will reply to this email address. You can reply to this email to add anything.",
      "",
      `Topic: ${topicLabel(ticket.topic)}`,
      "Your message:",
      ticket.message,
    ].join("\n"),
    html: renderEmail({
      preheader: `Request ${ticket.reference}: we'll reply by email.`,
      heading: "We've got your message",
      paragraphs: [
        `Hi ${escapeHtml(name)}, thanks for contacting us. Your request number is <b>${escapeHtml(ticket.reference)}</b>.`,
        "Our team will reply to this email address. To add anything, just reply to this email.",
        `<span style="color:#64748b">Topic: ${escapeHtml(topicLabel(ticket.topic))}</span>`,
        `<span style="display:block;padding:12px 14px;background:#f5f7fb;border-radius:10px">${paragraphs(ticket.message).join("<br><br>")}</span>`,
      ],
    }),
  };
}

// To the support inbox: a new request.
export function ticketAlertEmail(to: string, adminUrl: string, ticket: { reference: string; name: string; email: string; phone: string | null; topic: string; bookingReference: string | null; message: string }): MailMessage {
  const lines = [
    `From: ${ticket.name} <${ticket.email}>${ticket.phone ? `, ${ticket.phone}` : ""}`,
    `Topic: ${topicLabel(ticket.topic)}`,
    ...(ticket.bookingReference ? [`Booking: ${ticket.bookingReference}`] : []),
  ];
  return {
    to,
    subject: `New support request ${ticket.reference}: ${topicLabel(ticket.topic)}`,
    text: [...lines, "", ticket.message, "", `Open in admin: ${adminUrl}`].join("\n"),
    html: renderEmail({
      preheader: `${ticket.name}: ${ticket.message.slice(0, 80)}`,
      heading: `New request ${ticket.reference}`,
      paragraphs: [...lines.map(escapeHtml), ...paragraphs(ticket.message)],
      button: { label: "Open in admin", url: adminUrl },
    }),
  };
}

// To the customer: a reply from our team.
export function ticketReplyEmail(ticket: { reference: string; name: string | null; email: string }, reply: string, agent: string | null): MailMessage {
  const name = ticket.name?.trim() || "there";
  return {
    to: ticket.email,
    subject: `Re: your request ${ticket.reference}`,
    text: [`Hi ${name},`, "", reply, "", `${agent ?? "The QuickHotels24/7 team"}`, `Request ${ticket.reference}`].join("\n"),
    html: renderEmail({
      preheader: reply.slice(0, 90),
      heading: `About your request ${ticket.reference}`,
      paragraphs: [`Hi ${escapeHtml(name)},`, ...paragraphs(reply), `— ${escapeHtml(agent ?? "The QuickHotels24/7 team")}`],
      note: "Reply to this email if you need anything else.",
    }),
  };
}
