import { BriefProvider } from "@/components/tcg/brief";
import { Clients } from "@/components/tcg/clients";
import { Features } from "@/components/tcg/features";
import { Footprint } from "@/components/tcg/footprint";
import { Footer } from "@/components/tcg/footer";
import { SelectedWork, WhatWeDo } from "@/components/tcg/sections";
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

          {/* The cards are dragged into the intake box, and the two are
              siblings here, so the state they share lives above both. */}
          <BriefProvider>
            <Intake />

            <Features />
          </BriefProvider>

          <Footprint />

          <WhatWeDo />

          <SelectedWork />

          <Clients />
        </main>
      </div>

      {/* The footer is full bleed, so it sits outside .shell (which is capped
          at 1460px and carries the page gutters) and keeps its own inner
          column instead. */}
      <Footer />
    </>
  );
}
