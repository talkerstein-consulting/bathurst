'use client';

/**
 * Our Global Footprint — the Bathurst client map, carried over from the Promax
 * build (303 TCG Promax/bathurst).
 *
 * It is framed rather than mounted inline, and that is deliberate. The map is
 * not a component: it is lib/bathurst/engine.ts, three.js that takes the page
 * over — it reads innerWidth/innerHeight as its own canvas and owns its own
 * chrome. In a frame it gets its own document and its own viewport, and this
 * page keeps hers.
 *
 * Scroll expand (React Bits ScrollExpand-JS-CSS, components/ScrollExpand.jsx):
 * the stage is a sticky, viewport-wide box whose clip-path opens from the
 * section's own column out to full bleed as the section is scrolled through.
 * The frame itself never resizes — the engine would re-fit the camera on every
 * frame of the animation — only the window cut out of it does, so the map sits
 * still while the page opens it up. Reduced motion skips the animation and
 * leaves the map at its boxed size.
 */

import { useCallback, useEffect, useRef } from 'react';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

/** How much of the section's scroll is spent opening the map, and how long it is then held
 *  open (both in stage heights). The hold is a little over one stage, so the map does not move
 *  at all until the next section has covered it completely — it stays pinned through the scroll
 *  and the page carries on over the top of it. */
const SCROLL_DISTANCE = 0.9;
const HOLD_DISTANCE = 1.05;
const SMOOTHING = 0.1;
/** The share of the opening by which the map has reached its final view. */
const REVEAL_LEAD = 0.62;

export function Footprint() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  /**
   * Boxed → full bleed. The cut-out is a clip-path on the full-bleed stage; the
   * frame inside it is scaled to fit that cut-out, so the map's own chips and
   * controls stay on screen when it is boxed instead of being cropped away.
   */
  const applyProgress = useCallback((p: number) => {
    const stage = stageRef.current, clip = clipRef.current, frame = frameRef.current, root = rootRef.current;
    if (!stage || !clip || !frame || !root) return;
    const e = smoothstep(0, 1, p);
    const W = stage.clientWidth || window.innerWidth;
    const H = stage.clientHeight || window.innerHeight;
    // boxed: the section's own column. The frame is scaled to that width, so the cut-out is given
    // exactly the height the scaled frame covers — otherwise the box is taller than the map and the
    // plate shows as a blank band above and below it.
    const boxW = Math.min(root.getBoundingClientRect().width, W);
    const side = Math.max(0, (W - boxW) / 2) * (1 - e);
    const fitW = (W - 2 * side) / W;
    const v = Math.max(0, (H * (1 - fitW)) / 2);
    const r = 10 * (1 - e);   // --r-art → square at full bleed
    clip.style.clipPath = `inset(${v}px ${side}px ${v}px ${side}px round ${r}px)`;
    frame.style.transform = `scale(${fitW.toFixed(4)})`;
    /* and the map flies in with it: boxed, the whole globe; open, the Toronto bunch. The camera is
       given the last of the opening and the hold to settle, so the flight is over before the next
       section comes up — hence REVEAL_LEAD, which gets the map there ahead of the clip. */
    try {
      const q = Math.min(1, e / REVEAL_LEAD);
      (frame.contentWindow as unknown as { tcgMapReveal?: (v: number) => void } | null)?.tcgMapReveal?.(q);
    } catch { /* the frame is not ready, or not same-origin: the map keeps its own view */ }
  }, []);

  useEffect(() => {
    const root = rootRef.current, track = trackRef.current, stage = stageRef.current;
    if (!root || !track || !stage) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, current = 0, target = 0, running = false, stageH = 0;

    /* the stage's height is the CSS's (the viewport under the topbar); the track is that, plus the
       scroll the opening takes and the hold that keeps it open */
    const measure = () => {
      stageH = stage.clientHeight || window.innerHeight;
      track.style.height = `${stageH * (1 + SCROLL_DISTANCE + HOLD_DISTANCE)}px`;
      /* the tail the next section is pulled back over, so it rises across the held map */
      root.style.setProperty('--fp-overlap', `${stageH * HOLD_DISTANCE}px`);
      document.documentElement.style.setProperty('--fp-overlap', `${stageH * HOLD_DISTANCE}px`);
    };

    const readProgress = () => {
      if (reduce) return 0;
      const span = stageH * SCROLL_DISTANCE;
      return clamp(-track.getBoundingClientRect().top / span, 0, 1);
    };

    const tick = () => {
      const k = 1 - Math.exp(-1 / (60 * SMOOTHING));
      current += (target - current) * k;
      if (Math.abs(target - current) < 0.0004) { current = target; running = false; }
      applyProgress(current);
      raf = running ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (running) return; running = true; if (!raf) raf = requestAnimationFrame(tick); };

    const onScroll = () => {
      target = readProgress();
      if (reduce) { current = target; applyProgress(current); return; }
      kick();
    };
    const onResize = () => { measure(); target = current = readProgress(); applyProgress(current); };

    onResize();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }, [applyProgress]);

  return (
    <section className="footprint" id="footprint" aria-labelledby="footprint-h" ref={rootRef}>
      <div className="footprint-head">
        <h2 id="footprint-h">Our Global Footprint</h2>
      </div>

      <div className="footprint-track" ref={trackRef}>
        <div className="footprint-stage" ref={stageRef}>
          <div className="footprint-clip" ref={clipRef}>
            <iframe
              className="footprint-frame"
              ref={frameRef}
              src="/map"
              title="Our clients on the map"
              loading="lazy"
              /* The engine owns everything inside; nothing needs to reach out. */
              sandbox="allow-scripts allow-same-origin"
              /* The map's own fullscreen button requests it on its document,
                 which is this frame; without this it is refused. */
              allow="fullscreen"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
