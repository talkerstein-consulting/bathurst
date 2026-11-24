import { Card } from "./card";

/**
 * The four feature cards, in the same format as every other card.
 *
 * Four by instruction, with the client's own titles and lines. The preheader
 * and the read time are gone from the card format entirely (./card.tsx).
 *
 * BLANK BY INSTRUCTION. The stages previously carried a cropped map, a
 * spinning logo shutter and a dome of client photographs; the client called the
 * result ugly and asked for empty slots until they are redesigned. The modules
 * are still in the repo — components/signal-map.tsx, components/spin-shutter.tsx,
 * components/Dither.jsx and components/DomeGallery.jsx — so putting one back is
 * a one-line change per stage, not a reinstall.
 */
const CARDS: Array<[string, string]> = [
  ["Global Presence", "Working across borders, markets, and time zones."],
  [
    "Technical Capabilities",
    "From websites and applications to AI and automation.",
  ],
  [
    "Strategic Partnership",
    "Understanding your business before building solutions.",
  ],
  [
    "End-to-End Execution",
    "From the first idea to implementation and ongoing support.",
  ],
];

export function Features() {
  return (
    <section className="features" id="services" aria-labelledby="features-h">
      <h2 className="sr-only" id="features-h">
        What we do
      </h2>

      <div className="card-row">
        {CARDS.map(([title, dek]) => (
          <Card key={title} title={title} dek={dek} />
        ))}
      </div>
    </section>
  );
}
