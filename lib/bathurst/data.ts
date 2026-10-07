// Single source of truth for the Bathurst landing page: the map engine and every section read from here.
// Bathurst clients come from TCG email (Paymo tasks, proposals, quotes). Results are only shown where
// talkerstein.com/work publishes them. `hidden` keeps a record in the data but off the page for now.

export type Industry = "food" | "health" | "retail" | "services" | "beauty" | "community" | "finance" | "professional" | "industrial";

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
  /** Position on the scroll route (1 = first project the path visits). Pins without it only show in the final overview. */
  stop?: number;
  /** Pin icon when the industry's own doesn't fit (a key of the engine's ICON set, e.g. "wheel"). */
  icon?: string;
  hidden?: string;
  /** Thumbnail for the map callout and sheet row, e.g. "/clients/bubbys.jpg". TODO(content): add storefront photos. */
  thumb?: string;
  /** Logo artwork for the spotlight's logo row, e.g. "/clients/bubbys-logo.svg". TODO(content): collect client logos. */
  logo?: string;
  /** The client's own website, for pins without a case study in client-content.ts (which carries its own `site`). */
  site?: string;
  /** A TCG Studios ad on YouTube (video id). Shown as the case study's media, in place of a website. */
  youtube?: string;
  /** The ad is vertical (a Short), so the embed is portrait. */
  short?: boolean;
  /** A published client quote. TODO(content): collect these; never write one on a client's behalf. */
  testimonial?: { quote: string; who: string };
};

/**
 * Industry colours: Google Maps' category hues (food orange-yellow, shopping blue, health red, personal care purple,
 * services teal, community green, finance slate, industry brown) shifted toward old printing inks so they sit with the
 * Sea Breeze paper and Steel Blue ink. Each carries the Sea Breeze glyph at ≥4:1. Brand orange stays the "selected" state,
 * which is why food is mustard rather than Google's orange.
 */
export const INDUSTRIES: Record<Industry, { name: string; chip: string; icon: string; color: string }> = {
  food: { name: "Food & restaurant", chip: "Restaurants", color: "#94690F", icon: '<path d="M7 3v7a2 2 0 002 2v9M11 3v7M7 7h4M16 21V3c2.5 1.5 3 4 3 7h-3"/>' },
  retail: { name: "Retail", chip: "Retail", color: "#2F5788", icon: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/>' },
  health: { name: "Health", chip: "Health", color: "#A23A33", icon: '<path d="M12 5v14M5 12h14"/>' },
  services: { name: "Personal services", chip: "Personal services", color: "#2C6E6B", icon: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 16L18 4M16 16L6 4"/>' },
  beauty: { name: "Beauty", chip: "Beauty", color: "#8E4A6B", icon: '<path d="M12 3c-3 4-5 6.5-5 9.5a5 5 0 0010 0C17 9.5 15 7 12 3z"/>' },
  community: { name: "Nonprofit", chip: "Nonprofits", color: "#56703F", icon: '<path d="M4 20V10l8-6 8 6v10M9 20v-6h6v6"/>' },
  finance: { name: "Finance", chip: "Finance", color: "#4B5E70", icon: '<path d="M4 20h16M6 17V10M10 17V10M14 17V10M18 17V10M3 9l9-5 9 5z"/>' },
  professional: { name: "Professional services", chip: "Professional", color: "#19254A", icon: '<path d="M4 8h16v11H4zM9 8V5h6v3"/>' },
  industrial: { name: "Industrial & trades", chip: "Industrial", color: "#6E4E33", icon: '<path d="M3 20V10l5 3V10l5 3V6h6v14z"/>' },
};

// Projects list (Sept 2026). Coordinates are approximate geocodes of the published address.
// TODO(content): services for the new projects; confirm addresses flagged in `note`.
export const CLIENTS: Client[] = [
  { id: "yjc", name: "Yorkville Jewish Centre", addr: "94 Avenue Rd, Toronto", lat: 43.6725, lon: -79.396, ind: "community", services: [], stop: 1 },
  { id: "fringe", name: "Fringe Boutique", addr: "87 Lynnhaven Rd", lat: 43.72322, lon: -79.43973, ind: "retail", services: ["Branding", "Shopify", "POS"], result: "3.1× online conversion", stop: 2 },
  { id: "hilys", name: "Hily's Sparkly Spa", addr: "207 Edgeley Blvd #5, Concord", lat: 43.7978, lon: -79.5325, ind: "beauty", services: [], stop: 3 },
  { id: "mes", name: "Maple Electric Supply", addr: "8520 Jane St Unit 5, Concord", lat: 43.8132, lon: -79.5294, ind: "retail", services: [], stop: 4 },
  { id: "royaldairy", name: "Royal Dairy Cafe & Catering", addr: "10 Disera Dr Unit 100, Thornhill", lat: 43.8112, lon: -79.4544, ind: "food", services: [], stop: 5 },
  { id: "kapara", name: "Kapara", addr: "7700 Bathurst St Unit 12, Thornhill", lat: 43.8052, lon: -79.4482, ind: "food", services: [], stop: 6 },
  { id: "hoh", name: "House of Hair Extensionz", addr: "7181 Yonge St #218, Thornhill", lat: 43.8032, lon: -79.4194, ind: "beauty", services: ["Branding", "Shopify", "AI photoshoot"], result: "2.3× sales growth", stop: 7 },
  // always pinned, off the scroll route
  { id: "uzbek", name: "Uzbek Delight", addr: "382 Enford Rd, Richmond Hill", lat: 43.89, lon: -79.4384, ind: "food", services: ["Website", "Branding", "Food truck", "POS"] },
  { id: "ar26", name: "AR26 / A&R Motors", addr: "1100 Finch Ave W Unit 6A, North York", lat: 43.7685, lon: -79.4733, ind: "professional", icon: "wheel", services: [] },
  { id: "familytree", name: "Family Tree Dispute Resolution", addr: "Toronto, ON", lat: 43.7280, lon: -79.4200, ind: "professional", services: [], note: "Address not publicly verified; placeholder. Confirm." },
  { id: "umc", name: "Unionville Music Competition", addr: "74 Starwood Rd, Thornhill", lat: 43.8451, lon: -79.4669, ind: "community", services: [] },
  { id: "morgan", name: "Morgan Property Law", addr: "1454 Dundas St E, Unit 112, Mississauga", lat: 43.6100, lon: -79.5814, ind: "professional", services: [] },
  { id: "amritsari", name: "Amritsari Chatore", addr: "5484 Tomken Rd Unit 1, Mississauga", lat: 43.6359, lon: -79.6451, ind: "food", services: ["Branding", "Print", "WordPress"], result: "3.4× local discovery" },
  // Added Oct 2026 (geocoded from the street address with OpenStreetMap Nominatim). TODO(content): services, photos and case studies.
  { id: "elis", name: "Eli's Barbershop", addr: "4128 Bathurst St, North York", lat: 43.74678, lon: -79.43666, ind: "professional", icon: "services", services: [], site: "https://elisbarbershop.com/" },
  { id: "bubbys", name: "Bubby's Bagels", addr: "3030 Bathurst St, Toronto", lat: 43.71817, lon: -79.42982, ind: "food", services: ["Website", "Branding"], site: "https://www.bubbysbagels.com/" },
  { id: "crema", name: "Crema Cafe", addr: "3032 Bathurst St, Toronto", lat: 43.71825, lon: -79.42972, ind: "food", services: [] },
  { id: "chocolatecharm", name: "Chocolate Charm", addr: "3541 Bathurst St, North York", lat: 43.73012, lon: -79.43191, ind: "food", services: [], site: "https://chocolatecharm.ca/" },
  { id: "amazingdonuts", name: "Amazing Donuts", addr: "3499 Bathurst St, North York", lat: 43.72880, lon: -79.43177, ind: "food", services: ["Website"], site: "https://amazing-donuts.vercel.app/" },
  { id: "spectank", name: "SpecTank", addr: "127 Dolomite Dr, North York", lat: 43.78017, lon: -79.47227, ind: "industrial", services: [], site: "https://www.spectank.com/" },
  { id: "bazwell", name: "Wheel Walkers", addr: "3995 Chesswood Dr, North York", lat: 43.75840, lon: -79.47557, ind: "health", services: [], site: "https://www.wheelwalkers.ca/" },
  { id: "paloma", name: "Paloma Blanca", addr: "77 Sheffield St, North York", lat: 43.70721, lon: -79.47088, ind: "retail", services: [] },
  { id: "beker", name: "Beker Fashions", addr: "87 Colville Rd, North York", lat: 43.70760, lon: -79.47073, ind: "retail", services: [] },
  { id: "iceacademy", name: "Canadian Ice Academy", addr: "3111 Universal Dr, Mississauga", lat: 43.62472, lon: -79.57229, ind: "professional", services: [] },
  { id: "carmel", name: "Carmel Transport", addr: "25 North Rivermede Rd Unit 18, Concord", lat: 43.82140, lon: -79.48440, ind: "industrial", services: [] },
  { id: "brickstone", name: "Brickstone Construction", addr: "358 Flint Rd, North York", lat: 43.77013, lon: -79.48004, ind: "industrial", services: ["Website"] },
  { id: "luminari", name: "Luminari Cleaning", addr: "4100 Chesswood Dr Unit 200, North York", lat: 43.75841, lon: -79.47818, ind: "professional", services: [], site: "https://luminari-nine.vercel.app/" },
  { id: "paulas", name: "Paula's Wig Boutique", addr: "800 Petrolia Rd Unit 17, North York", lat: 43.77945, lon: -79.48982, ind: "beauty", services: ["Branding"] },
  { id: "sams", name: "Sam's Menswear", addr: "318 Charlton Ave, Vaughan", lat: 43.79403, lon: -79.46067, ind: "professional", services: ["Branding"] },
  { id: "beithalochem", name: "Beit Halochem Canada", addr: "1600 Steeles Ave W Suite 219, Concord", lat: 43.78850, lon: -79.47470, ind: "community", services: ["Instagram"] },
  { id: "womb", name: "The WOMB Vaughan", addr: "545 North Rivermede Rd Unit 105, Vaughan", lat: 43.80688, lon: -79.48317, ind: "health", services: [], site: "https://www.thewomb.ca/vaughan/" },
  // J2J short film ads by TCG Studios (Oct 2026): the YouTube ad stands in for a website. Addresses and pins from each
  // Google Maps listing (Oct 6, 2026); Pest Control Plus lists no address on Google, so its office is geocoded with Nominatim.
  { id: "jacs", name: "JACS Toronto", addr: "3625 Dufferin St Ste 400, North York", lat: 43.73102, lon: -79.45815, ind: "health", services: ["Short film ad"], youtube: "jopHwP1tYjc" },
  { id: "chailifeline", name: "Chai Lifeline Canada", addr: "300 Wilson Ave, North York", lat: 43.73725, lon: -79.43559, ind: "community", services: ["Short film ad"], youtube: "tH_e1TS7n4g" },
  { id: "shaarezedek", name: "Canadian Shaare Zedek Hospital Foundation", addr: "620 Wilson Ave Unit 101, North York", lat: 43.73238, lon: -79.46017, ind: "community", services: ["Short film ad"], youtube: "xWTlPwweVpU" },
  { id: "wokandbowl", name: "Wok & Bowl", addr: "3022 Bathurst St, North York", lat: 43.71804, lon: -79.42967, ind: "food", services: ["Short film ad"], youtube: "8_04lNcGLfY" },
  { id: "pestcontrolplus", name: "Pest Control Plus", addr: "380 Four Valley Dr, Concord", lat: 43.81917, lon: -79.53543, ind: "professional", services: ["Short film ad"], youtube: "r-ia5CyqSMU" },
  // Chillie's picks up and drops off; Google shows a service-area pin with no street address
  { id: "chillies", name: "Chillie's Dry Cleaning", addr: "North York (pickup & drop-off)", lat: 43.76987, lon: -79.44200, ind: "professional", services: ["Short film ad"], youtube: "UdmW8WqYLns" },
];

/** Published projects with no mapped address. */
export const ELSEWHERE: Client[] = [
  { id: "shomrim", name: "Shomrim Toronto", addr: "Greater Toronto Area", ind: "community", services: [], site: "https://shomrimtoronto.org/" },
  { id: "hetz", name: "Hetz Electrical", addr: "Greater Toronto Area", ind: "industrial", services: [], site: "https://www.hetzelectrical.com/" },
  { id: "zmedicair", name: "ZMedicAir", addr: "Canada", ind: "health", services: [], site: "https://zmedicair.ca/" },
  { id: "cleverpays", name: "CleverPays", addr: "Laval, QC", ind: "finance", services: [], site: "https://cleverpays.ca/" },
  { id: "kidicare", name: "KidiCare / Inspera", addr: "Montreal, QC", ind: "retail", services: [], site: "https://kidicare.ca/" },
  { id: "esthersaadia", name: "Esther Saadia", addr: "Queens, NY", ind: "retail", services: ["Branding", "Shopify", "AI photoshoot"] },
  { id: "premierkosher", name: "Premier Kosher", addr: "1607 Abingdon Rd, West Lincoln, ON", ind: "food", services: ["Short film ad"], youtube: "hDyAwOqVCPw" },
  { id: "ralphwigs", name: "Ralph Wigs", addr: "Aventura, FL", ind: "beauty", services: ["Short film ad"], youtube: "whkye_cU5j8", short: true },
  // TODO(content): no public address found (or more than one business by that name); confirm, then remove `hidden`
  { id: "mondialpay", name: "MondialPay", addr: "Canada", ind: "finance", services: [], hidden: "Location and website to confirm" },
  { id: "ohr", name: "Ohr", addr: "Toronto", ind: "community", services: [], hidden: "Which Ohr organization (Ohr Somayach, Ohr HaEmet…)? Address to confirm" },
  { id: "beautique", name: "Beautique", addr: "Toronto", ind: "beauty", services: [], hidden: "Possibly Beautique Bar, 3430 Yonge St; confirm" },
  { id: "lumique", name: "Lumique", addr: "Toronto", ind: "beauty", services: [], hidden: "Business and address to confirm" },
];

/** Where the route begins and where it ends (the TCG office). */
export const ROUTE_START = { name: "Start", lat: 43.6725, lon: -79.3960 };   // Yorkville: the first stop (YJC)
export const OFFICE = { name: "Talkerstein Consulting Group", addr: "5050 Dufferin St, North York", lat: 43.7668, lon: -79.4706 };

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
export const SERVICES: { name: string; title: string; slug: string; icon: string; body: string; seen?: string; price?: string; image?: string;
  /** The route list: a short name, a one-line outcome, and the stage it belongs to (SERVICE_STAGES). */
  short: string; line: string; stage: "plan" | "build" | "run" }[] = [
  { name: "Consulting", title: "Business Consulting in Toronto", slug: "business-consulting", short: "Consulting", line: "Clear decisions at a turning point.", stage: "plan", icon: '<path d="M4 19h16M6 16V9M10 16V5M14 16v-6M18 16v-9"/>', body: "Clearer decisions for businesses at a turning point. We bring strategy, technology and commercial thinking together to identify what needs to change and what should come next." },
  { name: "Web Design & Development", title: "Web Design & Development in Toronto", slug: "web-design", short: "Web Design", line: "A website built around how you actually work.", stage: "build", icon: '<path d="M4 5h16v14H4zM4 9h16"/>', body: "Websites built around how your business actually works. From WordPress and Shopify to custom builds, we create digital experiences designed to earn attention and turn it into action.", seen: "Amazing Donuts, Dr. Michael Peskin, Bubby's Bagels" },
  { name: "SEO", title: "SEO for Toronto Businesses", slug: "seo", short: "SEO", line: "Get found by people already looking.", stage: "build", icon: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M8.5 11h5M11 8.5v5"/>', body: "Get found by the people already looking for what you do. We build search strategies around your services, market and customers, with technical SEO and useful content working together." },
  { name: "Branding", title: "Branding & Identity", slug: "branding", short: "Branding", line: "Look like the business you’ve become.", stage: "build", icon: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.4l6-.8z"/>', body: "A clearer expression of what your business is worth. We develop identities, messaging and digital systems that make businesses easier to recognise, understand and choose.", seen: "Bubby's Bagels, Paula's Wig Boutique, Sam's Menswear" },
  { name: "Automation", title: "Business Automation", slug: "automation", short: "Automation", line: "Less manual work, better-connected tools.", stage: "run", icon: '<path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M18 3v4h-4M6 21v-4h4"/>', body: "Less manual work. Better-connected systems. We map repetitive processes and connect the tools your business already uses to make everyday operations run more efficiently." },
  { name: "AI Implementation", title: "AI Implementation", slug: "ai", short: "AI Implementation", line: "Practical AI, built into the tools you use.", stage: "run", icon: '<path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M6 6h12v12H6z"/>', body: "Practical AI for real business problems. We identify where AI can save time, improve customer experiences and support your team, then build it into the systems you already use." },
  { name: "Diagnostics", title: "Digital & Business Diagnostics", slug: "diagnostics", short: "Diagnostics", line: "Find what’s really holding the business back.", stage: "plan", icon: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', body: "Before changing everything, find out what is actually getting in the way. We audit your website, brand, customer journey and digital infrastructure to identify the opportunities worth pursuing." },
  { name: "Workshops", title: "Workshops", slug: "workshops", short: "Workshops", line: "Sessions that end in decisions, not debate.", stage: "plan", icon: '<path d="M4 6h16v10H4zM9 20h6M12 16v4"/>', body: "Facilitated executive sessions that turn debate into decisions your team leaves the room with." },
];

/** "What Gets You There": the services as a three-stage route, each stage in the order a business usually takes it. */
export const SERVICE_STAGES: { key: "plan" | "build" | "run"; name: string; line: string; order: string[] }[] = [
  { key: "plan", name: "Plan", line: "Know what to fix first.", order: ["diagnostics", "business-consulting", "workshops"] },
  { key: "build", name: "Build", line: "Make it worth choosing.", order: ["web-design", "branding", "seo"] },
  { key: "run", name: "Run", line: "Keep it working without you.", order: ["automation", "ai"] },
];

export const STEPS = [
  { kind: "start", label: "Start", title: "Your business, as it runs today", body: "Traffic that browses and leaves, leads chased by memory, a CRM nobody trusts." },
  { kind: "turn", label: "Head into", title: "A Business Diagnostic", body: "One focused working session. We map where the business leaks time, money and momentum across website, follow-up, CRM, brand and AI." },
  { kind: "turn", label: "Turn onto", title: "A prioritized order of operations", body: "You leave knowing what to fix first and what can wait, whether or not you work with us next." },
  { kind: "turn", label: "Continue on", title: "One build, one team", body: "Brand, web, automation, CRM and AI under one roof, so the pieces work together instead of five vendors patching each other." },
  { kind: "turn", label: "Keep going", title: "We stay in the room", body: "Clear priorities, real accountability, steady execution. You stay in control." },
  { kind: "end", label: "Arrive", title: "Prospects become clients" },
] as const;

/** Bespoke Directions: the steps the map's nav dot drives through after the last client (turn = the maneuver arrow).
 * Each step is told as it happened for one client (`client`, a CLIENTS id): the dot drives the main roads to that client and the
 * card tells that step for them (`story`). TODO(content): confirm each story with the client team before launch; Sam's (branding)
 * AR26 (website and online presence), Beit Halochem (Instagram) and Brickstone (new website, in progress) match the records. */
export const DIRECTIONS: { turn: "straight" | "right" | "left" | "arrive"; title: string; body: string; est: string; client: string; story: string }[] = [
  { turn: "straight", title: "A Business Diagnostic", body: "We map where your business is losing time, money, and momentum across web, marketing, CRM, brand, and AI.", est: "1 week", client: "sams",
    story: "We started by mapping where Sam’s Menswear was losing ground: how the store looked, how customers found it, and where its brand was holding it back." },
  { turn: "straight", title: "A Clear Order of Operations", body: "Know what to fix first, what can wait, and what will move the business forward.", est: "1 week", client: "beithalochem",
    story: "For Beit Halochem Canada, Instagram came first: one clear channel that keeps the veterans’ stories in front of the community and the people who support them." },
  { turn: "left", title: "One Connected System", body: "Website, brand, marketing, CRM, automation, and AI built to work as one.", est: "4–8 weeks", client: "brickstone",
    story: "For Brickstone Construction we’re building a new website that brings their restoration services, past projects and free site-assessment bookings together in one place." },
  { turn: "arrive", title: "One Team From Start to Finish", body: "One accountable team keeps the work moving, the priorities clear, and the pieces connected.", est: "Ongoing", client: "ar26",
    story: "A&R Motors works with one team on its website and online presence, keeping the work moving and the priorities clear." },
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

/** The "What Our Partners Think" slider on talkerstein.com/our-process: each client's logo, their words, and their own video. */
export const TESTIMONIALS: { id: string; who: string; role: string; quote: string; logo: string; video: string; poster: string; tall?: boolean }[] = [
  {"id": "fringe", "who": "Tova, Toronto", "role": "Co-owner of FRINGE boutique", "quote": "They are highly supportive! I feel completely supported in every part of my marketing. They are a wonderful team of people each bring in their own talents and strengths. They are responsive and eager to please and it's been a pleasure working with them.", "logo": "/testimonials/fringe-logo.svg", "video": "/testimonials/fringe-video.mp4", "poster": "/testimonials/fringe-poster.jpg"},
  {"tall": true, "id": "mes", "who": "Gadi, Toronto", "role": "Founder of Maple Electric Supply", "quote": "They helped us grow our business by 200%. The key point is coming up with new strategies, new ways, and thinking outside the box when it comes to developing your business to increase your sales and your presence. There is no other team I would recommend working with more than the Talkerstein team.", "logo": "/testimonials/mes-logo.png", "video": "/testimonials/mes-video.mp4", "poster": "/testimonials/mes-poster.jpg"},
  {"id": "novarrisk", "who": "Mendel, Cayman Islands", "role": "Co-Owner of Nova Risk Transfer", "quote": "When it comes to creating, designing, implementing, and executing, and also someone who wasn't going to break the bank, and we found them to be exactly what we needed. They were extremely professional, highly affordable.", "logo": "/testimonials/novarrisk-logo.svg", "video": "/testimonials/novarrisk-video.mp4", "poster": "/testimonials/novarrisk-poster.jpg"},
  {"id": "gemini", "who": "Jaykee, Toronto", "role": "Owner, Gemini Printing", "quote": "They helped me with the website and obtaining the government grant that I was eligible for. Their attention to detail and response time was outstanding. Highly professional in their approach and in the execution of the work they did. I'm happy to recommend Talkerstein to anyone who is looking for website or creative services needed!", "logo": "/testimonials/gemini-logo.png", "video": "/testimonials/gemini-video.mp4", "poster": "/testimonials/gemini-poster.jpg"},
  {"tall": true, "id": "jrcc", "who": "Rabbi Shmuel Neft", "role": "Director, JRCC @ Rockford", "quote": "I am a proud Talkerstein Consulting customer and friend. Rishon is providing top level service, they are doing professional work and very in-tuned with the needs of their customers. They are visionaries and want to build businesses. I recommed using them and watch the magic happen!", "logo": "/testimonials/jrcc-logo.png", "video": "/testimonials/jrcc-video.mp4", "poster": "/testimonials/jrcc-poster.jpg"},
  {"tall": true, "id": "uzbek", "who": "Joseph, Toronto", "role": "Owner of Uzbek Delight", "quote": "Rishon and his team built us a beautiful website, brand design and food truck. The team went above and beyond building for us everything from nothing. I truly recommend them for everything from branding to implementing POS systems!", "logo": "/testimonials/uzbek-logo.webp", "video": "/testimonials/uzbek-video.mp4", "poster": "/testimonials/uzbek-poster.jpg"},
  {"id": "iconrocklear", "who": "Skaf, Quebec", "role": "Co-owner of Icon Rocklear", "quote": "C'est des gars qui savent ce qu'ils font. Il n'y a pas eu de problème, toujours courtois. Quand on a besoin d'eux pour ajouter, modifier ou enlever des choses sur notre site web, ils sont toujours présents.", "logo": "/testimonials/iconrocklear-logo.webp", "video": "/testimonials/iconrocklear-video.mp4", "poster": "/testimonials/iconrocklear-poster.jpg"}
];

/** Reels on @talkersteinconsulting, shown under the reviews as Instagram's own embeds (loaded lazily). */
export const REELS = ["DYI5BWehMep", "DZ_AYCLSBL2", "DVCq69sj_QD", "DVQyZAADmhB", "DU3p8OCj3ix"];
