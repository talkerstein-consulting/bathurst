import { preload } from "react-dom";
import BathurstHero from "@/components/bathurst/BathurstHero";
import MapOnly from "./MapOnly";
import MapFullscreen from "./MapFullscreen";
import "./map-only.css";

/**
 * /map is the client map, nothing else. The engine (lib/bathurst/engine.ts, three.js) binds
 * to BathurstHero's markup by element id, so that markup has to be here; map-only.css hides
 * every part of it that is not the map, and MapOnly pins the engine to its map state.
 */
export default function MapPage() {
  preload("/map/bathurst-osm.tcgm.gz", { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  return (
    <>
      <BathurstHero headingLevel="h1" />
      <MapOnly />
      <MapFullscreen />
    </>
  );
}
