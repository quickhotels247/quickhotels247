import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import SiteLayout from "@/components/layout/SiteLayout";
import { SITE_NAME, SITE_URL } from "@/config/site";
import AuthProvider from "@/lib/auth/AuthProvider";
import WishlistProvider from "@/lib/wishlist/WishlistProvider";
import ClerkSetup from "@/lib/auth/ClerkSetup";
import ThemeRegistry from "@/theme/ThemeRegistry";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} — Hotel booking`, template: `%s | ${SITE_NAME}` },
  description: "Search and book hotels with QuickHotels24/7.",
};

export const viewport: Viewport = {
  themeColor: "#1a56db",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
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
