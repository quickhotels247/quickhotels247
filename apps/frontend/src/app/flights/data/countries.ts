import { flightImages } from "./images";
import type { FlightCountry } from "./types";

// "Explore by country": each tile searches flights to the country's main airport.
export const flightCountries: FlightCountry[] = [
  { id: "india", name: "India", flagCode: "in", mainAirport: "GOI", imageUrl: flightImages.goa },
  { id: "uae", name: "United Arab Emirates", flagCode: "ae", mainAirport: "DXB", imageUrl: flightImages.dubai },
  { id: "thailand", name: "Thailand", flagCode: "th", mainAirport: "BKK", imageUrl: flightImages.bangkok },
  { id: "singapore", name: "Singapore", flagCode: "sg", mainAirport: "SIN", imageUrl: flightImages.singapore },
  { id: "uk", name: "United Kingdom", flagCode: "gb", mainAirport: "LHR", imageUrl: flightImages.london },
  { id: "maldives", name: "Maldives", flagCode: "mv", mainAirport: "MLE", imageUrl: flightImages.maldives },
];
