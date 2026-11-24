"use client";

import { useEffect, useState } from "react";

const EXPAND =
  '<svg class="glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4H4v5M15 4h5v5M15 20h5v-5M9 20H4v-5"/></svg>';
const COLLAPSE =
  '<svg class="glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h5V4M20 9h-5V4M20 15h-5v5M4 15h5v5"/></svg>';

/**
 * A fullscreen control for the map.
 *
 * The engine builds its own control column (.ctrls) in the DOM, so this button
 * is appended into it rather than rendered beside it — that way it inherits the
 * column's position and the on-brand styling the override sheet gives its
 * siblings, instead of being a second floating thing in the corner.
 *
 * Fullscreen is requested on the document element, which inside the section's
 * frame means the frame itself goes full screen. The frame therefore has to
 * carry allow="fullscreen" (see components/tcg/footprint.tsx); without it the
 * request is refused and the button says nothing, so the attribute and this
 * component belong together.
 */
export default function MapFullscreen() {
  const [full, setFull] = useState(false);

  useEffect(() => {
    const ctrls = document.querySelector(".ctrls");
    if (!ctrls) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn single hair";
    btn.setAttribute("aria-label", "Full screen");
    btn.innerHTML = EXPAND;
    btn.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
    });
    // Above the compass, so the column still reads compass-then-actions.
    ctrls.prepend(btn);

    const onChange = () => {
      const on = !!document.fullscreenElement;
      setFull(on);
      btn.innerHTML = on ? COLLAPSE : EXPAND;
      btn.setAttribute("aria-label", on ? "Leave full screen" : "Full screen");
    };
    document.addEventListener("fullscreenchange", onChange);

    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      btn.remove();
    };
  }, []);

  // Nothing renders here; the button lives in the engine's own column.
  return <span className="sr-only">{full ? "Full screen" : ""}</span>;
}
