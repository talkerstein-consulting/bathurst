import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Toronto Web Design, AI & Automation Consulting | Talkerstein",
  description:
    "Talkerstein helps Toronto businesses grow through web design, AI, automation, branding and strategic consulting. Based in North York, serving businesses across the GTA.",
};

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
