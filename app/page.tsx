import BathurstHero from "@/components/bathurst/BathurstHero";
import CornerOffer from "@/components/bathurst/CornerOffer";

export default function Home() {
  return (
    <>
      {/* 1. Street View fly-through → crane → live map with industry steps */}
      <BathurstHero />
      <CornerOffer />
    </>
  );
}
