"use client";

import { useEffect, useRef } from "react";

/**
 * The page as a railway line along the paper strip under the map (Goal-gradient), drawn like an old route map: a thick line
 * with a thin one beside it on the outside, solid station dots (names on hover), one station per section in page order, and a streetcar that rides
 * the line as you scroll (the engine reports `tcg:progress`: the section and how far through it). The track
 * already travelled turns orange. Each station is also a stop you can jump to (`tcg:nav`), so the line doubles as the menu;
 * Hidden on the front page and on phones (the ☰ menu covers them). Scroll updates write straight to the DOM.
 */
const STATIONS = [["work", "Our work"], ["how", "How we work"], ["reviews", "Reviews"], ["services", "Services"]] as const;

export default function TrackRail() {
  const rail = useRef<HTMLElement>(null);
  useEffect(() => {
    const on = (e: Event) => {
      const { sec, f } = (e as CustomEvent<{ sec: string; f: number }>).detail, el = rail.current;
      if (!el) return;
      const at = STATIONS.findIndex(([k]) => k === sec);
      el.classList.toggle("on", sec !== "top");
      el.classList.toggle("arrived", sec === "services" && f > 0.97);   // the end of the page: the chest lights up
      // four stations evenly along the line, then the end of the line (the footer): the tram's place between them
      el.style.setProperty("--t", String(Math.max(0, (at + f) / STATIONS.length)));
      el.querySelectorAll<HTMLElement>(".tr-stop").forEach((s, i) => {
        s.classList.toggle("passed", i < at);
        if (i === at) s.setAttribute("aria-current", "location"); else s.removeAttribute("aria-current");
      });
    };
    // the line is fixed to the window but measured against the page column: tell it how wide the scrollbar is
    const sb = () => document.documentElement.style.setProperty("--sbw", `${innerWidth - document.documentElement.clientWidth}px`);
    sb();
    addEventListener("tcg:progress", on);
    addEventListener("resize", sb);
    return () => { removeEventListener("tcg:progress", on); removeEventListener("resize", sb); };
  }, []);
  return (
    <nav ref={rail} className="track" aria-label="Page sections">
      <span className="tr-line" aria-hidden="true"><i className="tr-done" /></span>
      <ol>
        {STATIONS.map(([to, label], i) => (
          <li key={to} style={{ "--at": i / STATIONS.length } as React.CSSProperties}>
            <button type="button" className="tr-stop" aria-label={`Go to ${label}`} onClick={() => window.dispatchEvent(new CustomEvent("tcg:nav", { detail: { to } }))}>
              <span className="tr-name">{label}</span>
            </button>
          </li>
        ))}
      </ol>
      {/* the end of the line: a simple chest (one box, a lid line, a lock), orange once the streetcar arrives */}
      <svg className="tr-end" viewBox="0 0 24 20" aria-hidden="true">
        <rect className="tr-chest" x="2" y="3" width="20" height="15" rx="3" />
        <path className="tr-band" d="M2 9h20" />
        <rect className="tr-lock" x="10" y="7" width="4" height="4.5" rx="1" />
      </svg>
      {/* the streetcar, side on (clerestory roof, arched windows, a door at each end, two wheels), riding the line */}
      <svg className="tr-tram" viewBox="0 0 48 28" aria-hidden="true">
        <rect className="tr-body" x="12" y="1" width="24" height="3" rx="1" />
        <rect className="tr-body" x="4" y="3.5" width="40" height="3" rx="1.5" />
        <rect className="tr-body" x="2" y="6" width="44" height="15" rx="2.5" />
        <rect className="tr-body" x="0" y="11" width="2" height="5" rx="1" /><rect className="tr-body" x="46" y="11" width="2" height="5" rx="1" />
        <rect className="tr-win" x="5" y="8.5" width="4" height="10" rx="1" /><rect className="tr-win" x="39" y="8.5" width="4" height="10" rx="1" />
        {[12, 17.5, 23, 28.5].map((x) => <path key={x} className="tr-win" d={`M${x} 14V10.5a2 2 0 014 0V14z`} />)}
        <rect className="tr-body" x="6" y="21" width="36" height="1.5" />
        <circle className="tr-wheel" cx="15" cy="24.5" r="3" /><circle className="tr-wheel" cx="33" cy="24.5" r="3" />
        <circle className="tr-win" cx="15" cy="24.5" r="1" /><circle className="tr-win" cx="33" cy="24.5" r="1" />
      </svg>
    </nav>
  );
}
