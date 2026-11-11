import type { ReactElement } from "react";
import LOGOS from "@/lib/bathurst/logos.json";

/**
 * One real piece of interface per capability card (Services.tsx), built in HTML like the products we ship: real copy,
 * real buttons, our clients' own photos. Sized in em on a 340 × 210 design grid (1em = 10 design px; app/bathurst-map.css
 * scales the font with the card), so every screen stays crisp and in proportion at any card width.
 */
const img = (id: string, f = "photo-1") => `/clients/${id}/${f}-sm.webp`;
/** a client's own logo (lib/bathurst/logos.json), as the brand mark inside its screen */
const Logo = ({ id, className = "" }: { id: keyof typeof LOGOS; className?: string }) => <img className={`u-logo ${className}`} src={LOGOS[id]} alt="" loading="lazy" />;
const Stars = () => <span className="u-stars" aria-hidden="true">★★★★★</span>;
const Chev = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 6l6 6-6 6" /></svg>;
const Check = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;

/** 1. A product page that sells: photo, reviews, variant, add to cart, and the conversion it moved */
function Conversion() {
  return (
    <div className="u-screen u-pdp">
      <div className="u-pdp-img"><img src={img("chocolatecharm", "banner")} alt="" loading="lazy" /><span className="u-badge">Best seller</span></div>
      <div className="u-pdp-info">
        <span className="u-brand"><Logo id="chocolatecharm" /><small>Chocolate Charm</small></span>
        <b>Signature Truffle Box</b>
        <span className="u-rate"><Stars /> 128 reviews</span>
        <span className="u-price">$48.00 <s>$56.00</s></span>
        <span className="u-seg"><i>12 pc</i><i className="on">24 pc</i><i>36 pc</i></span>
        <span className="u-btn">Add to cart</span>
        <span className="u-fine">Free local delivery over $60</span>
      </div>
    </div>
  );
}

/** 2. The abandoned-cart email, as it lands on the customer's phone */
function Retention() {
  return (
    <div className="u-screen u-mail">
      <div className="u-inbox">
        {[["House of Hair", "Still thinking it over?", "Your cart is saved for 48 hours", "1h"], ["House of Hair", "Welcome to the family", "Here’s 10% off your first order", "Mon"], ["House of Hair", "Your hair, 6 weeks later", "Time for a refresh? Book now", "Oct 2"]].map(([f, s, p, t], i) => (
          <div key={s} className={`u-row${i === 0 ? " on" : ""}`}><Logo id="hoh" className="u-av" /><span className="u-row-t"><b>{f}</b><i>{s}</i><small>{p}</small></span><time>{t}</time></div>
        ))}
      </div>
      <div className="u-phone">
        <Logo id="hoh" className="u-phone-logo" />
        <div className="u-phone-img"><img src={img("hoh")} alt="" loading="lazy" /></div>
        <b>Still thinking it over?</b>
        <small>Your Clip-In Set is waiting in your cart.</small>
        <span className="u-btn sm">Complete order</span>
      </div>
    </div>
  );
}

/** 3. The store's back office: orders flowing in, paid and fulfilled, stock synced */
function Ecommerce() {
  const rows: [string, string, string, string, string][] = [
    ["#1048", "Sarah K.", "Paid", "Fulfilled", "$124.00"], ["#1047", "Daniel M.", "Paid", "Shipping", "$86.50"],
  ];
  return (
    <div className="u-screen u-admin">
      <div className="u-admin-bar"><Logo id="bubbys" className="u-av sq" /><b>Orders</b><span className="u-search">Search orders</span><span className="u-btn sm">Create order</span></div>
      <div className="u-tabs"><i className="on">All</i><i>Unfulfilled</i><i>Unpaid</i><i>Open</i></div>
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Fulfillment</th><th>Total</th></tr></thead>
        <tbody>
          {rows.map(([o, c, p, f, t]) => (
            <tr key={o}><td><b>{o}</b></td><td>{c}</td><td><span className={`u-pill${p === "Paid" ? "" : " warn"}`}>{p}</span></td>
              <td><span className={`u-pill${f === "Fulfilled" ? " ok" : f === "Shipping" ? "" : " warn"}`}>{f}</span></td><td>{t}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="u-float u-sync"><Check /><span><b>Inventory synced</b><small>214 products · 2 min ago</small></span></div>
    </div>
  );
}

/** 4. A campaign cut for the feed and for stories, from one shoot */
function Creative() {
  return (
    <div className="u-screen u-ads">
      <div className="u-post">
        <div className="u-post-h"><Logo id="fringe" className="u-av" /><b>fringeboutique</b><small>Sponsored</small></div>
        <div className="u-post-img"><img src={img("fringe")} alt="" loading="lazy" /></div>
        <div className="u-post-cta"><span>Shop the new season</span><Chev /></div>
        <div className="u-post-f"><b>1,284 likes</b><small><b>fringeboutique</b> Layers for the first cold week</small></div>
      </div>
      <div className="u-story">
        <img src={img("paloma", "banner")} alt="" loading="lazy" />
        <span className="u-story-bar"><i /><i /><i /></span>
        <span className="u-story-h"><Logo id="paloma" className="u-av" /><span><b>Paloma Bridal</b><small>Sponsored</small></span></span>
        <span className="u-story-t">Your day,<br />your dress.</span>
        <span className="u-btn sm">Book a fitting</span>
      </div>
    </div>
  );
}

/** 5. The owner's dashboard: this month at a glance */
function Reporting() {
  const pts = [34, 40, 37, 48, 45, 56, 52, 63, 60, 72, 69, 82];
  const x = (i: number) => (i / (pts.length - 1)) * 300, y = (v: number) => 100 - v;
  const line = pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v)}`).join(" ");
  return (
    <div className="u-screen u-dash">
      <div className="u-dash-h"><Logo id="royaldairy" className="u-av" /><b>Royal Dairy</b><small>This month</small></div>
      <div className="u-kpis">
        {[["Revenue", "$48,210", "+12.4%"], ["Orders", "1,036", "+8.1%"], ["CAC", "$24.10", "−6.3%"], ["LTV", "$310", "+4.8%"]].map(([n, v, d]) => (
          <div key={n} className="u-kpi"><small>{n}</small><b>{v}</b><em>{d}</em></div>
        ))}
      </div>
      <div className="u-chart">
        <div className="u-chart-h"><b>Revenue</b><span className="u-legend"><i className="a" />2026 <i className="b" />2025</span></div>
        <svg viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
          {[25, 50, 75].map((g) => <path key={g} className="g" d={`M0 ${g}H300`} />)}
          <path className="prev" d={pts.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v * 0.78)}`).join(" ")} />
          <path className="area" d={`${line} L300 100 L0 100Z`} />
          <path className="line" d={line} />
        </svg>
        <div className="u-axis">{["Jan", "Mar", "May", "Jul", "Sep", "Nov"].map((m) => <small key={m}>{m}</small>)}</div>
      </div>
    </div>
  );
}

/** 6. The support assistant on the site, answering and logging the conversation */
function Automation() {
  return (
    <div className="u-screen">
      <div className="u-chat">
      <div className="u-chat-h"><Logo id="kidicare" className="u-av bot" /><span><b>Kidicare Assistant</b><small><i className="u-dot" />Online · replies instantly</small></span></div>
      <div className="u-msgs">
        <p className="me">Where’s my order? It said Tuesday.</p>
        <p className="bot">It shipped this morning and arrives Thursday. Here’s your tracking link: <u>CP 7841 2210</u></p>
        <div className="u-quick"><i>Track it</i><i>Get help</i></div>
      </div>
      <div className="u-compose"><span>Type a message…</span><i className="u-send"><Chev /></i></div>
      </div>
      <div className="u-float u-crm"><Check /><span><b>Logged to CRM</b><small>Ticket #2291 · Delivery</small></span></div>
    </div>
  );
}

export const CAP_DIAGRAMS: Record<string, () => ReactElement> = {
  conversion: Conversion, retention: Retention, ecommerce: Ecommerce, creative: Creative, reporting: Reporting, automation: Automation,
};
