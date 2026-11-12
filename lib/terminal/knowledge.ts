/**
 * Server only (imported by app/api/terminal/route.ts, never by a client component).
 * Loads the Markdown knowledge base in research/canadian-sme-knowledge-base/, splits it into heading-sized passages and,
 * per question, picks the most relevant passages (BM25) plus the sources the model may cite. Only https links that appear
 * in the knowledge base can ever reach the visitor as a citation, so the model cannot invent a URL.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const KB_ROOT = path.join(process.cwd(), "research", "canadian-sme-knowledge-base");

export type KbSource = { url: string; title: string; publisher: string; about: string };
type Passage = { file: string; title: string; heading: string; text: string; tf: Map<string, number>; len: number };
type Kb = { passages: Passage[]; df: Map<string, number>; avgLen: number; sources: Map<string, KbSource & { tf: Map<string, number> }> };

const STOP = new Set(("a an and are as at be but by can do does for from has have how i if in is it its my of on or our should so " +
  "that the their them there they this to was we what when where which who why will with you your me am any all also into than then " +
  "need want get").split(" "));
const words = (s: string) => (s.toLowerCase().normalize("NFKD").match(/[a-z0-9]{2,}/g) ?? []).filter((w) => !STOP.has(w));
const counts = (ws: string[]) => { const m = new Map<string, number>(); for (const w of ws) m.set(w, (m.get(w) ?? 0) + 1); return m; };

async function mdFiles(dir: string): Promise<string[]> {
  let entries;
  try { entries = await readdir(dir, { withFileTypes: true }); } catch { return []; }
  const out: string[] = [];
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await mdFiles(p));
    else if (e.name.endsWith(".md")) out.push(p);
  }
  return out.sort();
}

const MAX_PASSAGE = 3500;
const MD_LINK = /\[([^\]\n]{2,200})\]\((https:\/\/[^)\s]+)\)/g;
const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

async function load(): Promise<Kb> {
  const passages: Passage[] = [];
  const sources = new Map<string, KbSource & { tf: Map<string, number> }>();
  const addSource = (url: string, title: string, publisher = "", about = "") => {
    const clean = url.replace(/[.,;]+$/, "");
    if (!/^https:\/\/[^\s…]+$/.test(clean) || !hostOf(clean)) return;   // placeholders ("https://…") and broken URLs never become citations
    const prev = sources.get(clean);
    if (prev && (prev.publisher || !publisher)) return;   // the source register (which names the publisher) wins over a bare inline link
    const s = { url: clean, title: title.trim() || hostOf(clean), publisher: publisher.trim() || hostOf(clean), about: about.trim() };
    sources.set(clean, { ...s, tf: counts(words(`${s.title} ${s.publisher} ${s.about}`)) });
  };

  for (const file of await mdFiles(KB_ROOT)) {
    const rel = path.relative(KB_ROOT, file).replace(/\\/g, "/");
    if (rel === "README.md") continue;   // the index describes the folder (with example links); it isn't reference material
    const raw = (await readFile(file, "utf8")).replace(/\r/g, "");
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "");   // YAML frontmatter is metadata, not content
    const title = body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? rel;

    // source register tables: | Title | Publisher | URL | … | (any column order; read by header names)
    const lines = body.split("\n");
    for (let i = 0; i < lines.length - 2; i++) {
      if (!/^\s*\|/.test(lines[i]) || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) continue;
      const head = lines[i].split("|").slice(1, -1).map((h) => h.trim().toLowerCase());
      const col = (k: string) => head.findIndex((h) => h.includes(k));
      const [ct, cp, cu, cf] = [col("title"), col("publisher"), col("url"), col("finding") >= 0 ? col("finding") : col("cover")];
      if (cu < 0) continue;
      for (let j = i + 2; j < lines.length && /^\s*\|/.test(lines[j]); j++) {
        const cells = lines[j].split("|").slice(1, -1).map((c) => c.trim());
        const url = (cells[cu] ?? "").match(/https:\/\/[^\s)>|]+/)?.[0];
        if (url) addSource(url, ct >= 0 ? cells[ct].replace(MD_LINK, "$1") : "", cp >= 0 ? cells[cp] : "", cf >= 0 ? cells[cf] : "");
      }
    }
    for (const m of body.matchAll(MD_LINK)) addSource(m[2], m[1]);

    // passages: one per ## / ### section, long sections split on paragraphs
    let heading = title, buf: string[] = [];
    const flush = () => {
      const text = buf.join("\n").trim(); buf = [];
      if (text.length < 40) return;
      const parts: string[] = [];
      if (text.length <= MAX_PASSAGE) parts.push(text);
      else { let cur = ""; for (const para of text.split(/\n{2,}/)) { if (cur && cur.length + para.length > MAX_PASSAGE) { parts.push(cur); cur = ""; } cur += (cur ? "\n\n" : "") + para; } if (cur) parts.push(cur); }
      for (const t of parts) { const ws = words(`${title} ${heading} ${t}`); passages.push({ file: rel, title, heading, text: t, tf: counts(ws), len: ws.length }); }
    };
    for (const line of lines) {
      const h = line.match(/^#{2,3}\s+(.+)$/);
      if (h) { flush(); heading = h[1].trim(); } else buf.push(line);
    }
    flush();
  }

  const df = new Map<string, number>();
  for (const p of passages) for (const w of p.tf.keys()) df.set(w, (df.get(w) ?? 0) + 1);
  const avgLen = passages.reduce((a, p) => a + p.len, 0) / Math.max(1, passages.length);
  return { passages, df, avgLen, sources };
}

// production: read once per server instance; development: re-read on every question so edits to the Markdown show at once
let cached: Promise<Kb> | null = null;
const kb = () => (process.env.NODE_ENV === "development" ? load() : (cached ??= load()));

function bm25(tf: Map<string, number>, len: number, q: Map<string, number>, df: Map<string, number>, n: number, avg: number) {
  let s = 0;
  for (const [w, qn] of q) {
    const f = tf.get(w); if (!f) continue;
    const idf = Math.log(1 + (n - (df.get(w) ?? 0) + 0.5) / ((df.get(w) ?? 0) + 0.5));
    s += qn * idf * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * len / (avg || 1)));
  }
  return s;
}

export type Retrieval = { context: string; sources: KbSource[]; passages: number; kbPassages: number };

/** The passages and citable sources for one question. `budget` caps the excerpt characters sent to the model. */
export async function retrieve(query: string, budget: number, maxSources = 15): Promise<Retrieval> {
  const { passages, df, avgLen, sources } = await kb();
  const q = counts(words(query));
  const ranked = passages
    .map((p) => ({ p, s: bm25(p.tf, p.len, q, df, passages.length, avgLen) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s);

  const picked: Passage[] = []; let used = 0;
  for (const { p } of ranked) {
    if (used + p.text.length > budget) continue;
    picked.push(p); used += p.text.length;
    if (used > budget * 0.95) break;
  }
  const context = picked.map((p) => `### ${p.title} › ${p.heading}  (file: ${p.file})\n${p.text}`).join("\n\n---\n\n");

  // citable sources: the ones the chosen passages link to first, then the register's best matches for the question
  const linked = new Set(picked.flatMap((p) => [...p.text.matchAll(MD_LINK)].map((m) => m[2].replace(/[.,;]+$/, ""))));
  const all = [...sources.values()];
  const docN = Math.max(1, all.length), sdf = new Map<string, number>();
  for (const s of all) for (const w of s.tf.keys()) sdf.set(w, (sdf.get(w) ?? 0) + 1);
  const scored = all
    .map((s) => ({ s, score: (linked.has(s.url) ? 100 : 0) + bm25(s.tf, 12, q, sdf, docN, 12) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSources)
    .map(({ s }) => ({ url: s.url, title: s.title, publisher: s.publisher, about: s.about }));

  return { context, sources: scored, passages: picked.length, kbPassages: passages.length };
}
