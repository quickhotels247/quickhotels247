import HomeJsonLd from "./home/HomeJsonLd";
import HomePage from "./home/HomePage";

// Rebuilt hourly, so the seasonal hero and picks change with the month
// without a new deploy.
export const revalidate = 3600;

export default function Page() {
  return (
    <>
      <HomeJsonLd />
      <HomePage />
    </>
  );
}
