"use client";

import { InstrumentDial } from "@/components/instrument-dial";
import { Frame } from "./frame";

/**
 * The key to the numbers, directly under the intake: what each score is, where it turns
 * dangerous, and what that costs the business. It is a preview before a check has been
 * run and the legend afterwards, so it does not come and go with the result.
 *
 * THE BANDS ARE LIGHTHOUSE'S OWN, not ours: Google scores 0–49 as poor, 50–89 as needing
 * improvement and 90–100 as good, and colours them red, orange and green in its own
 * report. Those cut-offs are quoted here; nothing on this page re-weights or re-grades
 * them. Each needle is parked on the edge of its danger band, so the gauge shows where
 * the line is rather than inventing a score for a site nobody has checked yet.
 *
 * DELIBERATELY NOT SAID: the accessibility row does not mention the AODA or any other
 * obligation. Which Ontario organisations must meet WCAG 2.0 AA, and by when, is a legal
 * question with thresholds attached, and it is the client's to answer — not a line to
 * guess at in marketing copy. Add it here once they have confirmed the wording.
 *
 * The needle parks and stays: it is marking a fixed line, not reporting a live reading,
 * so it does not drift. The number under it is that line (49, 89, 89), labelled as the
 * danger line rather than as a score, because a bare 49 beside the word "Performance"
 * would read as this visitor's own result.
 *
 * The gauges are figures, not controls: they do not replay on click, they are hidden from
 * assistive technology, and the band and the risk are written out beside each one so the
 * section reads identically with no pictures at all.
 */

type Band = {
  key: string;
  label: string;
  /** The score at the top of the danger band — below this, Lighthouse stops calling it good. */
  edge: number;
  /** How Google bands it, in Google's words. */
  scale: string;
  risk: string;
};

const BANDS: Band[] = [
  {
    key: "performance",
    label: "Performance",
    edge: 49,
    scale: "Google calls 0–49 poor, 50–89 needs improvement, 90–100 good.",
    risk: "In the poor band the page is slow enough that people leave before it finishes. They do not report a slow website; they go back to the search results and open the next one.",
  },
  {
    key: "accessibility",
    label: "Accessibility",
    edge: 89,
    scale: "A machine can only check part of this. A high score is a floor, not a pass.",
    risk: "What it does catch is usually text no one can read against its background, a button with no name, or an image with nothing to announce. Each one is a customer who cannot finish what they came to do.",
  },
  {
    key: "practices",
    label: "Best practices",
    edge: 89,
    scale: "Mixed content, insecure requests, deprecated code and console errors.",
    risk: "This is the closest the check gets to the security question — and it still will not tell you that a page is quietly sending people somewhere else.",
  },
];

export function CheckBands() {
  return (
    <section className="ck-bands" aria-labelledby="bands-h">
      {/* The instrument panel: a double-lined plate with a rivet at each corner. The
          rivets are drawn here rather than in the markup of each row, so the enclosure
          belongs to the panel and not to its contents. */}
      <Frame className="ck-panel">
        <span className="ck-rivets" aria-hidden="true">
          <i /><i /><i /><i />
        </span>

        <header className="ck-panel-head">
          <h2 id="bands-h" className="ck-h3">
            What the three numbers are telling you
          </h2>
          <p className="ck-panel-sub">
            Where each one stops being good, and what sits on the other side of that line.
          </p>
        </header>

        <ul className="ck-band-list">
          {BANDS.map((band) => (
            <li className="ck-band" key={band.key}>
              <div className="ck-band-dial" aria-hidden="true">
                <InstrumentDial
                  stats={[{ label: "Danger line", value: band.edge, min: 0, max: 100 }]}
                  variant="gauge"
                  numerals
                  size={176}
                  gap={0}
                  theme="light"
                  accentColor="#19254A"
                  trackColor="rgb(25 37 74 / .20)"
                  textColor="#19254A"
                  duration={2200}
                  replayOnClick={false}
                />
              </div>

              <div className="ck-band-copy">
                <h3 className="ck-band-name">{band.label}</h3>
                <p className="ck-band-edge">
                  Danger below <b>{band.edge + 1}</b>
                </p>
                <p className="ck-band-scale">{band.scale}</p>
                <p className="ck-band-risk">{band.risk}</p>
              </div>
            </li>
          ))}
        </ul>
      </Frame>
    </section>
  );
}
