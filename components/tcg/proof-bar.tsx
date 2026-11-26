import LogoLoop from "@/components/LogoLoop";
import Awards from "@/components/bathurst/Awards";
import { CLIENT_LOGOS } from "./client-logos";

/**
 * The foot of /check-2: who says we are worth the half minute, and who has already been
 * through it.
 *
 * The ratings come first and the logos sit under them. That is the order of the claim:
 * the number and the certifications are the ones a stranger can check, and the row of
 * marks underneath is the evidence behind them. <Awards /> is the same component the map
 * hero and the home page's assessment lead-in use (components/bathurst/Awards.tsx), so
 * the Google figure and the two badges have one source here as everywhere else.
 *
 * The logos are the map's own clients (./client-logos.ts, built from CLIENTS), carried
 * by the react-bits LogoLoop so the row travels and keeps travelling at forty marks —
 * the hand-rolled two-copy marquee this replaces could not, and the component also
 * handles the drag, the fade at both ends and prefers-reduced-motion itself.
 *
 * No filter is applied to the marks. Several of these logos carry their own ground, and
 * a knockout turns them into solid shapes (see components/tcg/clients.tsx); they are
 * held back by opacity in app/check-2.css instead, which leaves every one of them
 * readable.
 */
/**
 * Each mark as a node rather than a `src`, for two reasons.
 *
 * The <img> can carry its own width and height: the row measures itself to decide how
 * many copies of the set it needs, and an <img> with no dimensions is zero-wide until
 * its file arrives, which moves that answer on every load and sends the measurement
 * into a loop. The attributes are the file's own pixels.
 *
 * Nothing crops them. The marks stand on the page's own ground, whole: most of these
 * files are transparent, and the ten that carried a white tile have been knocked out
 * into a `logo-cut.png` (see ./client-logos.ts) rather than hidden behind a shape.
 *
 * The ones a knockout cannot reach keep their ground and are marked `has-ground`: a
 * rounded corner turns the leftover rectangle into a plate the logo is printed on,
 * which is a deliberate shape rather than an oversight.
 *
 * `labels="hover"` names the business on hover and on focus. Half of these marks are a
 * monogram or a crest — recognisable to the client themselves and to nobody else — so
 * without a name the row asks the visitor to take a stranger's word for a shape. The
 * name is on `title`, which the component also uses for the label, and each item still
 * carries `ariaLabel`, so a screen reader hears the business rather than the tooltip.
 */
const MARKS = CLIENT_LOGOS.map(({ src, alt, w, h, ground }) => ({
  node: (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={ground ? "inst-mark has-ground" : "inst-mark"}
      src={src}
      alt=""
      width={w}
      height={h}
      loading="lazy"
      decoding="async"
    />
  ),
  ariaLabel: alt,
  title: alt,
}));

export function ProofBar() {
  return (
    <footer className="inst-foot">
      <Awards className="inst-awards" />

      <LogoLoop
        className="inst-logos"
        logos={MARKS}
        logoHeight={48}
        gap={56}
        speed={42}
        direction="left"
        labels="hover"
        fadeOut
        fadeOutWidth={0.1}
        scaleOnHover={false}
        ariaLabel="Clients we have worked with"
      />
    </footer>
  );
}
