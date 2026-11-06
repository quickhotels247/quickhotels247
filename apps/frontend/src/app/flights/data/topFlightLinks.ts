import type { FlightLinkGroup } from "./types";

// "Top flights from India": plain search links, good for SEO.
const routes: [string, string, string, string][] = [
  ["DEL", "New Delhi", "BOM", "Mumbai"],
  ["BOM", "Mumbai", "DEL", "New Delhi"],
  ["BLR", "Bengaluru", "DEL", "New Delhi"],
  ["HYD", "Hyderabad", "BOM", "Mumbai"],
  ["DEL", "New Delhi", "GOI", "Goa"],
  ["MAA", "Chennai", "BLR", "Bengaluru"],
  ["BOM", "Mumbai", "DXB", "Dubai"],
  ["DEL", "New Delhi", "BKK", "Bangkok"],
  ["BLR", "Bengaluru", "SIN", "Singapore"],
];

export const topFlightLinkGroups: FlightLinkGroup[] = [
  {
    id: "routes",
    label: "Popular routes",
    links: routes.map(([from, fromCity, to, toCity]) => ({ label: `${fromCity} → ${toCity}`, from, to })),
  },
  {
    id: "cities",
    label: "Cities",
    links: [
      ["Goa", "GOI"], ["Mumbai", "BOM"], ["New Delhi", "DEL"], ["Bengaluru", "BLR"], ["Hyderabad", "HYD"],
      ["Chennai", "MAA"], ["Kolkata", "CCU"], ["Kochi", "COK"], ["Jaipur", "JAI"], ["Dubai", "DXB"],
      ["Bangkok", "BKK"], ["Singapore", "SIN"],
    ].map(([city, code]) => ({ label: `Flights to ${city}`, to: code })),
  },
  {
    id: "countries",
    label: "Countries",
    links: [
      ["United Arab Emirates", "DXB"], ["Thailand", "BKK"], ["Singapore", "SIN"], ["Malaysia", "KUL"],
      ["Indonesia", "DPS"], ["Maldives", "MLE"], ["United Kingdom", "LHR"], ["United States", "JFK"],
    ].map(([country, code]) => ({ label: `Flights to ${country}`, to: code })),
  },
  {
    id: "airports",
    label: "Airports",
    links: [
      ["DEL", "Indira Gandhi International"], ["BOM", "Chhatrapati Shivaji Maharaj International"],
      ["BLR", "Kempegowda International"], ["HYD", "Rajiv Gandhi International"], ["MAA", "Chennai International"],
      ["CCU", "Netaji Subhas Chandra Bose International"], ["GOX", "Manohar International (Mopa)"], ["COK", "Cochin International"],
    ].map(([code, name]) => ({ label: `Flights to ${name} (${code})`, to: code })),
  },
];
