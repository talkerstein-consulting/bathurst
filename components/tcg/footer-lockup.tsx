'use client';

/**
 * The footer lockup — the full horizontal logo, with its globe animated.
 *
 * The motion is the endcard's, from `239 TCG Social Media Case Studies/endcard`
 * (_template.html): a wireframe globe turning behind the static lion, slowing
 * onto the rest grid, then cross-fading to the logo's own graticule. The
 * geometry measured off the logo, the rest grid and the easings are that
 * file's, re-expressed in this logo's 1337 x 236 space (see GEOM below).
 *
 * Differences from the endcard, and why:
 *  - The wordmark does not animate. The endcard grew TALKERSTEIN letter by
 *    letter out of its centreline; on the site the words are the logo, not a
 *    title card, so only the globe moves.
 *  - It plays once, on reveal, instead of looping. A footer mark that never
 *    stops moving is noise.
 *  - It takes the reel tuning (~1.7s), not the 4:5 card's 3.8s spin.
 *  - The lion, ring and lettering ship as one cached <image> rather than 60 kB
 *    of inline path data in every page's markup.
 *  - prefers-reduced-motion renders the finished logo and starts no frame loop.
 *
 * No orange: nothing here is operable, and a drawn mark is not a control.
 */

import { useEffect, useRef } from 'react';
import { DISCS, GRATICULE } from './lockup-art';

/* ---- the full logo's own space ---- */
const VB_W = 1337;
const VB_H = 236;

/* ---- globe geometry ----
 * The endcard drew its globe at r 377.6 about (473.74, 378.74) and measured the
 * artwork there: equator +7.96, latitudes 82.95 apart, meridians 99.65 / 199.3 /
 * 298.95 apart at the equator, latitudes bowed by 1 + 8e-7 dx^2 + 2e-12 dx^4.
 * Those are all proportions of that radius, so they carry over unchanged:
 *   equator   +0.021079 R      latitude step  0.219690 R
 *   meridians  0.263903 R, 0.527807 R, 0.791711 R
 *   bow        1 + 0.114058 u^2 + 0.040659 u^4,  u = dx / R
 * Here R and the centre are read off the ivory disc of tcg-logo-s-h.svg,
 * `M117.5 229.3a111.5 111.5 0 1 0 0-223` -> c (117.5, 117.8), r 111.5.
 */
const CX = 117.5;
const CY = 117.8;
const R = 111.5;
const YEQ = CY + 0.021079 * R;
const STEP = 0.21969 * R;
const BOW2 = 0.114058;
const BOW4 = 0.040659;
const D2R = Math.PI / 180;
const N = 20; // meridians, 18 degrees apart
const STEP_L = 360 / N;

/* ---- timing: the endcard's reel tuning (seconds) ---- */
const SPIN = 1.5;
const DEG = 162; // whole 18-degree steps, so it lands on the rest grid
const SWAP: readonly [number, number] = [1.45, 1.62];
const FADE = 0.3;
const DURATION = SWAP[1] + 0.08;

/* at rest the logo's meridians sit 0.263903 R apart at the equator -> ease the grid into
   exactly that, so the wire lands on the graticule it cross-fades to */
const REST: [number, number][] = [
  [0, 0],
  [18, Math.asin(0.263903) / D2R],
  [36, Math.asin(0.527807) / D2R],
  [54, Math.asin(0.791711) / D2R],
  [72, 92],
  [180, 180],
];

function settle(l: number) {
  const s = Math.sign(l);
  const a = Math.abs(l);
  for (let i = 1; i < REST.length; i++) {
    if (a <= REST[i][0]) {
      const [x0, y0] = REST[i - 1];
      const [x1, y1] = REST[i];
      return s * (y0 + ((y1 - y0) * (a - x0)) / (x1 - x0));
    }
  }
  return l;
}

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (v: number) => {
  const c = clamp(v);
  return c * c * (3 - 2 * c);
};
const outCubic = (v: number) => 1 - (1 - clamp(v)) ** 3;
const outQuad = (v: number) => 1 - (1 - clamp(v)) ** 2;
const wrap = (l: number) => ((((l + 180) % 360) + 360) % 360) - 180;

/* the nine latitudes, built once: they do not move, only the meridians turn */
const PARALLELS = Array.from({ length: 9 }, (_, k) => {
  const yc = YEQ + STEP * (k - 4);
  let d = '';
  for (let dx = -R; dx <= R + 0.01; dx += R / 63) {
    const u = dx / R;
    const bow = 1 + BOW2 * u * u + BOW4 * u ** 4; // bowed away from the equator toward the rim
    d += (d ? 'L' : 'M') + (CX + dx).toFixed(3) + ' ' + (YEQ + (yc - YEQ) * bow).toFixed(3);
  }
  return d;
});

export default function FooterLockup({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const mer = [...svg.querySelectorAll<SVGPathElement>('.fl-mer')];
    const wire = svg.querySelector<SVGGElement>('.fl-wire');
    const art = svg.querySelector<SVGGElement>('.fl-art');
    if (!wire || !art) return;

    function renderAt(t: number) {
      // the globe fades in already turning, then slows onto the rest grid
      const p = clamp(t / SPIN);
      const phi = -DEG * (1 - outQuad(p));
      const w = smooth((p - 0.45) / 0.55);
      for (let i = 0; i < N; i++) {
        const m = mer[i];
        if (!m) continue;
        let l = wrap(i * STEP_L + phi);
        l = l + w * (settle(l) - l);
        const c = Math.cos(l * D2R);
        const X = R * Math.sin(l * D2R);
        if (c <= 0) {
          m.style.opacity = '0';
          continue;
        }
        m.style.opacity = String(clamp(c / 0.14));
        const rx = Math.abs(X);
        m.setAttribute(
          'd',
          rx < 0.05
            ? `M${CX} ${CY - R}V${CY + R}`
            : `M${CX} ${CY - R}A${rx.toFixed(3)} ${R} 0 0 ${X > 0 ? 1 : 0} ${CX} ${CY + R}`,
        );
      }
      // the wire hands over to the graticule the logo actually draws
      const s = smooth((t - SWAP[0]) / (SWAP[1] - SWAP[0]));
      (wire as SVGGElement).setAttribute('opacity', String(outCubic(t / FADE) * (1 - s)));
      (art as SVGGElement).setAttribute('opacity', String(s));
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = 0;
    let t0 = 0;
    let done = false;

    if (reduced.matches) {
      renderAt(DURATION);
      return;
    }

    renderAt(0);

    const frame = (now: number) => {
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      renderAt(Math.min(t, DURATION));
      if (t < DURATION) raf = requestAnimationFrame(frame);
      else {
        raf = 0;
        done = true;
      }
    };

    // plays once, when the footer comes into view
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !raf && !done) {
          io.disconnect();
          raf = requestAnimationFrame(frame);
        }
      },
      { threshold: 0.25 },
    );
    io.observe(svg);

    const onReduced = () => {
      if (reduced.matches && !done) {
        cancelAnimationFrame(raf);
        raf = 0;
        done = true;
        renderAt(DURATION);
      }
    };
    reduced.addEventListener('change', onReduced);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      reduced.removeEventListener('change', onReduced);
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Talkerstein Consulting Group"
    >
      <defs>
        <clipPath id="fl-globe-clip">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
      </defs>

      {/* badge, navy disc and ivory disc, straight from tcg-logo-s-h.svg */}
      <g dangerouslySetInnerHTML={{ __html: DISCS }} />

      {/* the turning wireframe, over the ivory disc and clipped to it */}
      <g className="fl-wire" clipPath="url(#fl-globe-clip)" opacity="0">
        {PARALLELS.map((d, i) => (
          <path key={`p${i}`} d={d} />
        ))}
        {Array.from({ length: N }, (_, i) => (
          <path key={`m${i}`} className="fl-mer" />
        ))}
      </g>

      {/* the logo's own graticule, swapped in as the globe comes to rest */}
      <g className="fl-art" opacity="0" dangerouslySetInnerHTML={{ __html: GRATICULE }} />

      {/* the lion, the ring and the lettering: static, and never redrawn here */}
      <image href="/brand/tcg-logo-h-static.svg" x="0" y="0" width={VB_W} height={VB_H} />
    </svg>
  );
}
