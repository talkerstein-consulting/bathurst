"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { cn } from "@/lib/utils";

export interface SignalPoint {
  id: string;
  label: string;
  lat: number;
  lng: number;
  value?: string;
}

export interface SignalMapHandle {
  send: (from: string, to: string) => void;
  burst: (from: string) => void;
}

export interface SignalMapProps {
  points?: SignalPoint[];
  routes?: [string, string][];
  projection?: "miller" | "equirectangular" | "natural";
  density?: number;
  dotSize?: number;
  dotShape?: "circle" | "square";
  grid?: "hex" | "square";
  ocean?: boolean;
  rate?: number;
  travel?: number;
  arcHeight?: number;
  trail?: number;
  trace?: boolean;
  ripple?: boolean;
  rippleSize?: number;
  markers?: boolean;
  labels?: "hover" | "always" | "none";
  autoplay?: boolean;
  interactive?: boolean;
  height?: number;
  theme?: "auto" | "light" | "dark";
  accentColor?: string;
  dotColor?: string;
  textColor?: string;
  className?: string;
  style?: CSSProperties;
}

interface Projection {
  forward: (lambda: number, phi: number) => [number, number];
  inverse: (x: number, y: number) => [number, number] | null;
  xMin: number;
  xMax: number;
}

interface Dot {
  x: number;
  y: number;
  land: boolean;
}

interface Signal {
  a: number;
  b: number;
  start: number;
  duration: number;
  cx: number;
  cy: number;
  arrived: boolean;
}

interface Wave {
  x: number;
  y: number;
  start: number;
  scale: number;
}

interface Pulse {
  point: number;
  start: number;
}

interface Scene {
  width: number;
  height: number;
  spacing: number;
  radius: number;
  dots: Dot[];
  buckets: Map<number, number[]>;
  cell: number;
  points: { x: number; y: number }[];
}

interface Palette {
  accent: string;
  glint: string;
  dot: string;
  ocean: string;
  text: string;
  muted: string;
  surface: string;
  ring: string;
}

const SANS = 'var(--font-sans, ui-sans-serif), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const MASK = "rQkPGBemcjEglghgzmTi8GBgqIIBBDHBgymUixg4FhQDBFIiXBjpirFEgvHCBhjh9BJGMBgyCICioioKDgrEhnh3HBFFGCCBFCEcCZKilinSCGCZGhlhFIBJgoEBBFDEHhAMilinTBfMhbBDg4GCBCEBRiBRigiVFSSBURheg8RBBEFiLLDDiaiJDKKDEFgnGhng9WiYECKiViGHKKDGGHCYFhoDBhADBIDFiZKDBBBiRiDBBHIBGDCBFHFBFEBPNhohDJFGifCiXh5HVCRBJCETNBBhphBHKBidJiUh2KDBJCIBGCCBDIFZQhiDChFChiGhANBHiJhzIBCBHGEHEBJENHCHEThjCBifOg2ECfgyBhSh1BBBBDCLDJFLFBEHIJCBgnhQibOg0gugrBDOhHh9XCDGGCGCagqhOBDiTBBJgoBKg1gvQCJg7iDIdFDYguhLiWJg0g0g0DREg8hvKCCh5hLiVHg4gvEDg1ChOhwQTDIIDKFGDEBGgshHiVHgwg2CIECODfFhKhvVMHHHEJEGCRgqhDiXHaDShNJLZEhJhubCDCGFMCHFGCKBIgohEiVHaHFBHBChhXHhIhsNCUBGHKCDIIBVgnhDiUHaJEBDHChgUUg9hvIDdKGCEHghgkhDiTIaICEBhrGBNVg8AFgpChBCJbLBEHHglgiBBg3BHiUBBFWLCSBhdFgog2CgoQhEdOIHgodg6DFhXDBMgvITMCSBiYgpgkgggkCVfJKHgpZg-CChTBDTg3CPLDisgogigsQNCDCEIggFCDINHDCCBBUZGBg5hSeg1HILCiuEDHECNGghgyFgjFSBJFICICBHIFBCVaCEg0hRBCglaEUKFJDi-ERBADYhoCJCFBBBCBCCBDGCIBEFIKBBQdBCgzhRguWCHCHDCPDIDFBjNAFWhpLIMFDNCBBIKECPagxhVBBgxKFIguCjTAJWhvCYBPCLIFBCCQWgqhfg0GFEgxDjTAKWilJDGTSgphgg2FDEgxEjUALBFSihSXQgnhfg3Hg2DjWAUHFEiYCERPBKQglXDKFg3grEHDkVABBRFijBDBBTNEGSgiZFCNg1gtKkYABHIKigCFMVEDWZgjSgzTHTLkYJGMieCJIZbXghUgyVGVDFCkXBNBYiSDKHDGRaXglOgyXEZEkZDgmiOGGDEQQaWgkCBIgzBBWEk5CTDJCBiRKCMCLICFbUhiWFk8BeiTQDWIDBdRhhYFk9BdiSRCGBDGBDJFggQhFCYYHkdBYIciSaBDMNCePhGBXZIkSDGCVLciQggOgsNhfZIkOHDFSOebBGDhoghRgrKhgZHkOIBETQaDBZCIFhlgiQJBgmFhTBMbCBDJGj8OKFCTbBEBDSCFRhdgiQIDiKcSj9NFghgkQECYhZghSHEiJbKjwFBBBIHKHghgkDCMfhZeUEHh3BRIDNJjwgjGCBgggtHCCehYefhvCBFTEGLKCCjqgjHgkgsFDDgghYfehtBDHbKEBGBDjpghMgigrEEEghEBhSDBcehsBBJWDDKCCFEBjngiNgigpFgrheYehuIVFEJIjrgjOgignFgvhdQDEfhuHVGDHKjqgjQghgkFgzhgSghhsJUFBHNjoglNgkgiCCBBBg0hmJgmhmECHUIRjmgnNIBbeEg8CChiFgshiGBCBFTEBCKDDjnEBgjNgkcBhGhgGgshfJEHRFCEDj0DCFBZKgnaChCCDhhGgthdIGGPBBkIEBaIgoWDhGCDhhFguhcIDKKkUZIgohgBEhgFgvhcHDMGkWZFgrLBhVBFheGguhaIEMGkWaEgrEEhghfDgthcFGMFkYaDgshoiMCDhnLDkUCDaCgthniLDDhmLCkWDDZBgvhoiIFChmCBBKkWDEWCgwhqh4FDKFhwkYDEhIhsh1CDDEGKhokcDFhHhuhwCIKLhjCBkeDChKhvhuBJLMhgkiEChKhvh4KOhhkfFBhLhvh3TBCDhkkbGChKhwh4GBOBhmhOCYGirHDhJhwh7CDh1hACIFWIiqIBhLhwiAh1g_GEFVKipYBg8hwh1BIh4bCghFeIirJCKCg_hwhyCHh6cEeIDFTIirKDIBhBhwhwDEh-UCGFcTRHirLFEBhDhvhtIChyBMSFHEaWQHipMIhFhvhsh7ZDDIHFXYPIimMKhFhvhsh7YMBDGHVaNKieDBNIhIhvhsh7ZKCEGJSbNJicTBEChJhwhsh6YLCFIHRJHLOIBCiYUChOhwhoh-WOBHHGVDLIQLiXVChNhvhoh_UOEIIDJBBCDDgpHBCiFBQVDhNhvhliCTQDKEBCCJEgvHiHDOWEhMhwhkiCSFCKCMCGHGgvIiEEECGZEhMhwhjiCTRCNCHGFguJiDFCGEZEhMhxhhiDTggBIHFgtKh_HBHHWEhNhyhgiERbBDDIIDguKiAOHWDhOhzheiFRaGKGCBEgsKiCDBIBBGUEhOhzhdiGPVCHEMDEBDguIiJIGOBCGhOh0hciLJKQHBPBJgvEiJJHOJhOh0hciMCLUgmCEDEiqLGNJhPh1hciLCIYgyioNGKBCKhOh2hZiNHCZZFNDEinOGGQhPh2hZiMgjgrCFinNEHPhSh3hWiNgigziqRBDEBGhXh7hQiOglgxiqUCBFBChYh9hNiNgogvirLCFIhdh9hMiNguOEYisRFhgh-hJiOgyJIWitRDhhh-hIiPgyJLSivQDhhh_DDhBiOg1HPFFCixRBhiiADDg_iPg5DjLh1iADDg0CJiQkGh1iBDDguICCFiOh1EiQhziCEBgjIEMEiNh1FiPh0iDDCghZFh9BHBFh3FiNh1iEDCebFh_BEBEh5FiNPBhliCFEbcFiHhdEbFiLh2iDFDaeFiFhfDcGiIh3iEFDadFiFhfEcHFCh-QBhniHDDZeEFBh9hiEcLBBh-PBhoiICDZfDiDhiEcBBJBCh9h4iICFWghBiDhkEdHDIGCCChqh5iHEFVgmCh9hkEdGEVhoECh0iJDFUgnBh8hmEdBJUhmFCh1iKDFTijhnGgnUhjFDh1iMBGSijhnGgpThhGDh1iURbJh-hpGgpVhbJCh2iURaDCIh6hrFgqSgsBgsOBh2iVQdBFGh4hsEgpUgoFgqiGiVQPHQFFBhwhsEgoWEBdKggDDiKguChlRNHSGh1hsEgnXCDcLdFCiLgwBhkSMGUHhzhsFgkdcMcHBiLgwChjSMGcHhrhsGgjdbPZGEiKgwChkSKHdIhphsHgidZRZFEiLiYRGBBIdJhphrHggggXTYFEiLiZfTEEJCBCEhjhtGeghWVYFCVEhziccVBh6huGbgjVWYcEhzieaiQhuHagjTYZbEhzigXiQhvHWgnTYaaEhzijUg1BhahwGUgqQZEDVYEh0imCFTiHhwBBETgrOdBEWXDh1iuTh3BNhyFSgtMgjXWDh1ivTiDh1EOgwMgkWWEh0iwSiEh1DMgzLgkXWFhyi0NiGh1CJg2MgjXXBBFhvi2LiFh3BFg6MgkDCRWCDChwi5IiFh8RBgqLYBLDCRXBEChvi6HXChth4UBgqKZBKEEPXBDCBChti7GWCCChrh2PBgxJZBKEGNZBEChti8FTECFhqh2JGgxJglCHMaCCDhti8FQPHECBhch2DLgyIgkDIJWCEGhui8GPHBMCECBhdiDgyHgmCKFYBGHhsi9GOHCThfiCgyGCBgkCLDYBHECBhsjAEEEEfheiBgzFCCgjDJDYBICEBhsjBIBDCfhfiAg0EDCgiEKBYBNEhrjCGDgmhdh-g2CDEghFgsIhrjFDDgnhch-g7EgjDgrJhrjGBFgnhdh7g8FgjCgrBDFhrjNgnhdh6g9EgjEeCJBDDBBhrjNgphdaEhZg-DglEcDNDhtjNgwhXWIhYhmGaFNBhtjNgyhWSLhXhdFFHYIh5jNgzhXEYhVhfFFGWIh7jNg0hzBFhOhgFEGVJQBhqjNg1h3BBhMhiFEFJBKIh9jNg1h6hKhkFDFTJh9jMg2h6hJhiBDFDEQNh8jLg4h4hJhoFDEOOUBhnjKg6h3hHhrHCCKDBOTBhojKg6h3hGhpCCHCCJUEBGBFDhmjIg8h3hEhsBCJLSEKFChnjIg9h2hDhwKKRFBGBHBhoixBVhAhzhDhyICBIREBOCEChiixDThDhvhDh0HLRECCEHDEBBFDBhYjGhHhthChxBDIKPFIOIhbjGhJhrhBh2IBCINFGCBCDDBEBDEEBBDhTjGhJhsg_h4LHNFGVEEHNBhCjHhOBChkg9h5MBCDNFGNBGGCLhNjHhThjg7h7JDBHDBGEEBDHCCFEVRBg4jGhVhjg6h8IRCBBGCBDIBCBICBVhHjFhXhjg4h-HbCCDYUNDg2jFhZhig3h_GbCCBBBbTLDg2jGhbhfg2BBiAEbCDCdRKCFBgyjGhcheg2iDBBBg1BCCGSCHGBgyjGhchfg2iEFg0CHTDCJCgwjIhahfg2iDJCDgsBISQBgwjJhahfg1iGOgkBNRUBgtjJhahfg1iJNXBJBNTSBDBgqjKhYhhg0iOKBBCDCCDFZDCHFFRCCBgpjKhYhgg1iXBBGCEGEbGGEYBgmjLhWhhg1ipEfDIFBBTBBBgljLhWhhg2ieDGDgtFBBRDgmjMhUhjg2ifBGCgwEg7jMhShlg2ilBglBgnBgjjNhRhlg2i1BBCSChKjNhQhmg2FBitDCDQChKjOhPhmg2RBijMJEhJjPhNhmg3RCihMKEhJjPhLhng4QDigNKEhJPBi_hLhng4PEifNBBJEhJjPhLhng5OFiXEDNBBJGhHjQhKhmg6NGiVHCMMHhGjRhJhmg5NHiUXLIgqBajThHhmg5LJiUZJIhFjVhFhlg5JLiTdHIgrCXBjXhDhlg4KLiRBBeBBDKhBDjYhChlg2LLiRgjDKhEg9BibhBhlg0NLiRgwg_CDjbg-hngyOLiRgxg-CDjbg-hngxPLiQgygtBVjbg-hoguSJiRgzhCjbg9hqgsTJiPg3hAjbg9hqgsSJSBh5g9eBfjbg8hsgrSJiIhBfCDBZjcg6htgrRKOBh3hEfCcjcg6hugrQKiEhGggCbjbg6hwgqPKiEhJggBajbg5hxgqQJiDhLg6jbg0h2gqQIiEhLg6jbgzh3gqQIiEhMg5jbgvh7gqQIiEhNg4jbguh8gpSHiEhOg3jbgth9gmWEiHhPg1jagth_gkiihOg2jagth_gkighQg2jagth_gkihhPg2jagth_gkiihPg1jagtiAgiijhPg1jZguiBghijhPg1jZgtiDfilhOg1jZgsiEeinhNg1jZgriGciohNg1jZgriGciohMg2jYgpBBiIaiphMg2jZgpiJZirhLg2jZgniMXiscEgrg2jZgniMWitYMgmg3jZgmiNViuTSgkg4jYgniNTiwRVGBbg5jYgliQQixSWEBcg5jYbBJiQHi6JfDCbg6jYcDEiUBjAFgiBDBBZgsBNjXfmEBCYgtDLjXemEDCXguCLjWggmJVgwCKjWghmIVgxBBBIjVghmJVgxDIjVggmLTgyECCDjVggmNNg2IDjVdmUCDCg4HEjVXnYGGjVXnZFGjUXmlBg1EGjUYmdCEBgxBEDHjUSmjIgvIIjUSmkHguGLjUBCSmhHgtGMjTCBTmiFguFNjTCBRmkEgtGOjWQnUIOjUSnSHRjTSnSIRjTQnTISjSPnUJSjRQnVGUjRRnujTSnSBYjSTnrjRSntjRRnujRQkQEjbjRQkSBjcjROnxjRNnyjSMUBndjSMQGncjSNSBnejULnxjVFBFnwjVGBFnvjYLg6CmxjZMCBg3BmwjcGnurQrQrQrQrQ";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const MASK_WIDTH = 720;
const MASK_HEIGHT = 284;
const MASK_STEP = 0.5;
const TOP = 84;
const BOTTOM = -58;
const DEG = Math.PI / 180;
const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const ROOT = Math.sqrt(3) / 2;
const TRACE_FADE = 1600;

const DEFAULT_POINTS: SignalPoint[] = [
  { id: "sfo", label: "San Francisco", lat: 37.77, lng: -122.42, value: "12 ms" },
  { id: "nyc", label: "New York", lat: 40.71, lng: -74.01, value: "9 ms" },
  { id: "mex", label: "Mexico City", lat: 19.43, lng: -99.13, value: "21 ms" },
  { id: "gru", label: "São Paulo", lat: -23.55, lng: -46.63, value: "18 ms" },
  { id: "lon", label: "London", lat: 51.51, lng: -0.13, value: "8 ms" },
  { id: "fra", label: "Frankfurt", lat: 50.11, lng: 8.68, value: "7 ms" },
  { id: "sto", label: "Stockholm", lat: 59.33, lng: 18.07, value: "11 ms" },
  { id: "los", label: "Lagos", lat: 6.52, lng: 3.38, value: "24 ms" },
  { id: "jnb", label: "Johannesburg", lat: -26.2, lng: 28.05, value: "19 ms" },
  { id: "dxb", label: "Dubai", lat: 25.2, lng: 55.27, value: "14 ms" },
  { id: "bom", label: "Mumbai", lat: 19.08, lng: 72.88, value: "16 ms" },
  { id: "sin", label: "Singapore", lat: 1.35, lng: 103.82, value: "10 ms" },
  { id: "hkg", label: "Hong Kong", lat: 22.32, lng: 114.17, value: "13 ms" },
  { id: "tyo", label: "Tokyo", lat: 35.68, lng: 139.69, value: "9 ms" },
  { id: "syd", label: "Sydney", lat: -33.87, lng: 151.21, value: "15 ms" },
  { id: "akl", label: "Auckland", lat: -36.85, lng: 174.76, value: "22 ms" },
];

let decoded: Uint8Array | null = null;

const landMask = () => {
  if (decoded) return decoded;
  const lookup = new Int16Array(128).fill(-1);
  for (let k = 0; k < ALPHABET.length; k += 1) lookup[ALPHABET.charCodeAt(k)] = k;
  const bits = new Uint8Array(MASK_WIDTH * MASK_HEIGHT);
  let i = 0;
  let row = 0;
  let col = 0;
  let land = 0;
  while (i < MASK.length && row < MASK_HEIGHT) {
    let run = lookup[MASK.charCodeAt(i)];
    i += 1;
    if (run >= 32) {
      run = ((run - 32) << 6) | lookup[MASK.charCodeAt(i)];
      i += 1;
    }
    if (land && run > 0) bits.fill(1, row * MASK_WIDTH + col, row * MASK_WIDTH + col + run);
    col += run;
    land ^= 1;
    if (col >= MASK_WIDTH) {
      row += 1;
      col = 0;
      land = 0;
    }
  }
  decoded = bits;
  return bits;
};

const isLand = (bits: Uint8Array, lat: number, lng: number) => {
  const row = Math.floor((TOP - lat) / MASK_STEP);
  let col = Math.floor((lng + 180) / MASK_STEP);
  if (row < 0 || row >= MASK_HEIGHT) return false;
  col = ((col % MASK_WIDTH) + MASK_WIDTH) % MASK_WIDTH;
  return bits[row * MASK_WIDTH + col] === 1;
};

const projections: Record<NonNullable<SignalMapProps["projection"]>, Projection> = {
  equirectangular: {
    forward: (lambda, phi) => [lambda, phi],
    inverse: (x, y) => [x, y],
    xMin: -Math.PI,
    xMax: Math.PI,
  },
  miller: {
    forward: (lambda, phi) => [lambda, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * phi))],
    inverse: (x, y) => [x, 2.5 * Math.atan(Math.exp(0.8 * y)) - 0.625 * Math.PI],
    xMin: -Math.PI,
    xMax: Math.PI,
  },
  natural: {
    forward: (lambda, phi) => {
      const theta = Math.asin(ROOT * Math.sin(phi));
      const t2 = theta * theta;
      const t6 = t2 * t2 * t2;
      const x = (lambda * Math.cos(theta)) / (ROOT * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
      const y = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
      return [x, y];
    },
    inverse: (x, y) => {
      let theta = y / A1;
      for (let k = 0; k < 8; k += 1) {
        const t2 = theta * theta;
        const t6 = t2 * t2 * t2;
        const f = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2)) - y;
        const slope = A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2);
        theta -= f / slope;
      }
      const t2 = theta * theta;
      const t6 = t2 * t2 * t2;
      const slope = A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2);
      const lambda = (ROOT * x * slope) / Math.cos(theta);
      const s = Math.sin(theta) / ROOT;
      if (Math.abs(s) > 1 || Math.abs(lambda) > Math.PI) return null;
      return [lambda, Math.asin(s)];
    },
    xMin: -Math.PI / (ROOT * A1),
    xMax: Math.PI / (ROOT * A1),
  },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const finite = (value: number | undefined, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

const easeInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));

const subscribeToMotion = (notify: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};

const readMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const parse = (color: string, probe: CanvasRenderingContext2D | null) => {
  if (!probe) return null;
  probe.fillStyle = "#010203";
  probe.fillStyle = color;
  if (String(probe.fillStyle) === "#010203" && color.trim().toLowerCase() !== "#010203") return null;
  probe.clearRect(0, 0, 1, 1);
  probe.fillRect(0, 0, 1, 1);
  const pixel = probe.getImageData(0, 0, 1, 1).data;
  return [pixel[0], pixel[1], pixel[2], pixel[3] / 255];
};

const luminance = (rgba: number[] | null) => {
  if (!rgba || rgba[3] < 0.5) return -1;
  const linear = (value: number) => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(rgba[0]) + 0.7152 * linear(rgba[1]) + 0.0722 * linear(rgba[2]);
};

const readBackdrop = (root: HTMLElement, probe: CanvasRenderingContext2D | null) => {
  let node: Element | null = root.parentElement;
  let view: Window | null = root.ownerDocument.defaultView;
  for (let hop = 0; hop < 4 && view; hop += 1) {
    while (node) {
      const color = view.getComputedStyle(node).backgroundColor;
      const value = luminance(parse(color, probe));
      if (value >= 0) return { dark: value < 0.35, color };
      node = node.parentElement;
    }
    let frame: Element | null = null;
    try {
      frame = view.frameElement;
    } catch {
      frame = null;
    }
    if (!frame) break;
    node = frame.parentElement;
    view = frame.ownerDocument.defaultView;
  }
  const doc = root.ownerDocument;
  const html = doc.documentElement;
  const own = doc.defaultView ?? window;
  if (html.classList.contains("dark")) return { dark: true, color: null };
  if (html.classList.contains("light")) return { dark: false, color: null };
  const scheme = own.getComputedStyle(html).colorScheme;
  if (scheme === "dark" || scheme === "light") return { dark: scheme === "dark", color: null };
  return { dark: own.matchMedia("(prefers-color-scheme: dark)").matches, color: null };
};

const makePalette = (dark: boolean, surface: string | null, accent?: string, dot?: string, text?: string): Palette => {
  const tone = accent || (dark ? "#A99BFF" : "#5227FF");
  return {
    accent: tone,
    glint: dark ? `color-mix(in srgb, ${tone} 45%, #ffffff)` : `color-mix(in srgb, ${tone} 70%, #000000)`,
    dot: dot || (dark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.17)"),
    ocean: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
    text: text || (dark ? "#EDEDEF" : "#18181B"),
    muted: dark ? "#8C8C95" : "#71717A",
    surface: dark ? "rgba(24,24,27,0.94)" : "rgba(255,255,255,0.96)",
    ring: surface || (dark ? "#0A0A0A" : "#FFFFFF"),
  };
};

const SignalMap = forwardRef<SignalMapHandle, SignalMapProps>(function SignalMap(
  {
    points = DEFAULT_POINTS,
    routes,
    projection = "miller",
    density = 150,
    dotSize = 0.5,
    dotShape = "circle",
    grid = "hex",
    ocean = false,
    rate = 1.2,
    travel = 1600,
    arcHeight = 0.3,
    trail = 0.32,
    trace = true,
    ripple = true,
    rippleSize = 1,
    markers = true,
    labels = "hover",
    autoplay = true,
    interactive = true,
    height,
    theme = "auto",
    accentColor,
    dotColor,
    textColor,
    className,
    style,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<HTMLCanvasElement | null>(null);
  const signalsRef = useRef<Signal[]>([]);
  const wavesRef = useRef<Wave[]>([]);
  const pulsesRef = useRef<Pulse[]>([]);
  const clockRef = useRef(0);
  const nextRef = useRef(0);
  const wakeRef = useRef<() => void>(() => {});
  const settingsRef = useRef({ rate, travel, arcHeight, trail, trace, ripple, rippleSize, autoplay });
  const reduced = useSyncExternalStore(subscribeToMotion, readMotion, () => false);
  const [width, setWidth] = useState(0);
  const [probed, setProbed] = useState(false);
  const [surface, setSurface] = useState<string | null>(null);
  const [hovered, setHovered] = useState(-1);

  const dark = theme === "auto" ? probed : theme === "dark";
  const palette = useMemo(() => makePalette(dark, surface, accentColor, dotColor, textColor), [accentColor, dark, dotColor, surface, textColor]);

  const pointsKey = JSON.stringify(points.map((p) => [p.id, p.label, p.lat, p.lng, p.value ?? ""]));
  const list = useMemo(
    () =>
      (JSON.parse(pointsKey) as [string, string, number, number, string][]).map(([id, label, lat, lng, value]) => ({
        id,
        label,
        lat: clamp(finite(lat, 0), BOTTOM, TOP),
        lng: clamp(finite(lng, 0), -180, 180),
        value,
      })),
    [pointsKey],
  );
  const routesKey = JSON.stringify(routes ?? null);
  const links = useMemo(() => {
    const parsed = JSON.parse(routesKey) as [string, string][] | null;
    if (!parsed) return null;
    const index = new Map(list.map((p, k) => [p.id, k]));
    return parsed
      .map(([from, to]) => [index.get(from) ?? -1, index.get(to) ?? -1] as [number, number])
      .filter(([a, b]) => a >= 0 && b >= 0 && a !== b);
  }, [list, routesKey]);

  const project = projections[projection] ?? projections.miller;
  const yTop = project.forward(0, TOP * DEG)[1];
  const yBottom = project.forward(0, BOTTOM * DEG)[1];
  const aspect = (project.xMax - project.xMin) / (yTop - yBottom);
  const fixed = typeof height === "number" && Number.isFinite(height) && height > 0 ? height : 0;
  const mapWidth = width > 0 ? (fixed ? Math.min(width, fixed * aspect) : width) : 0;
  const mapHeight = mapWidth / aspect;
  const boxHeight = fixed || mapHeight || 0;

  useEffect(() => {
    settingsRef.current = { rate, travel, arcHeight, trail, trace, ripple, rippleSize, autoplay };
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(() => setWidth(root.clientWidth));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const doc = root.ownerDocument;
    const viewport = doc.defaultView ?? window;
    const probe = doc.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const measure = () => {
      const tone = readBackdrop(root, probe);
      setSurface(tone.color);
      if (theme === "auto") setProbed(tone.dark);
    };
    const frames: number[] = [];
    const timers: number[] = [];
    const schedule = () => {
      frames.push(viewport.requestAnimationFrame(measure));
      timers.push(viewport.setTimeout(measure, 380));
    };
    schedule();
    timers.push(viewport.setTimeout(measure, 1200));
    const observer = new MutationObserver(schedule);
    const watch = (target: Document) => {
      observer.observe(target.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
      if (target.body) observer.observe(target.body, { attributes: true, attributeFilter: ["class", "style", "data-theme"] });
    };
    watch(doc);
    let outer: Element | null = null;
    try {
      outer = viewport.frameElement;
    } catch {
      outer = null;
    }
    if (outer) watch(outer.ownerDocument);
    return () => {
      observer.disconnect();
      frames.forEach((id) => viewport.cancelAnimationFrame(id));
      timers.forEach((id) => viewport.clearTimeout(id));
    };
  }, [theme]);

  const scene = useMemo<Scene | null>(() => {
    if (mapWidth <= 0) return null;
    const bits = landMask();
    const k = mapWidth / (project.xMax - project.xMin);
    const spacing = Math.max(3, mapWidth / clamp(finite(density, 150), 30, 400));
    const radius = Math.max(0.5, (spacing * clamp(finite(dotSize, 0.5), 0.1, 1)) / 2);
    const rowStep = grid === "hex" ? spacing * ROOT : spacing;
    const dots: Dot[] = [];
    const reach = (spacing / k / DEG) * 0.32;
    const offsets = [
      [0, 0],
      [reach, reach],
      [-reach, reach],
      [reach, -reach],
      [-reach, -reach],
    ];
    const rows = Math.floor(mapHeight / rowStep);
    const top = (mapHeight - (rows - 1) * rowStep) / 2;
    for (let r = 0; r < rows; r += 1) {
      const y = top + r * rowStep;
      const shift = grid === "hex" && r % 2 ? spacing / 2 : 0;
      const cols = Math.floor((mapWidth - shift) / spacing);
      const left = (mapWidth - shift - (cols - 1) * spacing) / 2 + shift;
      for (let c = 0; c < cols; c += 1) {
        const x = left + c * spacing;
        const geo = project.inverse(x / k + project.xMin, yTop - y / k);
        if (!geo) continue;
        const lng = geo[0] / DEG;
        const lat = geo[1] / DEG;
        if (lat > TOP || lat < BOTTOM) continue;
        let hits = 0;
        for (const [dl, dp] of offsets) if (isLand(bits, lat + dp, lng + dl)) hits += 1;
        const land = hits >= 2;
        if (land || ocean) dots.push({ x, y, land });
      }
    }
    const cell = Math.max(16, spacing * 4);
    const buckets = new Map<number, number[]>();
    dots.forEach((d, i) => {
      if (!d.land) return;
      const key = Math.floor(d.x / cell) * 4096 + Math.floor(d.y / cell);
      const bucket = buckets.get(key);
      if (bucket) bucket.push(i);
      else buckets.set(key, [i]);
    });
    const placed = list.map((p) => {
      const [x, y] = project.forward(p.lng * DEG, p.lat * DEG);
      return { x: (x - project.xMin) * k, y: (yTop - y) * k };
    });
    return { width: mapWidth, height: mapHeight, spacing, radius, dots, buckets, cell, points: placed };
  }, [density, dotSize, grid, list, mapHeight, mapWidth, ocean, project, yTop]);

  useEffect(() => {
    if (!scene) return;
    const canvas = canvasRef.current;
    const doc = canvas?.ownerDocument ?? document;
    const viewport = doc.defaultView ?? window;
    const ratio = Math.min(2, viewport.devicePixelRatio || 1);
    const base = baseRef.current ?? doc.createElement("canvas");
    baseRef.current = base;
    base.width = Math.max(1, Math.round(scene.width * ratio));
    base.height = Math.max(1, Math.round(scene.height * ratio));
    const ctx = base.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, scene.width, scene.height);
    const square = dotShape === "square";
    const draw = (land: boolean) => {
      ctx.beginPath();
      scene.dots.forEach((d) => {
        if (d.land !== land) return;
        if (square) ctx.rect(d.x - scene.radius, d.y - scene.radius, scene.radius * 2, scene.radius * 2);
        else {
          ctx.moveTo(d.x + scene.radius, d.y);
          ctx.arc(d.x, d.y, scene.radius, 0, Math.PI * 2);
        }
      });
      ctx.fillStyle = land ? palette.dot : palette.ocean;
      ctx.fill();
    };
    if (ocean) draw(false);
    draw(true);
    wakeRef.current();
  }, [dotShape, ocean, palette, scene]);

  const curve = useCallback((signal: Signal, t: number) => {
    const a = scene?.points[signal.a];
    const b = scene?.points[signal.b];
    if (!a || !b) return [0, 0];
    const u = 1 - t;
    return [u * u * a.x + 2 * u * t * signal.cx + t * t * b.x, u * u * a.y + 2 * u * t * signal.cy + t * t * b.y];
  }, [scene]);

  const launch = useCallback(
    (a: number, b: number) => {
      if (!scene) return;
      const from = scene.points[a];
      const to = scene.points[b];
      if (!from || !to) return;
      const { travel: base, arcHeight: lift } = settingsRef.current;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const length = Math.hypot(dx, dy) || 1;
      let nx = -dy / length;
      let ny = dx / length;
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      const bow = clamp(finite(lift, 0.3), 0, 1.2) * length;
      let cx = (from.x + to.x) / 2 + nx * bow;
      let cy = (from.y + to.y) / 2 + ny * bow;
      if (cy < 6) {
        const scale = Math.max(0, (Math.min(from.y, to.y) - 6) / Math.max(1, Math.min(from.y, to.y) - cy));
        cx = (from.x + to.x) / 2 + nx * bow * scale;
        cy = (from.y + to.y) / 2 + ny * bow * scale;
      }
      const duration = clamp(finite(base, 1600) * (0.55 + (length / scene.width) * 1.1), 500, 6000);
      signalsRef.current.push({ a, b, start: clockRef.current, duration, cx, cy, arrived: false });
      pulsesRef.current.push({ point: a, start: clockRef.current });
      wakeRef.current();
    },
    [scene],
  );

  const pick = useCallback(() => {
    const count = list.length;
    if (count < 2) return null;
    if (links && links.length) return links[Math.floor(Math.random() * links.length)];
    const a = Math.floor(Math.random() * count);
    let b = Math.floor(Math.random() * (count - 1));
    if (b >= a) b += 1;
    return [a, b] as [number, number];
  }, [links, list.length]);

  const burst = useCallback(
    (a: number) => {
      const count = list.length;
      if (a < 0 || a >= count || count < 2) return;
      const pool = links && links.length ? links.filter(([x]) => x === a).map(([, y]) => y) : list.map((_, k) => k).filter((k) => k !== a);
      const chosen = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
      chosen.forEach((b, n) => {
        const root = rootRef.current;
        const viewport = root?.ownerDocument.defaultView ?? window;
        viewport.setTimeout(() => launch(a, b), n * 120);
      });
    },
    [launch, links, list],
  );

  useImperativeHandle(
    ref,
    () => ({
      send: (from: string, to: string) => {
        const a = list.findIndex((p) => p.id === from);
        const b = list.findIndex((p) => p.id === to);
        if (a >= 0 && b >= 0 && a !== b) launch(a, b);
      },
      burst: (from: string) => burst(list.findIndex((p) => p.id === from)),
    }),
    [burst, launch, list],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !scene) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const viewport = canvas.ownerDocument.defaultView ?? window;
    const ratio = Math.min(2, viewport.devicePixelRatio || 1);
    const w = Math.round(scene.width * ratio);
    const h = Math.round(scene.height * ratio);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (baseRef.current) ctx.drawImage(baseRef.current, 0, 0, w, h);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const now = clockRef.current;
    const { trail: tail, rippleSize: spread, trace: keep } = settingsRef.current;
    const square = dotShape === "square";
    const waveLife = 1700;
    const lit = new Map<number, number>();
    wavesRef.current.forEach((wave) => {
      const t = (now - wave.start) / waveLife;
      if (t < 0 || t > 1) return;
      const reach = scene.spacing * 9 * clamp(finite(spread, 1), 0.2, 3) * wave.scale;
      const radius = reach * (1 - Math.pow(1 - t, 3));
      const band = scene.spacing * 1.9;
      const strength = Math.pow(1 - t, 1.5);
      const x0 = Math.floor((wave.x - radius - band) / scene.cell);
      const x1 = Math.floor((wave.x + radius + band) / scene.cell);
      const y0 = Math.floor((wave.y - radius - band) / scene.cell);
      const y1 = Math.floor((wave.y + radius + band) / scene.cell);
      for (let bx = x0; bx <= x1; bx += 1) {
        for (let by = y0; by <= y1; by += 1) {
          const bucket = scene.buckets.get(bx * 4096 + by);
          if (!bucket) continue;
          for (const i of bucket) {
            const d = scene.dots[i];
            const gap = Math.abs(Math.hypot(d.x - wave.x, d.y - wave.y) - radius);
            if (gap > band) continue;
            const q = 1 - gap / band;
            const value = q * q * (3 - 2 * q) * strength;
            lit.set(i, Math.max(lit.get(i) ?? 0, value));
          }
        }
      }
    });
    if (lit.size) {
      ctx.fillStyle = palette.accent;
      lit.forEach((value, i) => {
        const d = scene.dots[i];
        const r = scene.radius * (1 + 0.45 * value);
        ctx.globalAlpha = clamp(value, 0, 1);
        ctx.beginPath();
        if (square) ctx.rect(d.x - r, d.y - r, r * 2, r * 2);
        else ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    const lag = clamp(finite(tail, 0.32), 0.05, 0.9);
    signalsRef.current.forEach((signal) => {
      const t = (now - signal.start) / signal.duration;
      if (t < 0) return;
      const head = easeInOut(Math.min(1, t / (1 - lag * 0.35)));
      const back = easeInOut((t - lag) / (1 - lag));
      if (keep) {
        const after = Math.max(0, now - signal.start - signal.duration);
        const fade = after > 0 ? 1 - clamp(after / TRACE_FADE, 0, 1) : 1;
        if (fade > 0 && back > 0.001) {
          ctx.globalAlpha = 0.2 * fade;
          ctx.strokeStyle = palette.accent;
          ctx.lineWidth = 1;
          ctx.beginPath();
          const end = Math.min(back, head);
          for (let s = 0; s <= 24; s += 1) {
            const [x, y] = curve(signal, (end * s) / 24);
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }
      if (t >= 1 || head <= back + 0.002) return;
      const steps = 28;
      const [hx, hy] = curve(signal, head);
      const [tx, ty] = curve(signal, back);
      const gradient = ctx.createLinearGradient(tx, ty, hx, hy);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(0.55, palette.accent);
      gradient.addColorStop(1, palette.glint);
      ctx.beginPath();
      for (let s = 0; s <= steps; s += 1) {
        const [x, y] = curve(signal, back + ((head - back) * s) / steps);
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      if (head < 1) {
        ctx.globalAlpha = clamp(Math.min(head * 8, (1 - head) * 12), 0, 1);
        ctx.fillStyle = palette.glint;
        ctx.beginPath();
        ctx.arc(hx, hy, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
    if (markers) {
      const pulse = new Map<number, number>();
      pulsesRef.current.forEach((p) => {
        const t = (now - p.start) / 900;
        if (t >= 0 && t <= 1) pulse.set(p.point, Math.max(pulse.get(p.point) ?? 0, 1 - t));
      });
      scene.points.forEach((p, k) => {
        const energy = pulse.get(k) ?? 0;
        if (energy > 0) {
          const t = 1 - energy;
          ctx.globalAlpha = energy * 0.7;
          ctx.strokeStyle = palette.accent;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 + t * 14, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        const r = 2.6 + energy * 1.2 + (hovered === k ? 0.8 : 0);
        ctx.fillStyle = palette.ring;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = hovered === k ? palette.glint : palette.accent;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [curve, dotShape, hovered, markers, palette, scene]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !scene) return;
    const doc = root.ownerDocument;
    const viewport = doc.defaultView ?? window;
    let raf = 0;
    let last = 0;
    let visible = false;
    let ticking = false;
    const tick = (time: number) => {
      raf = 0;
      ticking = true;
      const dt = last ? Math.min(64, time - last) : 16;
      last = time;
      clockRef.current += dt;
      const now = clockRef.current;
      const { rate: frequency, autoplay: auto, ripple: rings } = settingsRef.current;
      if (auto && !reduced && now >= nextRef.current) {
        const gap = 1000 / clamp(finite(frequency, 1.2), 0.05, 12);
        nextRef.current = now + gap * (0.6 + Math.random() * 0.8);
        if (signalsRef.current.length < 10) {
          const pair = pick();
          if (pair) launch(pair[0], pair[1]);
        }
      }
      signalsRef.current = signalsRef.current.filter((signal) => {
        const t = (now - signal.start) / signal.duration;
        const lag = clamp(finite(settingsRef.current.trail, 0.32), 0.05, 0.9);
        if (!signal.arrived && t >= 1 - lag * 0.35) {
          signal.arrived = true;
          const at = scene.points[signal.b];
          if (at && rings) wavesRef.current.push({ x: at.x, y: at.y, start: now, scale: 1 });
          pulsesRef.current.push({ point: signal.b, start: now });
        }
        return now - signal.start < signal.duration + (settingsRef.current.trace ? TRACE_FADE : 0);
      });
      wavesRef.current = wavesRef.current.filter((wave) => now - wave.start < 1700);
      pulsesRef.current = pulsesRef.current.filter((p) => now - p.start < 900);
      render();
      const busy = signalsRef.current.length > 0 || wavesRef.current.length > 0 || pulsesRef.current.length > 0;
      ticking = false;
      if (visible && !doc.hidden && (busy || (auto && !reduced))) raf = viewport.requestAnimationFrame(tick);
    };
    const wake = () => {
      if (raf || ticking || !visible || doc.hidden) return;
      last = 0;
      raf = viewport.requestAnimationFrame(tick);
    };
    wakeRef.current = wake;
    const observer = new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      if (visible) wake();
    });
    observer.observe(root);
    const onVisibility = () => wake();
    doc.addEventListener("visibilitychange", onVisibility);
    render();
    return () => {
      wakeRef.current = () => {};
      observer.disconnect();
      doc.removeEventListener("visibilitychange", onVisibility);
      viewport.cancelAnimationFrame(raf);
    };
  }, [launch, pick, reduced, render, scene]);

  useEffect(() => {
    wakeRef.current();
  }, [autoplay, rate]);

  const nearest = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || !scene) return -1;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / Math.max(1, rect.width)) * scene.width;
    const y = ((clientY - rect.top) / Math.max(1, rect.height)) * scene.height;
    let best = -1;
    let distance = 16;
    scene.points.forEach((p, k) => {
      const d = Math.hypot(p.x - x, p.y - y);
      if (d < distance) {
        distance = d;
        best = k;
      }
    });
    return best;
  };

  const offsetX = scene ? (width - scene.width) / 2 : 0;
  const offsetY = scene ? (boxHeight - scene.height) / 2 : 0;
  const summary = `Map of ${list.length} locations: ${list.map((p) => p.label).join(", ")}`;

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={summary}
      className={cn("relative w-full select-none", className)}
      style={{ height: boxHeight || undefined, aspectRatio: boxHeight ? undefined : `${aspect}`, color: palette.text, fontFamily: SANS, ...style }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        onPointerMove={(event) => {
          if (!interactive) return;
          const k = nearest(event.clientX, event.clientY);
          if (k !== hovered) {
            setHovered(k);
            wakeRef.current();
          }
        }}
        onPointerLeave={() => setHovered(-1)}
        onClick={(event) => {
          if (!interactive) return;
          const k = nearest(event.clientX, event.clientY);
          if (k >= 0) burst(k);
        }}
        style={{
          position: "absolute",
          left: offsetX,
          top: offsetY,
          width: scene?.width ?? "100%",
          height: scene?.height ?? "100%",
          display: "block",
          cursor: interactive && hovered >= 0 ? "pointer" : undefined,
          touchAction: "manipulation",
        }}
      />
      {scene && labels !== "none"
        ? list.map((p, k) => {
            const at = scene.points[k];
            if (!at) return null;
            const show = labels === "always" || hovered === k;
            const flip = at.x > scene.width * 0.72;
            return (
              <div
                key={p.id}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: offsetX + at.x + (flip ? -10 : 10),
                  top: offsetY + at.y,
                  transform: `translate(${flip ? "-100%" : "0"}, -50%) scale(${show ? 1 : 0.96})`,
                  transformOrigin: flip ? "100% 50%" : "0 50%",
                  opacity: show ? 1 : 0,
                  transition: "opacity 160ms ease, transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: 24,
                  padding: "0 9px",
                  boxSizing: "border-box",
                  borderRadius: 7,
                  background: palette.surface,
                  boxShadow: dark ? "0 6px 18px -8px rgba(0,0,0,0.7)" : "0 1px 2px rgba(0,0,0,0.06), 0 8px 20px -10px rgba(0,0,0,0.25)",
                  fontSize: 12,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  color: palette.text,
                }}
              >
                <span>{p.label}</span>
                {p.value ? <span style={{ color: palette.muted, fontVariantNumeric: "tabular-nums" }}>{p.value}</span> : null}
              </div>
            );
          })
        : null}
    </div>
  );
});

SignalMap.displayName = "SignalMap";

export { SignalMap };
export default SignalMap;
