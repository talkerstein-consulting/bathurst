"use client";

import { useEffect } from "react";

/**
 * Marks this page as one where the map IS the page.
 *
 * lib/bathurst/engine.ts reads `document.documentElement.dataset.mapOnly` to
 * decide what one finger does on a touch screen: everywhere else a one-finger
 * drag belongs to the page, so the visitor can scroll past the map, and only
 * two fingers pan it. Here the page is parked, so there is nothing to scroll —
 * one finger pans the map, the way it does in any maps app.
 *
 * The engine has always looked for this flag (its comment names a file that was
 * never written), and nothing set it. The result on a phone was a map that
 * answered two fingers and ignored one: `#stage` carries `touch-action: none`
 * in ./map-only.css, so the browser would not scroll either, and a single-finger
 * drag did nothing at all.
 *
 * It is set on the document element rather than on a wrapper because the engine
 * reads it from there, and cleared on unmount so a client-side route away from
 * /map does not leave the rest of the site driving the map with one finger.
 */
export default function MapOnly() {
  useEffect(() => {
    document.documentElement.dataset.mapOnly = "1";
    return () => {
      delete document.documentElement.dataset.mapOnly;
    };
  }, []);
  return null;
}
