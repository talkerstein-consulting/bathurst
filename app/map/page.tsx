import { preload } from "react-dom";
import MapStage from "@/components/tcg/map-stage";
import MapFullscreen from "./MapFullscreen";
import MapOnly from "./MapOnly";
import "./map-only.css";

/**
 * /map is the client map and nothing else. components/tcg/map-stage.tsx holds the markup
 * lib/bathurst/engine.ts binds to, started in its static mode; map-only.css sizes that map to
 * this page (and so to the frame the homepage's "Our Global Footprint" puts it in).
 */
export default function MapPage() {
  preload("/map/bathurst-osm.tcgm.gz", { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  return (
    <>
      <MapOnly />
      <MapStage headingLevel="h1" />
      <MapFullscreen />
    </>
  );
}
