import { homeImages } from "@/app/home/data/images";

// Places with a "Hotels in …" landing page (/hotels/in/<slug>). Short,
// factual descriptions; prices and hotels always come from a live search.
export interface CityPage {
  slug: string;
  name: string;
  // Shown under the name and used in the search: "Goa, India".
  country: string;
  region: string | null;
  blurb: string;
  imageUrl: string | null;
  group: "india" | "international";
}

const india = (slug: string, name: string, region: string | null, blurb: string, imageUrl: string | null = null): CityPage => ({ slug, name, country: "India", region, blurb, imageUrl, group: "india" });
const abroad = (slug: string, name: string, country: string, blurb: string, imageUrl: string | null = null): CityPage => ({ slug, name, country, region: null, blurb, imageUrl, group: "international" });

export const CITY_PAGES: CityPage[] = [
  india("goa", "Goa", null, "Beaches, beach shacks and Portuguese-era churches, with stays from beach huts to large resorts.", homeImages.goa),
  india("mumbai", "Mumbai", "Maharashtra", "India's financial capital by the Arabian Sea, from business hotels to stays near Marine Drive.", homeImages.mumbai),
  india("new-delhi", "New Delhi", "Delhi", "The capital, close to India Gate, Connaught Place and the city's Mughal monuments.", homeImages.delhi),
  india("bengaluru", "Bengaluru", "Karnataka", "A garden city and tech hub with business hotels, serviced apartments and boutique stays."),
  india("hyderabad", "Hyderabad", "Telangana", "Home of the Charminar and biryani, with stays around HITEC City, Banjara Hills and the old city."),
  india("chennai", "Chennai", "Tamil Nadu", "A coastal city on the Bay of Bengal, known for Marina Beach, temples and South Indian food."),
  india("jaipur", "Jaipur", "Rajasthan", "The Pink City of forts and palaces, from heritage havelis to modern hotels.", homeImages.jaipur),
  india("udaipur", "Udaipur", "Rajasthan", "The city of lakes, with palace hotels and stays overlooking Lake Pichola."),
  india("kochi", "Kochi", "Kerala", "A port city with Chinese fishing nets, Fort Kochi's old streets and a gateway to the backwaters."),
  india("pune", "Pune", "Maharashtra", "A student and IT city near the Western Ghats, with business hotels and weekend getaways."),
  india("kolkata", "Kolkata", "West Bengal", "The City of Joy, known for its colonial architecture, food and culture."),
  india("manali", "Manali", "Himachal Pradesh", "A Himalayan hill station for mountain views, adventure sports and cosy cottages.", homeImages.manali),
  india("agra", "Agra", "Uttar Pradesh", "Home of the Taj Mahal and Agra Fort, with stays a short drive from both.", homeImages.agra),
  india("shimla", "Shimla", "Himachal Pradesh", "A colonial-era hill station with the Mall Road and toy-train views.", homeImages.shimla),
  india("darjeeling", "Darjeeling", "West Bengal", "Tea gardens, the toy train and views of Kanchenjunga on clear mornings.", homeImages.darjeeling),
  india("kerala", "Kerala", null, "Backwaters, beaches and hill stations, from houseboats to Ayurveda resorts.", homeImages.kerala),
  india("rajasthan", "Rajasthan", null, "Desert forts, palace hotels and colourful cities like Jaipur, Udaipur and Jodhpur."),
  india("himachal-pradesh", "Himachal Pradesh", null, "Mountain towns such as Manali, Shimla and Dharamshala, for cool air and Himalayan views."),
  india("uttarakhand", "Uttarakhand", null, "Rishikesh, Nainital, Mussoorie and the Himalayan foothills."),
  india("kashmir", "Kashmir", null, "Srinagar's houseboats on Dal Lake, Gulmarg and Pahalgam."),
  india("andaman-islands", "Andaman Islands", "Andaman and Nicobar", "Clear water and island beaches at Havelock and Neil, reached via Port Blair.", homeImages.andaman),
  india("sikkim", "Sikkim", null, "Gangtok, monasteries and mountain lakes in the eastern Himalaya."),
  india("coorg", "Coorg", "Karnataka", "Coffee plantations and misty hills, with homestays and plantation resorts."),
  india("ooty", "Ooty", "Tamil Nadu", "A Nilgiri hill station with tea estates, lakes and the mountain railway."),
  abroad("dubai", "Dubai", "United Arab Emirates", "Skyscrapers, desert trips and beach resorts, a short flight from India.", homeImages.dubai),
  abroad("bangkok", "Bangkok", "Thailand", "Temples, street food and riverside hotels in Thailand's capital."),
  abroad("singapore", "Singapore", "Singapore", "A compact city of gardens, hawker food and stays from Marina Bay to Little India."),
  abroad("bali", "Bali", "Indonesia", "Rice terraces, temples and beach villas across Ubud, Seminyak and Nusa Dua.", homeImages.bali),
  abroad("kuala-lumpur", "Kuala Lumpur", "Malaysia", "The Petronas Towers, shopping and food in Malaysia's capital."),
  abroad("phuket", "Phuket", "Thailand", "Thailand's largest island, known for beaches and island-hopping trips."),
  abroad("london", "London", "United Kingdom", "Museums, theatres and neighbourhood stays across the UK's capital."),
  abroad("paris", "Paris", "France", "The Eiffel Tower, cafés and museums, with hotels in every arrondissement.", homeImages.paris),
  abroad("colombo", "Colombo", "Sri Lanka", "Sri Lanka's seaside capital and a start point for the island's beaches and hills."),
  abroad("kathmandu", "Kathmandu", "Nepal", "Temples, old squares and a base for Himalayan treks."),
  abroad("maldives", "Maldives", "Maldives", "Island resorts and overwater villas in the Indian Ocean."),
  abroad("new-york", "New York", "United States", "Manhattan, Brooklyn and beyond, from boutique hotels to Times Square stays.", homeImages.newYork),
];

export const citySlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const cityBySlug = (slug: string) => CITY_PAGES.find((city) => city.slug === slug) ?? null;
export const cityPagePath = (name: string) => {
  const city = CITY_PAGES.find((page) => page.name.toLowerCase() === name.toLowerCase());
  return city ? `/hotels/in/${city.slug}` : null;
};
