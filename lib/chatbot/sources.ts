import pages from "./knowledge.json";
import practiceNotes from "./practice-notes.json";

const stop = new Set("the this with from about have your there what does that our how can are for you and which want need show help talkerstein".split(" "));
function words(text: string) {
  return new Set((text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(word => word.length > 2 && !stop.has(word)).map(word => word.replace(/s$/, "")));
}
const documents = pages.map(page => ({
  page, title: words(page.title + " " + page.url.split("/").pop()), body: words(page.text),
}));

export function selectPages(question: string) {
  const query = words(question);
  const weights = Array.from(query, word => ({
    word, weight: Math.log(1 + documents.length / (1 + documents.filter(doc => doc.body.has(word)).length)),
  }));
  const ranked = documents.map(doc => ({
    page: doc.page,
    score: weights.reduce((sum, {word, weight}) => sum + weight * (Number(doc.title.has(word)) * 5 + Number(doc.body.has(word))), 0),
  })).sort((a, b) => b.score - a.score);
  const relevant = ranked.filter(doc => doc.score > 0).slice(0, 5).map(doc => doc.page);
  return relevant.length ? relevant : pages.filter(page => ["/", "/services", "/our-process"].includes(new URL(page.url).pathname));
}

// Require a topic and a distinct contextual word, so a generic “CRM” or “email”
// cannot displace the specific answer. Keep operational notes separate from linkable pages.
export function selectPracticeNotes(question: string) {
  const tokens = new Set(question.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  return practiceNotes.map(note => {
    const topics = note.topic.filter(word => tokens.has(word));
    const context = note.context.filter(word => tokens.has(word));
    const matches = new Set([...topics, ...context]);
    const score = topics.length && context.length && matches.size > 1 ? matches.size : 0;
    return {note, score};
  }).filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2).map(({note}) => ({title: note.title, basis: note.basis, guidance: note.text}));
}
