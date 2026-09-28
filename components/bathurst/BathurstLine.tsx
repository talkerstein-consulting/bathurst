"use client";

import type { CSSProperties } from "react";
import { CROSS_STREETS, INDUSTRIES, REVIEW, onBathurst, openOnMap, type Client } from "@/lib/bathurst/data";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";

type Stop = { lat: number; client?: Client; label?: string; term?: boolean; hwy?: boolean };

const shortName = (n: string) => n.replace(/ Ave W?$/, "").replace(" Ave", "").replace("Hwy 401", "401");

/** Section 2: Bathurst as a transit line. Clients are stations, cross streets are ticks, south to north. */
export default function BathurstLine() {
  const stops: Stop[] = [
    ...onBathurst.map((c) => ({ lat: c.lat!, client: c })),
    ...CROSS_STREETS.filter(([n]) => n !== "Centre St").map(([n, lat, hwy]) => ({ lat, label: shortName(n), hwy: !!hwy, term: n.startsWith("Eglinton") })),
    { lat: 43.815, label: "Thornhill", term: true },
  ].sort((a, b) => a.lat - b.lat);

  const cols = stops.map((s) => (s.client ? "minmax(0,1fr)" : "max-content")).join(" ");
  const row = "md:grid-rows-[88px_48px_auto] md:justify-items-center max-md:grid-cols-[48px_1fr] max-md:items-center max-md:gap-x-4";

  return (
    <section id="proof" className="section">
      <div className="wrap">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="script lead" aria-hidden="true">Right on Bathurst</span>
            <h2 className="h2">{onBathurst.length} clients on one street.</h2>
            <p className="mt-4 max-w-[52ch]">Bathurst, south to north. Pick a stop to see it on the map.</p>
          </div>
          <div className="frame flex items-center gap-4 px-6 py-4">
            <b className="font-heading text-[48px] leading-none">{REVIEW.rating.toFixed(1)}</b>
            <div>
              <span className="block text-lg tracking-[1px] text-orange" aria-label="5 out of 5">★★★★★</span>
              <span className="block text-[13px] text-steel/70">{REVIEW.count} verified reviews on Clutch</span>
            </div>
          </div>
        </div>

        <ol
          aria-label="Talkerstein clients along Bathurst Street, south to north"
          className="relative mt-12 grid grid-cols-1 items-start gap-x-4 md:mt-24 md:[grid-template-columns:var(--cols)]"
          style={{ "--cols": cols } as CSSProperties}
        >
          <span aria-hidden className="absolute inset-x-0 top-[111px] hidden h-[3px] bg-orange [filter:url(#grunge)] md:block" />
          <span aria-hidden className="absolute bottom-3 left-[23px] top-3 w-[3px] bg-orange [filter:url(#grunge)] md:hidden" />
          {stops.map((s) =>
            s.client ? (
              <li key={s.client.id} className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => openOnMap(s.client!.id)}
                  className={cn("group grid w-full cursor-pointer text-left md:text-center focus-visible:outline-none", row)}
                >
                  <span className="grid gap-0.5 md:self-end md:px-2 md:pb-4 max-md:col-start-2 max-md:row-start-1 max-md:pt-4">
                    <b className="text-base font-semibold leading-tight group-hover:text-orange group-focus-visible:text-orange">{s.client.name}</b>
                    <span className="text-[13px] tabular-nums text-steel/70">{s.client.addr.match(/^\d+/)?.[0]} Bathurst</span>
                  </span>
                  <span
                    className={cn(
                      "single relative z-10 grid size-12 place-items-center rounded-full bg-sea text-steel transition-colors duration-300 md:row-start-2 max-md:col-start-1 max-md:row-span-2 max-md:row-start-1",
                      s.client.maybe && "hair",
                      "group-hover:text-orange group-hover:[--ink:var(--orange)] group-focus-visible:text-orange group-focus-visible:[--ink:var(--orange)]",
                    )}
                  >
                    <Icon d={INDUSTRIES[s.client.ind].icon} />
                  </span>
                  <span className="text-[13px] leading-snug text-steel/70 md:max-w-[20ch] md:px-2 md:pt-4 max-md:col-start-2 max-md:row-start-2 max-md:pb-4">
                    {s.client.services.slice(0, 2).join(", ")}
                    {s.client.result && <em className="block font-semibold not-italic text-orange">{s.client.result}</em>}
                    {s.client.maybe && <em className="block font-semibold not-italic text-orange">To confirm</em>}
                  </span>
                </button>
              </li>
            ) : (
              <li key={s.label} aria-hidden={!s.term} className={cn("grid min-w-[52px]", row)}>
                <span className="max-md:hidden" />
                <i
                  className={cn(
                    "z-10 self-center justify-self-center bg-sea max-md:col-start-1 max-md:row-start-1",
                    s.hwy ? "single hair h-3 w-8 rounded-[3px]" : s.term ? "single size-6 rounded-full" : "single hair size-4 rounded-full",
                  )}
                />
                <span className={cn("whitespace-nowrap pt-4 text-xs tracking-[.02em] max-md:col-start-2 max-md:row-start-1 max-md:py-2", s.term ? "text-[13px] font-semibold text-steel" : "text-steel/70")}>
                  {s.label}
                </span>
              </li>
            ),
          )}
        </ol>

        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-steel/70">
          <span className="flex items-center gap-2"><i className="single size-4 rounded-full" />Client</span>
          <span className="flex items-center gap-2"><i className="single hair size-4 rounded-full" />To confirm</span>
          <span>Line diagram, not to scale</span>
        </div>
      </div>
    </section>
  );
}
