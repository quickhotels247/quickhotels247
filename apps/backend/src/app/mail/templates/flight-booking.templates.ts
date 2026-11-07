import type { FlightBookingResult } from "@quickhotels/types/flight-checkout";
import type { FlightJourney } from "@quickhotels/types/flights";
import type { MailMessage } from "../mail.service.js";
import { escapeHtml, renderEmail } from "./layout.js";

const rupees = (money: { amount: number; currency: string }) => `₹${money.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const when = (local: string) => {
  const [day = "", time = ""] = local.split("T");
  const date = new Date(`${day}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return `${date}, ${time.slice(0, 5)}`;
};
const legLine = (leg: FlightJourney) => {
  const flights = leg.segments.map((segment) => segment.flightNumber).join(" + ");
  return `${leg.from} → ${leg.to} · ${when(leg.departAt)} · ${flights}`;
};

interface FlightMailInput {
  to: string;
  name: string;
  journeys: FlightJourney[];
  booking: FlightBookingResult;
  paid: { amount: number; currency: string };
  link: string;
}

// Ticketed: PNRs and ticket numbers.
export function flightConfirmedEmail({ to, name, journeys, booking, paid, link }: FlightMailInput): MailMessage {
  const pnrs = booking.pnrs.map((p) => `${p.route}: ${p.pnr}`);
  const tickets = booking.tickets.map((t) => `${t.traveller} (${t.route}): ${t.ticket}`);
  return {
    to,
    subject: `Flight booked: PNR ${booking.pnrs.map((p) => p.pnr).join(", ") || booking.bookingId}`,
    text: [
      `Hi ${name},`,
      "",
      "Your flight is booked and your tickets are issued.",
      ...journeys.map(legLine),
      "",
      `Airline PNR: ${pnrs.join(", ") || "on its way"}`,
      ...(tickets.length ? ["Tickets:", ...tickets] : []),
      `Booking reference: ${booking.bookingId}`,
      `Paid: ${rupees(paid)}`,
      "",
      `Your booking: ${link}`,
      "Carry a government photo ID. Check in online with the airline using your PNR.",
    ].join("\n"),
    html: renderEmail({
      preheader: `PNR ${booking.pnrs.map((p) => p.pnr).join(", ")} · ${journeys.map((leg) => `${leg.from}–${leg.to}`).join(", ")}`,
      heading: "Your flight is booked",
      paragraphs: [
        `Hi ${escapeHtml(name)}, your tickets are issued.`,
        journeys.map((leg) => escapeHtml(legLine(leg))).join("<br>"),
        `<b>Airline PNR:</b> ${escapeHtml(pnrs.join(", ") || "on its way")}`,
        ...(tickets.length ? [`<b>Tickets:</b><br>${tickets.map(escapeHtml).join("<br>")}`] : []),
        `Booking reference ${escapeHtml(booking.bookingId)} · Paid ${escapeHtml(rupees(paid))}`,
        "Carry a government photo ID. Check in online with the airline using your PNR.",
      ],
      button: { label: "View your booking", url: link },
    }),
  };
}

// Couldn't ticket: nothing booked, refund on its way.
export function flightFailedEmail({ to, name, journeys, booking, paid, link }: FlightMailInput): MailMessage {
  const refund = booking.refund;
  const refundLine = !refund
    ? "If you were charged, we'll refund you in full."
    : refund.status === "failed"
      ? "We'll refund you in full; our team is processing it and will confirm by email."
      : `We've refunded ${rupees(refund.amount)} to your original payment method. Banks usually show it within 5–7 working days.`;
  return {
    to,
    subject: "We couldn't book your flight: full refund",
    text: [`Hi ${name},`, "", "The airline couldn't issue tickets for this booking, so nothing is booked.", ...journeys.map(legLine), "", refundLine, "", `Details: ${link}`].join("\n"),
    html: renderEmail({
      preheader: "Nothing is booked, and your payment is refunded.",
      heading: "We couldn't book your flight",
      paragraphs: [
        `Hi ${escapeHtml(name)}, the airline couldn't issue tickets for this booking, so nothing is booked.`,
        journeys.map((leg) => escapeHtml(legLine(leg))).join("<br>"),
        escapeHtml(refundLine),
        `Paid: ${escapeHtml(rupees(paid))}. Please search again for current fares.`,
      ],
      button: { label: "See details", url: link },
    }),
  };
}
