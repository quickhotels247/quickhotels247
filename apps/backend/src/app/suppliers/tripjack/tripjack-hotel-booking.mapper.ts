import type { SupplierHotelBooking, SupplierHotelGuests } from "../hotel-supplier.js";

// Our company's GST registration, sent on rates that need it.
export interface TripjackGstInfo {
  gstNumber: string;
  registeredName: string;
}

// Our guests as TripJack's hotel Book request (instant booking, v3). PAN goes
// only with the guest it belongs to (we ask the main guest of each room):
// TripJack checks each PAN against that guest's name (error 1092).
export function toTripjackHotelBook(bookingId: string, amount: number, guests: SupplierHotelGuests, gstInfo: TripjackGstInfo | null = null) {
  return {
    bookingId,
    type: "HOTEL",
    roomTravellerInfo: guests.rooms.map((room) => ({
      travellerInfo: room.guests.map((guest) => ({
        ti: guest.title,
        pt: guest.child ? "CHILD" : "ADULT",
        fN: guest.firstName,
        lN: guest.lastName,
        ...(guest.pan ? { pan: guest.pan } : {}),
        ...(guest.passportNumber ? { pNum: guest.passportNumber } : {}),
      })),
    })),
    deliveryInfo: {
      emails: [guests.contact.email],
      contacts: [guests.contact.phone.replace(/\s+/g, "")],
      code: [guests.contact.phoneCode],
    },
    ...(gstInfo ? { gstInfo } : {}),
    paymentInfos: [{ amount }],
  };
}

export interface TripjackHotelBookingDetails {
  order?: { bookingId?: string; status?: string };
  hotelConfirmationNumber?: string;
}

export function toHotelBooking(response: TripjackHotelBookingDetails): SupplierHotelBooking {
  const status = (response.order?.status ?? "PENDING").toUpperCase();
  return {
    status,
    confirmation: status === "SUCCESS" ? response.hotelConfirmationNumber ?? response.order?.bookingId ?? null : null,
    supplierReference: response.order?.bookingId ?? null,
  };
}
