const fringe = { title: "Fringe Boutique", url: "https://talkerstein.com/work/fringe-boutique" };
const crm = { title: "CRM automation", url: "https://talkerstein.com/services/crm-automation" };
const ads = { title: "Paid advertising", url: "https://talkerstein.com/services/paid-ads" };

export const previewQuestion = "What did Talkerstein build for Fringe Boutique?";

export function previewAnswer(question: string) {
  if (/inventory|stock|point of sale/i.test(question)) {
    return {
      answer: "Start with one product that you sell both online and in the shop. Record its stock count, ring up an in-store sale, then check what the website shows.\n\nIf the numbers disagree, you’ve found a specific handoff to investigate. That’s a more useful starting point than replacing the whole store.",
      meetingBrief: "Discuss how to check stock counts across the shop and website using a single product.",
      sources: [fringe], followups: ["What did the Fringe Boutique project include?"],
    };
  }
  if (/fringe|shopify|boutique/i.test(question)) {
    return {
      answer: "Talkerstein helped Fringe Boutique bring its modest-fashion brand online. The project covered its visual identity, Shopify storefront and in-store point of sale.\n\nThe published case study reports a 3.1× increase in online conversion. You can open it below to see the work behind that result.",
      meetingBrief: "The visitor asked about the Fringe Boutique Shopify and point-of-sale project.",
      sources: [fringe], followups: ["How can I check whether my shop inventory is in sync?"],
    };
  }
  if (/ad spend|ads|campaign|paid|lead/i.test(question)) {
    return {
      answer: "Pick one campaign and follow its leads past the form submission. In your CRM, count how many became qualified opportunities. Divide the campaign spend by that number.\n\nThat gives you a cost per qualified lead you can compare across campaigns. Use the same date range and qualification rule for each one.",
      meetingBrief: "Explore how to trace a campaign lead through the CRM and measure cost per qualified lead.",
      sources: [ads, crm], followups: ["How should I track follow-up in my CRM?"],
    };
  }
  if (/crm|follow.up|quote/i.test(question)) {
    return {
      answer: "Give each open quote an owner, a sent date and a next follow-up date. Then build one CRM view for quotes whose next follow-up is due.\n\nStart with a reminder for the owner. Once the timing and wording work for your team, you can decide which reminders to automate.",
      meetingBrief: "Discuss how quote ownership and reminders could support follow-up.",
      sources: [crm], followups: ["How do I connect my ad spend to qualified leads?"],
    };
  }
  return {
    answer: "This design preview has sample conversations about Fringe Boutique, ad campaigns and quote follow-up. Try one of those topics to see a full answer.",
    meetingBrief: "",
      sources: [], followups: [previewQuestion],
  };
}
