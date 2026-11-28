import { homeImages } from "./images";

// What the home page shows by time of year in India: the hero's headline and
// slides, and "Best for this season" picks with popular areas (an area chip
// opens that city's results filtered to the area).

export type SeasonId = "winter" | "summer" | "monsoon" | "festive";

export interface SeasonSlide {
  destination: string; // searched as is
  caption: string;
  imageUrl: string;
}

export interface SeasonPick {
  destination: string;
  imageUrl: string;
  why: string;
  // Localities found in hotel addresses, for the area filter.
  areas: string[];
}

export interface Season {
  id: SeasonId;
  label: string;
  months: string;
  headline: string;
  subtitle: string;
  slides: SeasonSlide[];
  picks: SeasonPick[];
}

// Hero photos at full width (the tiles use 800 px).
const wide = (url: string) => url.replace(/w=\d+/, "w=1800");

export const seasons: Record<SeasonId, Season> = {
  winter: {
    id: "winter",
    label: "Winter",
    months: "Dec – Feb",
    headline: "Winter escapes, your way",
    subtitle: "Snow in the hills, sunshine on the beaches.",
    slides: [
      { destination: "Manali", caption: "Snowy Manali", imageUrl: wide(homeImages.manali) },
      { destination: "Goa", caption: "Goa's beach season", imageUrl: wide(homeImages.goa) },
      { destination: "Shimla", caption: "Shimla in winter", imageUrl: wide(homeImages.shimla) },
      { destination: "Jaipur", caption: "Jaipur's sunny winter days", imageUrl: wide(homeImages.jaipur) },
    ],
    picks: [
      { destination: "Manali", imageUrl: homeImages.manali, why: "Snow, cafés and mountain views", areas: ["Old Manali", "Vashisht"] },
      { destination: "Goa", imageUrl: homeImages.goa, why: "Peak beach season and New Year parties", areas: ["Baga", "Calangute", "Candolim"] },
      { destination: "Jaipur", imageUrl: homeImages.jaipur, why: "Forts and palaces in mild sunshine", areas: ["MI Road", "Amer"] },
      { destination: "Shimla", imageUrl: homeImages.shimla, why: "Colonial charm and winter walks", areas: ["Mall Road", "Kufri"] },
    ],
  },
  summer: {
    id: "summer",
    label: "Summer",
    months: "Mar – May",
    headline: "Beat the heat this summer",
    subtitle: "Cool hill stations and clear island waters.",
    slides: [
      { destination: "Manali", caption: "Cool mountain air in Manali", imageUrl: wide(homeImages.manali) },
      { destination: "Darjeeling", caption: "Tea gardens of Darjeeling", imageUrl: wide(homeImages.darjeeling) },
      { destination: "Shimla", caption: "Summer in Shimla", imageUrl: wide(homeImages.shimla) },
      { destination: "Andaman Islands", caption: "Calm seas in the Andamans", imageUrl: wide(homeImages.andaman) },
    ],
    picks: [
      { destination: "Manali", imageUrl: homeImages.manali, why: "Pleasant days and adventure sports", areas: ["Old Manali", "Vashisht"] },
      { destination: "Darjeeling", imageUrl: homeImages.darjeeling, why: "Tea estates and Himalayan sunrises", areas: ["Gandhi Road"] },
      { destination: "Shimla", imageUrl: homeImages.shimla, why: "Cool evenings on the ridge", areas: ["Mall Road", "Kufri"] },
      { destination: "Andaman Islands", imageUrl: homeImages.andaman, why: "Best time for snorkelling and diving", areas: ["Port Blair"] },
    ],
  },
  monsoon: {
    id: "monsoon",
    label: "Monsoon",
    months: "Jun – Sep",
    headline: "Monsoon getaways",
    subtitle: "Green hills, misty mornings and rain-washed retreats.",
    slides: [
      { destination: "Kerala", caption: "Kerala's backwaters in the rain", imageUrl: wide(homeImages.kerala) },
      { destination: "Goa", caption: "Green Goa, quieter beaches", imageUrl: wide(homeImages.goa) },
      { destination: "Mumbai", caption: "Mumbai in the monsoon", imageUrl: wide(homeImages.mumbai) },
      { destination: "Kerala", caption: "Rainy-day spa retreats", imageUrl: wide(homeImages.spa) },
    ],
    picks: [
      { destination: "Kerala", imageUrl: homeImages.kerala, why: "Backwaters, tea hills and Ayurveda", areas: ["Munnar", "Alappuzha", "Kochi"] },
      { destination: "Goa", imageUrl: homeImages.goa, why: "Lush green and off-season prices", areas: ["Panjim", "Candolim"] },
      { destination: "Mumbai", imageUrl: homeImages.mumbai, why: "Sea-facing stays to watch the rain", areas: ["Juhu", "Colaba", "Bandra"] },
    ],
  },
  festive: {
    id: "festive",
    label: "Festive season",
    months: "Oct – Nov",
    headline: "Festive season getaways",
    subtitle: "Heritage cities, lights and celebrations.",
    slides: [
      { destination: "Jaipur", caption: "Festive lights in Jaipur", imageUrl: wide(homeImages.jaipur) },
      { destination: "Agra", caption: "The Taj Mahal at its best", imageUrl: wide(homeImages.agra) },
      { destination: "New Delhi", caption: "Delhi's festive markets", imageUrl: wide(homeImages.delhi) },
      { destination: "Goa", caption: "Goa's season begins", imageUrl: wide(homeImages.goa) },
    ],
    picks: [
      { destination: "Jaipur", imageUrl: homeImages.jaipur, why: "Palaces, bazaars and festive lights", areas: ["MI Road", "Amer"] },
      { destination: "Agra", imageUrl: homeImages.agra, why: "Clear skies over the Taj Mahal", areas: ["Taj Ganj", "Fatehabad Road"] },
      { destination: "New Delhi", imageUrl: homeImages.delhi, why: "Markets, food and Diwali shopping", areas: ["Connaught Place", "Karol Bagh", "Paharganj"] },
      { destination: "Goa", imageUrl: homeImages.goa, why: "Shacks reopen and the sun returns", areas: ["Baga", "Calangute", "Candolim"] },
    ],
  },
};

// The season for a date, by the month in India.
export function seasonFor(date: Date): Season {
  const month = Number(new Intl.DateTimeFormat("en-IN", { month: "numeric", timeZone: "Asia/Kolkata" }).format(date));
  if (month === 12 || month <= 2) return seasons.winter;
  if (month <= 5) return seasons.summer;
  if (month <= 9) return seasons.monsoon;
  return seasons.festive;
}
