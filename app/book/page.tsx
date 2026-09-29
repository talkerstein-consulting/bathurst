import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT } from "@/lib/bathurst/data";

export const metadata: Metadata = {
  title: "Start a Conversation | Talkerstein Consulting Group, Toronto",
  description: "Tell us about your business and where you want to go next. Talkerstein works with businesses across Toronto and the GTA on websites, branding, SEO, automation and AI.",
};

const GOALS: Record<string, string> = {
  engagement: "Engagement", sales: "Sales", marketing: "Marketing", leads: "Lead generation",
  retention: "Customer retention", operations: "Operations & automation", awareness: "Brand awareness",
};

/**
 * Booking: where the map's last step (Find Your Way Forward) lands with ?from=&goal=, and a Services coupon with ?service=.
 * TODO(booking): the full booking flow replaces this placeholder.
 */
export default async function BookPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const q = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const from = one(q.from), goal = GOALS[one(q.goal)] ?? "", service = one(q.service);   // ?service= from a Services coupon
  return (
    <main className="book">
      <Link href="/" className="book-back">← Back to the map</Link>
      <div className="book-card frame">
        <p className="eyebrow">Find your next move</p>
        <h1 className="h2">Let’s see where you’re going.</h1>
        <p className="book-note">Tell us a little about your business, what you’re trying to change, and where you want to go next. We’ll use it to understand whether we’re the right fit and where we can help.</p>
        {service && <dl className="book-route"><div><dt>Inquiry</dt><dd>{service}</dd></div></dl>}
        {(from || goal) && (
          <dl className="book-route">
            <div><dt>From</dt><dd>{from || "Your business"}</dd></div>
            <div><dt>To</dt><dd>{goal || "Your destination"}</dd></div>
          </dl>
        )}
        <p className="book-note">The full booking page is on its way. Until then, reach our team directly and we will map your route.</p>
        <div className="book-ctas">
          <a className="book-btn" href={`mailto:${CONTACT.email}?subject=${encodeURIComponent(service ? `Inquiry: ${service}` : `Booking: ${from || "my business"}${goal ? ` → ${goal}` : ""}`)}`}>Email {CONTACT.email}</a>
          <a className="book-link" href={CONTACT.tel}>Call {CONTACT.phone}</a>
        </div>
        <p className="book-fine">A few questions first. No hard sell.</p>
      </div>
    </main>
  );
}
