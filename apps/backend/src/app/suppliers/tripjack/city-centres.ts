import type { LatLng } from "../../common/utils/geo.js";

// The landmark visitors think of as the centre of popular destinations, keyed
// by TripJack region name and country. Elsewhere distances are measured from
// the middle of the area's hotels.
const LANDMARKS: Record<string, { name: string } & LatLng> = {
  "NEW DELHI|INDIA": { name: "Connaught Place", lat: 28.6315, lng: 77.2167 },
  "MUMBAI|INDIA": { name: "CST Mumbai", lat: 18.94, lng: 72.8353 },
  "HYDERABAD|INDIA": { name: "Charminar", lat: 17.3616, lng: 78.4747 },
  "BENGALURU|INDIA": { name: "MG Road", lat: 12.9757, lng: 77.6055 },
  "CHENNAI|INDIA": { name: "Chennai Central", lat: 13.0828, lng: 80.2753 },
  "KOLKATA|INDIA": { name: "Park Street", lat: 22.5535, lng: 88.3525 },
  "PUNE|INDIA": { name: "Shaniwar Wada", lat: 18.5195, lng: 73.8553 },
  "JAIPUR|INDIA": { name: "Hawa Mahal", lat: 26.9239, lng: 75.8267 },
  "AGRA|INDIA": { name: "Taj Mahal", lat: 27.1751, lng: 78.0421 },
  "GOA|INDIA": { name: "Panaji", lat: 15.4909, lng: 73.8278 },
  "PANAJI|INDIA": { name: "Panaji", lat: 15.4909, lng: 73.8278 },
  "UDAIPUR|INDIA": { name: "City Palace", lat: 24.5764, lng: 73.6835 },
  "JODHPUR|INDIA": { name: "Mehrangarh Fort", lat: 26.2978, lng: 73.0185 },
  "JAISALMER|INDIA": { name: "Jaisalmer Fort", lat: 26.9124, lng: 70.9126 },
  "VARANASI|INDIA": { name: "Dashashwamedh Ghat", lat: 25.3071, lng: 83.0104 },
  "AMRITSAR|INDIA": { name: "Golden Temple", lat: 31.62, lng: 74.8765 },
  "MANALI|INDIA": { name: "Mall Road", lat: 32.2432, lng: 77.1892 },
  "SHIMLA|INDIA": { name: "The Ridge", lat: 31.1046, lng: 77.1734 },
  "KOCHI|INDIA": { name: "Fort Kochi", lat: 9.9658, lng: 76.2421 },
  "DARJEELING|INDIA": { name: "Chowrasta", lat: 27.0417, lng: 88.2663 },
  "RISHIKESH|INDIA": { name: "Laxman Jhula", lat: 30.126, lng: 78.329 },
  "DUBAI|UNITED ARAB EMIRATES": { name: "Burj Khalifa", lat: 25.1972, lng: 55.2744 },
  "PARIS|FRANCE": { name: "the Louvre", lat: 48.8606, lng: 2.3376 },
  "LONDON|UNITED KINGDOM": { name: "Trafalgar Square", lat: 51.508, lng: -0.1281 },
  "NEW YORK|UNITED STATES": { name: "Times Square", lat: 40.758, lng: -73.9855 },
  "SINGAPORE|SINGAPORE": { name: "Marina Bay", lat: 1.2834, lng: 103.8607 },
  "BANGKOK|THAILAND": { name: "the Grand Palace", lat: 13.75, lng: 100.4913 },
};

export function landmarkFor(regionName: string, countryName: string) {
  return LANDMARKS[`${regionName}|${countryName}`] ?? null;
}
