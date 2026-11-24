import type { Metadata } from "next";
import { Stub } from "@/components/tcg/stub";

export const metadata: Metadata = { title: "Book an appointment — TCG" };

/**
 * PLACEHOLDER. A real route so the masthead's appointment control is live on
 * staging rather than greyed out. The booking flow is not built: no calendar,
 * no availability, no confirmation.
 */
export default function Book() {
  return (
    <Stub
      pre="Appointments"
      title="Booking is not connected yet."
      body="The appointment flow has not been built. Until it is, describe the problem in the box on the home page — that reaches us the same way, and sooner."
    />
  );
}
