import { describe, expect, it } from "vitest";
import { toHotelBooking, toTripjackHotelBook } from "./tripjack-hotel-booking.mapper.js";

describe("TripJack hotel booking mapping", () => {
  it("builds the instant Book request per room", () => {
    const request = toTripjackHotelBook("TGS1", 4210.5, {
      rooms: [{ guests: [{ title: "Mr", firstName: "Ravi", lastName: "Kumar", child: false, pan: "ABCDE1234F" }, { title: "Master", firstName: "Aru", lastName: "Kumar", child: true }] }],
      contact: { email: "ravi@example.com", phoneCode: "+91", phone: "98765 43210" },
    });
    expect(request).toEqual({
      bookingId: "TGS1",
      type: "HOTEL",
      roomTravellerInfo: [{ travellerInfo: [{ ti: "Mr", pt: "ADULT", fN: "Ravi", lN: "Kumar", pan: "ABCDE1234F" }, { ti: "Master", pt: "CHILD", fN: "Aru", lN: "Kumar" }] }],
      deliveryInfo: { emails: ["ravi@example.com"], contacts: ["9876543210"], code: ["+91"] },
      paymentInfos: [{ amount: 4210.5 }],
    });
  });

  it("reads the status and the hotel's confirmation number", () => {
    expect(toHotelBooking({ order: { bookingId: "TJ9", status: "SUCCESS" }, hotelConfirmationNumber: "HCN123" })).toEqual({ status: "SUCCESS", confirmation: "HCN123", supplierReference: "TJ9" });
    expect(toHotelBooking({ order: { status: "in_progress" } })).toMatchObject({ status: "IN_PROGRESS", confirmation: null });
  });
});
