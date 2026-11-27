import type { CSSProperties } from "react";
import { CONTACT, GOOGLE, REVIEW } from "@/lib/bathurst/data";

/**
 * The proof row: the Clutch and Google ratings and the certifications, each in its own cell with a hairline between.
 * One source for both places it appears — the map hero's headline column (components/bathurst/BathurstHero.tsx) and
 * the home page's assessment lead-in, under the fine print (components/home/AssessLead.tsx) — so the ratings, the
 * labels and the badge sizes only ever have to be changed here. Styles live with `.hero-awards` in bathurst-map.css.
 */

/** Stars filled to the actual rating, so the picture matches the number. */
export const Stars = ({ r }: { r: number }) => (
  <span className="stars rated" role="img" aria-label={`${r} out of 5`} style={{ "--pct": `${(r / 5) * 100}%` } as CSSProperties}>
    <span aria-hidden="true">★★★★★</span><span className="fill" aria-hidden="true">★★★★★</span>
  </span>
);

/**
 * `logos` swaps the platform names for each company's full logo, from its own site
 * (public/brand/third-party/README.md): Clutch's logotype, Google's colour wordmark and
 * HighLevel's Space Blue lockup. Only /check-2 asks for it; the map and home keep the
 * text names until they are moved over too.
 */
export default function Awards({ className = "", style, logos = false }: { className?: string; style?: CSSProperties; logos?: boolean }) {
  /* eslint-disable @next/next/no-img-element */
  const clutch = logos
    ? <small className="aw-src"><img src="/brand/third-party/clutch-logo.svg" alt="Clutch" width={406} height={115} className="aw-logo aw-logo--clutch" />{REVIEW.count} reviews</small>
    : <small>{REVIEW.count} reviews on Clutch</small>;
  const google = logos
    ? <small className="aw-src"><img src="/brand/third-party/google-wordmark.png" alt="Google" width={540} height={179} className="aw-logo aw-logo--google" />{GOOGLE.count ? `${GOOGLE.count} reviews` : "Rating"}</small>
    : <small>{GOOGLE.count ? `${GOOGLE.count} reviews on Google` : "Rating on Google"}</small>;
  return (
    <ul className={`hero-awards ${className}`.trim()} style={style} aria-label="Ratings and certifications">
      <li><a href={CONTACT.clutch} target="_blank" rel="noopener"><b>{REVIEW.rating.toFixed(1)}</b><span><Stars r={REVIEW.rating} />{clutch}</span></a></li>
      <li><a href={GOOGLE.url} target="_blank" rel="noopener"><b>{GOOGLE.rating?.toFixed(1)}</b><span><Stars r={GOOGLE.rating ?? 5} />{google}</span></a></li>
      <li className="aw-badge"><img src="/badges/shopify.avif" alt="" width={512} height={85} className="cert-shopify" /><small>Shopify Partner</small></li>
      {logos
        ? <li className="aw-badge"><img src="/brand/third-party/highlevel-logo.png" alt="HighLevel" width={1200} height={269} className="aw-logo aw-logo--highlevel" /><small>Certified Admin</small></li>
        : <li className="aw-badge"><img src="/badges/ghl.avif" alt="" width={256} height={256} className="cert-ghl" /><small>GoHighLevel Certified Admin</small></li>}
    </ul>
  );
  /* eslint-enable @next/next/no-img-element */
}
