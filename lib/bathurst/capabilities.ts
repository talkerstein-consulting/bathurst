/** "What we can do": six capability areas, each a card in the Services slider (components/bathurst/Services.tsx). */
export type Capability = { id: string; title: string; line: string; items: string[] };

export const CAPABILITIES: Capability[] = [
  {
    id: "conversion",
    title: "Revenue growth and conversion",
    line: "Help businesses turn more visitors into paying customers.",
    items: [
      "Conversion rate optimization (CRO)", "Landing page design and development", "Product page optimization", "Cart and checkout improvements",
      "A/B testing and experimentation", "Promotional campaign pages", "Upsell and cross-sell systems", "Mobile shopping experience improvements",
    ],
  },
  {
    id: "retention",
    title: "Customer acquisition and retention",
    line: "Build a more predictable system for attracting and bringing customers back.",
    items: [
      "Email marketing campaigns", "Automated welcome sequences", "Abandoned cart recovery", "Post-purchase follow-ups",
      "Customer win-back campaigns", "Loyalty and referral programs", "Paid advertising creative", "Seasonal and promotional campaigns",
    ],
  },
  {
    id: "ecommerce",
    title: "E-commerce technology and development",
    line: "Keep the online store competitive, reliable, and easier to manage.",
    items: [
      "Shopify development and customization", "Custom storefront features", "Product catalog management", "Search and filtering improvements",
      "Inventory and order integrations", "Shipping and fulfillment integrations", "Subscription commerce", "Third-party app integrations",
    ],
  },
  {
    id: "creative",
    title: "Brand and creative production",
    line: "Give businesses a consistent supply of high-quality marketing materials.",
    items: [
      "Product photography and AI-assisted imagery", "Campaign art direction", "Advertising creatives", "Social media content",
      "Promotional graphics", "Product launch campaigns", "Brand identity improvements", "Creative testing and iteration",
    ],
  },
  {
    id: "reporting",
    title: "Business intelligence and reporting",
    line: "Give owners a clearer picture of what's working and what needs attention.",
    items: [
      "Revenue and sales dashboards", "Marketing attribution", "Customer acquisition cost (CAC)", "Customer lifetime value (LTV)",
      "Product performance analysis", "Customer cohort analysis", "Campaign performance reporting", "Profitability and margin visibility",
    ],
  },
  {
    id: "automation",
    title: "AI and business automation",
    line: "Reduce repetitive work and connect disconnected business systems.",
    items: [
      "AI customer support assistants", "Automated inquiry handling", "CRM and lead management", "Order processing automation",
      "Internal knowledge bases", "AI product descriptions", "Workflow automation", "Custom AI agents and integrations",
    ],
  },
];
