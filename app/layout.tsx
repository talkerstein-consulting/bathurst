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
  title: "Talkerstein Consulting Group · Find your way to the right customers",
  description:
    "We build bespoke systems that use AI, automation, and technology to create a clearer path between your business and the right customers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jost.variable} ${cheltenham.variable} ${slowly.variable} antialiased`}>
      <body>
        <LineSystem />
        {children}
      </body>
    </html>
  );
}
