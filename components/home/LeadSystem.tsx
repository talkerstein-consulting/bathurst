"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Pipeline from "@/components/pipeline";

/**
 * 03b · From one visitor to a system. The section that follows the phone demo (components/home/JourneyPanels.tsx)
 * and answers the obvious next question: that was one person — what happens when there are dozens?
 *
 * The stage is pinned while the page scrolls past it, and one scroll progress (0 → 1) drives the whole thing:
 *
 *   0.00–0.30  the phone, still holding its booked screen, shrinks until it is just the first of five visitors.
 *              Its insides crossfade from the real screen to the label the rest of the row already wears.
 *   0.25–0.45  the other four visitors arrive. Five arrivals, five different jobs, one week.
 *   0.40–0.85  they feed the pipeline (components/pipeline.tsx): inbox, sorted, routed, answered.
 *   0.80–1.00  the line leaves the bottom of the stage and carries on into the hub section below, which is drawn to
 *              look like the same line arriving.
 *
 * The heading changes with it: the job the website has is only the first step; what the job needs is a system.
 * TODO(content): the names, the jobs and the figures are a worked example, not clients.
 */

const VISITORS = [
  { who: "Dana W.", job: "Office fit-out", note: "Quote request" },
  { who: "Marc L.", job: "Retail build", note: "Called, no answer" },
  { who: "Priya S.", job: "Restaurant", note: "Asked for dates" },
  { who: "Tom B.", job: "Warehouse", note: "Sent drawings" },
  { who: "Ellen R.", job: "Office refresh", note: "Budget question" },
];

const NODES = [
  { id: "site", title: "The website", description: "Five inquiries, one week", icon: "globe" as const },
  { id: "inbox", title: "One inbox", description: "Nothing lands in a personal mailbox", icon: "mail" as const },
  { id: "sort", title: "Sorted", description: "By job type, size and urgency", icon: "layers" as const },
  { id: "route", title: "Routed", description: "To whoever actually answers it", icon: "branch" as const },
  { id: "reply", title: "Answered", description: "Nothing waits more than a day", icon: "check" as const },
];
const EDGES: [string, string][] = [["site", "inbox"], ["inbox", "sort"], ["sort", "route"], ["route", "reply"]];

/** Eases a raw 0–1 progress into the window a given phase owns. */
const at = (p: number, from: number, to: number) => Math.min(1, Math.max(0, (p - from) / (to - from)));

export default function LeadSystem() {
  const track = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);
  const [pin, setPin] = useState(0);

  useEffect(() => {
    const el = track.current; if (!el) return;
    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      // Narrow screens drop the tall track, and with it the pin. With nothing to travel through, the stage shows its
      // end state — the five arrivals and the pipeline — rather than an empty frame.
      if (travel <= 0) { setP(1); setPin(0); return; }
      const past = -r.top;
      setP(Math.min(1, Math.max(0, past / travel)));
      // The stage is pinned by hand rather than with `position: sticky`: the sheet this page lives in is a
      // transformed, clipped box, so neither sticky nor fixed has the viewport to work against. Translating the
      // stage by exactly how far the track has gone past holds it still on screen for the whole track.
      setPin(Math.min(travel, Math.max(0, past)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure); };
    // the sheet over the map scrolls in its own box, so listen there as well as on the window
    const scroller = el.closest(".cover-body");
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    scroller?.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      scroller?.removeEventListener("scroll", onScroll);
    };
  }, []);

  const shrink = at(p, 0, 0.3);        // the phone coming down to visitor size
  const crowd = at(p, 0.25, 0.45);     // the other four arriving
  const flow = at(p, 0.4, 0.85);       // the pipeline doing its work
  const leave = at(p, 0.8, 1);         // the line heading for the next section
  const systemOn = flow > 0.15;                // the heading has turned over by here

  return (
    <section id="system" className="section ls" aria-label="From one visitor to a system">
      <div className="ls-track" ref={track}>
        <div
          className={`ls-stage${systemOn ? " is-system" : ""}`}
          style={{
            "--p": p,
            "--shrink": shrink,
            "--crowd": crowd,
            "--flow": flow,
            "--leave": leave,
            "--pin": `${pin}px`,
            /* 2.4 → 1: the phone fills its column, then settles into the first slot of five */
            "--row-scale": 2.4 - 1.4 * shrink,
          } as CSSProperties}
        >
          <header className="ls-head">
            <p className="eyebrow">What happens next</p>
            <span className="ls-h-swap">
              <h2 className="h2 ls-h a">That Was One Visitor.</h2>
              <h2 className="h2 ls-h b">The Job Needs a System.</h2>
            </span>
            <span className="ls-lead-swap">
              <p className="hs-lead a">Most weeks there are more. Getting the website right is the first step, not the whole job.</p>
              <p className="hs-lead b">Every inquiry lands in one place, gets sorted, and reaches the person who answers it — before the customer calls someone else.</p>
            </span>
          </header>

          <div className="ls-canvas">
            {/* the five arrivals; the first is the phone from the section above, coming down to size */}
            <ol className="ls-row">
              {VISITORS.map((v, i) => (
                <li key={v.who} className={i === 0 ? "ls-v is-phone" : "ls-v"} style={{ "--i": i } as CSSProperties}>
                  <span className="ls-card">
                    {i === 0 && (
                      <span className="ls-screen" aria-hidden="true">
                        <span className="ls-screen-tick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                        <b>Site walk booked</b>
                        <em>Deposit paid · dates held</em>
                      </span>
                    )}
                    <span className="ls-label">
                      <i className="ls-dot" aria-hidden="true" />
                      <b>{v.who}</b>
                      <em>{v.job}</em>
                      <small>{v.note}</small>
                    </span>
                  </span>
                </li>
              ))}
            </ol>

            {/* what the five run through */}
            <div className="ls-pipe">
              <Pipeline
                nodes={NODES}
                edges={EDGES}
                direction="vertical"
                theme="light"
                accentColor="#0E8F80"
                nodeColor="#FFFFFF"
                textColor="#19254A"
                grid={false}
                interactive={false}
                autoplay
                loop
                className="ls-pipeline"
              />
            </div>

            {/* and the line that carries on into the hub below */}
            <span className="ls-tail" aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
