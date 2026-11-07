import type { FlightTravellerDetails } from "@quickhotels/types/flight-checkout";
import type { SupplierFlightBooking } from "../../flight-supplier.js";

const PAX_TYPE = { adult: "ADULT", child: "CHILD", infant: "INFANT" } as const;
const phone = (code: string, number: string) => `${code}${number}`.replace(/\s+/g, "");

// Our traveller details as TripJack's Air Book request (instant booking).
export function toTripjackBook(bookingId: string, amount: number, details: FlightTravellerDetails) {
  return {
    bookingId,
    paymentInfos: [{ amount }],
    travellerInfo: details.travellers.map((traveller) => ({
      ti: traveller.title,
      pt: PAX_TYPE[traveller.type],
      fN: traveller.firstName,
      lN: traveller.lastName,
      ...(traveller.dateOfBirth ? { dob: traveller.dateOfBirth } : {}),
      ...(traveller.passport
        ? {
            pNum: traveller.passport.number,
            pNat: traveller.passport.nationality,
            ...(traveller.passport.expiry ? { eD: traveller.passport.expiry } : {}),
            ...(traveller.passport.issueDate ? { pid: traveller.passport.issueDate } : {}),
          }
        : {}),
      ...(traveller.pan ? { pan: traveller.pan } : {}),
    })),
    deliveryInfo: { emails: [details.contact.email], contacts: [phone(details.contact.phoneCode, details.contact.phone)] },
    ...(details.emergencyContact
      ? { contactInfo: { ecn: details.emergencyContact.name, contacts: [phone(details.emergencyContact.phoneCode, details.emergencyContact.phone)], emails: [details.contact.email] } }
      : {}),
    ...(details.gst
      ? {
          gstInfo: {
            gstNumber: details.gst.number,
            registeredName: details.gst.companyName.slice(0, 35),
            ...(details.gst.email ? { email: details.gst.email } : {}),
            ...(details.gst.phone ? { mobile: details.gst.phone } : {}),
            ...(details.gst.address ? { address: details.gst.address.slice(0, 70) } : {}),
          },
        }
      : {}),
  };
}

interface TripjackTravellerInfo {
  fN?: string;
  lN?: string;
  pnrDetails?: Record<string, string>;
  ticketNumberDetails?: Record<string, string>;
}

export interface TripjackBookingDetailsResponse {
  order?: { bookingId?: string; status?: string };
  itemInfos?: { AIR?: { travellerInfos?: TripjackTravellerInfo[] } };
  travellerInfos?: TripjackTravellerInfo[];
}

// Booking Details → status, airline PNRs per route and ticket numbers.
export function toFlightBooking(response: TripjackBookingDetailsResponse): SupplierFlightBooking {
  const travellers = response.itemInfos?.AIR?.travellerInfos ?? response.travellerInfos ?? [];
  const pnrs = new Map<string, string>();
  const tickets: SupplierFlightBooking["tickets"] = [];
  for (const traveller of travellers) {
    for (const [route, pnr] of Object.entries(traveller.pnrDetails ?? {})) if (pnr) pnrs.set(route, pnr);
    const name = [traveller.fN, traveller.lN].filter(Boolean).join(" ");
    for (const [route, ticket] of Object.entries(traveller.ticketNumberDetails ?? {})) if (ticket) tickets.push({ traveller: name, route, ticket });
  }
  return {
    status: (response.order?.status ?? "PENDING").toUpperCase(),
    pnrs: [...pnrs].map(([route, pnr]) => ({ route, pnr })),
    tickets,
  };
}
