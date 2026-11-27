"use client";

import { useEffect, useState } from "react";

/**
 * The times offered on stage 04, and where a real calendar plugs in.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * FOR WHOEVER WIRES THIS UP
 *
 * Nothing here talks to a calendar. `loadSlots()` below invents a week of openings so
 * the screen can be designed, reviewed and clicked through, and it is the ONLY function
 * that has to change: replace its body with a fetch of your own endpoint and everything
 * above it — the picker, the form, the payload — keeps working.
 *
 *   export async function loadSlots(): Promise<Slot[]> {
 *     const r = await fetch("/api/slots", { cache: "no-store" });
 *     return r.ok ? ((await r.json()) as Slot[]) : [];
 *   }
 *
 * THE CONTRACT
 *   A Slot is `{ id, start }`. `start` is a full ISO instant with its offset
 *   ("2026-12-02T14:30:00-05:00"), never a local date-time with no zone and never a
 *   date-only string — the screen renders it in the business's own zone (BUSINESS_TZ)
 *   whatever zone the visitor is in, and a bare "14:30" cannot be placed on a clock.
 *   `id` is the booking system's own id for that opening and is what comes back in the
 *   submitted payload; it is never parsed here, so any opaque string is fine.
 *
 *   The chosen slot is posted to /api/book as `slot: { id, start }` alongside the
 *   contact fields (components/tcg/instrument.tsx, BookingPanel). A slot is a REQUEST,
 *   not a reservation: this screen never tells the visitor a time is held, because
 *   nothing here can hold one. If the endpoint behind it does hold the time, the
 *   confirmation copy in BookingPanel's `sent` state has to change with it — it
 *   currently says the time is confirmed by reply.
 *
 *   Two openings that collide are the server's problem, not this screen's: by the time
 *   a visitor presses the button, the list they are looking at is seconds to minutes
 *   old. Treat the posted `id` as a claim to be re-checked, and answer a slot that has
 *   gone with a 409 so the form can say so and reload.
 * ──────────────────────────────────────────────────────────────────────────────
 */

export type Slot = {
  /** The booking system's own id. Opaque here; posted back as-is. */
  id: string;
  /** A full ISO instant WITH offset, e.g. "2026-12-02T14:30:00-05:00". */
  start: string;
};

/**
 * The business's own zone — G18. Every time on this screen is rendered in it and
 * labelled with it, so a visitor in Vancouver books the same instant the office reads
 * off its own wall. Never a fixed offset: Toronto moves between EST and EDT, and a
 * hardcoded -05:00 is an hour wrong for eight months of the year.
 */
export const BUSINESS_TZ = "America/Toronto";

/** The hour of a slot in the business's zone, e.g. "2:30 PM". */
export const slotTime = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

/** The weekday and date of a slot in the business's zone, e.g. { dow: "Tue", day: "2" }. */
export const slotDay = (iso: string) => {
  const at = new Date(iso);
  const part = (opt: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: BUSINESS_TZ, ...opt }).format(at);
  return {
    dow: part({ weekday: "short" }),
    day: part({ day: "numeric" }),
    month: part({ month: "short" }),
    /** The calendar date in the BUSINESS's zone — the key days are grouped by. A slot
     *  at 9pm Toronto is already tomorrow in UTC, so grouping on the ISO string's own
     *  date splits a day in two. */
    key: part({ year: "numeric", month: "2-digit", day: "2-digit" }),
  };
};

/** The zone's short name as the visitor should read it, e.g. "EST".
 *
 *  It takes the instant to name it AT, rather than reading the clock itself: the label
 *  changes across a DST boundary, and a component that calls `new Date()` as it renders
 *  is a value Next cannot prerender ("unstable value `new Date()` in a Client
 *  Component"). Pass the first opening — the label belongs to the week being shown. */
export const tzLabel = (iso: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    timeZoneName: "short",
  }).formatToParts(new Date(iso));
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "ET";
};

/* ---- the placeholder ------------------------------------------------------------
   Ten working days, four openings a day, starting tomorrow. */

/** The business zone's own clock reading for an instant. */
function partsAt(t: number) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TZ,
    hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p: Record<string, string> = {};
  for (const part of f.formatToParts(new Date(t))) p[part.type] = part.value;
  return {
    y: +p.year, mo: +p.month, d: +p.day,
    /* Intl gives hour 24 for midnight under hour12:false in some engines. */
    h: +p.hour % 24, mi: +p.minute, s: +p.second,
  };
}

/** How far the business zone is from UTC at `t`, in ms. Not a constant: Toronto moves
 *  between EST and EDT, and a hardcoded −05:00 is an hour wrong for eight months. */
function offsetAt(t: number) {
  const p = partsAt(t);
  return Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s) - t;
}

/** The instant at which the business's own clock reads this wall time.
 *  Two passes: the first correction uses the offset at the guessed instant, which is
 *  the wrong side of a DST change for a couple of hours a year; the second settles it. */
function instantFor(y: number, mo: number, d: number, h: number, mi: number) {
  const wall = Date.UTC(y, mo - 1, d, h, mi);
  let t = wall - offsetAt(wall);
  t = wall - offsetAt(t);
  return new Date(t).toISOString();
}

const HOURS: Array<[number, number]> = [[10, 0], [11, 30], [14, 0], [15, 30]];
/* Two working weeks. The rail is a scrolling row of dates (D06), so a single week of
   five plates left it half empty on a desktop; ten fills it, and gives a visitor who
   cannot make this week somewhere to go. */
const DAYS = 10;

/**
 * FOR NOW: made-up openings, so the screen can be built and clicked through.
 * Replace the body with a call to the real calendar — see the contract at the top of
 * this file. Nothing else in the page needs to change.
 */
export async function loadSlots(): Promise<Slot[]> {
  const out: Slot[] = [];
  /* Walk the BUSINESS's calendar, not the visitor's. Someone opening this in Sydney is
     already on tomorrow's date; starting from their midnight would skip a Toronto day
     and could offer one that has been and gone. */
  const today = partsAt(Date.now());
  let cursor = Date.UTC(today.y, today.mo - 1, today.d);
  let placed = 0;
  while (placed < DAYS) {
    cursor += 86_400_000;
    const d = new Date(cursor);
    const dow = d.getUTCDay(); // cursor is a bare calendar date held as UTC midnight
    if (dow === 0 || dow === 6) continue; // no weekend openings
    placed += 1;
    for (const [h, mi] of HOURS) {
      const start = instantFor(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), h, mi);
      out.push({ id: `tcg-${start}`, start });
    }
  }
  return out;
}

/** Slots grouped into days, in order, keyed on the date in the business's own zone. */
export function byDay(slots: Slot[]) {
  const days = new Map<string, Slot[]>();
  for (const s of slots) {
    const { key } = slotDay(s.start);
    const list = days.get(key);
    if (list) list.push(s);
    else days.set(key, [s]);
  }
  return [...days.entries()];
}

/**
 * Loads the openings once, on mount. Returns the list and whether it is still coming,
 * so the picker can draw its own waiting state at its own size (D07) rather than
 * collapsing to nothing and pushing the form around when the times land.
 */
export function useSlots() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  useEffect(() => {
    let live = true;
    loadSlots()
      .then((s) => live && setSlots(s))
      .catch(() => live && setSlots([]));
    return () => {
      live = false; // G13
    };
  }, []);
  return slots;
}
