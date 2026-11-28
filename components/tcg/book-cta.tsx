"use client";

import { Cta } from "./cta";

/**
 * "Book a review" on /check-2. Booking is stage 04 of the instrument, not a
 * route, so the press fires the same `tcg:book` event the top bar's appointment
 * control does (components/tcg/instrument.tsx) and the stage opens in place.
 * The href is the answer for anything that does not run this script.
 */
export function BookCta({ className = "" }: { className?: string }) {
  return (
    <Cta
      href="/check-2?stage=booking"
      primary
      className={className}
      label="Book a review"
      onActivate={(e) => {
        e.preventDefault();
        window.dispatchEvent(new Event("tcg:book"));
      }}
    >
      Book a review
    </Cta>
  );
}
