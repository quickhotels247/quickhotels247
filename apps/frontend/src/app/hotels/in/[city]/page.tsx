import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CityLandingPage from "../CityLandingPage";
import { CITY_PAGES, cityBySlug } from "../data/cities";

// Built ahead of time for each place; other slugs are 404s.
export const dynamicParams = false;
export const generateStaticParams = () => CITY_PAGES.map((city) => ({ city: city.slug }));

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
  const city = cityBySlug((await params).city);
  if (!city) return {};
  const title = `Hotels in ${city.name}`;
  const description = `Compare hotels in ${city.name}${city.country !== city.name ? `, ${city.country}` : ""} with live prices and clear cancellation terms. ${city.blurb}`;
  return {
    title,
    description,
    alternates: { canonical: `/hotels/in/${city.slug}` },
    openGraph: { title, description, url: `/hotels/in/${city.slug}`, ...(city.imageUrl ? { images: [{ url: city.imageUrl }] } : {}) },
  };
}

export default async function Page({ params }: { params: Promise<{ city: string }> }) {
  const city = cityBySlug((await params).city);
  if (!city) notFound();
  return <CityLandingPage city={city} />;
}
