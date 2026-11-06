// SAMPLE hotels for development only (HOTEL_SUPPLIER=mock). Names, ratings and
// prices are made up and placed in whatever city is searched. Production
// refuses to start with the mock supplier (spec §3.4: no fabricated content).
const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=75`;

export interface MockHotel {
  slug: string;
  name: string;
  rating: number;
  reviewCount: number;
  propertyType: string;
  mealPlan: string | null;
  freeCancellation: boolean;
  nightlyRate: number; // INR, before taxes
  imageId: string;
}

export const MOCK_HOTELS: MockHotel[] = [
  { slug: "grand-vista", name: "Grand Vista Resort", rating: 4.8, reviewCount: 12000, propertyType: "Resort", mealPlan: "Breakfast included", freeCancellation: true, nightlyRate: 9999, imageId: "1571896349842-33c89424de2d" },
  { slug: "city-central", name: "City Central Hotel", rating: 4.3, reviewCount: 3410, propertyType: "Hotel", mealPlan: null, freeCancellation: true, nightlyRate: 4299, imageId: "1611892440504-42a792e24d32" },
  { slug: "palm-cove", name: "Palm Cove Beach Hotel", rating: 4.6, reviewCount: 5300, propertyType: "Hotel", mealPlan: "Breakfast included", freeCancellation: false, nightlyRate: 7499, imageId: "1582719508461-905c673771fd" },
  { slug: "azure-bay", name: "Azure Bay Suites", rating: 4.7, reviewCount: 8400, propertyType: "Resort", mealPlan: "Breakfast and dinner", freeCancellation: true, nightlyRate: 12499, imageId: "1540541338287-41700207dee6" },
  { slug: "heritage-house", name: "Heritage House Homestay", rating: 4.5, reviewCount: 640, propertyType: "Homestay", mealPlan: "Breakfast included", freeCancellation: true, nightlyRate: 3499, imageId: "1505691938895-1758d7feb511" },
  { slug: "skyline-apartments", name: "Skyline Serviced Apartments", rating: 4.2, reviewCount: 1980, propertyType: "Apartment", mealPlan: null, freeCancellation: false, nightlyRate: 5899, imageId: "1522708323590-d24dbb6b0267" },
  { slug: "lagoon-retreat", name: "Lagoon Retreat & Spa", rating: 4.6, reviewCount: 3900, propertyType: "Resort", mealPlan: "Breakfast included", freeCancellation: true, nightlyRate: 8299, imageId: "1520250497591-112f2f40a3f4" },
  { slug: "hillside-villa", name: "Hillside Private Villa", rating: 4.9, reviewCount: 410, propertyType: "Villa", mealPlan: null, freeCancellation: false, nightlyRate: 15999, imageId: "1613490493576-7fde63acd811" },
];

export const mockImageUrl = (hotel: MockHotel) => unsplash(hotel.imageId);
