"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Directions: the sheet every "Get directions" button opens (dispatch `tcg:directions`, optionally with
 * {from, goal} to prefill). The same mechanism as the map's last step: a Google-Maps from/to intake, and the
 * Start button slides in once a destination is chosen (the name field pulses if it is still empty); it leads to the booking page (/book).
 */
export const GOALS: [string, string][] = [
  ["engagement", "Engagement"], ["sales", "Sales"], ["marketing", "Marketing"], ["leads", "Lead generation"],
  ["retention", "Customer retention"], ["operations", "Operations & automation"], ["awareness", "Brand awareness"],
];

const G = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  pin: <><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  chevD: <path d="M6 9l6 6 6-6" />,
  start: <path d="M12 3l7 18-7-4-7 4z" />,   // Google-Maps style navigation arrow: the route starts here
  turn: <><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></>,
};
const Glyph = ({ g }: { g: keyof typeof G }) => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">{G[g]}</svg>;

export default function DirectionsPanel() {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [goal, setGoal] = useState("");
  const fromRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent).detail as { from?: string; goal?: string } | undefined;
      if (d?.from) setFrom(d.from);
      if (d?.goal && GOALS.some(([k]) => k === d.goal)) setGoal(d.goal);
      setOpen(true); setTimeout(() => fromRef.current?.focus({ preventScroll: true }), 450);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("tcg:directions", onOpen);
    addEventListener("keydown", onKey);
    return () => { removeEventListener("tcg:directions", onOpen); removeEventListener("keydown", onKey); };
  }, []);
  useEffect(() => { document.getElementById("dirbtn")?.setAttribute("aria-expanded", String(open)); }, [open]);

  const ready = from.trim() && goal;
  const needName = !!goal && !from.trim();   // destination first: the name field pulses until it is filled
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) { fromRef.current?.focus(); return; }
    location.href = "/book?" + new URLSearchParams({ from: from.trim(), goal });
  };

  return (
    <div className={`dirsheet frame${open ? " on" : ""}`} role="dialog" aria-label="Find Your Way Forward" aria-hidden={!open} inert={!open}>
      {/* close: a bare ×, top left */}
      <button type="button" className="dir-x" aria-label="Close" onClick={() => setOpen(false)}><Glyph g="close" /></button>
      <div className="dir-h">
        <h2>Find Your Way Forward</h2>
      </div>
      <form className="dir-form" onSubmit={go}>
        <div className="dc-route">
          {/* Google Maps rail: origin dot, dotted line, destination pin */}
          <span className="rail" aria-hidden="true"><i className="dot" /><i className="dots" /><span className="rpin"><Glyph g="pin" /></span></span>
          <label className={`sprout field-box dir-box${needName ? " need" : ""}`}>
            <input ref={fromRef} className="input" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Your business name" aria-label="Your business name" autoComplete="organization" />
          </label>
          <label className="sprout field-box dir-box">
            <select className="input" value={goal} onChange={(e) => setGoal(e.target.value)} aria-label="Your destination">
              <option value="" disabled>Choose your destination</option>
              {GOALS.map(([k, n]) => <option key={k} value={k}>{n}</option>)}
            </select>
            <span className="caret"><Glyph g="chevD" /></span>
          </label>
        </div>
        {/* slides in as soon as a destination is chosen */}
        {goal && (
          <button type="submit" className="sprout btn orange dc-go dc-start" data-no-tumble aria-label={needName ? "Start (enter your business name first)" : "Start"}><Glyph g="start" />Start</button>
        )}
      </form>
    </div>
  );
}
