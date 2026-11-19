"use client";

import { useEffect } from "react";

/**
 * The client map on its own.
 *
 * lib/bathurst/engine.ts drives the whole hero from one value, `prog`, and it recomputes that
 * from scrollY every frame — so setting it once (its __tcgJump hook) is immediately overwritten.
 * The map state is what the engine shows while the page sits about one screen down, so this
 * holds the page there and keeps it there. No fly-through, nothing to scroll past, no sheet.
 *
 * map-only.css hides every other part of the reference's hero. What is left is the map.
 */
export default function MapOnly() {
  useEffect(() => {
    let raf = 0;
    const park = () => {
      const want = Math.round(innerHeight);     // the band where the engine holds the map
      if (Math.abs(scrollY - want) > 1) scrollTo(0, want);
      raf = requestAnimationFrame(park);
    };
    raf = requestAnimationFrame(park);
    return () => cancelAnimationFrame(raf);
  }, []);

  return null;
}
