import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import SiteLayout from "@/components/layout/SiteLayout";
import { SITE_IMAGE, SITE_NAME, SITE_URL } from "@/config/site";
import AuthProvider from "@/lib/auth/AuthProvider";
import WishlistProvider from "@/lib/wishlist/WishlistProvider";
import ClerkSetup from "@/lib/auth/ClerkSetup";
import ThemeRegistry from "@/theme/ThemeRegistry";

// Inter for reading; Plus Jakarta Sans for headings, prices and the brand voice.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-heading", display: "swap" });

const DESCRIPTION = "Book hotels and flights across India and abroad with live prices, clear cancellation terms and secure checkout.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Hotels and flights`, template: `%s | ${SITE_NAME}` },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: `${SITE_NAME} — Hotels and flights`,
    description: DESCRIPTION,
    url: "/",
    images: [{ url: SITE_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: { card: "summary_large_image", title: `${SITE_NAME} — Hotels and flights`, description: DESCRIPTION, images: [SITE_IMAGE] },
};

export const viewport: Viewport = {
  themeColor: "#1a56db",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <ThemeRegistry>
          <ClerkSetup>
            <AuthProvider>
              <WishlistProvider>
                <SiteLayout>{children}</SiteLayout>
              </WishlistProvider>
            </AuthProvider>
          </ClerkSetup>
        </ThemeRegistry>
      </body>
    </html>
  );
}
