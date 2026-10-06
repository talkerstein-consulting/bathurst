import type { Metadata } from "next";
import Link from "next/link";
import BookingForm from "@/components/bathurst/BookingForm";
import RiseHeading from "@/components/style/RiseHeading";
import "@/app/bathurst-map.css";   // the route rail and the branded dropdown are drawn by the map's styles

export const metadata: Metadata = {
  title: "Get Directions | Talkerstein Consulting Group, Toronto",
  description: "Tell us where your business is and where you want it to go. Talkerstein works with businesses across Toronto and the GTA on websites, branding, SEO, automation and AI.",
  alternates: { canonical: "/book" },   // the root layout's canonical is "/", so this page needs its own
  openGraph: { title: "Get Directions | Talkerstein Consulting Group, Toronto", url: "/book" },
};

/**
 * Get directions: every "Get directions" on the site lands here. The map's last step arrives with ?from=&goal=,
 * a Services card with ?service=; the form (components/bathurst/BookingForm.tsx) starts from those.
 */
export default async function BookPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  return (
    <main className="book">
      <header className="book-top">
        <Link href="/" className="book-brand" aria-label="Talkerstein Consulting Group, back to the map"><span className="tcg-logo" aria-hidden="true" /></Link>
        <Link href="/" className="book-back">← Back to the map</Link>
      </header>
      <div className="book-head">
        <p className="eyebrow rise-after">Get directions</p>
        <RiseHeading text="Let’s map your route." className="h2 book-title" delay={100} />
        <p className="book-note rise-after" style={{ "--rise-delay": "420ms" } as React.CSSProperties}>
          Three quick stops: where your business is today, where you want it to go, and how to reach you. We’ll reply within one business day with your first step.
        </p>
      </div>
      <div className="rise-after" style={{ "--rise-delay": "560ms" } as React.CSSProperties}>
        <BookingForm initial={{ from: one(q.from), goal: one(q.goal), service: one(q.service) }} />
      </div>
    </main>
  );
}
