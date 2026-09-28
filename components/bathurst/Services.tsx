"use client";

import { useRef } from "react";
import { SERVICES } from "@/lib/bathurst/data";
import { CtaButton } from "@/components/style/Cta";
import { Icon } from "./Icon";

/** Services as a Google-Maps-style card row: swipe sideways, or step with the chevrons. Image, heading, price range. */
export default function Services() {
  const row = useRef<HTMLUListElement>(null);
  const page = (d: number) => row.current?.scrollBy({ left: d * row.current.clientWidth * 0.8, behavior: "smooth" });
  const chev = (d: string) => <svg className="glyph" viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>;
  return (
    <section id="services" className="section">
      <div className="wrap">
        <div className="flex items-end justify-between gap-6">
          <h2 className="h2">Services</h2>
          <div className="flex gap-2">
            <CtaButton variant="icon" label="Previous services" onClick={() => page(-1)}>{chev("M14 6l-6 6 6 6")}</CtaButton>
            <CtaButton variant="icon" label="Next services" onClick={() => page(1)}>{chev("M10 6l6 6-6 6")}</CtaButton>
          </div>
        </div>
        <ul ref={row} className="svc-row mt-6">
          {SERVICES.map((s) => (
            <li key={s.name} className="svc frame">
              {/* TODO(content): an image per service in /public/services/<slug>.jpg */}
              <div className="svc-img">{s.image ? <img src={s.image} alt="" /> : <Icon d={s.icon} className="size-10 [stroke-width:1.2]" />}</div>
              <h3>{s.name}</h3>
              <p className="svc-price">{s.price ?? "Starts at $1,500"}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
