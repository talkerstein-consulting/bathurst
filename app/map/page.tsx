import { preload } from "react-dom";
import BathurstHero from "@/components/bathurst/BathurstHero";
import "./map-only.css";

export default function MapPage() {
  preload("/map/bathurst-osm.tcgm.gz", { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  return (
    <div className="standalone-map">
      <BathurstHero headingLevel="h1" />
    </div>
  );
}
