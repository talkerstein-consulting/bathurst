"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import BrowserWindow from "@/components/browser-window";

/**
 * 03 · Website assessment: one phone, one business, two websites — played, not described. The heading and the fine
 * print sit on the left, the phone on the right. The sequence runs once when it comes into view, then waits on the
 * replay button in the phone's top corner.
 *
 * Act one (fast, 0–4.7s): the site that was assembled. Search, a page built for a desktop, a booking form that
 * fails, and a cross over the whole screen.
 * The morph (4.7–5.6s): the same glass, the same business, rebuilt.
 * Act two (5.6–14s): the current site. One thing to do, a quote sent, the booking confirmed, the deposit taken in an
 * iOS payment sheet, and the dates it writes into the calendar app.
 *
 * The mock site in act two is deliberately NOT in Talkerstein's faces or colours — it is the client's brand, not
 * ours, so it carries its own modern wordmark, type and ink (--nw-* in app/home.css). The deposit sheet and the
 * calendar are iOS and Google Calendar surfaces, drawn in their own system idioms for the same reason.
 * Reduced motion holds the final frame instead of playing.
 * TODO(content): the business, the deposit and the dates are a worked example, not a client. Swap in a real
 * before/after when one is cleared for publication.
 */

/** Step start times in ms. Act one is deliberately quick; act two gets room to land. */
const TIMES = [0, 700, 1500, 2300, 3100, 3900, 5600, 6800, 7800, 9200, 10600, 12200];
const END = 14200;
const TICK = 100;

const LABELS = [
  "Searching",
  "The old page loads",
  "Hunting for a way to book",
  "Filling the booking form",
  "The booking fails",
  "Visitor gone",
  "The same business, rebuilt",
  "One thing to do",
  "Requesting a quote",
  "Booking confirmed",
  "Deposit taken",
  "Dates in the calendar",
];

/** Where the visitor's thumb is, per step. */
const CURSOR: [number, number][] = [
  [50, 26], [62, 40], [44, 66], [50, 78], [50, 82], [50, 82],
  [50, 30], [46, 60], [56, 76], [50, 70], [50, 84], [50, 58],
];

/** The steps the visitor actually taps on, so the ripple only fires where a finger lands. */
const TAPS = new Set([2, 3, 4, 7, 8, 10]);

const clock = (ms: number) => `0:${String(Math.floor(ms / 1000)).padStart(2, "0")}`;

/** March 2026 starts on a Sunday, so the month grid needs no leading blanks. */
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const REPORTS = [13, 20, 27];

export default function JourneyPanels({ eyebrow, title, lead }: {
  eyebrow?: string; title: string; lead: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const timer = useRef(0);
  const started = useRef(false);
  const [t, setT] = useState(0);
  const [done, setDone] = useState(false);

  const play = useCallback(() => {
    clearInterval(timer.current);
    setDone(false);
    setT(0);
    timer.current = window.setInterval(() => {
      setT((v) => {
        const next = v + TICK;
        if (next >= END) { clearInterval(timer.current); setDone(true); return END; }
        return next;
      });
    }, TICK);
  }, []);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      if (reduced) { setT(END); setDone(true); return; }
      play();
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); clearInterval(timer.current); };
  }, [play]);

  const step = Math.max(0, TIMES.filter((ms) => t >= ms).length - 1);
  const pct = Math.round(Math.min(1, t / END) * 100);
  const [cx, cy] = CURSOR[step];
  const act = step < 6 ? "old" : "new";

  return (
    <div className="jp-layout" ref={box}>
      {/* ---------- left: the heading, where the sequence has got to, and the fine print ---------- */}
      <div className="jp-aside">
        <header className="hs-head">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2 className="h2 hs-h">{title}</h2>
          <p className="hs-lead">{lead}</p>
        </header>

        <div className="jp-prog" role="img" aria-label={`${LABELS[step]} — ${pct}% through the sequence`}>
          <span className="jp-prog-track"><i style={{ "--p": `${pct}%` } as CSSProperties} /></span>
          <span className="jp-prog-row"><em>{LABELS[step]}</em><b>{clock(Math.min(t, END))}</b></span>
        </div>
      </div>

      {/* ---------- right: the phone ---------- */}
      <figure className={`jp is-${step} act-${act}`}>
        <div className="jp-frame">
          <span className="jp-island" aria-hidden="true" />
          <button type="button" className="jp-replay" onClick={play}
            aria-label={done ? "Replay the sequence" : "Start the sequence again"}
            title={done ? "Replay" : "Start again"}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8" /><path d="M3 3v5h5" /></svg>
          </button>

          <BrowserWindow
            className="jp-win"
            url={act === "old" ? "northside-reno.ca/home.html" : "northsiderenovations.ca"}
            aspect={0.5}
            chrome="compact"
            frame="inset"
            theme="light"
            radius={30}
            windowColor="#f2f4f7"
            autoplay={false}
            typing={false}
            loader={false}
            controls={false}
          >
            <div className="jp-view">
              {/* 0 · the search both acts start from */}
              <div className="jp-scene jp-search">
                <div className="jp-q"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></svg>commercial renovation company near me</div>
                <a className="jp-hit"><b>Northside Renovations</b><span>northside-reno.ca</span><em>Commercial renovations · North York</em></a>
                <span className="jp-hit dim"><b /><span /><em /></span>
                <span className="jp-hit dim"><b /><span /><em /></span>
              </div>

              {/* ---------- act one: the site that was assembled ---------- */}
              <div className="jp-act act-1">
                <div className="jp-scene jp-site jp-bad">
                  {/* the whole point of this panel: it is not an old site, it is a current one */}
                  <div className="bd-built"><b>Built in 2025</b><span>Still live. Still losing the booking.</span></div>
                  <div className="bd-nav"><b>NORTHSIDE RENO</b><span>Home</span><span>About Us</span><span>Services</span><span>Gallery</span><span>Contact</span></div>
                  <h4 className="bd-h">Welcome To Our Website!</h4>
                  <p className="bd-p">We are a family owned company serving the GTA since 2009 with quality workmanship and competitive pricing on all types of projects both big and small.</p>
                  <div className="bd-photo"><img src="/journey/bad-hero.webp" alt="" loading="lazy" decoding="async" /></div>
                  <div className="bd-btns"><span>Learn More</span><span>Click Here</span><span>Our Services</span></div>
                  <div className="bd-strip"><b>★ FAMILY OWNED &amp; OPERATED ★</b><b>★ FULLY INSURED ★</b><b>★ FREE ESTIMATES ★</b></div>
                  <h5 className="bd-h2">Our Work</h5>
                  <div className="bd-gal"><span><img src="/journey/bad-work.webp" alt="" loading="lazy" decoding="async" /></span><span /><span /><span /></div>
                  <p className="bd-p sm">Photos coming soon. Check back for updates on our latest completed projects.</p>
                  <h5 className="bd-h2">Business Hours</h5>
                  <table className="bd-hours"><tbody>
                    {[["Monday – Friday", "7:00 AM – 5:00 PM"], ["Saturday", "By appointment"], ["Sunday", "CLOSED"]].map(([d, h]) => (
                      <tr key={d}><td>{d}</td><td>{h}</td></tr>
                    ))}
                  </tbody></table>
                  <h5 className="bd-h2">Book An Appointment</h5>
                  <div className="bd-form">
                    <span className="bd-field f1">Dana Whitfield</span>
                    <span className="bd-field f2">dana@fieldstone.ca</span>
                    <span className="bd-field f3">Preferred date (dd/mm/yyyy)</span>
                    <span className="bd-field tall">Message *</span>
                    <span className="bd-captcha"><i />I&rsquo;m not a robot</span>
                    <span className="bd-submit">SUBMIT</span>
                  </div>
                  <div className="bd-foot">Tel: (416) 555‑0148 · info@northside-reno.ca<br />Copyright © 2025 Northside Renovations. All Rights Reserved. · Visitors: 014872</div>
                </div>
                {/* the bar a page that never fitted this screen leaves behind */}
                <span className="bd-hbar" aria-hidden="true"><i /></span>
                <div className="bd-err"><b>Error</b><span>Your booking could not be submitted. Please try again later.</span></div>
                {/* 5 · nothing came of it */}
                <div className="bd-cross" aria-hidden="true">
                  <svg viewBox="0 0 120 120"><path d="M24 24l72 72M96 24l-72 72" /></svg>
                  <p>No booking. No record. No follow-up.</p>
                </div>
              </div>

              {/* ---------- act two: the same business, rebuilt (the client's own brand, not ours) ---------- */}
              <div className="jp-act act-2">
                <div className="jp-scene jp-site jp-good">
                  <div className="nw-nav"><b>northside<i /></b><span className="nw-burger" aria-hidden="true"><i /><i /></span></div>
                  <p className="nw-eyebrow">Commercial fit-outs · Greater Toronto Area</p>
                  <h4 className="nw-h">Commercial renovations, finished on schedule.</h4>
                  <p className="nw-p">Office fit-outs, retail builds and restaurant renovations, handed back on the date you were given.</p>
                  <div className="nw-photo">
                    <img src="/journey/good-hero.webp" alt="" loading="lazy" decoding="async" />
                    <span className="nw-photo-tag"><b>Fieldstone Dental</b><em>Delivered 2 weeks early</em></span>
                  </div>
                  <div className="nw-stats">
                    {[["18", "years in the GTA"], ["240+", "projects delivered"], ["96%", "on or ahead"]].map(([v, l]) => (
                      <span key={l}><b>{v}</b><em>{l}</em></span>
                    ))}
                  </div>
                  <div className="nw-trust">{["Fieldstone Dental", "Bayview Optical", "Harlow & Co."].map((n) => <i key={n}>{n}</i>)}</div>
                  <h5 className="nw-h2">How a project runs</h5>
                  <ol className="nw-steps">
                    {[["01", "Site walk", "We measure, photograph and price the real conditions."], ["02", "Fixed schedule", "Trades booked end to end before day one."], ["03", "Weekly report", "Photos and spend, every Friday."]].map(([n, ti, d]) => (
                      <li key={n}><span>{n}</span><b>{ti}</b><em>{d}</em></li>
                    ))}
                  </ol>
                  <h5 className="nw-h2">Recent projects</h5>
                  <div className="nw-work">
                    {/* one lead project, then the rest two up — a hierarchy, not a uniform strip */}
                    <figure className="lead"><img src="/journey/good-1.webp" alt="" loading="lazy" decoding="async" /><b>Bayview Optical</b><em>Retail build · 1,800 sq ft</em></figure>
                    <figure><img src="/journey/good-2.webp" alt="" loading="lazy" decoding="async" /><b>Queen St. Kitchen</b><em>Restaurant · 11 weeks</em></figure>
                    <figure><img src="/journey/good-3.webp" alt="" loading="lazy" decoding="async" /><b>Harlow &amp; Co.</b><em>Office · two floors</em></figure>
                  </div>
                  <blockquote className="nw-quote">
                    <p>&ldquo;They handed back the space two weeks early and we opened on the date we&rsquo;d already advertised.&rdquo;</p>
                    <cite><i />Dana Whitfield <small>· Fieldstone Dental</small></cite>
                  </blockquote>
                  <div className="nw-foot">
                    <span><b>northside</b><em>41 Wingold Ave, North York</em></span>
                    <span><b>quotes@northsiderenovations.ca</b><em>Replies within one business day</em></span>
                  </div>
                </div>

                {/* the one thing to do, within a thumb's reach the whole way down */}
                <span className="nw-bar"><b>Get a quote</b></span>

                {/* 8 · the request */}
                <div className="nw-form">
                  <p className="nw-form-h">Request a quote</p>
                  <label className="nw-f f1"><i>Name</i><b>Dana Whitfield</b></label>
                  <label className="nw-f f2"><i>Email</i><b>dana@fieldstone.ca</b></label>
                  <label className="nw-f f3"><i>Project</i><b>Office fit-out, 4,200 sq ft</b></label>
                  <span className="nw-send">Send request</span>
                </div>

                {/* 9 · it becomes a booking */}
                <div className="nw-booked">
                  <span className="nw-tick"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                  <b>Site walk booked</b>
                  <em>Tuesday 3 March · 8:00 AM · 41 Wingold Ave</em>
                </div>

                {/* 10 · the deposit, taken in the phone's own payment sheet */}
                <div className="ios-sheet" role="img" aria-label="iOS payment sheet confirming a $1,250.00 deposit">
                  <span className="ios-grab" aria-hidden="true" />
                  <div className="ios-head"><b>Deposit</b><span>northside</span></div>
                  <div className="ios-row"><span className="ios-card" aria-hidden="true" />Visa ···· 4242<em>Default Card</em></div>
                  <div className="ios-row ios-total"><span>Total</span><b>$1,250.00</b></div>
                  <div className="ios-done"><span className="ios-ok" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>Done</div>
                  <span className="ios-bar" aria-hidden="true" />
                </div>

                {/* 11 · and what it writes into the calendar */}
                <div className="gc-app" role="img" aria-label="Google Calendar showing the site walk and the weekly reports">
                  <div className="gc-top">
                    <span className="gc-menu" aria-hidden="true"><i /><i /><i /></span>
                    <b>March 2026</b>
                    <span className="gc-avatar" aria-hidden="true">D</span>
                  </div>
                  <div className="gc-wk">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <i key={i}>{d}</i>)}</div>
                  <div className="gc-grid">
                    {DAYS.map((d) => (
                      <span key={d} className={d === 3 ? "today" : undefined}>
                        <i>{d}</i>
                        {d === 3 && <em className="ev blue">Site walk</em>}
                        {d === 13 && <em className="ev green">Schedule</em>}
                        {REPORTS.includes(d) && d !== 13 && <em className="ev dot" />}
                      </span>
                    ))}
                  </div>
                  <ul className="gc-agenda">
                    <li><i className="blue" /><b>8:00 AM</b><em>Site walk · 41 Wingold Ave</em></li>
                    <li><i className="green" /><b>Fri 13</b><em>Fixed schedule issued</em></li>
                    <li><i className="grey" /><b>Every Fri</b><em>Weekly report · photos and spend</em></li>
                  </ul>
                </div>
              </div>

              {/* the visitor's thumb, and the tap it leaves behind */}
              <span className="jp-cursor" style={{ left: `${cx}%`, top: `${cy}%` }} aria-hidden="true" />
              {TAPS.has(step) && <span key={step} className="jp-tap" style={{ left: `${cx}%`, top: `${cy}%` }} aria-hidden="true" />}
            </div>
          </BrowserWindow>
          <span className="jp-home" aria-hidden="true" />
        </div>
      </figure>
    </div>
  );
}
