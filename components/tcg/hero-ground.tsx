"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

/** Only the props the hero actually sets. */
type DitherProps = {
  className?: string;
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  waveColor?: number[];
  backgroundColor?: number[];
  colorNum?: number;
  ditherMode?: string;
  scale?: number;
  contrast?: number;
  brightness?: number;
  mouseEffect?: string;
  pixelSize?: number;
  enableMouseInteraction?: boolean;
  clickRipple?: boolean;
  mouseRadius?: number;
  mouseStrength?: number;
  trail?: number;
  intro?: boolean;
};

/**
 * The hero's ground.
 *
 * Dither ships as plain JS, so TypeScript infers its props from the defaults —
 * which leaves the three undefaulted ones (palette, dpr, style) looking
 * required, and types the colours as number[] even though the component also
 * parses CSS strings. One typed boundary here is cheaper than editing a file
 * the registry overwrites on the next install.
 *
 * WebGL, so client-only: rendering it on the server buys nothing and costs a
 * hydration mismatch. D07 gives it a loading state inside the block's own size.
 */
const Dither = dynamic(
  () =>
    import("@/components/Dither") as Promise<{
      default: ComponentType<DitherProps>;
    }>,
  {
    ssr: false,
    loading: () => <div className="hero-bg hero-bg--wait" aria-hidden="true" />,
  },
);

/**
 * An sRGB hex to the linear 0-1 triple the uniforms expect, so the brand hex
 * stays readable here instead of three decimals in the markup.
 */
const linear = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  const chan = (shift: number) => {
    const c = ((n >> shift) & 255) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return [chan(16), chan(8), chan(0)];
};

/** The ground takes the client map's own palette, so the hero and the map
 *  further down the page are printed on the same paper.
 *
 *  Both values are lifted from PALETTES.paper in lib/bathurst/engine.ts, the
 *  palette the map actually renders with: WAVE_INK is its `ground` (the warm
 *  grey land) and GROUND is its lightest road fill (the paper the streets are
 *  drawn on). Nothing in between is invented -- the dither simply quantises
 *  from one to the other.
 *
 *  They sit on the same side of neutral (red highest, blue lowest in both), so
 *  every step between them stays warm. That is what went wrong with Sea Breeze
 *  before: its green channel was the highest, and it was mixing toward a blue
 *  wave, so the middle steps landed on green.
 *
 *  D02: the land measures 9.3:1 against the Steel Blue headline -- more
 *  headroom than the blue ground it replaces, which sat at 8.2:1.
 *
 *  FLAGGED, D00.3: the two hex values are duplicated here because the palette
 *  is read in JS by a component that has no access to the engine's internals.
 *  If PALETTES.paper is retuned, these follow it by hand. */
/* The map's `ground` -- the warm grey land it paints Toronto on, so the hero
   and the map are printed on the same paper.

   Leave this alone. Two alternatives were tried and both rejected: a blue dark
   end (#A4B7D6) and a higher-chroma ochre (#CDBB9C, which measured "less
   muddy" at chroma 70 but read gold on screen). The low chroma here is the
   point, not a fault to be corrected. */
const WAVE_INK = "#D3CBC5";
const GROUND = "#F8F4EC";

/**
 * The ground takes a pair of colours so one component can print two papers: the home
 * hero's warm grey, which is the map's own, and /check-2's brand blue. They must be on
 * the same side of neutral as each other — the dither quantises BETWEEN them, and a
 * pair that straddles neutral puts a third hue in the middle steps. That is the fault
 * the comment above records.
 */
export function HeroGround({
  ink = WAVE_INK,
  paper = GROUND,
}: {
  ink?: string;
  paper?: string;
} = {}) {
  return (
    /* The canvas is wrapped rather than given .hero-bg directly. Dither.css
       sets .dither-container { position: relative; height: 100% } on whatever
       element carries its className, and component CSS is injected after
       globals — so an absolute .hero-bg on the same element loses the cascade
       and the canvas collapses to zero height. Wrapping sidesteps the race:
       the wrapper is positioned, and the container fills a real height. */
    <div className="hero-bg" aria-hidden="true">
      <Dither
        /* The BG Studio settings, with the two colours swapped for brand
           tokens. Palette is None there, so the wave is a single colour
           quantised into `colorNum` steps rather than a ramp of its own. */
        waveColor={linear(ink)}
        backgroundColor={linear(paper)}
        colorNum={6}
        ditherMode="bayer"
        pixelSize={1}
        scale={1}
        waveSpeed={0.04}
        waveFrequency={0.7}
        waveAmplitude={0.6}
        contrast={1}
        brightness={0}
        mouseEffect="ripple"
        mouseRadius={0.24}
        mouseStrength={0.55}
        trail={0.5}
        enableMouseInteraction
        clickRipple
        intro={false}
      />
    </div>
  );
}
