import { Features } from "@/components/tcg/features";
import { Footprint } from "@/components/tcg/footprint";
import { Footer } from "@/components/tcg/footer";
import {
  SelectedWork,
  Testimonials,
  WhatWeDo,
} from "@/components/tcg/sections";
import { Intake } from "@/components/tcg/intake";
import { Masthead } from "@/components/tcg/masthead";
import { Nav } from "@/components/tcg/nav";
import { TopBar } from "@/components/tcg/topbar";

export default function Home() {
  return (
    <>
      <div className="shell">
        <TopBar />

        <main className="col">
          {/* The id is what the condensed bar watches for. */}
          <div className="mast-block" id="mast-block">
            <Masthead />
            <Nav />
          </div>

          <Intake />

          <Features />

          <Footprint />

          <WhatWeDo />

          <SelectedWork />

          <Testimonials />
        </main>
      </div>

      {/* The footer is full bleed, so it sits outside .shell (which is capped
          at 1460px and carries the page gutters) and keeps its own inner
          column instead. */}
      <Footer />
    </>
  );
}
