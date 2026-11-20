// The two React Bits items that ship as .jsx: give their props a surface TypeScript can see.
declare module "@/components/OrbitImages" {
  import type { CSSProperties, ReactNode } from "react";
  export interface OrbitImagesProps {
    images?: string[];
    centerContent?: ReactNode;
    altPrefix?: string;
    baseWidth?: number;
    fill?: boolean;
    easing?: string;
    shadow?: number;
    shape?: "ellipse" | "circle" | "square" | "rectangle" | "triangle" | "star" | "custom";
    radius?: number; radiusX?: number; radiusY?: number;
    itemSize?: number; itemRadius?: number;
    duration?: number; rotation?: number; depth?: number; hoverScale?: number;
    showPath?: boolean; pathColor?: string; pathWidth?: number;
    direction?: "normal" | "reverse"; paused?: boolean;
    width?: string | number; height?: string | number;
    className?: string; style?: CSSProperties;
  }
  const OrbitImages: (p: OrbitImagesProps) => JSX.Element;
  export default OrbitImages;
}

declare module "@/components/DomeGallery" {
  import type { CSSProperties } from "react";
  export interface DomeGalleryProps {
    images?: { src: string; alt?: string }[];
    fit?: number; segments?: number; grayscale?: boolean;
    overlayBlurColor?: string; imageBorderRadius?: string;
    dragSensitivity?: number; maxVerticalRotationDeg?: number;
    /** degrees of yaw per second the sphere turns on its own, endlessly; 0 is still */
    autoSpinDegPerSec?: number;
    className?: string; style?: CSSProperties;
  }
  const DomeGallery: (p: DomeGalleryProps) => JSX.Element;
  export default DomeGallery;
}
