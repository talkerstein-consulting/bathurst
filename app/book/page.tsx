import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@/lib/bathurst/data";

export const metadata: Metadata = { title: "Book · Talkerstein Consulting Group" };

const GOALS: Record<string, string> = {
  engagement: "Engagement", sales: "Sales", marketing: "Marketing", leads: "Lead generation",
  retention: "Customer retention", operations: "Operations & automation", awareness: "Brand awareness",
};

/**
 * Booking: where "Get directions" on the map's last step (Find Your Way Forward) lands, with ?from=&goal=.
 * TODO(booking): the full booking flow replaces this placeholder.
 */
export default async function BookPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const from = one(q.from), goal = GOALS[one(q.goal)] ?? "";
  return (
    <main className="book">
      <Link href="/" className="book-back">← Back to the map</Link>
      <div className="book-card frame">
        <p className="eyebrow">Booking</p>
        <h1 className="h2">Find Your Way Forward</h1>
        {(from || goal) && (
          <dl className="book-route">
            <div><dt>From</dt><dd>{from || "Your business"}</dd></div>
            <div><dt>To</dt><dd>{goal || "Your destination"}</dd></div>
          </dl>
        )}
        <p className="book-note">The full booking page is on its way. Until then, reach our team directly and we will map your route.</p>
        <div className="book-ctas">
          <a className="book-btn" href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(`Booking: ${from || "my business"}${goal ? ` → ${goal}` : ""}`)}`}>Email {CONTACT.email}</a>
          <a className="book-link" href={CONTACT.tel}>Call {CONTACT.phone}</a>
        </div>
      </div>
    </main>
  );
}
