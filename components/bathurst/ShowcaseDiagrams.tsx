import type { ReactElement, ReactNode } from "react";
import LOGOS from "@/lib/bathurst/logos.json";
import { BRAND_FONTS } from "./brandFonts";

/**
 * The twelve showcase builds (Showcase.tsx, lib/bathurst/showcase.ts), each drawn as a working screen in a 2026 client's own
 * branding: their logo, colours and typeface (read from their live site; brand variables in app/bathurst-map.css, ".s-…").
 * Same 340 × 210 em grid as the capability screens (CapDiagrams.tsx): 1em = 10 design px, scaled by the card's width.
 */
type LogoId = keyof typeof LOGOS;
const Logo = ({ id, className = "" }: { id: LogoId; className?: string }) => <img className={`u-logo ${className}`} src={LOGOS[id]} alt="" loading="lazy" />;
const Check = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
const Chev = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6l6 6-6 6" /></svg>;
/** a screen's root: the shared grid plus the brand's class */
const Screen = ({ brand, children }: { brand: string; children: ReactNode }) => <div className={`u-screen ${BRAND_FONTS} s-screen s-${brand}`}>{children}</div>;
/** the brand's app bar: logo, name, one control on the right */
const Bar = ({ logo, name, right }: { logo: LogoId; name: string; right?: ReactNode }) => (
  <div className="s-bar"><Logo id={logo} className="s-bar-logo" /><b>{name}</b>{right}</div>
);

/* ---------------- Win more business ---------------- */

/** Eli's Barbershop: pick a service, a day and a time, book */
function Booking() {
  return (
    <Screen brand="elis">
      <Bar logo="elis" name="ELI'S BARBERSHOP" right={<span className="s-step">Book online</span>} />
      <div className="s-book">
        <div className="s-svc">
          {[["Classic cut", "45 min", "$35"], ["Cut + beard", "60 min", "$50"], ["Beard trim", "20 min", "$20"]].map(([n, t, p], i) => (
            <div key={n} className={`s-svc-row${i === 0 ? " on" : ""}`}><span><b>{n}</b><small>{t}</small></span><em>{p}</em></div>
          ))}
        </div>
        <div className="s-slots">
          <div className="s-days">{["Wed 12", "Thu 13", "Fri 14"].map((d, i) => <i key={d} className={i === 1 ? "on" : ""}>{d}</i>)}</div>
          <div className="s-times">{["10:00", "10:45", "11:30", "1:15", "2:00", "2:45"].map((t, i) => <i key={t} className={i === 1 ? "on" : i === 4 ? "off" : ""}>{t}</i>)}</div>
          <span className="u-btn">Book Thu 10:45</span>
        </div>
      </div>
    </Screen>
  );
}

/** Brickstone Construction: answer a few questions, see a price range */
function Quote() {
  return (
    <Screen brand="brick">
      <Bar logo="brickstone" name="Brickstone" right={<span className="s-step">Step 2 of 4</span>} />
      <div className="s-prog"><i style={{ width: "50%" }} /></div>
      <div className="s-quote">
        <div>
          <b className="s-q">What are you building?</b>
          <div className="s-opts">{["Basement finish", "Kitchen reno", "Home addition"].map((o, i) => <i key={o} className={i === 0 ? "on" : ""}>{i === 0 && <Check />}{o}</i>)}</div>
          <b className="s-q">Size</b>
          <div className="s-range"><i style={{ width: "42%" }} /><span>850 sq ft</span></div>
        </div>
        <div className="s-est"><small>Estimated range</small><b>$42,000 – $56,000</b><span className="u-btn sm">Get my firm quote</span></div>
      </div>
    </Screen>
  );
}

/** Bubby's Bagels: build a platter, the price follows */
function Configurator() {
  return (
    <Screen brand="bubbys">
      <Bar logo="bubbys" name="Build your platter" right={<span className="s-step">Catering</span>} />
      <div className="s-cfg">
        <div className="s-cfg-l">
          <small>Size</small>
          <div className="s-seg">{["12", "24", "36"].map((n, i) => <i key={n} className={i === 1 ? "on" : ""}>{n} bagels</i>)}</div>
          <small>Spreads</small>
          <div className="s-ticks">{[["Plain cream cheese", 1], ["Scallion", 1], ["Lox spread  +$12", 1], ["Hummus", 0]].map(([n, on]) => <i key={n as string} className={on ? "on" : ""}><span>{on ? <Check /> : null}</span>{n}</i>)}</div>
        </div>
        <div className="s-cfg-r">
          <div className="s-cfg-img"><img src="/clients/bubbys/banner-sm.webp" alt="" loading="lazy" /></div>
          <div className="s-total"><small>Total</small><b>$64.00</b></div>
          <span className="u-btn sm">Add to order</span>
        </div>
      </div>
    </Screen>
  );
}

/** Hetz Electrical: the site assistant qualifies the job and hands over the lead */
function Assistant() {
  return (
    <Screen brand="hetz">
      <div className="s-chatw">
        <div className="s-chat-h"><Logo id="hetz" className="u-av" /><span><b>Hetz Assistant</b><small>Licensed electricians · replies instantly</small></span></div>
        <div className="s-msgs">
          <p className="me">Do you install EV chargers in Thornhill?</p>
          <p className="bot">Yes, Level 2 chargers, usually in one day. What size is your electrical panel?</p>
          <div className="s-quick"><i>100 amp</i><i>200 amp</i><i>Not sure</i></div>
        </div>
      </div>
      <div className="u-float s-lead"><Check /><span><b>New lead</b><small>EV charger · Thornhill · 200A</small></span></div>
    </Screen>
  );
}

/* ---------------- Run your business ---------------- */

/** AR26 / A&R Motors: the customer's own login: status, documents, invoice */
function Portal() {
  const steps = ["Received", "Approved", "In repair", "Ready"];
  return (
    <Screen brand="ar26">
      <Bar logo="ar26" name="My repair" right={<span className="s-user">D. Cohen</span>} />
      <div className="s-portal">
        <div className="s-card">
          <b>2019 Audi A4 · Body & paint</b>
          <div className="s-steps">{steps.map((s, i) => <span key={s} className={i < 2 ? "done" : i === 2 ? "now" : ""}><i>{i < 2 ? <Check /> : null}</i>{s}</span>)}</div>
        </div>
        <div className="s-docs">
          <div className="s-doc"><i>PDF</i><span>Estimate #2041</span></div>
          <div className="s-doc"><i>IMG</i><span>Damage photos (12)</span></div>
        </div>
        <div className="s-inv"><span><small>Invoice #2041</small><b>$1,840.00</b></span><span className="u-btn sm">Pay now</span></div>
      </div>
    </Screen>
  );
}

/** KidiCare: one stock count across store, warehouse and website */
function Inventory() {
  const rows: [string, number, number, number, boolean][] = [["Baby carrier, grey", 4, 18, 22, false], ["Bottle warmer", 1, 0, 1, true], ["Play mat, rainbow", 6, 31, 37, false]];
  return (
    <Screen brand="kidi">
      <Bar logo="kidicare" name="Inventory" right={<span className="s-step">All locations</span>} />
      <div className="s-alert"><b>2 items</b> below reorder point<span className="u-btn sm">Reorder</span></div>
      <table className="s-table">
        <thead><tr><th>Product</th><th>Store</th><th>Warehouse</th><th>Online</th></tr></thead>
        <tbody>{rows.map(([n, a, b, c, low]) => <tr key={n} className={low ? "low" : ""}><td>{n}</td><td>{a}</td><td>{b}</td><td>{low ? <span className="u-pill warn">{c} left</span> : c}</td></tr>)}</tbody>
      </table>
    </Screen>
  );
}

/** Luminari Cleaning: today's dispatch board */
function Field() {
  const crews: [string, [number, number, string, string][]][] = [
    ["Maria", [[0, 2, "Deep clean · Elm Ave", "done"], [2.4, 1.6, "Move-out · Bathurst", "now"]]],
    ["Dev", [[0.6, 1.8, "Office · Yonge St", "done"], [2.8, 1.2, "Windows · Steeles", ""]]],
    ["Ana", [[0, 1.4, "Weekly · Wilson", "done"], [1.8, 2.2, "Post-reno · Finch", "now"]]],
  ];
  return (
    <Screen brand="lum">
      <Bar logo="luminari" name="Dispatch · Thursday" right={<span className="s-step">3 crews · 6 jobs</span>} />
      <div className="s-board">
        <div className="s-hours"><span />{["8", "9", "10", "11", "12"].map((h) => <small key={h}>{h}:00</small>)}</div>
        {crews.map(([c, jobs]) => (
          <div key={c} className="s-lane"><b>{c}</b><div className="s-track">{jobs.map(([x, w, t, st]) => <i key={t} className={st} style={{ left: `${x * 25}%`, width: `${w * 25}%` }}>{t}</i>)}</div></div>
        ))}
      </div>
    </Screen>
  );
}

/** Kapara: documents in, approvals routed, signatures gathered */
function Approvals() {
  const docs: [string, string, string][] = [["Supplier agreement", "Signed", "ok"], ["Insurance certificate", "Uploaded", "ok"], ["Event menu", "Waiting on Chef", "wait"], ["Final invoice", "Not started", ""]];
  return (
    <Screen brand="kapara">
      <Bar logo="kapara" name="Event file · Nov 22" right={<span className="s-step">2 of 4 done</span>} />
      <div className="s-docs2">
        {docs.map(([n, s, k]) => <div key={n} className={`s-drow ${k}`}><i>{k === "ok" ? <Check /> : null}</i><b>{n}</b><small>{s}</small></div>)}
        <div className="s-sign"><span><small>Your signature</small><em>Event menu</em></span><span className="u-btn sm">Review & sign</span></div>
      </div>
    </Screen>
  );
}

/* ---------------- Automate your business ---------------- */

/** CleverPays: the pipeline, lead to signed */
function Pipeline() {
  const cols: [string, number, [string, string][]][] = [
    ["New", 12, [["Maple Dental", "$4.2k"], ["Northline HVAC", "$2.8k"]]],
    ["Contacted", 8, [["Rosen Law", "$6.0k"], ["Bloom Florals", "$1.9k"]]],
    ["Proposal", 5, [["Elm Logistics", "$12k"]]],
    ["Won", 3, [["Harbour Café", "$3.4k"]]],
  ];
  return (
    <Screen brand="clever">
      <Bar logo="cleverpays" name="Pipeline" right={<span className="s-step">$58.6k open</span>} />
      <div className="s-kanban">
        {cols.map(([n, c, deals], i) => (
          <div key={n} className={`s-col${i === 3 ? " won" : ""}`}><small>{n} <em>{c}</em></small>{deals.map(([d, v]) => <div key={d} className="s-deal"><b>{d}</b><span>{v}</span></div>)}</div>
        ))}
      </div>
    </Screen>
  );
}

/** Amazing Donuts: sales, orders and stores in one view */
function Intelligence() {
  const stores: [string, number][] = [["Bathurst", 92], ["Yonge", 74], ["Thornhill", 58], ["Online", 46]];
  return (
    <Screen brand="donuts">
      <Bar logo="amazingdonuts" name="This week" right={<span className="s-step">All stores</span>} />
      <div className="s-bi">
        <div className="s-kpis">{[["Sales", "$18,420", "+9%"], ["Orders", "1,264", "+6%"], ["Avg order", "$14.57", "+3%"], ["Repeat", "38%", "+4 pts"]].map(([n, v, d]) => <div key={n}><small>{n}</small><b>{v}</b><em>{d}</em></div>)}</div>
        <div className="s-bars"><small>Sales by store</small>{stores.map(([n, w]) => <div key={n}><span>{n}</span><i style={{ width: `${w}%` }} /></div>)}</div>
      </div>
    </Screen>
  );
}

/** a phone in the card: the screen is a 390-px-wide page on a 10-px em grid (39em), the camera (.s-cam) scrolls and zooms */
const Phone = ({ brand, children }: { brand: string; children: ReactNode }) => (
  <div className={`u-screen ${BRAND_FONTS} s-stage`}>
    <div className={`s-phone s-${brand}`}>
      <div className="s-cam">{children}</div>
      <span className="s-island" aria-hidden="true" />
    </div>
  </div>
);
const Status = ({ dark = false }: { dark?: boolean }) => <div className={`s-status${dark ? " dark" : ""}`}><b>9:41</b><span><i /><i /><i /></span></div>;
const Tap = ({ className }: { className: string }) => <i className={`s-tap ${className}`} aria-hidden="true" />;

/** Carmel Transport: their container/booking tracker on a phone, operated: tap the field (zoom), type the booking number,
 *  tap Search (zoom), and the shipment's status fills in (CSS loop in app/bathurst-map.css, ".s-ctm") */
function Tracking() {
  const steps: [string, string][] = [["Picked up", "Concord, ON · Nov 12, 8:10 am"], ["In transit", "Kingston, ON · 11:42 am"], ["Out for delivery", "Expected Nov 14"], ["Delivered", ""]];
  return (
    <Phone brand="ctm">
      <div className="s-ctm-hero">
        <Status dark />
        <div className="s-ctm-nav"><Logo id="carmel" className="s-ctm-logo" /><span className="s-ctm-menu"><i /><i /><i /></span></div>
        <b className="s-ctm-h">Container/ Booking Tracker</b>
        <p>Track your container with the container number or the booking number provided to you.</p>
      </div>
      <div className="s-ctm-card">
        <div className="s-ctm-search"><span className="s-ctm-field"><span className="s-ctm-ph">Enter Booking Number</span><span className="s-ctm-typed">CT-48213</span><i className="s-ctm-caret" /></span><span className="s-ctm-btn">Search</span></div>
        <div className="s-ctm-res">
          <div className="s-ctm-eta"><small>Booking CT-48213 · 40ft container</small><b>Arrives Thu, Nov 14</b><span>2–4 pm · Montréal, QC</span></div>
          <ol className="s-ctm-steps">{steps.map(([t, d], i) => <li key={t} className={`k${i}`}><i>{i === 0 ? <Check /> : null}</i><span><b>{t}</b>{d && <small>{d}</small>}</span></li>)}</ol>
        </div>
        <Tap className="t1" /><Tap className="t2" />
      </div>
    </Phone>
  );
}

/** Hily's Sparkly Spa: the after-visit email, from the customer's side on a phone: it lands two days after the visit,
 *  she opens it (zoom), taps the fifth star (zoom), and the thank-you with 10% off comes straight back (CSS loop, ".s-eam") */
function Journeys() {
  return (
    <Phone brand="eam">
      <Status />
      <div className="s-eam-inbox">
        <div className="s-eam-bar"><b>Inbox</b><small>Updated just now</small></div>
        <div className="s-eam-row new"><Logo id="hilys" className="s-eam-av" /><span><b>Hily’s Sparkly Spa</b><i>How was Twinkly Day? ★</i><small>Tap a star to tell us how we did…</small></span><time>now</time></div>
        <div className="s-eam-row"><span className="s-eam-av2">C</span><span><b>Canada Post</b><i>Your parcel is on the way</i><small>Track your delivery…</small></span><time>9:12</time></div>
        <div className="s-eam-row"><span className="s-eam-av2">M</span><span><b>Mom</b><i>Sunday dinner</i><small>Bring the kids at 5…</small></span><time>Tue</time></div>
        <Tap className="t1" />
      </div>
      <div className="s-eam-mail">
        <div className="s-eam-top"><span>‹ Inbox</span></div>
        <div className="s-eam-from"><Logo id="hilys" className="s-eam-av" /><span><b>Hily’s Sparkly Spa</b><small>to Sarah · 2 days after your visit</small></span></div>
        <div className="s-eam-body">
          <div className="s-eam-img"><img src="/clients/hilys/photo-1-sm.webp" alt="" loading="lazy" /></div>
          <b className="s-eam-h">How was Twinkly Day?</b>
          <p>Tap a star to tell us how Maya’s visit went.</p>
          <div className="s-eam-stars"><i>★</i><i>★</i><i>★</i><i>★</i><i>★</i></div>
          <div className="s-eam-thanks"><b>Thank you, Sarah!</b><p>Here’s 10% off your next visit.</p><span className="s-eam-code">SPARKLE10</span><span className="s-eam-book">Book again</span></div>
          <Tap className="t2" />
        </div>
      </div>
    </Phone>
  );
}

export const SHOWCASE_DIAGRAMS: Record<string, () => ReactElement> = {
  booking: Booking, quote: Quote, configurator: Configurator, assistant: Assistant,
  portal: Portal, inventory: Inventory, field: Field, approvals: Approvals,
  pipeline: Pipeline, bi: Intelligence, tracking: Tracking, journeys: Journeys,
};
