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

// Brand faces (client-supplied files in app/fonts)
const cheltenham = localFont({
  src: "./fonts/CheltenhamStdBoldCond.otf",
  variable: "--font-chelt",
  weight: "700",
  display: "swap",
});
const slowly = localFont({
  src: "./fonts/SlowlySignature.ttf",
  variable: "--font-slowly",
  display: "swap",
  preload: false,   // 141 KB; only the closing signature line uses it, far down the page, so it loads on demand
});

export const metadata: Metadata = {
  title: "Talkerstein Consulting Group · Find your way to the right customers",
  description:
    "We build bespoke systems that use AI, automation, and technology to create a clearer path between your business and the right customers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${cheltenham.variable} ${slowly.variable} antialiased`}>
      <head>
        {/* the map's data starts downloading with the page (the engine fetches the same URLs) */}
        <link rel="preload" href="/map/bathurst-osm.tcgm.gz" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/map/bathurst-topo.tcgt.gz" as="fetch" crossOrigin="anonymous" />
      </head>
      <body>
        <LineSystem />
        {children}
      </body>
    </html>
  );
}
