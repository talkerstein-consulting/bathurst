import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import LineSystem from "@/components/style/LineSystem";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Brand faces: WOFF2 subsets (Latin + typographic punctuation) of the client files kept at the project root
const cheltenham = localFont({
  src: "./fonts/CheltenhamStdBoldCond.woff2",
  variable: "--font-chelt",
  weight: "700",
  display: "swap",
});
const slowly = localFont({
  src: "./fonts/SlowlySignature.woff2",
  variable: "--font-slowly",
  display: "swap",
  preload: false,   // only the accent script and the closing signature line use it, so it loads on demand
});

const SITE = "https://talkerstein.com";
const TITLE = "Toronto Web Design, AI & Automation Consulting | Talkerstein";
const DESCRIPTION =
  "Talkerstein helps Toronto businesses grow through web design, AI, automation, branding and strategic consulting. Explore our work along Bathurst Street, from North York to Thornhill.";
const OG_IMAGE = { url: "/brand/og-bathurst.jpg", width: 1200, height: 630, alt: "A vintage illustration of Bathurst Street in Toronto, with a streetcar and brick storefronts" };

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Talkerstein Consulting Group",
  alternates: { canonical: "/" },
  keywords: ["Toronto web design", "AI consulting Toronto", "business automation", "branding", "SEO", "North York", "GTA"],
  openGraph: { type: "website", siteName: "Talkerstein Consulting Group", locale: "en_CA", url: "/", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: [OG_IMAGE.url] },
  robots: { index: true, follow: true },
  // favicons: app/favicon.ico + app/icon.png + app/apple-icon.png (the TCG lion mark) are picked up by file convention
};

export const viewport: Viewport = { themeColor: "#19254A", colorScheme: "light" };

// Local business entity for search engines: the same name, address and phone the footer shows
const LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "Talkerstein Consulting Group",
  url: "https://talkerstein.com",
  telephone: "+1-416-937-7676",
  email: "hi@talkerstein.ca",
  address: { "@type": "PostalAddress", streetAddress: "5050 Dufferin Street", addressLocality: "Toronto", addressRegion: "ON", postalCode: "M3H 5T5", addressCountry: "CA" },
  areaServed: ["Toronto", "North York", "Greater Toronto Area"],
  knowsAbout: ["Web design", "Web development", "SEO", "Branding", "Business automation", "AI implementation", "Business consulting"],
  sameAs: ["https://www.instagram.com/talkersteinconsulting", "https://www.facebook.com/Talkersteinconsulting/", "https://clutch.co/profile/talkerstein-consulting"],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${cheltenham.variable} ${slowly.variable} antialiased`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS) }} />
        <LineSystem />
        {children}
      </body>
    </html>
  );
}
