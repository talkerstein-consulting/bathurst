"use client";

import { useEffect, useRef, useState } from "react";
import { TOOLS, toolSrc } from "@/lib/bathurst/tools";
import "@/app/landing.css";

/**
 * 07 · The Stack — what 06's last card was standing on, taken out of it.
 *
 * ONE continuous move, start to finish, on one set of chips: the marks begin exactly where they lie on the
 * "Make it easier to manage the business" card (components/home/Interfaces.tsx, lib/bathurst/tools.ts), leave it
 * for the open page, and are then drawn into a network around the TCG mark, which grows at the middle of it and
 * holds every one of them on a line. Nothing is mounted, swapped or cross-faded part-way: every chip holds one
 * position that is interpolated across the whole track, so the sequence never breaks.
 *
 * This is why the react-bits orbit that was here is gone. It owns its own intro and runs on its own clock, so the
 * only way to use it was to hand over to it mid-sequence — the chips stopped being the same chips at that point.
 * The network here is drawn from the same numbers that place the chips, so the lines cannot disagree with them.
 *
 * Pinned by hand and re-measured every frame, for the same reason as components/home/RealityPanels.tsx and
 * components/home/SentenceSection.tsx: the sheet this sits on (.cover) is a transformed box the map engine moves
 * from its own scroll handler, so `position: sticky` has no viewport to hold against and a rect read during a
 * `scroll` event can be a frame behind.
 */

/* the track, in screens: out of the card, a breath scattered, then gathered into the network and held */
const OUT_OF_CARD = 1.0, LOOSE = 0.4, GATHER = 1.3, HOLD = 0.5;

/* where the beats fall along the track */
const SCATTERED = 0.34;   // the chips are fully out on the open page
const NETWORK = 0.82;     // the network is fully drawn

/* the loose scatter, in per-cent of the field. Irregular on purpose: this is everything spread out on a desk. */
const LOOSE_AT: [number, number][] = [
  [8, 18], [22, 7], [37, 22], [51, 5], [65, 19], [79, 8], [92, 23],
  [6, 46], [19, 61], [33, 43], [47, 64], [61, 42], [75, 61], [89, 45],
  [14, 81], [30, 88], [56, 84], [73, 78],
];

/* the network: two rings around the mark, the shorter one inside. Ellipses, because the field is wider than it
   is tall and circles in per-cent of it would not be circles anyway. */
const RING = (i: number, n: number) => {
  const inner = i < 7;
  const k = inner ? i : i - 7;
  const of = inner ? 7 : n - 7;
  const a = (k / of) * Math.PI * 2 - Math.PI / 2 + (inner ? 0.25 : 0);
  const rx = inner ? 23 : 42, ry = inner ? 23 : 38;
  return [50 + rx * Math.cos(a), 50 + ry * Math.sin(a)] as [number, number];
};

const easeInOut = (x: number) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export default function ToolOrbit() {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLSpanElement>(null);
  const web = useRef<SVGSVGElement>(null);
  const [flat, setFlat] = useState(true);
  /* where each chip starts: its own place on the card, read off the card itself the first time the track is in
     play, so the chips leave from where the reader last saw them. Until the card can be read (it is pinned in the
     section above and may already be gone) they start piled at the top middle, which is where it stood. */
  const from = useRef<[number, number][] | null>(null);

  useEffect(() => {
    const m = matchMedia("(min-width: 900px)");
    const set = () => setFlat(!m.matches);
    set(); m.addEventListener("change", set); return () => m.removeEventListener("change", set);
  }, []);

  useEffect(() => {
    const el = track.current, st = stage.current, fd = field.current;
    if (!el || !st || !fd) return;
    if (flat) { st.style.removeProperty("--pin"); return; }
    let raf = 0;

    /* the card's own chips, in per-cent of this field, measured once while it is still on screen */
    const readCard = (box: DOMRect) => {
      const card = document.querySelectorAll<HTMLElement>("#capabilities .tool-scatter .tool-chip");
      if (card.length !== TOOLS.length || !box.width || !box.height) return null;
      const out: [number, number][] = [];
      for (const c of card) {
        const r = c.getBoundingClientRect();
        if (!r.width) return null;   // hidden: nothing to take a place from
        out.push([((r.left + r.width / 2 - box.left) / box.width) * 100,
                  ((r.top + r.height / 2 - box.top) / box.height) * 100]);
      }
      return out;
    };

    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -400 || r.top > innerHeight + 400) return;
      const travel = r.height - innerHeight;
      if (travel <= 0) return;
      const past = Math.min(travel, Math.max(0, -r.top));
      st.style.setProperty("--pin", `${past}px`);
      const p = past / travel;

      const box = fd.getBoundingClientRect();
      if (!from.current) from.current = readCard(box);
      const start = from.current;

      // one number per beat, both eased, so the whole run is smooth through the middle of it
      const out = easeInOut(clamp01(p / SCATTERED));                       // card → open page
      const net = easeInOut(clamp01((p - SCATTERED) / (NETWORK - SCATTERED)));   // open page → network

      const chips = fd.querySelectorAll<HTMLElement>(".to-fly");
      const pts: [number, number][] = [];
      chips.forEach((c, i) => {
        const a = start?.[i] ?? [50, 6];
        const b = LOOSE_AT[i % LOOSE_AT.length];
        const d = RING(i, TOOLS.length);
        const x = mix(mix(a[0], b[0], out), d[0], net);
        const y = mix(mix(a[1], b[1], out), d[1], net);
        // small on the card, full size loose, a little tighter once it is a node in the network
        const s = mix(mix(0.72, 1, out), 0.92, net);
        c.style.transform = `translate3d(${((x / 100) * box.width).toFixed(1)}px, ${((y / 100) * box.height).toFixed(1)}px, 0) translate(-50%, -50%) scale(${s.toFixed(3)})`;
        pts.push([(x / 100) * box.width, (y / 100) * box.height]);
      });

      // the mark grows at the middle as the network draws, and every chip is put on a line to it
      const mk = mark.current;
      if (mk) {
        mk.style.transform = `translate3d(${(box.width / 2).toFixed(1)}px, ${(box.height / 2).toFixed(1)}px, 0) translate(-50%, -50%) scale(${mix(0.2, 1, net).toFixed(3)})`;
        mk.style.opacity = net.toFixed(3);
      }
      const sv = web.current;
      if (sv) {
        sv.setAttribute("viewBox", `0 0 ${Math.round(box.width)} ${Math.round(box.height)}`);
        const lines = sv.querySelectorAll<SVGLineElement>("line");
        lines.forEach((ln, i) => {
          const [x, y] = pts[i] ?? [0, 0];
          ln.setAttribute("x1", (box.width / 2).toFixed(1));
          ln.setAttribute("y1", (box.height / 2).toFixed(1));
          ln.setAttribute("x2", x.toFixed(1));
          ln.setAttribute("y2", y.toFixed(1));
        });
        // the lines only come in once the chips are on their way to being nodes, never over the loose scatter
        sv.style.opacity = clamp01((net - 0.35) / 0.4).toFixed(3);
      }
    };
    const frame = () => { measure(); raf = requestAnimationFrame(frame); };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [flat]);

  const head = (
    <header className="to-head">
      <h2 className="h2 lp-h">From business challenges to working solutions.</h2>
      <p className="lp-lead">
        We don’t start by selling you a service. We start by understanding what your business needs.
      </p>
    </header>
  );

  // phones: no pin and no sequence — the marks sit together under the heading with the mark under them, which is
  // the same point without asking a phone to run a pinned stage
  if (flat) {
    return (
      <section id="stack" className="section hs to" aria-label="From business challenges to working solutions">
        {head}
        <ul className="to-grid">
          {TOOLS.map((t) => (
            <li key={t.slug}><span className="tool-chip is-flat"><img src={toolSrc(t.slug)} alt={t.name} loading="lazy" decoding="async" /></span></li>
          ))}
        </ul>
        <span className="to-mark to-mark-flat" aria-hidden="true"><img src="/brand/tcg-icon.svg" alt="" width={72} height={72} /></span>
      </section>
    );
  }

  return (
    <section id="stack" className="section hs to" aria-label="From business challenges to working solutions">
      <div className="to-track" ref={track} style={{ height: `calc(100svh + ${((OUT_OF_CARD + LOOSE + GATHER + HOLD) * 100).toFixed(0)}svh)` }}>
        <div className="to-stage" ref={stage}>
          {head}
          <div className="to-field" ref={field} aria-hidden="true">
            {/* the network, under the chips: one line per mark, drawn from the middle out */}
            <svg className="to-web" ref={web} preserveAspectRatio="none">
              {TOOLS.map((t) => <line key={t.slug} />)}
            </svg>
            {TOOLS.map((t) => (
              <span key={t.slug} className="tool-chip to-fly">
                <img src={toolSrc(t.slug)} alt="" loading="lazy" decoding="async" />
              </span>
            ))}
            <span className="to-mark" ref={mark}>
              <img src="/brand/tcg-icon.svg" alt="" width={128} height={128} />
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
