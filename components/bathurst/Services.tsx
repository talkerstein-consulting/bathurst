"use client";

import { useRef } from "react";
import { SERVICES } from "@/lib/bathurst/data";
import { CtaButton, CtaLink } from "@/components/style/Cta";
import { Icon } from "./Icon";

/** Services as a row of clip-out coupons: swipe sideways, or step with the chevrons. Image, heading, body, price range and an Inquire CTA. */
export default function Services() {
  const row = useRef<HTMLUListElement>(null);
  const page = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });
  const chev = (d: string) => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
  return (
    <section id="services" className="section">
      <div className="wrap">
        <div className="flex items-end justify-between gap-6">
          <div><p className="eyebrow">What we do</p><h2 className="h2 mt-2">Services</h2></div>
          <div className="flex gap-2">
            <CtaButton variant="icon" label="Previous services" onClick={() => page(-1)}>{chev("M14 6l-6 6 6 6")}</CtaButton>
            <CtaButton variant="icon" label="Next services" onClick={() => page(1)}>{chev("M10 6l6 6-6 6")}</CtaButton>
          </div>
        </div>
        <ul ref={row} className="svc-row mt-6">
          {SERVICES.map((s, i) => (
            // a clip-out coupon: dashed cut line around the card; one pair of scissors, on the first coupon's top edge
            <li key={s.name} id={s.slug} className="svc-coupon">
              {i === 0 && <svg className="svc-scissors" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M8.6 7.6L20 17M8.6 16.4L20 7M13.5 12h.01" />
              </svg>}
              <div className="svc frame">
                {/* TODO(content): an image per service in /public/services/<slug>.jpg */}
                <div className="svc-img">{s.image ? <img src={s.image} alt="" /> : <Icon d={s.icon} className="size-10 [stroke-width:1.2]" />}</div>
                <h3>{s.title}</h3>
                <p className="svc-body">{s.body}</p>
                <div className="svc-foot">
                  <p className="svc-price">{s.price ?? "Starts at $1,500"}</p>
                  <CtaLink href={`/book?${new URLSearchParams({ service: s.name })}`} label={`Inquire about ${s.name}`} small>Inquire</CtaLink>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
