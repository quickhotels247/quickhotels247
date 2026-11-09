import type { SupplierHotelBooking, SupplierHotelGuests } from "../hotel-supplier.js";

// Our guests as TripJack's hotel Book request (instant booking, v3).
export function toTripjackHotelBook(bookingId: string, amount: number, guests: SupplierHotelGuests) {
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
