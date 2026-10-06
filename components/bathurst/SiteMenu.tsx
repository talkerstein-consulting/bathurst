"use client";

import { useEffect, useRef, useState } from "react";
import { CONTACT } from "@/lib/bathurst/data";
import { CtaButton } from "@/components/style/Cta";

/**
 * The site menu, where Google Maps keeps its own (Jakob's Law): ☰ in the top-left corner, a drawer from the left.
 * Five destinations at most (Hick's Law), in page order, each with a one-line "what's there"; the section on screen is marked
 * (the engine reports it as `tcg:section`), and Get directions is the one filled CTA, last (serial position, Von Restorff).
 * Jumps go through the engine (`tcg:nav`), since the whole page is one scroll-driven map.
 */
type Section = "top" | "work" | "how" | "services" | "reviews";
const STOPS: { to: Section; label: string; line: string }[] = [
  { to: "top", label: "Start", line: "Find your way to the right customers" },
  { to: "work", label: "Our work", line: "Clients across Toronto, on the map" },
  { to: "how", label: "How we work", line: "Four steps, diagnostic to done" },
  { to: "reviews", label: "Reviews", line: "In our clients’ words" },
  { to: "services", label: "Services", line: "Plan, build and run" },
];
const Glyph = ({ children }: { children: React.ReactNode }) => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;

export function MenuButton() {
  return (
    <button type="button" className="sprout btn icon menubtn" id="menubtn" data-no-tumble aria-label="Menu" aria-haspopup="dialog" aria-expanded="false" aria-controls="sitemenu"
      onClick={() => window.dispatchEvent(new Event("tcg:menu"))}>
      {/* ☰ turns into × while the menu is open: the button stays put, above the drawer */}
      <svg className="glyph mb-open" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      <svg className="glyph mb-close" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  );
}

export default function SiteMenu() {
  const [open, setOpen] = useState(false);
  const [here, setHere] = useState<Section>("top");
  const [arrived, setArrived] = useState(false);   // the end of the page: the final node fills orange
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const toggle = () => setOpen((o) => !o);
    const onSection = (e: Event) => setHere((e as CustomEvent<Section>).detail);
    const onProgress = (e: Event) => { const { sec, f } = (e as CustomEvent<{ sec: string; f: number }>).detail; setArrived(sec === "services" && f > 0.97); };
    addEventListener("tcg:menu", toggle);
    addEventListener("tcg:section", onSection);
    addEventListener("tcg:progress", onProgress);
    return () => { removeEventListener("tcg:menu", toggle); removeEventListener("tcg:section", onSection); removeEventListener("tcg:progress", onProgress); };
  }, []);

  useEffect(() => {
    const btn = document.getElementById("menubtn");
    btn?.setAttribute("aria-expanded", String(open));
    btn?.setAttribute("aria-label", open ? "Close menu" : "Menu");
    document.documentElement.classList.toggle("menu-open", open);   // the bottom railway steps aside while the drawer is open
    if (!open) return;
    const t = setTimeout(() => panel.current?.querySelector<HTMLElement>(".station-btn[aria-current], .station-btn")?.focus(), 200);
    // dialog conventions: Escape closes (before the map takes it), Tab stays inside, focus returns to ☰
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); return; }
      if (e.key !== "Tab" || !panel.current) return;
      const f = [...(btn ? [btn] : []), ...panel.current.querySelectorAll<HTMLElement>("button, a")];
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    addEventListener("keydown", onKey, true);
    return () => { clearTimeout(t); removeEventListener("keydown", onKey, true); btn?.focus({ preventScroll: true }); };
  }, [open]);

  const go = (to: Section) => { setOpen(false); window.dispatchEvent(new CustomEvent("tcg:nav", { detail: { to } })); };

  return (
    <div className={`menu${open ? " on" : ""}`} inert={!open}>
      <div className="menu-scrim" onClick={() => setOpen(false)} aria-hidden="true" />
      <div ref={panel} className="menu-panel frame" id="sitemenu" role="dialog" aria-modal="true" aria-label="Menu">
        {/* the close × is the ☰ button itself, in this row's first slot (MenuButton) */}
        <div className="menu-head">
          <button type="button" className="menu-brand" onClick={() => go("top")} aria-label="Talkerstein Consulting Group, back to the top">
            <span className="tcg-logo" aria-hidden="true" />
          </button>
        </div>
        {/* the site as a train route: one station per section in page order, the line behind you in orange,
            "You are here" on your station, and Get directions as the end of the line */}
        <nav aria-label="Site" className="route">
          <ol className="route-list">
            {STOPS.map((it, i) => {
              const at = STOPS.findIndex((s) => s.to === here), state = i < at ? "passed" : i === at ? "here" : "ahead";
              return (
                <li key={it.to} className={`station ${state}`}>
                  <span className="station-dot" aria-hidden="true" />
                  {/* the services' own CTA (an outline box with a name, a line and an arrow; the printed edge sprouts on hover) */}
                  <CtaButton label={`${it.label}: ${it.line}${state === "here" ? " (you are here)" : ""}`} className="svc-scope station-btn"
                    aria-current={state === "here" ? "location" : undefined} onClick={() => go(it.to)}>
                    {/* "You are here" sits on the active station's own line, beside its name */}
                    <span className="svc-scope-t"><b>{it.label}{state === "here" && <span className="menu-here">You are here</span>}</b><small>{it.line}</small></span>
                    <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </CtaButton>
                </li>
              );
            })}
            {/* the end of the line: a pin in a steel circle, filled orange once you've arrived (the end of the page) */}
            <li className={`station terminus${arrived ? " arrived" : ""}`}>
              <span className="station-dot" aria-hidden="true"><Glyph><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Glyph></span>
              <a className="sprout btn orange menu-cta" data-no-tumble href="/book">
                <Glyph><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></Glyph>Get directions
              </a>
            </li>
          </ol>
        </nav>
        {/* contact as icons: call, email, find us (each names itself on hover and to screen readers) */}
        <address className="menu-foot">
          <a className="menu-ic" href={CONTACT.tel} aria-label={`Call ${CONTACT.phone}`} data-tip={CONTACT.phone}>
            <Glyph><path d="M6.6 3.5h2.8l1.4 4.2-2 1.4a12 12 0 006.1 6.1l1.4-2 4.2 1.4v2.8a2 2 0 01-2.2 2A16.6 16.6 0 014.6 5.7a2 2 0 012-2.2z" /></Glyph>
          </a>
          <a className="menu-ic" href={`mailto:${CONTACT.email}`} aria-label={`Email ${CONTACT.email}`} data-tip={CONTACT.email}>
            <Glyph><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M4 7l8 6 8-6" /></Glyph>
          </a>
          <a className="menu-ic" href={CONTACT.map} target="_blank" rel="noopener" aria-label={`Find us: ${CONTACT.address}`} data-tip={CONTACT.address}>
            <Glyph><path d="M12 21s-7-6.2-7-11.5A7 7 0 0112 2.5a7 7 0 017 7C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></Glyph>
          </a>
        </address>
      </div>
    </div>
  );
}
