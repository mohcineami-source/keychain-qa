import type { Metadata, Viewport } from "next";
// Cairo is self-hosted from /public/fonts/cairo/* (see app/globals.css).
// No external fetch from fonts.googleapis.com at build or runtime.
import "./globals.css";
import { config } from "@/lib/config";
import { copy } from "@/data/copy";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloatingButton } from "@/components/layout/WhatsAppFloatingButton";
import { TrackingProvider } from "@/components/tracking/TrackingProvider";

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: `${copy.brand.nameAr} | keychain.qa`,
    template: `%s | ${copy.brand.nameAr}`,
  },
  description: copy.offer.description,
  openGraph: {
    title: copy.brand.nameAr,
    description: copy.offer.description,
    url: config.siteUrl,
    locale: "ar_QA",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#8A1538",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Preload the Arabic variable font — used by every Arabic page above the fold */}
        <link
          rel="preload"
          href="/fonts/cairo/cairo-arabic-variable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans flex min-h-screen flex-col">
        <TrackingProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <WhatsAppFloatingButton />
        </TrackingProvider>
      </body>
    </html>
  );
}
