import JsonLd from "@/components/seo/JsonLd";
import { CONTACT_EMAIL, SITE_NAME, SITE_URL } from "@/config/site";

// Who we are, for search engines (schema.org Organization and WebSite).
export default function HomeJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "TravelAgency",
            "@id": `${SITE_URL}/#organization`,
            name: SITE_NAME,
            url: SITE_URL,
            logo: `${SITE_URL}/icon.png`,
            email: CONTACT_EMAIL,
            areaServed: "IN",
          },
          { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, publisher: { "@id": `${SITE_URL}/#organization` }, inLanguage: "en-IN" },
        ],
      }}
    />
  );
}
