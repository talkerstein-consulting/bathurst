// Single source of truth for the Bathurst landing page: the map engine and every section read from here.
// Bathurst clients come from TCG email (Paymo tasks, proposals, quotes). Results are only shown where
// talkerstein.com/work publishes them. `hidden` keeps a record in the data but off the page for now.

export type Industry = "food" | "health" | "retail" | "services";

export type Client = {
  id: string;
  name: string;
  addr: string;
  lat?: number;
  lon?: number;
  ind: Industry;
  services: string[];
  result?: string;
  note?: string;
  maybe?: boolean;
  group?: "thornhill" | "mississauga";
  hidden?: string;
  /** Thumbnail for the map callout and sheet row, e.g. "/clients/bubbys.jpg". TODO(content): add storefront photos. */
  thumb?: string;
  /** Logo artwork for the spotlight's logo row, e.g. "/clients/bubbys-logo.svg". TODO(content): collect client logos. */
  logo?: string;
  /** A published client quote. TODO(content): collect these; never write one on a client's behalf. */
  testimonial?: { quote: string; who: string };
};

export const INDUSTRIES: Record<Industry, { name: string; chip: string; icon: string }> = {
  food: { name: "Food & restaurant", chip: "Restaurants", icon: '<path d="M7 3v7a2 2 0 002 2v9M11 3v7M7 7h4M16 21V3c2.5 1.5 3 4 3 7h-3"/>' },
  retail: { name: "Retail & beauty", chip: "Retail & beauty", icon: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/>' },
  health: { name: "Health", chip: "Health", icon: '<path d="M12 5v14M5 12h14"/>' },
  services: { name: "Personal services", chip: "Personal services", icon: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 16L18 4M16 16L6 4"/>' },
};

export const CLIENTS: Client[] = [
  { id: "bubbys", name: "Bubby's Bagels", addr: "3035 Bathurst St", lat: 43.71833, lon: -79.4292, ind: "food", services: ["Rebrand", "Brand kit", "Tri-fold menu", "Website"] },
  { id: "peskin", name: "Dr. Michael Peskin", addr: "3178 Bathurst St", lat: 43.7225, lon: -79.43089, ind: "health", services: ["Brand identity", "Website", "Booking flow"] },
  { id: "paulas", name: "Paula's Wig Boutique", addr: "3405 Bathurst St", lat: 43.72678, lon: -79.43129, ind: "retail", services: ["Logo", "Labels", "Site care"], result: "2.6× consultation growth", note: "Listed as Miami, FL on /work; email places it at 3405 Bathurst. Confirm." },
  { id: "donuts", name: "Amazing Donuts", addr: "3499 Bathurst St", lat: 43.7288, lon: -79.43177, ind: "food", services: ["Ordering site", "Square checkout", "Delivery zones"] },
  { id: "fringe", name: "Fringe Boutique", addr: "87 Lynnhaven Rd", lat: 43.72322, lon: -79.43973, ind: "retail", services: ["Branding", "Shopify", "POS"], result: "3.1× online conversion", hidden: "87 Lynnhaven Rd, not on Bathurst" },
  { id: "elis", name: "Eli's Barbershop", addr: "4128 Bathurst St", lat: 43.74678, lon: -79.43666, ind: "services", services: ["Website"], maybe: true, note: "Paid engagement not yet confirmed." },
  { id: "sams", name: "Sam's Menswear", addr: "7241 Bathurst St, Thornhill", lat: 43.79896, lon: -79.44632, ind: "retail", services: ["Suit illustrations", "Photography"], group: "thornhill" },
];

/** Published projects with no Bathurst address. Hidden while the page focuses on Bathurst. */
export const ELSEWHERE: Client[] = [
  { id: "hoh", name: "House of Hair Extensionz", addr: "Thornhill, ON", ind: "retail", services: ["Branding", "Shopify", "AI photoshoot"], result: "2.3× sales growth", group: "thornhill", hidden: "No Bathurst address confirmed" },
  { id: "amritsari", name: "Amritsari Chatore", addr: "Mississauga, ON", ind: "food", services: ["Branding", "Print", "WordPress"], result: "3.4× local discovery", group: "mississauga", hidden: "Mississauga" },
];

export const GROUPS = {
  thornhill: { name: "Thornhill", lat: 43.79896, lon: -79.44632 },
  mississauga: { name: "Mississauga", lat: 43.589, lon: -79.644 },
};

/** Cross streets along Bathurst, south to north. The third field marks the highway. */
export const CROSS_STREETS: [name: string, lat: number, highway?: 1][] = [
  ["Eglinton Ave W", 43.7057],
  ["Lawrence Ave W", 43.7196],
  ["Wilson Ave", 43.734],
  ["Hwy 401", 43.7402, 1],
  ["Sheppard Ave W", 43.7545],
  ["Finch Ave W", 43.7765],
  ["Steeles Ave W", 43.7906],
  ["Centre St", 43.804],
];

export const visible = (list: Client[]) => list.filter((c) => !c.hidden);
export const onBathurst = visible(CLIENTS);

/** `price` is the published range per service. TODO(content): fill in real ranges; cards show a placeholder while unset. */
export const SERVICES: { name: string; icon: string; body: string; seen?: string; price?: string; image?: string }[] = [
  { name: "Consulting", icon: '<path d="M4 19h16M6 16V9M10 16V5M14 16v-6M18 16v-9"/>', body: "Business consulting for founders and leadership teams who need a clear plan and a partner who stays to execute it." },
  { name: "Business Diagnostics", icon: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', body: "A clear-eyed audit of where the business leaks time, money and momentum, with a prioritized fix list." },
  { name: "Workshops", icon: '<path d="M4 6h16v10H4zM9 20h6M12 16v4"/>', body: "Facilitated executive sessions that turn debate into decisions your team leaves the room with." },
  { name: "Branding & Creative", icon: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.4l6-.8z"/>', body: "Identity, print, menus, photography and AI photoshoots that make the business look as good as it is.", seen: "Bubby's Bagels, Paula's Wig Boutique, Sam's Menswear" },
  { name: "Web Development", icon: '<path d="M4 5h16v14H4zM4 9h16"/>', body: "WordPress, Shopify and custom builds, including online ordering, POS and booking flows.", seen: "Amazing Donuts, Dr. Michael Peskin, Bubby's Bagels" },
  { name: "Automation", icon: '<path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M18 3v4h-4M6 21v-4h4"/>', body: "CRM cleanup and follow-up flows, so response time stops depending on someone remembering." },
  { name: "AI Services", icon: '<path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M6 6h12v12H6z"/>', body: "AI connected to real workflows across sales, marketing, admin, reporting and service." },
];

export const STEPS = [
  { kind: "start", label: "Start", title: "Your business, as it runs today", body: "Traffic that browses and leaves, leads chased by memory, a CRM nobody trusts." },
  { kind: "turn", label: "Head into", title: "A Business Diagnostic", body: "One focused working session. We map where the business leaks time, money and momentum across website, follow-up, CRM, brand and AI." },
  { kind: "turn", label: "Turn onto", title: "A prioritized order of operations", body: "You leave knowing what to fix first and what can wait, whether or not you work with us next." },
  { kind: "turn", label: "Continue on", title: "One build, one team", body: "Brand, web, automation, CRM and AI under one roof, so the pieces work together instead of five vendors patching each other." },
  { kind: "turn", label: "Keep going", title: "We stay in the room", body: "Clear priorities, real accountability, steady execution. You stay in control." },
  { kind: "end", label: "Arrive", title: "Prospects become clients" },
] as const;

/** Bespoke Directions: the steps the map's nav dot drives through after the last client (turn = the maneuver arrow). */
export const DIRECTIONS: { turn: "straight" | "right" | "left" | "arrive"; title: string; body: string; est: string }[] = [
  { turn: "straight", title: "A Business Diagnostic", body: "We map where your business is losing time, money, and momentum across web, marketing, CRM, brand, and AI.", est: "1 week" },
  { turn: "straight", title: "A Clear Order of Operations", body: "Know what to fix first, what can wait, and what will move the business forward.", est: "1 week" },
  { turn: "left", title: "One Connected System", body: "Website, brand, marketing, CRM, automation, and AI built to work as one.", est: "4–8 weeks" },
  { turn: "arrive", title: "One Team From Start to Finish", body: "One accountable team keeps the work moving, the priorities clear, and the pieces connected.", est: "Ongoing" },
];

export const REVIEW = {
  quote:
    "We came for marketing and left with a system. Within months our website traffic was up 40%, social engagement climbed, and reservations actually started showing up. Nothing felt templated.",
  who: "Owner",
  org: "Israeli Street Food Restaurant",
  tags: ["SEO", "Social", "Web"],
  rating: 5.0,
  count: 7,
};

/** Google Business Profile rating, as talkerstein.com shows it (no review count published there). */
export const GOOGLE: { rating: number | null; count: number | null; url: string } = { rating: 4.9, count: null, url: "https://share.google/ys09a4729NPyQuGzg" };

/** Contact and profiles, from talkerstein.com's own footer. */
export const CONTACT = {
  email: "hi@talkerstein.ca", phone: "416-937-7676", tel: "tel:4169377676",
  address: "5050 Dufferin St., Toronto, ON M3H 5T5", map: "https://share.google/fjRHwYcuaFN7eQo3A",
  instagram: "https://www.instagram.com/talkersteinconsulting", facebook: "https://www.facebook.com/Talkersteinconsulting/",
  clutch: "https://clutch.co/profile/talkerstein-consulting",
};

export const LEAKS = ["Not sure yet", "Website conversion", "Follow-up system", "Brand trust", "CRM reality", "AI implementation"];

/** Ask the map (inside the hero) to fly to a client and open its card. */
export const openOnMap = (id: string) => window.dispatchEvent(new CustomEvent("tcg:open", { detail: { id } }));
