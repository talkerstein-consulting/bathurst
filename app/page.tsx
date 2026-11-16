import { preload } from "react-dom";
import BathurstHero from "@/components/bathurst/BathurstHero";
import CornerOffer from "@/components/bathurst/CornerOffer";
import AssessLead from "@/components/home/AssessLead";
import ThumbCta from "@/components/home/ThumbCta";

export default function Home() {
  // the map's street data (lib/bathurst/osm-layer.ts) is the heaviest download: start it with the page, behind the scripts,
  // so it is already here when the engine asks for it instead of starting after the load event
  preload("/map/bathurst-osm.tcgm.gz", { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  return (
    <>
      {/* 01 Canadian Business Terminal: the question box over the playing horizon (the hero's lead-in); it slides up on the
          first scroll and the headline rises in. 02 Toronto Business Map (fly-through → crane → live map), then on the sheet
          that rises over it: 03 Partner Stories · 04 What We Build · 05 Bathurst Interviews · 06 Partnership CTA · footer */}
      <BathurstHero headingLevel="h2" lead={<AssessLead />} />
      <CornerOffer />
      <ThumbCta />
    </>
  );
}
