import { ChevronLeft } from "lucide-react";
import { Cta } from "./cta";
import { Masthead } from "./masthead";
import { Nav } from "./nav";

/**
 * The shell every placeholder route shares: the masthead and page bar exactly
 * as the home page carries them, one honest line about what is not built, and a
 * working way back (D06 — every page has a visible back control).
 */
export function Stub({
  pre,
  title,
  body,
}: {
  pre: string;
  title: string;
  body: string;
}) {
  return (
    <div className="shell">
      <main className="col">
        <div className="mast-block">
          <Masthead />
          <Nav />
        </div>

        <section className="stub">
          <span className="pre">{pre}</span>
          <h2>{title}</h2>
          <p>{body}</p>
          <Cta as="a" href="/" label="Back to the home page">
            <ChevronLeft className="glyph sm" aria-hidden="true" />
            Back
          </Cta>
        </section>
      </main>
    </div>
  );
}
