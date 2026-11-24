import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import { GrungeDefs } from "@/components/tcg/grunge";
import "./globals.css";

/* Jost is the body face; Cheltenham and Slowly Signature are self-hosted in
   globals.css because they are licensed files, not Google fonts. */
const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-jost",
});

export const metadata: Metadata = {
  title: "TCG — Talkerstein Consulting Group",
  description:
    "Consulting for owner-run businesses: strategy, custom development, AI and automation — planned, built, and seen through.",
};

export const viewport: Viewport = {
  themeColor: "#F3F7F3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={jost.variable}>
      <body>
        <GrungeDefs />
        {children}
      </body>
    </html>
  );
}
