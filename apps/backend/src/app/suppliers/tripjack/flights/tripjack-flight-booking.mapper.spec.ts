import { describe, expect, it } from "vitest";
import { toFlightBooking, toTripjackBook } from "./tripjack-flight-booking.mapper.js";

describe("TripJack flight booking mapping", () => {
  it("builds the instant Book request", () => {
    const request = toTripjackBook("TJS1", 5864, {
      travellers: [
        { type: "adult", title: "Mr", firstName: "Ravi", lastName: "Kumar", pan: "ABCDE1234F" },
        { type: "infant", title: "Master", firstName: "Aru", lastName: "Kumar", dateOfBirth: "2025-06-01" },
      ],
      contact: { email: "ravi@example.com", phoneCode: "+91", phone: "98765 43210" },
      acceptTerms: true,
    });
    expect(request).toMatchObject({
      bookingId: "TJS1",
      paymentInfos: [{ amount: 5864 }],
      deliveryInfo: { emails: ["ravi@example.com"], contacts: ["+919876543210"] },
    });
    expect(request.travellerInfo).toEqual([
      { ti: "Mr", pt: "ADULT", fN: "Ravi", lN: "Kumar", pan: "ABCDE1234F" },
      { ti: "Master", pt: "INFANT", fN: "Aru", lN: "Kumar", dob: "2025-06-01" },
    ]);
  });

  it("reads PNRs and tickets from Booking Details", () => {
    const booking = toFlightBooking({
      order: { bookingId: "TJS1", status: "SUCCESS" },
      itemInfos: { AIR: { travellerInfos: [
        { fN: "Ravi", lN: "Kumar", pnrDetails: { "HYD-CCU": "ABC123" }, ticketNumberDetails: { "HYD-CCU": "098-1234567890" } },
        { fN: "Aru", lN: "Kumar", pnrDetails: { "HYD-CCU": "ABC123" } },
      ] } },
    });
    expect(booking).toEqual({ status: "SUCCESS", pnrs: [{ route: "HYD-CCU", pnr: "ABC123" }], tickets: [{ traveller: "Ravi Kumar", route: "HYD-CCU", ticket: "098-1234567890" }] });
  });
});
