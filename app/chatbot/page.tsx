import Prototype from "@/components/Prototype";

export const metadata = {
  title: "Ask Talkerstein | Better Business Systems",
  description: "Ask about marketing, websites and automation. Find practical answers and examples from Talkerstein’s published work.",
  alternates: { canonical: "/chatbot" },
};

/**
 * The chatbot prototype (04 SEAN / 304), mounted on its own route so the Bathurst
 * homepage at app/page.tsx is untouched. The live client map it embeds is /map.
 */
export default function ChatbotPrototype() {
  return <Prototype />;
}
