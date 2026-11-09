import type { BookingDetails } from "@quickhotels/types/bookings";
import { PdfWriter, SUPPORT_EMAIL, longDate, rupees } from "./pdf.js";

const MEAL = (plan: string | null) => (plan ? plan.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : "Room only");
const indiaTime = (local: string) => {
  const [day = "", time = ""] = local.split("T");
  return `${longDate(day)}, ${time.slice(0, 5)}`;
};

// The hotel voucher: what the guest shows at check-in. Only for confirmed bookings.
export async function hotelVoucherPdf(booking: BookingDetails): Promise<Buffer> {
  const pdf = new PdfWriter(`Hotel voucher ${booking.reference}`, `${booking.hotel.name}, ${booking.checkIn}`);
  pdf.header("Hotel voucher");
  pdf.headline("Booking reference", booking.reference, "CONFIRMED");
  if (booking.supplierConfirmation) pdf.row("Hotel confirmation no.", booking.supplierConfirmation, true);
  pdf.row("Booked on", longDate(booking.bookedAt));

  pdf.section("Hotel");
  pdf.text(booking.hotel.name, { bold: true, size: 13 });
  if (booking.hotel.starRating) pdf.text(`${booking.hotel.starRating}-star hotel`, { muted: true });
  const place = [booking.hotel.address, booking.hotel.city].filter(Boolean).join(", ");
  if (place) pdf.text(place);

  pdf.section("Your stay");
  pdf.row("Check-in", longDate(booking.checkIn), true);
  pdf.row("Check-out", longDate(booking.checkOut), true);
  pdf.row("Length of stay", `${booking.nights} night${booking.nights === 1 ? "" : "s"}`);
  pdf.row("Rooms", `${booking.rooms} · ${booking.adults} adult${booking.adults === 1 ? "" : "s"}${booking.children ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""}`);

  pdf.section("Rooms and guests");
  pdf.table(
    [
      { title: "Room", share: 0.08 },
      { title: "Room type", share: 0.32 },
      { title: "Meals", share: 0.2 },
      { title: "Guests", share: 0.4 },
    ],
    booking.roomsBooked.map((room, i) => [
      String(i + 1),
      room.name,
      MEAL(room.mealPlan),
      room.guests.map((guest) => `${[guest.title, guest.firstName, guest.lastName].filter(Boolean).join(" ")}${guest.child ? " (child)" : ""}${guest.lead ? " (lead)" : ""}`).join("\n") || "—",
    ]),
  );
  if (booking.specialRequests) pdf.row("Special requests", `${booking.specialRequests} (subject to availability)`);

  pdf.section("Payment");
  pdf.row("Total paid", rupees(booking.price.total), true);
  if (booking.price.discount.amount > 0) pdf.row("Discount", rupees(booking.price.discount));
  pdf.row("Status", booking.payment?.status === "paid" ? "Paid online in full" : (booking.payment?.status ?? "Paid"));
  pdf.text("The room charges are paid. The hotel may ask for a deposit or charge for extras (minibar, meals not included, local taxes) directly.", { muted: true, size: 9 });

  pdf.section("Cancellation policy");
  const policy = booking.cancellationPolicy;
  if (!policy || (!policy.refundable && !policy.charges.length)) pdf.text("Non-refundable: no refund if cancelled or not used.");
  else {
    if (policy.freeCancellationUntil) pdf.text(`Free cancellation until ${indiaTime(policy.freeCancellationUntil)} (India time).`);
    for (const charge of policy.charges.filter((item) => item.amount.amount > 0)) {
      pdf.text(`From ${indiaTime(charge.from)}: cancellation charge ${rupees(charge.amount)}.`, { size: 9 });
    }
  }

  pdf.section("Good to know");
  pdf.bullets([
    "Show this voucher (printed or on your phone) and a government photo ID for every adult guest at check-in.",
    "Check-in and check-out times are set by the hotel; ask the hotel for early check-in or late check-out.",
    "Couples may need to show proof of identity; some hotels don't accept local IDs. Check the hotel's policies on your booking page.",
    `Lead guest contact: ${booking.contact.email} · ${booking.contact.phone}`,
  ]);
  pdf.footer(`Need help? Email ${SUPPORT_EMAIL} with your booking reference ${booking.reference}. QuickHotels24/7 acts as a booking agent for the hotel.`);
  return pdf.toBuffer();
}
