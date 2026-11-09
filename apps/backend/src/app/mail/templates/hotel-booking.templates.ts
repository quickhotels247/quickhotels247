import type { MailMessage } from "../mail.service.js";
import { escapeHtml, renderEmail } from "./layout.js";

const rupees = (money: { amount: number; currency: string }) => `₹${money.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const day = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export interface HotelMailInput {
  to: string;
  name: string;
  hotel: string;
  city: string | null;
  checkIn: string;
  checkOut: string;
  room: string;
  rooms: number;
  reference: string;
  confirmation: string | null;
  paid: { amount: number; currency: string };
  refund: { status: "pending" | "processed" | "failed"; amount: { amount: number; currency: string } } | null;
  link: string;
}

const stayLine = (input: HotelMailInput) =>
  `${input.hotel}${input.city ? `, ${input.city}` : ""} · ${day(input.checkIn)} → ${day(input.checkOut)} · ${input.rooms > 1 ? `${input.rooms} × ` : ""}${input.room}`;

// Booked: our reference and the hotel's confirmation number.
export function hotelConfirmedEmail(input: HotelMailInput): MailMessage {
  const confirmation = input.confirmation ? `Hotel confirmation number: ${input.confirmation}` : "The hotel's confirmation number will follow.";
  return {
    to: input.to,
    subject: `Booking confirmed: ${input.hotel} (${input.reference})`,
    text: [
      `Hi ${input.name},`,
      "",
      "Your stay is booked.",
      stayLine(input),
      "",
      `Booking reference: ${input.reference}`,
      confirmation,
      `Paid: ${rupees(input.paid)}`,
      "",
      `Your booking: ${input.link}`,
      "Carry a government photo ID for every adult guest at check-in.",
    ].join("\n"),
    html: renderEmail({
      preheader: `${input.reference} · ${input.hotel} · ${day(input.checkIn)}`,
      heading: "Your stay is booked",
      paragraphs: [
        `Hi ${escapeHtml(input.name)}, your booking is confirmed.`,
        escapeHtml(stayLine(input)),
        `<b>Booking reference:</b> ${escapeHtml(input.reference)}<br>${escapeHtml(confirmation)}`,
        `Paid ${escapeHtml(rupees(input.paid))}`,
        "Carry a government photo ID for every adult guest at check-in.",
      ],
      button: { label: "View your booking", url: input.link },
    }),
  };
}

// Couldn't book: nothing booked, refund on its way.
export function hotelFailedEmail(input: HotelMailInput): MailMessage {
  const refund = input.refund;
  const refundLine = !refund
    ? "If you were charged, we'll refund you in full."
    : refund.status === "failed"
      ? "We'll refund you in full; our team is processing it and will confirm by email."
      : `We've refunded ${rupees(refund.amount)} to your original payment method. Banks usually show it within 5–7 working days.`;
  return {
    to: input.to,
    subject: `We couldn't book ${input.hotel}: full refund`,
    text: [`Hi ${input.name},`, "", "The hotel couldn't confirm this booking, so nothing is booked.", stayLine(input), "", refundLine, "", `Details: ${input.link}`].join("\n"),
    html: renderEmail({
      preheader: "Nothing is booked, and your payment is refunded.",
      heading: "We couldn't book your stay",
      paragraphs: [
        `Hi ${escapeHtml(input.name)}, the hotel couldn't confirm this booking, so nothing is booked.`,
        escapeHtml(stayLine(input)),
        escapeHtml(refundLine),
        `Reference ${escapeHtml(input.reference)} · Paid ${escapeHtml(rupees(input.paid))}. Please search again for current prices.`,
      ],
      button: { label: "See details", url: input.link },
    }),
  };
}

export interface HotelCancelledInput {
  to: string;
  name: string;
  hotel: string;
  city: string | null;
  checkIn: string;
  checkOut: string;
  reference: string;
  refund: { status: "pending" | "processed" | "failed"; amount: { amount: number; currency: string } } | null;
  link: string;
}

// Cancelled with the hotel, and what's refunded.
export function hotelCancelledEmail(input: HotelCancelledInput): MailMessage {
  const stay = `${input.hotel}${input.city ? `, ${input.city}` : ""} · ${day(input.checkIn)} → ${day(input.checkOut)}`;
  const refundLine = !input.refund
    ? "Under the cancellation policy for this booking, no refund is due."
    : input.refund.status === "failed"
      ? `We'll refund ${rupees(input.refund.amount)}; our team is processing it and will confirm by email.`
      : `We've refunded ${rupees(input.refund.amount)} to your original payment method. Banks usually show it within 5–7 working days.`;
  return {
    to: input.to,
    subject: `Booking cancelled: ${input.hotel} (${input.reference})`,
    text: [`Hi ${input.name},`, "", `Your booking ${input.reference} is cancelled with the hotel.`, stay, "", refundLine, "", `Details: ${input.link}`].join("\n"),
    html: renderEmail({
      preheader: `${input.reference} is cancelled.`,
      heading: "Your booking is cancelled",
      paragraphs: [`Hi ${escapeHtml(input.name)}, booking <b>${escapeHtml(input.reference)}</b> is cancelled with the hotel.`, escapeHtml(stay), escapeHtml(refundLine)],
      button: { label: "See details", url: input.link },
    }),
  };
}
