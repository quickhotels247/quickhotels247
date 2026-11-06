import type { Airport } from "@quickhotels/types/flights";

// Major airports for the From / To fields. Replace with TripJack's airport
// list once the flights API is connected; codes are IATA.
export const airports: Airport[] = [
  { code: "DEL", city: "New Delhi", name: "Indira Gandhi International", country: "India" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International", country: "India" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda International", country: "India" },
  { code: "MAA", city: "Chennai", name: "Chennai International", country: "India" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International", country: "India" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose International", country: "India" },
  { code: "GOI", city: "Goa", name: "Dabolim", country: "India" },
  { code: "GOX", city: "Goa", name: "Manohar International (Mopa)", country: "India" },
  { code: "COK", city: "Kochi", name: "Cochin International", country: "India" },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel International", country: "India" },
  { code: "PNQ", city: "Pune", name: "Pune", country: "India" },
  { code: "JAI", city: "Jaipur", name: "Jaipur International", country: "India" },
  { code: "DXB", city: "Dubai", name: "Dubai International", country: "United Arab Emirates" },
  { code: "SIN", city: "Singapore", name: "Changi", country: "Singapore" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi", country: "Thailand" },
  { code: "KUL", city: "Kuala Lumpur", name: "Kuala Lumpur International", country: "Malaysia" },
  { code: "DPS", city: "Bali", name: "Ngurah Rai International", country: "Indonesia" },
  { code: "MLE", city: "Malé", name: "Velana International", country: "Maldives" },
  { code: "LHR", city: "London", name: "Heathrow", country: "United Kingdom" },
  { code: "JFK", city: "New York", name: "John F. Kennedy International", country: "United States" },
];

export const airportByCode = (code: string) => airports.find((airport) => airport.code === code) ?? null;
