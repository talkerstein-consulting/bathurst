/** Twelve builds we can show, in three collections of four (components/bathurst/Showcase.tsx): Win, Run and Automate.
 *  Each collection is its own short row, so no row becomes a long sideways scroll. Each build is pictured as a screen drawn
 *  in a different 2026 client's branding, and clicking a card opens a modal that explains it. */
export type ShowcaseModule = {
  id: string; title: string; line: string; who: string[];
  /** whose branding the drawn screen wears (components/bathurst/ShowcaseDiagrams.tsx): a 2026 client project */
  client: string; clientName: string;
  /** a real screen of this feature from that client's live build (public/showcase/<id>.webp, scripts/snap-showcase.mjs) */
  shot?: boolean;
  /** a phone recording of the live build being operated (public/showcase/<id>.mp4/.webm, scripts/record-showcase.mjs) */
  video?: boolean;
  /** the modal: a fuller explanation and what the build does */
  detail: string; points: string[];
};
export type ShowcaseCollection = { id: string; title: string; line: string; modules: ShowcaseModule[] };

export const SHOWCASE: ShowcaseCollection[] = [
  {
    id: "win",
    title: "Win more business",
    line: "Tools that turn a visit into a booking, a quote or a lead.",
    modules: [
      { id: "booking", title: "Online booking system", line: "Customers pick a service, a staff member and an open time, and book it themselves.", who: ["Clinics", "Professional services", "Hospitality"],
        client: "hilys", clientName: "Hily's Sparkly Spa", shot: true,
        detail: "Every phone call to set an appointment is time you're not billing. Online booking puts your real availability on your site, so customers choose a service and a time that suits them, day or night, and you wake up to a full calendar instead of voicemails.",
        points: ["Live availability from your calendar, so nothing double-books", "Services, staff and durations set the way you work", "Confirmations and reminders by email or text to cut no-shows", "Deposits or prepayment taken at booking when you need them"] },
      { id: "quote", title: "Instant quote calculator", line: "Customers enter what they need and get a preliminary estimate on the spot.", who: ["Construction", "Manufacturing", "Home services"],
        client: "amazingdonuts", clientName: "Amazing Donuts", shot: true,
        detail: "Most people won't call for a price, but they will answer a few questions. A quote calculator walks them through what they need and gives a realistic range on the spot, and you get a qualified lead with the details already filled in.",
        points: ["A step-by-step questionnaire in your customers' words", "Price ranges from your own rates and rules", "Every answer saved with the lead, so the follow-up call starts informed", "A clear next step: book a visit, request a firm quote or buy"] },
      { id: "configurator", title: "Interactive product configurator", line: "Customers choose options and specifications and see the price update as they go.", who: ["Manufacturing", "Retail", "eCommerce"],
        client: "sams", clientName: "Sam's Menswear", video: true,
        detail: "When a product comes in options, customers want to see their version before they commit. A configurator lets them build it step by step, with the price updating as they go, then order it or send it to you for a quote.",
        points: ["Options, sizes and add-ons as simple choices", "Price that updates with every change", "Rules that stop combinations you can't make", "Straight to checkout, or sent to you as a detailed request"] },
      { id: "assistant", title: "AI business assistant", line: "Answers customer questions, qualifies inquiries, recommends services and captures the lead.", who: ["All industries"],
        client: "hetz", clientName: "Hetz Electrical",
        detail: "Visitors leave when they can't get an answer. An assistant trained on your services, prices and policies answers them at any hour, asks the questions you would ask, and passes you the serious inquiries with their details.",
        points: ["Answers from your own content, not the open internet", "Asks qualifying questions before handing off", "Captures name, contact and need into your CRM or inbox", "Hands over to a person whenever it should"] },
    ],
  },
  {
    id: "run",
    title: "Run your business",
    line: "Systems that take the admin off your plate.",
    modules: [
      { id: "portal", title: "Customer portal", line: "Customers see project updates, documents, invoices and requests in one login.", who: ["Agencies", "Construction", "Professional services"],
        client: "hilys", clientName: "Hily's Sparkly Spa", shot: true,
        detail: "\"Any update?\" emails add up. A customer portal gives each client one place to see where their work stands, download documents, pay invoices and send requests, so your team answers fewer status questions.",
        points: ["A private login for each customer", "Status, milestones and next steps in plain language", "Documents and invoices in one place, with online payment", "Requests that reach the right person, with a record"] },
      { id: "inventory", title: "Inventory management", line: "Track stock and variants across locations, with alerts before you run low.", who: ["Retail", "Wholesale", "Manufacturing"],
        client: "kidicare", clientName: "KidiCare",
        detail: "Spreadsheets drift from what's on the shelf. Inventory management keeps stock counts current across locations and your online store, so you stop overselling, stop over-ordering and know what to reorder before it runs out.",
        points: ["One count across store, warehouse and website", "Variants, bins and locations tracked", "Low-stock alerts and reorder suggestions", "Connected to your POS, eCommerce and accounting"] },
      { id: "field", title: "Field service management", line: "Schedule technicians, assign jobs and track each work order to completion.", who: ["Contractors", "Maintenance", "Home services"],
        client: "luminari", clientName: "Luminari Cleaning",
        detail: "When jobs live in texts and whiteboards, things get missed. Field service software puts every job on one schedule, sends crews where they need to be with the details they need, and records the work when it's done.",
        points: ["A dispatch board for the day and the week", "Job details, notes and photos on the crew's phone", "Status updates customers can see", "Completed work flows straight into invoicing"] },
      { id: "approvals", title: "Document and approval workflow", line: "Collect documents, route approvals, gather signatures and see where each one stands.", who: ["Professional services", "Construction", "Finance"],
        client: "hilys", clientName: "Hily's Sparkly Spa", shot: true,
        detail: "Chasing signatures and paperwork by email is slow and easy to lose track of. A workflow collects the documents, routes them to the right people in order, gathers e-signatures and shows exactly where each file is waiting.",
        points: ["Upload requests with checklists of what's needed", "Approvals routed in the right order", "E-signatures with an audit trail", "Reminders that chase so you don't have to"] },
    ],
  },
  {
    id: "automate",
    title: "Automate your business",
    line: "Follow-ups, updates and reports that run without you.",
    modules: [
      { id: "pipeline", title: "Sales pipeline dashboard", line: "Track every lead, follow-up and deal from first contact to signed.", who: ["B2B", "Real estate", "Professional services"],
        client: "cleverpays", clientName: "CleverPays",
        detail: "Leads tracked in your head or inbox go cold. A pipeline brings every inquiry from your site, phone and email into one board, shows what stage each is at, and reminds you who to follow up with today.",
        points: ["Every lead captured automatically from your site and forms", "Stages that match how you actually sell", "Follow-up reminders and tasks", "A clear view of what's likely to close this month"] },
      { id: "bi", title: "Business intelligence dashboard", line: "Sales, marketing, customer and operations data together in one view.", who: ["SMEs", "eCommerce", "Multi-location"],
        client: "amazingdonuts", clientName: "Amazing Donuts",
        detail: "Your numbers live in five different tools. A dashboard pulls sales, marketing, customer and operations data together and updates itself, so you can see what's working at a glance instead of building reports by hand.",
        points: ["Data from POS, eCommerce, ads and accounting in one view", "The few numbers that matter to you, up front", "Trends by product, location and channel", "Scheduled summaries to your inbox"] },
      { id: "tracking", title: "Order tracking system", line: "Customers follow their order from purchase through fulfilment to delivery.", who: ["eCommerce", "Wholesale", "Manufacturing"],
        client: "carmel", clientName: "Carmel Transport",
        detail: "\"Where's my order?\" is the question support hears most. Order tracking gives customers a page and automatic updates at every step, from order to production to delivery, so they stop needing to ask.",
        points: ["A branded tracking page for every order", "Automatic emails or texts at each stage", "Carrier tracking pulled in automatically", "Delays flagged to your team before the customer notices"] },
      { id: "journeys", title: "Automated customer journeys", line: "Follow-ups, reminders and campaigns that send themselves based on what customers do.", who: ["eCommerce", "B2B", "Professional services"],
        client: "hilys", clientName: "Hily's Sparkly Spa",
        detail: "The best time to follow up is when a customer just did something: booked, bought, went quiet. Automated journeys send the right message at that moment, every time, without anyone remembering to.",
        points: ["Triggers from bookings, purchases and inactivity", "Email and text sequences in your brand's voice", "Rebooking, review and win-back messages", "CASL-compliant consent and unsubscribe built in"] },
    ],
  },
];
