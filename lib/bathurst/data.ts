// Single source of truth for the Bathurst landing page: the map engine and every section read from here.
// Bathurst clients come from TCG email (Paymo tasks, proposals, quotes). Results are only shown where
// talkerstein.com/work publishes them. `hidden` keeps a record in the data but off the page for now.

export type Industry = "food" | "health" | "retail" | "services" | "beauty" | "community" | "finance" | "professional";

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
  retail: { name: "Retail", chip: "Retail", icon: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 016 0v2"/>' },
  health: { name: "Health", chip: "Health", icon: '<path d="M12 5v14M5 12h14"/>' },
  services: { name: "Personal services", chip: "Personal services", icon: '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8 16L18 4M16 16L6 4"/>' },
  beauty: { name: "Beauty", chip: "Beauty", icon: '<path d="M12 3c-3 4-5 6.5-5 9.5a5 5 0 0010 0C17 9.5 15 7 12 3z"/>' },
  community: { name: "Nonprofit", chip: "Nonprofits", icon: '<path d="M4 20V10l8-6 8 6v10M9 20v-6h6v6"/>' },
  finance: { name: "Finance", chip: "Finance", icon: '<path d="M4 20h16M6 17V10M10 17V10M14 17V10M18 17V10M3 9l9-5 9 5z"/>' },
  professional: { name: "Professional services", chip: "Professional", icon: '<path d="M4 8h16v11H4zM9 8V5h6v3"/>' },
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
  { id: "ar26", name: "AR26 / A&R Motors", addr: "1100 Finch Ave W Unit 6A, North York", lat: 43.7685, lon: -79.4733, ind: "services", services: [] },
  { id: "familytree", name: "Family Tree Dispute Resolution", addr: "Toronto, ON", lat: 43.7280, lon: -79.4200, ind: "professional", services: [], note: "Address not publicly verified; placeholder. Confirm." },
  { id: "umc", name: "Unionville Music Competition", addr: "74 Starwood Rd, Thornhill", lat: 43.8451, lon: -79.4669, ind: "community", services: [] },
  { id: "morgan", name: "Morgan Property Law", addr: "1454 Dundas St E, Unit 112, Mississauga", lat: 43.6100, lon: -79.5814, ind: "professional", services: [] },
  { id: "amritsari", name: "Amritsari Chatore", addr: "5484 Tomken Rd Unit 1, Mississauga", lat: 43.6359, lon: -79.6451, ind: "food", services: ["Branding", "Print", "WordPress"], result: "3.4× local discovery" },
];

/** Published projects with no mapped address. */
export const ELSEWHERE: Client[] = [];

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
export const SERVICES: { name: string; title: string; slug: string; icon: string; body: string; seen?: string; price?: string; image?: string }[] = [
  { name: "Consulting", title: "Business Consulting in Toronto", slug: "business-consulting", icon: '<path d="M4 19h16M6 16V9M10 16V5M14 16v-6M18 16v-9"/>', body: "Clearer decisions for businesses at a turning point. We bring strategy, technology and commercial thinking together to identify what needs to change and what should come next." },
  { name: "Web Design & Development", title: "Web Design & Development in Toronto", slug: "web-design", icon: '<path d="M4 5h16v14H4zM4 9h16"/>', body: "Websites built around how your business actually works. From WordPress and Shopify to custom builds, we create digital experiences designed to earn attention and turn it into action.", seen: "Amazing Donuts, Dr. Michael Peskin, Bubby's Bagels" },
  { name: "SEO", title: "SEO for Toronto Businesses", slug: "seo", icon: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M8.5 11h5M11 8.5v5"/>', body: "Get found by the people already looking for what you do. We build search strategies around your services, market and customers, with technical SEO and useful content working together." },
  { name: "Branding", title: "Branding & Identity", slug: "branding", icon: '<path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.4l6-.8z"/>', body: "A clearer expression of what your business is worth. We develop identities, messaging and digital systems that make businesses easier to recognise, understand and choose.", seen: "Bubby's Bagels, Paula's Wig Boutique, Sam's Menswear" },
  { name: "Automation", title: "Business Automation", slug: "automation", icon: '<path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3M18 3v4h-4M6 21v-4h4"/>', body: "Less manual work. Better-connected systems. We map repetitive processes and connect the tools your business already uses to make everyday operations run more efficiently." },
  { name: "AI Implementation", title: "AI Implementation", slug: "ai", icon: '<path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3M6 6h12v12H6z"/>', body: "Practical AI for real business problems. We identify where AI can save time, improve customer experiences and support your team, then build it into the systems you already use." },
  { name: "Diagnostics", title: "Digital & Business Diagnostics", slug: "diagnostics", icon: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>', body: "Before changing everything, find out what is actually getting in the way. We audit your website, brand, customer journey and digital infrastructure to identify the opportunities worth pursuing." },
  { name: "Workshops", title: "Workshops", slug: "workshops", icon: '<path d="M4 6h16v10H4zM9 20h6M12 16v4"/>', body: "Facilitated executive sessions that turn debate into decisions your team leaves the room with." },
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
