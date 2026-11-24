import Image from "next/image";
import { User } from "lucide-react";
import { Cta } from "./cta";

/**
 * The masthead, after Monocle and The Atlantic: the roundel on the far left at
 * the wordmark's own height, the wordmark centred — a figure, not a
 * heading: the page's h1 is the intake's question — and the account controls on
 * the far right, sign-in first and the appointment last.
 *
 * The roundel is decorative and inert: no link, no hover, no orange. It is a
 * figure, not a control. Both controls on the right are outlines, like every
 * other CTA in the system.
 *
 * PLACEHOLDER DESTINATIONS: /book and /sign-in are stubs so the two controls
 * are genuinely live on staging rather than greyed out. Neither flow is built.
 */
export function Masthead() {
  return (
    <header className="mast">
      <div className="mast-top">
        <div className="mast-mark">
          <Image
            src="/brand/tcg-icon.svg"
            alt=""
            width={235}
            height={235}
            aria-hidden="true"
            priority
          />
        </div>

        <div className="mast-word">
          <Image
            className="wordmark"
            src="/brand/tcg-text.svg"
            alt="TCG"
            width={1032}
            height={232}
            priority
          />
        </div>

        <div className="mast-acct">
          <Cta as="a" href="/sign-in" variant="icon" underline label="Sign in">
            <User className="glyph" aria-hidden="true" />
          </Cta>
          <Cta as="a" href="/book" underline label="Book appointment">
            Book appointment
          </Cta>
        </div>
      </div>

      <div className="mast-rule" aria-hidden="true" />
    </header>
  );
}
