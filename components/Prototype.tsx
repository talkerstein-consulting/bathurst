"use client";

import Link from "next/link";

import { useLayoutEffect, useRef, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import ClientMapSection from "./ClientMapSection";
import RiseHeading from "./style/RiseHeading";
import AgencyChat from "./AgencyChat";
import OrbitImages from "@/components/OrbitImages";
import DomeGallery from "@/components/DomeGallery";
import type { AnimatedListItem } from "@/components/react-bits/animated-list";
const AnimatedList = dynamic(() => import("@/components/react-bits/animated-list"), { ssr: false });

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

function PhotoReel({ photos }: { photos: string[] }) {
  return <span className="sx-slot" aria-hidden="true"><span className="sx-reel">
    {[...photos, photos[0]].map((photo, index) => <img key={index} src={photo} alt="" loading="lazy" decoding="async" />)}
  </span></span>;
}

function StatementLine({before, after, photos, delay}: {before: string; after: string; photos: string[]; delay: number}) {
  function words(phrase: string, offset: number) {
    return phrase.split(" ").map((word, index) => <span key={index}>
      <span className="rise-w"><span style={{"--i": offset + index} as CSSProperties}>{word}</span></span>{" "}
    </span>);
  }
  return <span className="sx-line landing-title" style={{"--line-delay": delay + "ms"} as CSSProperties}>
    {words(before, 0)}<PhotoReel photos={photos} />{words(after, before.split(" ").length)}
  </span>;
}

function useLandingMotion() {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!root.current || !("IntersectionObserver" in window)) return;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const running = new Set<Animation>();
    const reveal = new IntersectionObserver(entries => {
      const siblings = new Map<Element | null, number>();
      for (const {target, isIntersecting} of entries) {
        if (!isIntersecting) continue;
        reveal.unobserve(target);
        if (target.classList.contains("landing-title")) {
          target.classList.add("title-entered");
          continue;
        }
        if (media.matches) continue;
        const group = target.parentElement;
        const order = siblings.get(group) || 0;
        siblings.set(group, order + 1);
        const motion = target.animate([{ opacity: 0, transform: "translate(18px, 12px)" }, { opacity: 1, transform: "translate(0, 0)" }],
          {duration: 620, delay: Math.min(order, 4) * 95, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards"});
        running.add(motion);
        motion.onfinish = () => running.delete(motion);
      }
    }, {rootMargin: "0px 0px -7% 0px"});
    const loops = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.classList.toggle("motion-visible", entry.isIntersecting);
    });
    const titles = root.current.querySelectorAll(".landing-title");
    titles.forEach(el => el.classList.add("title-pending"));
    root.current.querySelectorAll("main h2:not(.sx-h), main h3, .sx-line, .row-copy p, .row-copy a, .sample-caption, .ft-nav a, .ft-meta > div, .ft-legal > *").forEach(el => reveal.observe(el));
    root.current.querySelectorAll(".statement, .mapwide").forEach(el => loops.observe(el));
    const stop = () => { if (media.matches) { running.forEach(animation => animation.cancel()); running.clear(); } };
    media.addEventListener("change", stop);
    return () => { titles.forEach(el => el.classList.remove("title-pending", "title-entered")); reveal.disconnect(); loops.disconnect(); running.forEach(animation => animation.cancel()); media.removeEventListener("change", stop); };
  }, []);
  return root;
}

export default function Prototype({designPreview = false}: {designPreview?: boolean}) {
  const landing = useLandingMotion();
  return (
    <div ref={landing}>
      <AgencyChat designPreview={designPreview}>
      {/* ============================ statement ============================ */}
      <section className="statement is-open">
        <div className="wrap">
          <h2 className="sx-h">
            <StatementLine before="It answers from" after="our own work." delay={0} photos={["/photos/aria.webp", "/clients/fringe/photo-1-sm.webp", "/clients/hoh/photo-1-sm.webp"]} />
            <StatementLine before="Services." after="Client projects." delay={80} photos={["/photos/kidicare.webp", "/clients/kapara/photo-1-sm.webp", "/clients/royaldairy/photo-1-sm.webp"]} />
            <StatementLine before="With" after="links to the source." delay={160} photos={["/photos/esther.webp", "/clients/hilys/photo-1-sm.webp", "/clients/ar26/photo-1-sm.webp"]} />
          </h2>
        </div>
      </section>

      {/* ============================ the map ============================ */}
      <ClientMapSection />

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
                  radiusY={98}
                  rotation={-8}
                  itemSize={82}
                  itemRadius={41}
                  duration={46}
                  depth={0.95}
                  hoverScale={1.14}
                  showPath={false}
                  className="orbit"
                  centerContent={<img className="orbit-mark" src="/brand/tcg-icon.svg" alt="" />}
                />
              </div>
            </div>
          <div className="row-copy">
            <RiseHeading as="h2" className="landing-title" text="Technology should solve problems, not create more work." />
            <p>Explore how automation, AI, web development, and connected business systems can help your organization operate more efficiently, serve customers better, and create new opportunities.</p>
            <a className="btn sprout" href="https://talkerstein.com/services">Explore our services <svg className="glyph" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></a>
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
            <RiseHeading as="h2" className="landing-title" text="Ideas are only as good as what they accomplish." />
            <p>See how we turn business challenges into practical digital solutions. Explore the websites, systems, automations, and digital experiences we’ve designed and developed.</p>
            <a className="btn sprout" href="https://talkerstein.com/work">View our work <svg className="glyph" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></a>
          </div>
        </article>

        {/* row 3 */}
        <article className="row">
          <div className="row-vis">
              <div className="vis notes">
                <span className="sample-caption">Sample activity</span>
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
            <RiseHeading as="h2" className="landing-title" text="Good technology starts with understanding your business." />
            <p>We’re a technology consulting partner helping businesses make better use of digital tools. We bring strategy, creative thinking, and technical expertise together to build solutions that work.</p>
            <a className="btn sprout" href="https://talkerstein.com/about-us">Get to know Talkerstein <svg className="glyph" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg></a>
          </div>
        </article>

      </section>
      </div>


      </AgencyChat>



      {/* ============================ footer ============================ */}
      <footer className="ft">
        <div className="wrap">
          <nav className="ft-nav" aria-label="Footer">
            <a href="https://talkerstein.com/our-process">Our process</a>
            <a href="https://talkerstein.com/work">Our work</a>
            <a href="https://talkerstein.com/business-resources">Business resources</a>
            <Link href="/book">Book a call</Link>
          </nav>

          <div className="ft-mark">
            <img src="/brand/tcg-text.svg" alt="Talkerstein Consulting Group" />
          </div>

          <div className="ft-meta">
            <div>
              <img className="seal" src="/brand/tcg-icon.svg" alt="" />
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
            <a href="https://talkerstein.com/privacy-policy">Privacy policy</a>
            <a href="https://talkerstein.com/terms-of-use">Terms of use</a>
            <small>© 2026 Talkerstein Consulting Group</small>
          </div>
        </div>
      </footer>

    </div>
  );
}
