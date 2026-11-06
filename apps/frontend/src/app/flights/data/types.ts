// Shapes used only by the flights page's sections.

export interface PopularRoute {
  id: string;
  scope: "domestic" | "international";
  from: string; // IATA code
  to: string; // IATA code
  imageUrl: string;
}

export interface FlightCountry {
  id: string;
  name: string;
  flagCode: string; // ISO 3166 alpha-2, lower case, for the flag image
  mainAirport: string; // IATA code the tile searches to
  imageUrl: string;
}

export interface FlightLinkGroup {
  id: string;
  label: string;
  links: { label: string; from?: string; to: string }[];
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}
