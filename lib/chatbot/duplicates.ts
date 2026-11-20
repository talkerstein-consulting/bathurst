type Turn = { role: "user" | "assistant"; content: string; paraphrases?: string[] };

function normalized(text: string) {
  return text.trim().normalize("NFKC").toLowerCase().replace(/[’‘]/g, "'")
    .replace(/^[¿¡]|[?.!]+$/g, "").replace(/\s+/g, " ").trim();
}

function questionKey(text: string) {
  return normalized(text)
    .replace(/\b(?:how (?:can|do|would|could|should) (?:i|we)|what(?:'s| is) the (?:best )?way to|can you (?:tell|show) me (?:how to )?|please)\b/g, " ")
    .replace(/\b(?:figure out|find out|determine|identify|track|tell|know|see|measure)\b/g, " check ")
    .replace(/\b(?:advertisements?|adverts?|ads)\b/g, " ad ")
    .replace(/\b(?:bring(?:ing)?(?: in)?|generat(?:e|es|ing)|driv(?:e|es|ing)|deliver(?:s|ing)?|attract(?:s|ing)?)\b/g, " deliver ")
    .replace(/\b(?:high[- ]quality|quality) leads?\b/g, " qualified leads ")
    .replace(/\b(?:which|what) (?:of (?:my|our|the) )?(?:ad|ads)\b/g, " ad ")
    .replace(/\b(?:my|our|the|are|a|an)\b/g, " ")
    .replace(/\s+/g, " ").trim();
}

function figures(value: string) {
  return value.match(/[-+]?\d+(?:[,.]\d+)*%?/g)?.join("|") ?? "";
}

export function sameQuestion(left: string, right: string) {
  if (!left.trim() || !right.trim()) return false;
  if (normalized(left) === normalized(right)) return true;
  const key = questionKey(left).replace(/^check /, "");
  return key.split(" ").length >= 3 && key === questionKey(right).replace(/^check /, "");
}

// Reuse completed, self-contained questions. Short contextual replies belong to the current turn.
export function answeredAt(question: string, history: readonly Turn[]): number {
  const exact = normalized(question);
  if (/^(yes|no|ok|okay|sure|please do|go ahead|tell me more|why|how)$/.test(exact)) return -1;
  const contextual = /\b(it|that|those|them|this|these|instead|now|again|there|above)\b/i.test(exact)
    || exact.split(" ").length < 3;
  for (let i = history.length - 1; i > 0; i--) {
    const answer = history[i], original = history[i - 1];
    if (answer.role !== "assistant" || original.role !== "user") continue;
    if (contextual && i !== history.length - 1) return -1;
    if (figures(question) !== figures(original.content)) continue;
    if ([original.content, ...(answer.paraphrases ?? [])].some(value => sameQuestion(question, value))) return i;
  }
  return -1;
}
