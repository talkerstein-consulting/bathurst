// Clear agency-pricing questions can use the booking flow without a model call.
// Ambiguous requests are interpreted in conversation by the server.
export function asksForPricing(question: string) {
  const text = question.toLowerCase().replace(/[’']/g, "").trim();
  if (/^(?:what(?:s| is) (?:the |your )?)?(?:pricing|price|prices|rates|fees|how much)[?!. ]*$/.test(text)) return true;
  if (/\bcost per (?:lead|click|acquisition|conversion)\b/.test(text) && !/\b(?:your fees|you charge)\b/.test(text)) return false;
  return [
    /\bhow much (?:is|for|to (?:build|design)) (?:a |an |your )?(?:new |custom )?(?:website|site|redesign|retainer|campaign|consultation)\b/,
    /\b(?:your|agency|talkersteins?|service|package|project|website|web design|retainer|consulting|hourly|monthly)\s+(?:prices?|pricing|fees?|rates?)\b/,
    /\b(?:your|a|the) (?:pricing plans?|rate card|price list|price range|ballpark (?:price|estimate|figure))\b/,
    /\b(?:pricing|prices?|fees?|rates?) (?:for|of) (?:your|a website|web design|a project|marketing services)\b/,
    /\bhow much (?:do|would|will|does) (?:you|your|talkerstein|it|a website|a site)\b.*\b(?:charge|cost|bill)\b/,
    /\b(?:what|how much) (?:do|would|will) you charge\b/,
    /\b(?:can i get|give me|send me|could i get|can you give me) (?:a |an )?(?:quote|estimate|ballpark)\b/,
  ].some(pattern => pattern.test(text));
}

export function pricingInvitation(previousBrief: string) {
  const topic = "Discuss project scope and pricing with Rishon.";
  return {
    answer: "Rishon can walk through pricing for your project on a free 30-minute call. Bring the main thing you want to change and what you already have in place so he can discuss the scope with you.",
    invite: true, sources: [], followups: [], paraphrases: [],
    meetingBrief: [topic, previousBrief.replace(topic, "").trim()].filter(Boolean).join(" ").slice(0, 600),
  };
}
