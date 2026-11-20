"use client";

import { useEffect } from "react";
import OrbitImages from "@/components/OrbitImages";
import DomeGallery from "@/components/DomeGallery";
import AnimatedList, { type AnimatedListItem } from "@/components/react-bits/animated-list";
import runPrototype from "./prototype-behaviour";
import "@/app/prototype.css";

/** the marketing tools the assistant works across, orbiting the TCG mark */
const TOOLS = [
  "/chatbot-tools/airtable.svg",
  "/chatbot-tools/claude.svg",
  "/chatbot-tools/figma.svg",
  "/chatbot-tools/googleads.svg",
  "/chatbot-tools/googleanalytics.svg",
  "/chatbot-tools/hubspot.svg",
  "/chatbot-tools/mailchimp.svg",
  "/chatbot-tools/make.svg",
  "/chatbot-tools/meta.svg",
  "/chatbot-tools/n8n.svg",
  "/chatbot-tools/notion.svg",
  "/chatbot-tools/semrush.svg",
  "/chatbot-tools/shopify.svg",
  "/chatbot-tools/stripe.svg",
  "/chatbot-tools/webflow.svg",
  "/chatbot-tools/wordpress.svg",
  "/chatbot-tools/zapier.svg",
  "/chatbot-tools/google.svg",
];

/** the third visual: the day as it lands. Store notifications in the shape Shopify
    sends them, cycling forever - AnimatedList wraps its cursor on the list. */
const NOTES: AnimatedListItem[] = [
  { id: 1, title: "New order \u00B7 $248.00", description: "Amazing Donuts \u2014 3 items, Toronto", time: "now", icon: "\u{1F6CD}" },
  { id: 2, title: "Quote accepted", description: "AR26 \u2014 fit-out, signed off in the thread", time: "1m", icon: "\u2714\uFE0F" },
  { id: 3, title: "Booking confirmed", description: "Ice Academy \u2014 Saturday, 9:00 AM", time: "4m", icon: "\u{1F4C5}" },
  { id: 4, title: "New order \u00B7 $1,120.00", description: "Kapara \u2014 catering, North York", time: "7m", icon: "\u{1F6CD}" },
  { id: 5, title: "Invoice paid", description: "MES \u2014 $3,400, two days early", time: "12m", icon: "\u{1F4B3}" },
  { id: 6, title: "Review left \u00B7 5.0", description: "Luminari \u2014 \u201CDid what they said they would.\u201D", time: "18m", icon: "\u2B50" },
  { id: 7, title: "Enquiry answered", description: "HOH \u2014 replied while the shop was shut", time: "26m", icon: "\u{1F4AC}" },
  { id: 8, title: "New order \u00B7 $86.50", description: "Family Tree \u2014 pickup, Thornhill", time: "33m", icon: "\u{1F6CD}" },
];

/** the gallery: the sites we built and the businesses behind them, from public/clients */
const WORK: { src: string; alt: string }[] = [
  { src: "/clients/amazingdonuts/site-1-sm.webp", alt: "Amazing Donuts — the site we built" },
  { src: "/clients/amritsari/photo-1.webp", alt: "Amritsari — at work" },
  { src: "/clients/amritsari/site-1-sm.webp", alt: "Amritsari — the site we built" },
  { src: "/clients/ar26/photo-1.webp", alt: "AR26 — at work" },
  { src: "/clients/ar26/site-1-sm.webp", alt: "AR26 — the site we built" },
  { src: "/clients/familytree/photo-1.webp", alt: "Family Tree — at work" },
  { src: "/clients/bazwell/site-1-sm.webp", alt: "Bazwell — the site we built" },
  { src: "/clients/fringe/photo-1.webp", alt: "Fringe — at work" },
  { src: "/clients/beithalochem/site-1-sm.webp", alt: "Beit Halochem — the site we built" },
  { src: "/clients/hilys/photo-1.webp", alt: "Hily's — at work" },
  { src: "/clients/beker/site-1-sm.webp", alt: "Beker — the site we built" },
  { src: "/clients/hoh/photo-1.webp", alt: "HOH — at work" },
  { src: "/clients/brickstone/site-1-sm.webp", alt: "Brickstone — the site we built" },
  { src: "/clients/kapara/photo-1.webp", alt: "Kapara — at work" },
  { src: "/clients/bubbys/site-1-sm.webp", alt: "Bubby's — the site we built" },
  { src: "/clients/mes/photo-1.webp", alt: "MES — at work" },
  { src: "/clients/carmel/site-1-sm.webp", alt: "Carmel — the site we built" },
  { src: "/clients/royaldairy/photo-1.webp", alt: "Royal Dairy — at work" },
  { src: "/clients/chocolatecharm/site-1-sm.webp", alt: "Chocolate Charm — the site we built" },
  { src: "/clients/uzbek/photo-1.webp", alt: "Uzbek — at work" },
  { src: "/clients/crema/site-1-sm.webp", alt: "Crema — the site we built" },
  { src: "/clients/elis/site-1-sm.webp", alt: "Eli's — the site we built" },
  { src: "/clients/familytree/site-1-sm.webp", alt: "Family Tree — the site we built" },
  { src: "/clients/fringe/site-1-sm.webp", alt: "Fringe — the site we built" },
  { src: "/clients/hilys/site-1-sm.webp", alt: "Hily's — the site we built" },
  { src: "/clients/hoh/site-1-sm.webp", alt: "HOH — the site we built" },
  { src: "/clients/iceacademy/site-1-sm.webp", alt: "Ice Academy — the site we built" },
  { src: "/clients/kapara/site-1-sm.webp", alt: "Kapara — the site we built" },
  { src: "/clients/luminari/site-1-sm.webp", alt: "Luminari — the site we built" },
  { src: "/clients/mes/site-1-sm.webp", alt: "MES — the site we built" },
];

/**
 * The prototype page. The markup began life as a single static HTML file and was moved here
 * so the three section visuals could be real components; everything else is unchanged, and
 * its behaviour (the hero carousel, the chat, the sentence slots, the line system) lives in
 * prototype-behaviour.ts, run once on mount.
 */
export default function Prototype() {
  useEffect(() => runPrototype(), []);

  return (
    <>
      {/* ============================ header ============================ */}
      <header className="site-head" id="head">
        <div className="wrap">
          <a className="brand" href="#top">
            <img src="brand/tcg-logo-s-h.svg" alt="Talkerstein Consulting Group" />
          </a>
          <button className="btn sm sprout" type="button">
            Menu
            <svg className="glyph" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </header>

      {/* ============================ hero ============================ */}
      <main id="top">
      <section className="hero">
        <div className="wrap">
          <h1>Better Business Systems</h1>
          <p className="deck">What would you like to make easier?</p>


          <div className="plate">
            {/* TCG's own photography: the eight service shots, plus two client jobs.
                 Order matches EXAMPLES in the script below. */}
            <div className="shots" id="shots" aria-hidden="true">
              <img className="on" src="photos/electrical.webp" alt="" fetchPriority="high" />
              <img src="photos/auto-service.webp" alt="" />
              <img src="photos/restaurant.webp" alt="" />
              <img src="photos/paperwork.webp" alt="" />
              <img src="photos/salon.webp" alt="" />
              <img src="photos/takeout.webp" alt="" />
              <img src="photos/events.webp" alt="" />
              <img src="photos/clinic.webp" alt="" />
              <img src="photos/retail.webp" alt="" />
              <img src="photos/catering.webp" alt="" />
            </div>


            <form className="ask">
              <label className="sr" htmlFor="q">Describe what you need</label>
              <input id="q" type="text" placeholder="Try ‘Quotes take me three hours every night’" autoComplete="off" />
              <button className="btn icon mic" type="button" aria-label="Attach a file">
                <svg className="glyph" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M21.4 11.1 12.3 20a5.5 5.5 0 0 1-7.8-7.8l9.2-9.1a3.7 3.7 0 1 1 5.2 5.2l-9.2 9.1a1.8 1.8 0 1 1-2.6-2.6l8.5-8.4"/></svg>
              </button>
              <button className="btn icon mic" type="button" aria-label="Ask by voice">
                <svg className="glyph" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M19 10a7 7 0 0 1-14 0M12 17v5"/></svg>
              </button>
              <button className="send sprout" type="submit" aria-label="Send">
                <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </button>
            </form>

            <p className="shot-cap" id="cap" aria-live="polite"><i></i><span>Example 1 of 10</span></p>
          </div>

          <div className="rotor">
            <button className="btn icon sprout" type="button" id="prev" aria-label="Previous example">
              <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <span className="count" id="count">1 / 10</span>
            <button className="btn icon sprout" type="button" id="next" aria-label="Next example">
              <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </section>

      {/* ============================ the chat interface ============================ */}
      <section className="chatsec" id="chatsec" hidden>
        <div className="wrap">
          <div className="chat">
            <div className="chat-top">
              <img className="chat-mark" src="brand/tcg-logo-s-h.svg" alt="Talkerstein Consulting Group" />
              <span className="live"><i></i>Nothing saved</span>
              <button className="chat-close" id="chatclose" type="button" aria-label="Close the conversation">
                <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="thread-scroll">
            <div className="thread">
              <p className="msg-u">Quotes take me three hours every night. I run a six-van electrical shop.</p>

              <div className="msg-a">
                <span className="who"><i><img src="brand/tcg-icon.svg" alt="" /></i>Talkerstein</span>
                <p>Three hours a night is about sixty hours a month — roughly a part-time wage in unbilled time. For a shop your size the fix is usually the same: a price book the quote builds itself from, so you pick the job and it writes the numbers.</p>
                <p>Here is what that looks like, and what it would take.</p>

                <div className="cards">
                  <div className="ccard demo">
                    <span className="kind">Demo</span>
                    <h4>Quote builder</h4>
                    <div className="demo-ui">
                      <div className="r"><span>Panel upgrade, 200A</span><span>$2,400</span></div>
                      <div className="r"><span>Permit & inspection</span><span>$385</span></div>
                      <div className="r"><span>Labour, 2 days</span><span>$1,760</span></div>
                      <div className="r"><span><b>Total</b></span><span style={{ fontWeight: '600' }}>$4,545</span></div>
                    </div>
                    <p>Built from your own price book in about four minutes.</p>
                    <button className="act btn sm sprout" type="button">Try it with my prices</button>
                  </div>

                  <div className="ccard sell">
                    <span className="kind">What it takes</span>
                    <h4>Quoting system</h4>
                    <p className="price">$6,800<small>fixed · 3 weeks</small></p>
                    <p>Price book, quote builder, e-signature, and a follow-up that chases the ones you never hear back on.</p>
                    <button className="act btn sm sprout" type="button">See the scope</button>
                  </div>
                </div>
              </div>

              <p className="msg-u">What about the ones that go quiet after I send them?</p>

              <div className="msg-a">
                <span className="who"><i><img src="brand/tcg-icon.svg" alt="" /></i>Talkerstein</span>
                <p>That is the bigger number, usually. Across the trades shops we have built for, a two-touch follow-up brings back about a fifth of the quotes that would otherwise die.</p>

                <div className="cards">
                  <div className="ccard demo">
                    <span className="kind">Demo</span>
                    <h4>Follow-up, running</h4>
                    <div className="demo-ui">
                      <div className="r"><span>Quote sent</span><span>Mon</span></div>
                      <div className="r"><span>Reminder</span><span>Thu</span></div>
                      <div className="r"><span>Last call</span><span>Next Tue</span></div>
                      <div className="bar"><i></i></div>
                      <div className="r"><span>Recovered this month</span><span style={{ fontWeight: '600' }}>$11,200</span></div>
                    </div>
                    <button className="act btn sm sprout" type="button">Watch a full sequence</button>
                  </div>

                  <div className="ccard sell">
                    <span className="kind">Add on</span>
                    <h4>Book straight from the quote</h4>
                    <p className="price">$2,100<small>fixed · 1 week</small></p>
                    <div className="demo-ui" style={{ background: 'rgb(243 247 243 / .55)' }}>
                      <div className="r"><span>Thursday, 14 Jan</span></div>
                      <div className="slots"><b>8:00</b><b className="on">10:30</b><b>13:00</b><b>15:30</b></div>
                      <div className="r"><span>Van 3 · Dani</span><span>Confirmed</span></div>
                    </div>
                    <button className="act btn sm sprout" type="button">Add to the scope</button>
                  </div>
                </div>
              </div>
            </div>
            </div>

            <div className="chat-foot">
              <form className="ask">
                <label className="sr" htmlFor="q5">Reply</label>
                <input id="q5" type="text" placeholder="Ask anything…" autoComplete="off" />
                <button className="send sprout" type="submit" aria-label="Send">
                  <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                </button>
              </form>
              <div className="chat-sugg">
                <button className="chip btn sm sprout" type="button">What does waiting a year cost me?</button>
                <button className="chip btn sm sprout" type="button">Show me a shop like mine</button>
                <button className="chip btn sm sprout" type="button">Talk to a person</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================ statement ============================ */}
      <section className="statement">
        <div className="wrap">
          <h2 className="sx-h">
            <span className="sx-line">It answers from <span className="sx-slot"><img src="photos/aria.webp" alt="" /></span>our own work.</span>
            <span className="sx-line">Real quotes. <span className="sx-slot"><img src="photos/kidicare.webp" alt="" /></span>Real timelines.</span>
            <span className="sx-line">And it says <span className="sx-slot"><img src="photos/esther.webp" alt="" /></span>when we’re wrong.</span>
          </h2>
        </div>
      </section>

      {/* ============================ the map ============================ */}
      <section className="mapwide">
        <div className="wrap">
          <div className="mapplate">
          <iframe src="/map" title="Every Talkerstein client across the GTA. Drag to pan, scroll to zoom, click a pin." loading="lazy"></iframe>
          </div>
        </div>
      </section>

      {/* ============================ three rows ============================ */}
      <div className="wrap">
      <section className="rows">

        {/* row 1 */}
        <article className="row">
          <div className="row-vis">
              <div className="vis bare">
                <OrbitImages
            images={TOOLS}
            altPrefix="Marketing tool"
            shape="ellipse"
            baseWidth={1400}
            radiusX={430}
            radiusY={150}
            rotation={-8}
            itemSize={82}
            itemRadius={41}
            duration={46}
            depth={0.95}
            hoverScale={1.14}
            showPath={false}
            className="orbit"
          />
                <img className="orbit-mark" src="/brand/tcg-icon.svg" alt="Talkerstein Consulting Group" />
              </div>
            </div>
          <div className="row-copy">
            <h2>Technology should solve problems, not create more work.</h2>
            <p>Explore how automation, AI, web development, and connected business systems can help your organization operate more efficiently, serve customers better, and create new opportunities.</p>
            <a className="btn sprout" href="#">Explore our services <svg className="glyph" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></a>
          </div>
        </article>

        {/* row 2 */}
        <article className="row">
          <div className="row-vis">
              <div className="vis dome">
                <DomeGallery images={WORK} segments={20} grayscale={false} fit={0.7} overlayBlurColor="#19254A" autoSpinDegPerSec={5} />
              </div>
            </div>
          <div className="row-copy">
            <h2>Ideas are only as good as what they accomplish.</h2>
            <p>See how we turn business challenges into practical digital solutions. Explore the websites, systems, automations, and digital experiences we’ve designed and developed.</p>
            <a className="btn sprout" href="#">View our work <svg className="glyph" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></a>
          </div>
        </article>

        {/* row 3 */}
        <article className="row">
          <div className="row-vis">
              <div className="vis notes">
                {/* the work landing as it happens: orders, bookings, invoices, reviews,
                    stacked the way a shop sees them come in. The list runs on forever. */}
                <AnimatedList
                  items={NOTES}
                  layout="stack"
                  position="center"
                  entrance="morph"
                  interval={2200}
                  initialCount={3}
                  maxItems={5}
                  height="100%"
                  gap={12}
                  radius={16}
                  padding={14}
                  stackDepth={3}
                  peek={14}
                  pauseOnHover
                  expandOnHover
                  liveTime={false}
                  theme="light"
                  accentColor="#B3530E"
                  cardColor="#F3F7F3"
                  className="notefeed"
                />
              </div>
            </div>
          <div className="row-copy">
            <h2>Good technology starts with understanding your business.</h2>
            <p>We’re a technology consulting partner helping businesses make better use of digital tools. We bring strategy, creative thinking, and technical expertise together to build solutions that work.</p>
            <a className="btn sprout" href="#">Get to know Talkerstein <svg className="glyph" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></a>
          </div>
        </article>

      </section>
      </div>


      </main>



      {/* ============================ footer ============================ */}
      <footer className="ft">
        <div className="wrap">
          <nav className="ft-nav" aria-label="Footer">
            <a href="#">How it works</a>
            <a href="#">Privacy</a>
            <a href="#">The studio</a>
            <a href="#">Our work</a>
            <a href="#">Pricing</a>
            <a href="#">Frequently asked questions</a>
            <a href="#">Book a call</a>
          </nav>

          <div className="ft-mark">
            <img src="brand/tcg-text.svg" alt="Talkerstein Consulting Group" />
          </div>

          <div className="ft-meta">
            <div>
              <img className="seal" src="brand/tcg-icon.svg" alt="" />
              Built and run by Talkerstein<br />Consulting Group
            </div>
            <div>
      5050 Dufferin Street, North York<br />Serving the GTA since 2014
            </div>
            <div>
              Designed & engineered on<br />Bathurst Street, Toronto
            </div>
          </div>

          <div className="ft-legal">
            <a href="#">Privacy policy</a>
            <a href="#">Terms of use</a>
            <span className="dot" aria-hidden="true"></span>
            <a href="#">All systems normal</a>
            <a href="#">English</a>
            <a href="#">Français</a>
            <small>© 2026 Talkerstein Consulting Group</small>
          </div>
        </div>
      </footer>

      {/* pinned ask bar */}
      <div className="pinned" id="pinned">
        <form className="ask">
          <label className="sr" htmlFor="q3">Ask anything</label>
          <input id="q3" type="text" placeholder="Ask anything…" autoComplete="off" />
          <button className="send sprout" type="submit" aria-label="Send">
            <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </form>
      </div>

      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        {/* grunge: roughens the edge (displacement) and eats speckles out of the line (grain mask) */}
        <filter id="grunge" x="-5%" y="-20%" width="110%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="4" result="warp"/>
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="rough"/>
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="11" result="grain"/>
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.4" result="speckle"/>
          <feComposite in="rough" in2="speckle" operator="in"/>
        </filter>
      </svg>
    </>
  );
}
