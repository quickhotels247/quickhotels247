import type { Destination } from "@quickhotels/types/hotels";

// Shapes used only by the home page's sections.

export type TripTheme = "beaches" | "hills" | "heritage" | "cities";

export interface IndiaDestination extends Destination {
  state: string;
  themes: TripTheme[];
}

export interface PropertyType {
  id: string; // the value sent as ?propertyType= to search
  label: string;
  imageUrl: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  imageUrl: string;
}


export interface LinkGroup {
  id: string;
  label: string;
  links: { label: string; destination: string }[];
}
