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

/** Brand ink laid over brand paper at `amount`, so the wave is a tint of a
 *  token rather than a grey picked by eye. */
const tint = (amount: number): [number, number, number] => {
  const paper = linear(PAPER);
  const ink = linear(STREAK);
  return [0, 1, 2].map((i) => paper[i] + (ink[i] - paper[i]) * amount) as [
    number,
    number,
    number,
  ];
};

const PAPER = "#F3F7F3";
const INK = "#19254A";

/** TRIAL, at the client's request: the wave runs through Muted Orange instead
 *  of Steel Blue, which puts orange on a decorative surface — the one thing the
 *  brand reserves for operable elements. Swap INK back in to undo it. */
const STREAK = "#B3530E";

/** How much colour the wave carries. .12 is a whisper, .20 reads clearly, .35
 *  is loud. Raised so the texture is actually obvious. */
const WAVE = 0.42;

/**
 * Sea Breeze waved through Steel Blue at WAVE strength, so the texture is
 * legible while the block stays light, and both ends are brand tokens rather
 * than a grey chosen by eye.
 *
 * The ground answers the pointer at the client's instruction: the dither
 * erases under the cursor and a click sends a ripple. That makes a decorative
 * surface interactive, which the brand otherwise reserves for controls, so the
 * wrapper takes pointer events back while everything above it keeps its own. It
 * still takes no tab stop: there is nothing here to operate, only to disturb.
 */
export function HeroGround() {
  return (
    /* The canvas is wrapped rather than given .hero-bg directly. Dither.css
       sets .dither-container { position: relative; height: 100% } on whatever
       element carries its className, and component CSS is injected after
       globals — so an absolute .hero-bg on the same element loses the cascade
       and the canvas collapses to zero height. Wrapping sidesteps the race:
       the wrapper is positioned, and the container fills a real height. */
    <div className="hero-bg" aria-hidden="true">
      <Dither
        backgroundColor={linear(PAPER)}
        waveColor={tint(WAVE)}
        colorNum={6}
        waveAmplitude={0.32}
        waveFrequency={2.4}
        waveSpeed={0.02}
        pixelSize={2}
        enableMouseInteraction
        clickRipple
        mouseRadius={1.2}
        mouseStrength={0.9}
        trail={0.5}
        intro={false}
      />
    </div>
  );
}
