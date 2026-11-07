import { Suspense } from "react";
import type { Metadata } from "next";
import JsonLd from "@/components/seo/JsonLd";
import { hotelDescription, hotelForSeo } from "@/lib/seo/hotelSeo";
import HotelDetailsPage from "./HotelDetailsPage";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const hotel = await hotelForSeo(id);
  if (!hotel) return { title: "Hotel", description: "Photos, facilities, policies and live room prices on QuickHotels24/7." };
  const title = hotel.city ? `${hotel.name}, ${hotel.city}` : hotel.name;
  const description = hotelDescription(hotel);
  const image = hotel.images[0]?.url;
  return {
    title,
    description,
    // The same hotel with any dates is one page.
    alternates: { canonical: `/hotels/${hotel.id}` },
    openGraph: { title, description, url: `/hotels/${hotel.id}`, ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: image ? "summary_large_image" : "summary", title, description, ...(image ? { images: [image] } : {}) },
  };
}

// The page reads the stay from the URL in the browser; Suspense covers the
// moment before that. Structured data (schema.org Hotel) is rendered here.
export default async function Page({ params }: Props) {
  const { id } = await params;
  const hotel = await hotelForSeo(id);
  return (
    <>
      {hotel && (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Hotel",
            name: hotel.name,
            description: hotelDescription(hotel),
            ...(hotel.images.length ? { image: hotel.images.slice(0, 5).map((image) => image.url) } : {}),
            ...(hotel.address || hotel.city
              ? { address: { "@type": "PostalAddress", ...(hotel.address ? { streetAddress: hotel.address } : {}), ...(hotel.city ? { addressLocality: hotel.city } : {}), ...(hotel.country ? { addressCountry: hotel.country } : {}) } }
              : {}),
            ...(hotel.latitude != null && hotel.longitude != null ? { geo: { "@type": "GeoCoordinates", latitude: hotel.latitude, longitude: hotel.longitude } } : {}),
            ...(hotel.starRating ? { starRating: { "@type": "Rating", ratingValue: hotel.starRating } } : {}),
            ...(hotel.checkIn.from ? { checkinTime: hotel.checkIn.from } : {}),
            ...(hotel.checkOut.until ? { checkoutTime: hotel.checkOut.until } : {}),
            ...(hotel.facilities.length ? { amenityFeature: hotel.facilities.slice(0, 15).map((facility) => ({ "@type": "LocationFeatureSpecification", name: facility, value: true })) } : {}),
          }}
        />
      )}
      <Suspense>
        <HotelDetailsPage />
      </Suspense>
    </>
  );
}
