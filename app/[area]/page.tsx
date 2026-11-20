import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { preload } from "react-dom";
import BathurstHero from "@/components/bathurst/BathurstHero";
import CornerOffer from "@/components/bathurst/CornerOffer";
import { AREAS } from "@/lib/bathurst/data";

// the area pages are the home page with the map narrowed to one geography (lib/bathurst/data.ts AREAS)
export const dynamicParams = false;
export const generateStaticParams = () => Object.keys(AREAS).map(area => ({ area }));

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const { area } = await params, a = AREAS[area];
  if (!a) return {};
  const title = `${a.name} Web Design, AI & Automation Consulting | Talkerstein`;
  const description = `Talkerstein helps ${a.name} businesses grow through web design, AI, automation, branding and strategic consulting. See our work with local businesses in ${a.name}.`;
  return { title, description, alternates: { canonical: `/${area}` }, openGraph: { title, description, url: `/${area}` } };
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (!AREAS[area]) notFound();
  preload("/map/bathurst-osm.tcgm.gz", { as: "fetch", crossOrigin: "anonymous", fetchPriority: "low" });
  return (
    <>
      <BathurstHero area={area} />
      <CornerOffer />
    </>
  );
}
