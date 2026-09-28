"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import { CtaButton, CtaLink } from "@/components/style/Cta";
import DirectionsPanel from "@/components/bathurst/DirectionsPanel";
import Testimonials from "@/components/bathurst/Testimonials";
import { CONTACT, GOOGLE, REVIEW } from "@/lib/bathurst/data";
import Services from "@/components/bathurst/Services";
import SiteFooter from "@/components/bathurst/SiteFooter";
import SignatureLine from "@/components/bathurst/SignatureLine";
import { COMPASS_ROSE } from "@/lib/bathurst/icons";
import "@/app/bathurst-map.css";

/** 20px line glyphs (STYLE.md icon rules: line only, round caps, currentColor). */
const G = {
  arrowR: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowD: <path d="M12 5v14M6 13l6 6 6-6" />,
  arrowU: <path d="M12 19V5M6 11l6-6 6 6" />,
  search: <><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevL: <path d="M14 6l-6 6 6 6" />,
  chevR: <path d="M10 6l6 6-6 6" />,
  chevD: <path d="M6 9l6 6 6-6" />,
  layers: <><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></>,
  peg: <><circle cx="12" cy="5" r="2.4" /><path d="M8.5 21l1-6H8l1.2-5.2A2 2 0 0111.1 8h1.8a2 2 0 011.9 1.8L16 15h-1.5l1 6" /></>,
  recenter: <><circle cx="12" cy="12" r="3.2" /><circle cx="12" cy="12" r="7.5" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  turn: <><path d="M12 2.8l9.2 9.2-9.2 9.2L2.8 12z" /><path d="M9 14.5V12a1.5 1.5 0 011.5-1.5H15M13 8.5l2 2-2 2" /></>,
  play: <path d="M8 5.5v13l10.5-6.5z" />,
  panel: <><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" /><path d="M9.5 4.5v15" /></>,
};
/** Stars filled to the actual rating, so the picture matches the number. */
const Stars = ({ r }: { r: number }) => (
  <span className="stars rated" role="img" aria-label={`${r} out of 5`} style={{ "--pct": `${(r / 5) * 100}%` } as CSSProperties}>
    <span aria-hidden="true">★★★★★</span><span className="fill" aria-hidden="true">★★★★★</span>
  </span>
);
const Glyph = ({ g }: { g: keyof typeof G }) => (
  <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true">{G[g]}</svg>
);

function Toggle({ show, label }: { show: string; label: string }) {
  return (
    <label className="tg">
      <span>{label}</span>
      <input type="checkbox" data-show={show} defaultChecked />
      <span className="box single" aria-hidden="true"><Glyph g="check" /></span>
    </label>
  );
}

/**
 * Hero: Street View fly-through up Bathurst, crane move, then a live maps-app view of the clients.
 * React owns this markup; lib/bathurst/engine.ts attaches the three.js scene and all map behaviour
 * to it by element id. The markup must not re-render after mount, so keep this component stateless.
 */
export default function BathurstHero() {
  useEffect(() => {
    let engine: { destroy: () => void } | null = null;
    let cancelled = false;
    const stick = document.getElementById("stick");
    stick?.classList.add("loading");
    import("@/lib/bathurst/engine").then(({ createBathurstEngine }) => {
      if (!cancelled) engine = createBathurstEngine();
    }).finally(() => stick?.classList.remove("loading"));
    return () => {
      cancelled = true;
      engine?.destroy();
    };
  }, []);

  return (
    <section id="hero" aria-label="Talkerstein Consulting Group">
      <div id="stick" className="open">
        <div id="stage" tabIndex={0} aria-label="Map of Talkerstein clients on Bathurst Street. Drag to pan, arrow keys to move, plus and minus to zoom." />
        <div id="labels" />

        {/* opening "front page": masthead row; then the headline column on paper (left), the moving view in its
            rounded, neatlined window (right; #win reserves the box the engine opens to full screen). The column holds the
            headline, CTA, ratings and certifications, and slides away as the window opens. */}
        <div id="sv">
          <div className="mast-space" aria-hidden="true" />
          <div className="hero-grid">
            <div className="sv-hero" id="svhero">
              <h1 className="h1">Find your way to the right customers.</h1>
              <p>We build bespoke systems that use AI, automation, and technology to create a clearer path between your business and the right customers.</p>
              <CtaLink href="/book" label="Book a free call" accent className="hero-cta" data-no-tumble />
              {/* proof: the ratings and the certifications on one compact row, on the sky with the text */}
              <div className="hero-proofrow">
                <div className="hero-ratings">
                  <a href={CONTACT.clutch} target="_blank" rel="noopener"><b>{REVIEW.rating.toFixed(1)}</b><span><Stars r={REVIEW.rating} /><small>{REVIEW.count} reviews on Clutch</small></span></a>
                  <a href={GOOGLE.url} target="_blank" rel="noopener"><b>{GOOGLE.rating?.toFixed(1)}</b><span><Stars r={GOOGLE.rating ?? 5} /><small>Rating on Google</small></span></a>
                </div>
                <div className="hero-certs" aria-label="Certifications">
                  <img src="/badges/shopify.avif" alt="Shopify Partners" width={512} height={85} className="cert-shopify" />
                  <img src="/badges/ghl.avif" alt="HighLevel Certified Admin" width={256} height={256} className="cert-ghl" />
                </div>
              </div>
            </div>
            <div id="win" aria-hidden="true" />
          </div>
        </div>

        <div id="mapui">
          {/* neatline: a checkered map border around the whole view; each block is one scale unit */}
          <div className="neatline" id="neatline" aria-hidden="true" />
          <div className="panel">
            <div className="searchrow">
              {/* TCG mark. On the front page the wordmark sits beside it; on scroll the wordmark slides left into the
                  mark and the search slides out from behind it */}
              <a className="brandbtn" href="#top" id="brandbtn" aria-label="Talkerstein Consulting Group, back to top">
                <img className="mark" src="/brand/tcg-icon.svg" alt="" />
              </a>
              <span className="wordclip" aria-hidden="true"><img className="word" src="/brand/tcg-text.svg" alt="" /></span>
              <form className="search" id="searchform" role="search">
                <label className="sprout field-box search-box">
                  <Glyph g="search" />
                  <input id="q" className="input" type="search" autoComplete="off" enterKeyHint="search" aria-label="Search Talkerstein Maps" placeholder="Search Talkerstein Maps" />
                  <button className="qclear" type="button" id="qclear" aria-label="Clear search" hidden><Glyph g="close" /></button>
                  <button className="qclear" type="button" id="placeclose" aria-label="Close place" hidden><Glyph g="close" /></button>
                </label>
              </form>
            </div>
            <div className="sheet frame" id="sheet" data-state="half">
              <button className="grab" id="grab" type="button" aria-label="Resize results panel"><i /></button>
              <div className="sheet-body" id="sheetBody" />
            </div>
          </div>
          {/* maps-style tab on the panel's right edge, vertically centred */}
          <button type="button" className="edgetab frame" id="edgetab" aria-label="Collapse side panel" aria-expanded="true"><Glyph g="chevL" /></button>


          {/* directions: orange fill, steel line, white glyph; "Get directions" on the front page, shrinking to the icon on scroll */}
          <div className="layers-top">
            <button type="button" id="dirbtn" className="sprout btn icon dirbtn" data-no-tumble aria-label="Directions" aria-expanded="false"
              onClick={() => window.dispatchEvent(new Event("tcg:directions"))}><Glyph g="turn" /><span className="dirlabel">Get directions</span></button>
          </div>
          <div className="layers" id="layers" role="dialog" aria-label="Map view settings" hidden>
            <div className="mv frame">
              <div className="mv-h"><h3>Map view</h3><CtaButton variant="icon" id="mvclose" label="Close map view settings"><Glyph g="close" /></CtaButton></div>
              <fieldset><legend className="eyebrow">View</legend>
                <div className="seg">
                  <button type="button" className="sprout btn sm" data-view="3d" aria-pressed="true">3D</button>
                  <button type="button" className="sprout btn sm" data-view="2d" aria-pressed="false">2D</button>
                </div>
              </fieldset>
              <fieldset><legend className="eyebrow">Style</legend>
                <div className="seg">
                  <button type="button" className="sprout btn sm" data-style="paper" aria-pressed="true">Paper</button>
                  <button type="button" className="sprout btn sm" data-style="poster" aria-pressed="false">Poster</button>
                </div>
              </fieldset>
              <fieldset><legend className="eyebrow">Show</legend>
                <Toggle show="buildings" label="3D buildings" />
                <Toggle show="blocks" label="City blocks" />
                <Toggle show="nature" label="Parks & water" />
              </fieldset>
              <fieldset><legend className="eyebrow">Callouts show</legend>
                <div className="seg seg-3">
                  <button type="button" className="sprout btn sm" data-layer="industry" aria-pressed="true">Industry</button>
                  <button type="button" className="sprout btn sm" data-layer="services" aria-pressed="false">Services</button>
                  <button type="button" className="sprout btn sm" data-layer="results" aria-pressed="false">Results</button>
                </div>
              </fieldset>
            </div>
          </div>

          <div className="ctrls">
            <button type="button" id="compass" aria-label="Compass: drag to rotate the map, press to face north" title="Drag to rotate · click for north"><span id="needle" className="rose" dangerouslySetInnerHTML={{ __html: COMPASS_ROSE }} /></button>
            <CtaButton variant="icon" id="pegman" label="Street View" title="Drop into Street View"><Glyph g="peg" /></CtaButton>
            <CtaButton variant="icon" id="recenter" label="Recenter on Bathurst" title="Recenter on Bathurst"><Glyph g="recenter" /></CtaButton>
            <div className="zoomgrp frame" role="group" aria-label="Zoom">
              <button type="button" id="zin" aria-label="Zoom in"><Glyph g="plus" /></button>
              <i aria-hidden="true" />
              <button type="button" id="zout" aria-label="Zoom out"><Glyph g="minus" /></button>
            </div>
          </div>
          <div className="foot" aria-label="Map information">
            <span id="coords" className="fp-coords">43.720°N 79.430°W</span>
            <span className="fp-scale"><i className="blk" /><i className="blk alt" /><span id="scaletxt">1 block = 100 m</span></span>
          </div>
        </div>
        <div className="chipbar" id="chipbar">
            <CtaButton variant="icon" id="chipprev" label="Previous category"><Glyph g="chevL" /></CtaButton>
            <div className="chips" id="chips" role="group" aria-label="Filter by industry" />
            <CtaButton variant="icon" id="chipnext" label="Next category"><Glyph g="chevR" /></CtaButton>
          </div>
        <DirectionsPanel />
        {/* after the last direction step: reviews, services and the footer, one sheet that rises over the map */}
        <div className="cover frame" id="cover" aria-label="Reviews">
          <button type="button" className="cover-grab" id="covergrab" aria-label="Open"><i /></button>
          <div className="cover-body" id="coverbody"><Testimonials /><Services /><SignatureLine /><SiteFooter /></div>
        </div>
        {/* directions: the Route Preview heading, then one framed card per leg that slides in and out (filled by the engine) */}
        <div className="dircard" id="dircard" role="status" aria-live="polite">
          <h2 className="dc-title">Route Preview</h2>
          <div className="dc-track" />
        </div>
        {/* between the hero and the project stops: slides in over the route overview, out when the first project opens */}
        <h2 className="workhead" id="workhead">Our Work Across the Map</h2>
        <div className="ghint frame" id="ghint" aria-hidden="true"><span id="ghintTxt" /></div>
        <div className="toast frame" id="toast" role="status" aria-live="polite"><span /></div>
      </div>
    </section>
  );
}
