import { describe, expect, it } from "vitest";
import type { BookingDetails } from "@quickhotels/types/bookings";
import { buildMime } from "../mail/mime.js";
import { flightTicketPdf } from "./flight-ticket.pdf.js";
import { hotelVoucherPdf } from "./hotel-voucher.pdf.js";
import { plain } from "./pdf.js";

const inr = (amount: number) => ({ amount, currency: "INR" });

const booking = {
  reference: "QH-ABC234", status: "confirmed", supplierConfirmation: "HC-998", bookedAt: "2026-11-09T10:00:00.000Z",
  hotel: { id: "h1", name: "Sea Breeze Resort", city: "Goa", imageUrl: null, address: "Baga Beach Road", starRating: 4, latitude: null, longitude: null },
  checkIn: "2026-12-01", checkOut: "2026-12-03", nights: 2, rooms: 1, adults: 2, children: 1, total: inr(9100),
  roomsBooked: [{ name: "Deluxe Sea View", mealPlan: "BREAKFAST", adults: 2, childAges: [5], guests: [
    { title: "Ms", firstName: "Asha", lastName: "Rao", child: false, lead: true },
    { title: "Mr", firstName: "Ravi", lastName: "Rao", child: false, lead: false },
    { title: "Master", firstName: "Kiran", lastName: "Rao", child: true, lead: false },
  ] }],
  price: { total: inr(9100), taxes: inr(900), discount: inr(100) },
  payment: { status: "paid", method: "upi", amount: inr(9100), at: "2026-11-09T10:00:00.000Z" },
  cancellationPolicy: { refundable: true, freeCancellationUntil: "2026-11-28T12:00", charges: [{ from: "2026-11-28T12:00", to: "2026-12-01T12:00", amount: inr(4600) }] },
  cancellation: null, refunds: [], timeline: [], contact: { email: "a@example.com", phone: "+91 9876543210" }, specialRequests: "High floor",
} as unknown as BookingDetails;

describe("PDF documents", () => {
  it("builds a hotel voucher", async () => {
    const pdf = await hotelVoucherPdf(booking);
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(2000);
  });

  it("builds a flight e-ticket", async () => {
    const segment = { airlineCode: "6E", airlineName: "IndiGo", flightNumber: "6E 6045", from: "HYD", to: "CCU", departAt: "2026-12-01T05:45", arriveAt: "2026-12-01T08:05", durationMins: 140 };
    const pdf = await flightTicketPdf({
      journeys: [{ from: "HYD", to: "CCU", departAt: segment.departAt, arriveAt: segment.arriveAt, durationMins: 140, stops: 0, segments: [segment] }],
      travellers: [{ type: "adult", title: "Mr", firstName: "Ravi", lastName: "Kumar" }] as never,
      contact: { email: "r@example.com", phoneCode: "+91", phone: "9876543210" },
      booking: { bookingId: "TJS1", pnrs: [{ route: "HYD-CCU", pnr: "ABC123" }], tickets: [{ traveller: "Mr Ravi Kumar", route: "HYD-CCU", ticket: "0981234567" }], failureReason: null, refund: null },
      paid: inr(6100),
    });
    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("keeps text drawable in the built-in font", () => {
    expect(plain("₹4,100 · HYD → CCU")).toBe("Rs. 4,100 · HYD - CCU");
  });

  it("attaches files to emails as multipart/mixed", () => {
    const raw = buildMime({ from: "a@b.c", to: "d@e.f", subject: "Hi", text: "t", html: "<p>h</p>", attachments: [{ filename: "voucher QH-1.pdf", contentType: "application/pdf", content: Buffer.from("%PDF-1.3") }] });
    expect(raw).toContain("multipart/mixed");
    expect(raw).toContain('filename="voucher_QH-1.pdf"');
    expect(raw).toContain(Buffer.from("%PDF-1.3").toString("base64"));
  });
});
