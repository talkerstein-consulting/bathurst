import { Card } from "./card";
import { FeatureFigure } from "./figures";
import { FeatureRail } from "./feature-rail";

/**
 * The five feature cards, in the same format as every other card.
 *
 * Five by instruction (AI Chief of Staff added first), with the client's own titles and lines. No numbering,
 * no preheader and no read time; and no "Learn more" either, because these do
 * not go anywhere. Each one is handed to the assistant instead: dragged into
 * the intake box, or pressed. ./card.tsx has the format, ./brief.tsx the drag.
 *
 * THE SLOTS ARE FILLED AGAIN, with the drawn figures in ./figures.tsx — one
 * shape per card, in the page's own inks and rule weights. They replace the
 * cropped map, the spinning logo shutter and the dome of client photographs
 * the client called ugly and asked to have pulled; those modules are still in
 * the repo (components/signal-map.tsx, components/spin-shutter.tsx,
 * components/Dither.jsx, components/DomeGallery.jsx) and none of them is used
 * here. Every OTHER card on the page still carries the empty plate.
 */
const CARDS: Array<[string, string]> = [
  [
    "AI Chief of Staff",
    "Your personal AI agent keeps track of your calendar, monitors your pipeline, organizes priorities, and flags what needs your attention.",
  ],
  [
    "Smart Quoting Systems",
    "Generate accurate quotes, calculate pricing, and let customers book and pay.",
  ],
  [
    "Automated Customer Journeys",
    "Capture inquiries, follow up automatically, nurture leads, and recover missed sales.",
  ],
  [
    "Custom Business Portals",
    "Let customers and employees access information, manage requests, and track work in one place.",
  ],
  [
    "AI Business Intelligence",
    "Ask questions about your business and get useful answers from connected business data.",
  ],
];

export function Features() {
  return (
    <section className="features" id="services" aria-labelledby="features-h">
      <FeatureRail heading={<h2 id="features-h">Drag an idea. Let&rsquo;s build it.</h2>}>
        {CARDS.map(([title, dek], i) => (
          <Card
            key={title}
            title={title}
            dek={dek}
            drag
            art={<FeatureFigure at={i} />}
          />
        ))}
      </FeatureRail>
    </section>
  );
}
