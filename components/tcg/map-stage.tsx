"use client";

import { useEffect } from "react";
import { COMPASS_ROSE } from "@/lib/bathurst/icons";
import { Globe } from "lucide-react";
import "@/app/bathurst-map.css";

/**
 * The client map, static.
 *
 * This is the only markup lib/bathurst/engine.ts binds to on this site. The reference build
 * wrapped the same engine in a whole front page — a street fly-through, a headline column, a
 * reviews/services cover sheet, a route card — and drove it from scrollY; /map then hid all of
 * that again with CSS and parked the page so the engine would hold its map state.
 *
 * None of that is here. The engine is started with `static: true`, which puts it on the map at
 * once and takes it off the page's scroll, and this component renders the map chrome only:
 * the canvas, the industry chips, the place sheet, the controls and the place readout.
 *
 * Every id below is one the engine looks up by name — keep them. The elements with no children
 * (#sv, #cover, #dircard, the map-view fieldsets) are the handles it still reaches for; they
 * stay empty because the states that filled them are gone.
 *
 * The markup must not re-render after mount: the engine owns these nodes. Keep it stateless.
 */

/** 20px line glyphs (STYLE.md icon rules: line only, round caps, currentColor). */
const G = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevL: <path d="M14 6l-6 6 6 6" />,
  chevR: <path d="M10 6l6 6-6 6" />,
  recenter: <><circle cx="12" cy="12" r="3.2" /><circle cx="12" cy="12" r="7.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
};
const Glyph = ({ g }: { g: keyof typeof G }) => (
  <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">{G[g]}</svg>
);

export default function MapStage({ headingLevel = "h1" }: { headingLevel?: "h1" | "h2" } = {}) {
  useEffect(() => {
    let engine: { destroy: () => void; reveal?: (p: number) => void } | null = null;
    let cancelled = false;
    /* The page that frames this map (components/tcg/footprint.tsx) turns the globe with its own
       scroll: 0 while the map is boxed, 1 once it is full bleed. The frame is same-origin, so it
       calls this directly. Calls that land before the engine has loaded are kept and replayed. */
    let pending = 1;
    const reveal = (p: number) => { pending = p; engine?.reveal?.(p); };
    (window as unknown as { tcgMapReveal?: (p: number) => void }).tcgMapReveal = reveal;
    import("@/lib/bathurst/engine").then(({ createBathurstEngine }) => {
      if (cancelled) return;
      engine = createBathurstEngine(undefined, { static: true });
      engine.reveal?.(pending);
    });
    return () => {
      cancelled = true;
      delete (window as unknown as { tcgMapReveal?: (p: number) => void }).tcgMapReveal;
      engine?.destroy();
    };
  }, []);

  const Heading = headingLevel;

  return (
    <section id="hero" aria-label="Talkerstein Consulting Group clients">
      <div id="stick" className="navbar-on">
        <Heading className="sr-only">Our clients on the map</Heading>
        <div
          id="stage"
          tabIndex={0}
          aria-label="Map of Talkerstein clients on Bathurst Street. Drag to pan, arrow keys to move, plus and minus to zoom."
        />
        <div id="labels" />

        {/* the front page the engine can still fade in and out of; nothing is in it */}
        <div id="sv" hidden><div id="svhero" /><div id="win" /></div>

        <div id="mapui">
          <div className="neatline" id="neatline" aria-hidden="true" />

          {/* the place sheet: one clicked client at a time, docked beside the map */}
          <div className="panel">
            <div className="searchrow">
              <a className="brandbtn" href="#top" id="brandbtn" aria-label="Talkerstein Consulting Group, back to top">
                <img className="mark" src="/brand/tcg-icon.svg" alt="" />
              </a>
              <form className="search" id="searchform" role="search">
                <button type="button" className="sprout field-box search-box backmap" id="backmap"><span>Back to map</span></button>
                {/* the search field is retired; the engine still clears through these */}
                <span hidden>
                  <input id="q" className="input" type="search" autoComplete="off" tabIndex={-1} aria-hidden="true" />
                  <button className="qclear" type="button" id="qclear" tabIndex={-1} aria-hidden="true"><Glyph g="close" /></button>
                  <button className="qclear" type="button" id="placeclose" tabIndex={-1} aria-hidden="true"><Glyph g="close" /></button>
                </span>
              </form>
            </div>
            <div className="sheet frame" id="sheet" data-state="half">
              <button className="grab" id="grab" type="button" aria-label="Resize results panel"><i /></button>
              <div className="sheet-body" id="sheetBody" />
            </div>
          </div>
          <button type="button" className="edgetab frame" id="edgetab" aria-label="Collapse side panel" aria-expanded="true"><Glyph g="chevL" /></button>

          {/* map view settings: the engine reads its own buttons out of here, and there are none left */}
          <div className="layers" id="layers" role="dialog" aria-label="Map view settings" hidden>
            <div className="mv frame">
              <div className="mv-h"><h3>Map view</h3><button type="button" id="mvclose" aria-label="Close map view settings"><Glyph g="close" /></button></div>
            </div>
          </div>

          <div className="ctrls">
            <button type="button" id="compass" aria-label="Compass: drag to rotate the map, press to face north" data-tip="Drag to rotate · click for north"><span id="needle" className="rose" dangerouslySetInnerHTML={{ __html: COMPASS_ROSE }} /></button>
            <button type="button" className="btn icon" id="recenter" aria-label="Recenter on Bathurst" data-tip="Recenter the map"><Glyph g="recenter" /></button>
            <div className="zoomgrp frame" role="group" aria-label="Zoom">
              <button type="button" id="zin" aria-label="Zoom in" data-tip="Zoom in"><Glyph g="plus" /></button>
              <i aria-hidden="true" />
              <button type="button" id="zout" aria-label="Zoom out" data-tip="Zoom out"><Glyph g="minus" /></button>
            </div>
          </div>

          <div className="foot" aria-label="Map information">
            {/* what the middle of the view is over: a country, a sea or a lake (lib/bathurst/engine.ts, placeAt) */}
            <span className="fp-place"><Globe className="glyph" aria-hidden="true" /><span id="placename">Canada</span></span>
          </div>
        </div>

        <div className="chipbar" id="chipbar">
          <button type="button" className="btn icon" id="chipprev" aria-label="Previous category"><Glyph g="chevL" /></button>
          <div className="chips" id="chips" role="group" aria-label="Filter by industry" />
          <button type="button" className="btn icon" id="chipnext" aria-label="Next category"><Glyph g="chevR" /></button>
        </div>

        {/* handles the engine still looks up; the states behind them are gone with the scroll */}
        <div className="cover frame" id="cover" hidden><button type="button" id="covergrab" hidden /><div id="coverbody" /></div>
        <div className="dircard" id="dircard" hidden><div className="dc-track" /></div>
        <button type="button" id="dcmore" hidden />
        <h2 id="workhead" hidden />

        <div className="ghint frame" id="ghint" aria-hidden="true"><span id="ghintTxt" /></div>
        <div className="toast frame" id="toast" role="status" aria-live="polite"><span /></div>
      </div>
    </section>
  );
}
