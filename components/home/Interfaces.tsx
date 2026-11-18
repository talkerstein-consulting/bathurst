import "@/app/interfaces.css";

/**
 * The pictures for §03 The Reality (components/home/RealityPanels.tsx) and §06 What We Do
 * (components/home/CapabilityPanels.tsx).
 *
 * THREE DIFFERENT SHAPES, because the three ideas are different shapes. Drawing all of them the same way — three
 * boxes on a connector, whatever the heading said — made the section read as one picture repeated six times.
 *
 *   1 · being found      a RANKED LIST. The whole idea is a position in a list, and only a list shows a position.
 *   2 · the page         a PAGE. The idea is what is on it and whether there is anything to press.
 *   3 · the follow-up    a CHAIN of containers on connectors. The idea is a sequence that either completes or
 *                        doesn't, and connectors are the only one of the three that draws a sequence.
 *
 * §03 and §06 are the same three shapes twice: failing, then working. The list has you at 28th, then first; the
 * page has nothing to press, then something; the chain breaks before the end, then runs through.
 *
 * Each is cut to the fewest parts that still say it. A fourth name in the list, a paragraph under the headline, a
 * label over every line of the chain — each was true and none of it was read, because the figure had already made
 * its point by then.
 *
 * Nothing sits inside a browser or app window: the frame added a thing to decode before you could read what was
 * inside it. Motion runs only while a figure is the one being read, and stops under `prefers-reduced-motion`
 * (app/interfaces.css).
 */

/* ---------- 1 · the ranked list ---------- */

const Rank = ({ at, name, mine = false }: { at: string; name: string; mine?: boolean }) => (
  <li className={mine ? "rk-row is-mine" : "rk-row"}>
    <span className="rk-at">{at}</span>
    <span className="rk-name">{name}</span>
  </li>
);

/** §03 — they are looking, and they never get as far as you */
export const FigNotFound = () => (
  <div className="fg is-cold">
    <p className="fg-cap">Searching “plumber north york”</p>
    <ol className="rk">
      <Rank at="1" name="Rapid Plumbing GTA" />
      <Rank at="2" name="North York Drain Co." />
      <li className="rk-fold">nobody scrolls past here</li>
      <Rank at="28" name="Your business" mine />
    </ol>
  </div>
);

/** §06 — the same list, with you at the top of it */
export const FigGrowth = () => (
  <div className="fg">
    <p className="fg-cap">Searching “plumber north york”</p>
    <ol className="rk rk-climb">
      <Rank at="1" name="Your business" mine />
      <Rank at="2" name="Rapid Plumbing GTA" />
      <Rank at="3" name="North York Drain Co." />
    </ol>
  </div>
);

/* ---------- 2 · the page ---------- */

/** §03 — they read it, and there is nothing to do next */
export const FigNotConvinced = () => (
  <div className="fg is-cold">
    <p className="fg-cap">Your website</p>
    <div className="pg">
      <p className="pg-h">We do quality work for the GTA.</p>
      <span className="pg-none">nothing to press</span>
    </div>
  </div>
);

/** §06 — the same page, saying something, with one thing to do */
export const FigExperience = () => (
  <div className="fg">
    <p className="fg-cap">Your website</p>
    <div className="pg">
      <p className="pg-h">A plumber at your door in 90 minutes.</p>
      <span className="pg-btn">Get a quote</span>
    </div>
  </div>
);

/* ---------- 3 · the chain ---------- */

const Step = ({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "key" | "dead" }) => (
  <div className={`ch-box is-${tone}`}>{children}</div>
);

const Join = ({ broken = false, note }: { broken?: boolean; note?: string }) => (
  <div className={broken ? "ch-join is-broken" : "ch-join"} aria-hidden="true">
    <span className="ch-line"><i className="ch-pulse" /></span>
    {note && <span className="ch-note">{note}</span>}
  </div>
);

/** §03 — the inquiry arrives, and the answer never does */
export const FigNotFollowed = () => (
  <div className="fg is-cold">
    <div className="ch">
      <Step>“Can you quote a reno?”</Step>
      <Join broken note="nine days, no reply" />
      <Step tone="dead">A booked job</Step>
    </div>
  </div>
);

/** §06 — the same chain, joined up and running itself */
export const FigSystems = () => (
  <div className="fg">
    <div className="ch">
      <Step>“Can you quote a reno?”</Step>
      <Join note="replied in two minutes" />
      <Step tone="key">A booked job</Step>
    </div>
  </div>
);

/** What the phone is showing. The three states §04 steps through; §03 shows the first of them. */
function Screen({ i }: { i: number }) {
  if (i === 0) return (
    <div className="ph-screen">
      <p className="ph-cap">Searching “plumber north york”</p>
      <ol className="ph-list">
        <li className="ph-row is-mine"><span>1</span>Your business</li>
        <li className="ph-row"><span>2</span>Rapid Plumbing GTA</li>
        <li className="ph-row"><span>3</span>North York Drain Co.</li>
      </ol>
    </div>
  );
  if (i === 1) return (
    <div className="ph-screen">
      <p className="ph-cap">Your website</p>
      <p className="ph-h">A plumber at your door in 90 minutes.</p>
      <span className="ph-btn">Get a quote</span>
    </div>
  );
  return (
    <div className="ph-screen">
      <p className="ph-cap">Your inbox</p>
      <ol className="ph-list">
        <li className="ph-row is-done">Dana R.<em>Replied</em></li>
        <li className="ph-row is-done">Marc T.<em>Replied</em></li>
        <li className="ph-row is-done">Priya S.<em>Booked</em></li>
      </ol>
    </div>
  );
}

/**
 * The phone. §03's last step hands it over to §04: the same device, drawn the same way, so moving from the right of
 * one section to the left of the next reads as the phone travelling rather than as two different pictures.
 */
export function Phone({ at }: { at: number }) {
  return (
    <div className="ph" aria-hidden="true">
      <div className="ph-body">
        <span className="ph-bar" />
        <div className="ph-stack">
          {[0, 1, 2].map((i) => (
            <div key={i} className={i === at ? "ph-slot is-on" : "ph-slot"}><Screen i={i} /></div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * §03's last step: the phone itself, showing the first of its screens. It is the handover — the next section opens
 * with the same device on its left, so the two sections read as one phone carried across rather than as a picture
 * that stopped and another that started.
 */
export const FigHandover = () => (
  <div className="fg is-hand"><Phone at={0} /></div>
);

export const CAPABILITY_FIGURES = [FigGrowth, FigExperience, FigSystems];
export const REALITY_FIGURES = [FigNotFound, FigNotConvinced, FigNotFollowed, FigHandover];
