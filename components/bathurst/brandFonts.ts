import {
  Be_Vietnam_Pro, Bebas_Neue, Comfortaa, DM_Sans, Domine, Exo_2, Figtree, IBM_Plex_Sans, Inter, Karla, Libre_Baskerville, Libre_Bodoni,
  Libre_Franklin, Montserrat, Open_Sans, Playfair_Display, Raleway, Roboto, Source_Sans_3,
} from "next/font/google";

/* Our clients' own typefaces, read from their live sites, for the client-branded screens on the capability and showcase cards
   (CapDiagrams.tsx, ShowcaseDiagrams.tsx). None preload: a face downloads only when a screen on the page uses it.
   Stand-ins: Playfair Display for Chocolate Charm's licensed IvyPresto. */
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-playfair" });
const openSans = Open_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-opensans" });
const bodoni = Libre_Bodoni({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-bodoni" });
const raleway = Raleway({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-raleway" });
const figtree = Figtree({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-figtree" });
const baskerville = Libre_Baskerville({ subsets: ["latin"], weight: ["400", "700"], display: "swap", preload: false, variable: "--bf-baskerville" });
const franklin = Libre_Franklin({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-franklin" });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-dmsans" });
const comfortaa = Comfortaa({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-comfortaa" });
const bebas = Bebas_Neue({ subsets: ["latin"], weight: "400", display: "swap", preload: false, variable: "--bf-bebas" });
const roboto = Roboto({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-roboto" });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-montserrat" });
const vietnam = Be_Vietnam_Pro({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", preload: false, variable: "--bf-vietnam" });
const exo = Exo_2({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-exo" });
const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", preload: false, variable: "--bf-plex" });
const karla = Karla({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-karla" });
const inter = Inter({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-inter" });
const domine = Domine({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-domine" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], display: "swap", preload: false, variable: "--bf-source" });

/** every brand face's CSS variable, for the root of a branded screen */
export const BRAND_FONTS = [
  playfair, openSans, bodoni, raleway, figtree, baskerville, franklin, dmSans, comfortaa,
  bebas, roboto, montserrat, vietnam, exo, plex, karla, inter, domine, sourceSans,
].map((f) => f.variable).join(" ");
