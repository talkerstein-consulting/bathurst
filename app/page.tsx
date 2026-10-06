import { preload } from "react-dom";
import BathurstHero from "@/components/bathurst/BathurstHero";
import CornerOffer from "@/components/bathurst/CornerOffer";

export default function Home() {
  // the map's street data (lib/bathurst/osm-layer.ts) is the heaviest download: start it with the page, behind the scripts,
  // so it is already here when the engine asks for it instead of starting after the load event
  preload("/map/bathurst-osm.tcgm.gz", { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  return (
    <>
      {/* 1. Street View fly-through → crane → live map with industry steps */}
      <BathurstHero />
      <CornerOffer />
    </>
  );
}
