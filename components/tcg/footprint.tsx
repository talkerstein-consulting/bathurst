/**
 * Our Global Footprint — the Bathurst client map, carried over from the Promax
 * build (303 TCG Promax/bathurst).
 *
 * It is framed rather than mounted inline, and that is deliberate. The map is
 * not a component: it is lib/bathurst/engine.ts, 1654 lines of three.js that
 * take the page over — it sets history.scrollRestoration to manual, calls
 * scrollTo(0, 0), reads innerWidth/innerHeight as its own canvas, and clamps
 * scrollY so the view holds while the document stays tall. /map pins it to its
 * map state exactly as that build's own /map route does.
 *
 * Mounted inline it would fight this page's scroll and the sticky bar with it.
 * In a frame it gets its own document, its own scroll and its own viewport, and
 * this page keeps hers. The cost is a second React tree; the alternative is
 * rewriting the engine to take a driver other than scrollY, which is a job of
 * its own and not this one.
 */
export function Footprint() {
  return (
    <section className="footprint" id="footprint" aria-labelledby="footprint-h">
      <div className="footprint-head">
        <h2 id="footprint-h">Our Global Footprint</h2>
      </div>

      <div className="footprint-stage">
        <iframe
          className="footprint-frame"
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
    </section>
  );
}
