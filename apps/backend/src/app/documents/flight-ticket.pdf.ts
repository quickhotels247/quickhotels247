import type { FlightBookingResult, FlightTravellerDetails } from "@quickhotels/types/flight-checkout";
import type { FlightJourney } from "@quickhotels/types/flights";
import { PdfWriter, SUPPORT_EMAIL, longDate, rupees } from "./pdf.js";

export interface FlightTicketInput {
  journeys: FlightJourney[];
  travellers: FlightTravellerDetails["travellers"];
  contact: FlightTravellerDetails["contact"];
  booking: FlightBookingResult;
  paid: { amount: number; currency: string };
}

const time = (local: string) => local.slice(11, 16);
const duration = (mins: number) => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
const TYPE = { adult: "Adult", child: "Child", infant: "Infant" } as const;

// The e-ticket: PNRs, flights and ticket numbers per traveller.
export async function flightTicketPdf({ journeys, travellers, contact, booking, paid }: FlightTicketInput): Promise<Buffer> {
  const pnrs = [...new Set(booking.pnrs.map((item) => item.pnr))];
  const pdf = new PdfWriter(`E-ticket ${pnrs.join(", ") || booking.bookingId}`, journeys.map((leg) => `${leg.from}-${leg.to}`).join(", "));
  pdf.header("Flight e-ticket");
  pdf.headline(pnrs.length > 1 ? "Airline PNRs" : "Airline PNR", pnrs.join(" / ") || "Pending", "CONFIRMED");
  for (const item of booking.pnrs) if (pnrs.length > 1 || booking.pnrs.length > 1) pdf.row(item.route, item.pnr, true);
  pdf.row("Booking reference", booking.bookingId);

  journeys.forEach((leg, i) => {
    pdf.section(`${journeys.length > 1 ? `Flight ${i + 1}: ` : ""}${leg.from} to ${leg.to} · ${longDate(leg.departAt)}`);
    pdf.table(
      [
        { title: "Flight", share: 0.24 },
        { title: "Departs", share: 0.27 },
        { title: "Arrives", share: 0.27 },
        { title: "Duration", share: 0.22 },
      ],
      leg.segments.map((segment) => [
        `${segment.airlineName}\n${segment.flightNumber}`,
        `${segment.from} ${time(segment.departAt)}\n${longDate(segment.departAt)}`,
        `${segment.to} ${time(segment.arriveAt)}\n${longDate(segment.arriveAt)}`,
        duration(segment.durationMins),
      ]),
    );
    pdf.text(`${leg.stops ? `${leg.stops} stop${leg.stops === 1 ? "" : "s"}` : "Non-stop"} · total ${duration(leg.durationMins)}`, { muted: true, size: 9 });
  });

  pdf.section("Travellers");
  pdf.table(
    [
      { title: "Traveller", share: 0.42 },
      { title: "Type", share: 0.14 },
      { title: "Ticket numbers", share: 0.44 },
    ],
    travellers.map((traveller) => {
      const name = `${traveller.firstName} ${traveller.lastName}`.toLowerCase();
      const tickets = booking.tickets.filter((ticket) => ticket.traveller.toLowerCase().includes(name)).map((ticket) => `${ticket.route}: ${ticket.ticket}`);
      return [`${traveller.title} ${traveller.firstName} ${traveller.lastName}`, TYPE[traveller.type], tickets.join("\n") || "Issued with the PNR"];
    }),
  );

  pdf.section("Payment");
  pdf.row("Total paid", rupees(paid), true);

  pdf.section("Good to know");
  pdf.bullets([
    "Carry a government photo ID (passport for international flights) matching the names above.",
    "Check in online with the airline using your PNR. Airport check-in usually closes 45-60 minutes before domestic and 60-75 minutes before international departures.",
    "Baggage allowance, seat and meal rules follow the airline's fare conditions.",
    "Changes and cancellations follow the fare rules shown when you booked; contact us before the flight.",
    `Contact on this booking: ${contact.email} · ${contact.phoneCode} ${contact.phone}`,
  ]);
  pdf.footer(`Need help? Email ${SUPPORT_EMAIL} with your PNR. QuickHotels24/7 acts as a booking agent for the airline.`);
  return pdf.toBuffer();
}
