/**
 * The tools we work in: the marks scattered over 06's "Make it easier to manage the business" card
 * (components/home/Interfaces.tsx) and then flown out and put into orbit in 07 · The Stack
 * (components/home/ToolOrbit.tsx).
 *
 * The files are written by `node scripts/gen-tool-icons.mjs` into public/tools/<slug>.svg. simple-icons has
 * dropped several large brands at their owners' request, so these are NOT in the set and have to be dropped into
 * public/tools/ by hand before they can be listed here: Adobe, Canva, ChatGPT/OpenAI and GoHighLevel. Adding one
 * is a file plus a line in this list.
 *
 * `at` is where the mark sits scattered on the card, in per-cent of the card's art window. The positions are
 * irregular on purpose — a grid would read as a logo wall rather than as a desk with everything on it.
 */
export type Tool = { slug: string; name: string; at: [number, number] };

export const TOOLS: Tool[] = [
  { slug: "google", name: "Google", at: [12, 22] },
  { slug: "googleads", name: "Google Ads", at: [31, 9] },
  { slug: "googleanalytics", name: "Google Analytics", at: [52, 19] },
  { slug: "meta", name: "Meta", at: [73, 10] },
  { slug: "mailchimp", name: "Mailchimp", at: [89, 26] },
  { slug: "hubspot", name: "HubSpot", at: [22, 46] },
  { slug: "shopify", name: "Shopify", at: [44, 38] },
  { slug: "wordpress", name: "WordPress", at: [64, 48] },
  { slug: "webflow", name: "Webflow", at: [84, 55] },
  { slug: "figma", name: "Figma", at: [9, 63] },
  { slug: "claude", name: "Claude", at: [36, 70] },
  { slug: "zapier", name: "Zapier", at: [57, 78] },
  { slug: "make", name: "Make", at: [76, 84] },
  { slug: "n8n", name: "n8n", at: [94, 72] },
  { slug: "notion", name: "Notion", at: [17, 86] },
  { slug: "stripe", name: "Stripe", at: [47, 93] },
  { slug: "semrush", name: "Semrush", at: [68, 28] },
  { slug: "airtable", name: "Airtable", at: [27, 60] },
];

export const toolSrc = (slug: string) => `/tools/${slug}.svg`;
