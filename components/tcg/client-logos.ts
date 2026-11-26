/**
 * The client logos, taken from the map's own client list.
 *
 * One row per client in CLIENTS (lib/bathurst/data.ts) that has artwork in
 * public/clients/<id>/logo.*, in the order the map lists them — so a client added to
 * the map, with a logo dropped in its folder, turns up here by being added to this
 * list, and the names are the names the map already uses.
 *
 * FLAGGED, D00.3: this is a hand-kept mirror of two things the build cannot read at
 * once — a TypeScript array and a public/ folder. It is regenerated, not edited by
 * guesswork: every id below is a CLIENTS id and every path is a file that exists.
 *
 * zmedicair is left out on purpose: its only artwork is a .ico favicon, which is not a
 * logo. It joins the row when a real file is added to its folder.
 */
/** `ground: true` marks a file that still carries its own background. They are given a
 *  rounded corner so the tile reads as a plate the logo is printed on. */
export type ClientLogo = { src: string; alt: string; w: number; h: number; ground?: true };

/** `w`/`h` are each file's own pixel size, carried so the row can reserve the mark's
 *  width before the file arrives — without them every logo is zero-wide until it loads,
 *  the row re-measures on each one, and the loop never settles.
 *
 *  THREE KINDS OF FILE, best first:
 *   - `logo-full.*` is the client's REAL logo, taken from their own live website rather
 *     than from the square site icon that was here before. Eight of them so far.
 *   - `logo-cut.png` is a knockout made from the file already in the repo: its ground
 *     flood-filled from the edges and the artwork trimmed to its ink. Eli's Barbershop
 *     is a special case — the only mark they publish is white, so it is recoloured to
 *     Steel Blue rather than left invisible on this page's pale paper.
 *   - `logo.*` is the original, used where neither of the above could be made.
 *
 *  CleverPays is deliberately NOT in this row. The others are businesses TCG built
 *  something for; it is a payments provider, and a reader scanning the row for "people
 *  like me" reads it as a partner badge instead.
 *
 *  FLAGGED: four still carry a dark ground and show as a rounded tile — amritsari,
 *  esthersaadia, royaldairy, spectank, uzbek. SpecTank's field is not one flat colour, so
 *  no key or fill takes it cleanly — it was tried and taken back out. And most of the rest are still the client's square
 *  site icon, not a wordmark: those businesses publish no logo file anywhere I could
 *  reach, so the artwork has to come from the client.
 */
export const CLIENT_LOGOS: ClientLogo[] = [
  { src: "/clients/yjc/logo.png", alt: "Yorkville Jewish Centre", w: 192, h: 192 },
  { src: "/clients/hilys/logo.webp", alt: "Hily's Sparkly Spa", w: 512, h: 512 },
  { src: "/clients/royaldairy/logo.png", alt: "Royal Dairy Cafe & Catering", w: 192, h: 192, ground: true },
  { src: "/clients/kapara/logo.svg", alt: "Kapara", w: 64, h: 64 },
  { src: "/clients/hoh/logo.png", alt: "House of Hair Extensionz", w: 300, h: 199 },
  { src: "/clients/uzbek/logo.jpg", alt: "Uzbek Delight", w: 300, h: 300, ground: true },
  { src: "/clients/ar26/logo.webp", alt: "AR26 / A&R Motors", w: 300, h: 300 },
  { src: "/clients/familytree/logo.png", alt: "Family Tree Dispute Resolution", w: 350, h: 369 },
  { src: "/clients/umc/logo.png", alt: "Unionville Music Competition", w: 200, h: 200 },
  { src: "/clients/morgan/logo-cut.png", alt: "Morgan Property Law", w: 146, h: 49 },
  { src: "/clients/amritsari/logo.jpg", alt: "Amritsari Chatore", w: 417, h: 407, ground: true },
  { src: "/clients/elis/logo-cut.png", alt: "Eli's Barbershop", w: 752, h: 363 },
  { src: "/clients/bubbys/logo.png", alt: "Bubby's Bagels", w: 1080, h: 1080 },
  { src: "/clients/crema/logo-cut.png", alt: "Crema Cafe", w: 150, h: 150 },
  { src: "/clients/chocolatecharm/logo-full.png", alt: "Chocolate Charm", w: 1383, h: 126 },
  { src: "/clients/amazingdonuts/logo-full.svg", alt: "Amazing Donuts", w: 1388, h: 150 },
  { src: "/clients/spectank/logo.webp", alt: "SpecTank", w: 266, h: 128, ground: true },
  { src: "/clients/bazwell/logo-full.png", alt: "Wheel Walkers", w: 796, h: 168 },
  { src: "/clients/paloma/logo.png", alt: "Paloma Blanca", w: 256, h: 256 },
  { src: "/clients/beker/logo-cut.png", alt: "Beker Fashions", w: 62, h: 128 },
  { src: "/clients/iceacademy/logo-cut.png", alt: "Canadian Ice Academy", w: 152, h: 152 },
  { src: "/clients/carmel/logo-cut.png", alt: "Carmel Transport", w: 601, h: 596 },
  { src: "/clients/brickstone/logo.png", alt: "Brickstone Construction", w: 192, h: 192 },
  { src: "/clients/luminari/logo.svg", alt: "Luminari Cleaning", w: 100, h: 100 },
  { src: "/clients/paulas/logo.webp", alt: "Paula's Wig Boutique", w: 300, h: 300 },
  { src: "/clients/sams/logo.svg", alt: "Sam's Menswear", w: 415, h: 415 },
  { src: "/clients/beithalochem/logo.png", alt: "Beit Halochem Canada", w: 100, h: 100 },
  { src: "/clients/womb/logo-full.png", alt: "The WOMB Vaughan", w: 962, h: 277 },
  { src: "/clients/jacs/logo.png", alt: "JACS Toronto", w: 200, h: 200 },
  { src: "/clients/chailifeline/logo-cut.png", alt: "Chai Lifeline Canada", w: 200, h: 197 },
  { src: "/clients/shaarezedek/logo.png", alt: "Canadian Shaare Zedek Hospital Foundation", w: 200, h: 200 },
  { src: "/clients/wokandbowl/logo-cut.png", alt: "Wok & Bowl", w: 146, h: 150 },
  { src: "/clients/pestcontrolplus/logo-cut.png", alt: "Pest Control Plus", w: 66, h: 67 },
  { src: "/clients/kidicare/logo-full.png", alt: "KidiCare", w: 800, h: 162 },
  { src: "/clients/esthersaadia/logo.png", alt: "Esther Saadia", w: 256, h: 256, ground: true },
  { src: "/clients/premierkosher/logo.svg", alt: "Premier Kosher", w: 221, h: 154 },
  { src: "/clients/ralphwigs/logo-cut.png", alt: "Ralph Wigs", w: 150, h: 150 },
  { src: "/clients/shomrim/logo.png", alt: "Shomrim Toronto", w: 237, h: 256 },
  { src: "/clients/hetz/logo-full.png", alt: "Hetz Electrical", w: 1056, h: 484 },
];
