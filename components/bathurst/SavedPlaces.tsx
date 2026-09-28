"use client";

import { CLIENTS, INDUSTRIES, onBathurst, openOnMap } from "@/lib/bathurst/data";
import { Icon } from "./Icon";

const FEATURED_ID = "paulas";

/** Section 5: case studies as "Saved places". The map's Case study button scrolls here and flashes the row. */
export default function SavedPlaces() {
  const featured = CLIENTS.find((c) => c.id === FEATURED_ID)!;
  const rest = onBathurst.filter((c) => c.id !== FEATURED_ID && !c.maybe);

  return (
    <section id="saved" className="section">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="script lead" aria-hidden="true">Worth the stop</span>
            <h2 className="h2">Saved places</h2>
          </div>
          <span className="eyebrow text-[12px] text-steel/70">{rest.length + 1} Bathurst clients</span>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-[7fr_5fr] md:gap-16">
          {/* TODO(content): real case-study photography for the featured client */}
          <a className="feat group grid content-start gap-4 no-underline" href="https://talkerstein.com/work" target="_blank" rel="noopener">
            <div className="frame p-2">
              <div className="grid aspect-[4/3] max-w-full place-items-center rounded-[12px] bg-[repeating-linear-gradient(135deg,var(--steel-08)_0_10px,transparent_10px_20px)] text-[12px] tracking-[.14em] text-steel/70">
                CASE STUDY IMAGE NEEDED
              </div>
            </div>
            <div>
              <span className="text-sm text-steel/70">{featured.addr} · {featured.services.join(", ")}</span>
              <h3 className="h3 mt-1 group-hover:text-orange">{featured.name}</h3>
            </div>
            <div className="font-heading text-[32px] leading-[1.05] text-orange">2.6× consultation growth · 41% premium engagement</div>
          </a>
          <ul id="slist">
            {rest.map((c, i) => (
              <li key={c.id} className={i ? "rule" : undefined}>
                <a
                  href="#hero"
                  data-id={c.id}
                  onClick={(e) => {
                    e.preventDefault();
                    openOnMap(c.id);
                  }}
                  className="group grid grid-cols-[48px_1fr_auto] items-center gap-4 py-4 no-underline"
                >
                  <span className="single grid size-12 place-items-center rounded-[10px]">
                    <Icon d={INDUSTRIES[c.ind].icon} />
                  </span>
                  <span>
                    <b className="block font-semibold group-hover:text-orange">{c.name}</b>
                    <span className="text-[13px] text-steel/70">{c.addr}</span>
                  </span>
                  <em className="max-w-[18ch] text-right text-sm font-semibold not-italic text-orange">{c.result ?? c.services.slice(0, 2).join(" · ")}</em>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
