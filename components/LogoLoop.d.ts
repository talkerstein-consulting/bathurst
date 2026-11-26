// Types for the react-bits LogoLoop (components/LogoLoop.jsx, added by shadcn and left as
// the registry ships it). Only the props this project passes are declared.
import type { ReactNode } from "react";

declare const LogoLoop: (props: {
  logos: Array<{ src?: string; alt?: string; title?: string; href?: string; node?: ReactNode; ariaLabel?: string }>;
  speed?: number;
  direction?: "left" | "right" | "up" | "down";
  logoHeight?: number;
  gap?: number;
  pauseOnHover?: boolean;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutWidth?: number;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  labels?: "none" | "hover" | "inline" | "below";
  ariaLabel?: string;
  className?: string;
  width?: number | string;
}) => ReactNode;

export default LogoLoop;
