// Services card images with Nano Banana Pro through the Higgsfield CLI: node scripts/gen-service-images.mjs [--variants=N] [slug ...]
// Reads the prompts from ../higgsfield-services-prompts.md (each "## N. Name — `slug`" section's quoted subject, plus the shared
// style block and negative prompt), runs `higgsfield generate create nano_banana_pro` (4:3, 2k) for each, and writes
// public/services/<slug>.jpg (1600×1200) and <slug>-sm.jpg (800×600). Needs the Higgsfield CLI, signed in (`higgsfield auth login`).
// --variants=N saves N takes per service as <slug>-v1.jpg, -v2 … (the first also becomes <slug>.jpg). About 2 credits per image.
import sharp from "sharp";
import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, copyFileSync } from "node:fs";

const args = process.argv.slice(2), only = args.filter((a) => !a.startsWith("--"));
const VARIANTS = Number((args.find((a) => a.startsWith("--variants=")) || "=1").split("=")[1]) || 1;
const md = readFileSync(new URL("../../higgsfield-services-prompts.md", import.meta.url), "utf8");
const quote = (heading) => { const i = md.indexOf(heading); return md.slice(i).match(/\n> ([^\n]+)/)[1].trim(); };
const STYLE = quote("## Style block"), NEGATIVE = quote("## Negative prompt");
const services = [...md.matchAll(/## \d+\. ([^—\n]+) — `([a-z-]+)`\n> ([^\n]+)/g)].map((m) => ({ name: m[1].trim(), slug: m[2], subject: m[3].trim() }))
  .filter((s) => !only.length || only.includes(s.slug));

// the CLI's own Node entry (the Windows .cmd shim would re-split a long prompt through the shell)
const HF_JS = process.env.HIGGSFIELD_JS || (process.platform === "win32"
  ? `${process.env.APPDATA}/npm/node_modules/@higgsfield/cli/bin/higgsfield.js` : null);
const hf = (argv) => new Promise((ok, no) => execFile(HF_JS ? process.execPath : "higgsfield", HF_JS ? [HF_JS, ...argv] : argv,
  { maxBuffer: 1 << 24, timeout: 15 * 60e3 }, (e, out, err) => (e ? no(new Error((err || e.message).slice(0, 400))) : ok(out))));
const urlsIn = (text) => [...new Set(text.match(/https?:\/\/[^\s"'\\]+\.(?:png|jpe?g|webp)(?:\?[^\s"'\\]*)?/gi) || [])];

mkdirSync("public/services", { recursive: true });
const jobs = services.flatMap((s) => Array.from({ length: VARIANTS }, (_, k) => ({ s, v: k + 1 })));
await Promise.all(jobs.map(async ({ s, v }) => {
  const prompt = `${s.subject} ${STYLE} Avoid: ${NEGATIVE}.`;
  try {
    const out = await hf(["generate", "create", "nano_banana_pro", "--prompt", prompt, "--aspect_ratio", "4:3", "--resolution", "2k", "--wait", "--wait-timeout", "12m", "--json"]);
    const url = urlsIn(out)[0]; if (!url) throw new Error("no image URL in: " + out.slice(0, 300));
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    const name = VARIANTS > 1 ? `${s.slug}-v${v}` : s.slug;
    await sharp(buf).resize(1600, 1200, { fit: "cover" }).jpeg({ quality: 84, mozjpeg: true }).toFile(`public/services/${name}.jpg`);
    await sharp(buf).resize(800, 600, { fit: "cover" }).jpeg({ quality: 82, mozjpeg: true }).toFile(`public/services/${name}-sm.jpg`);
    if (VARIANTS > 1 && v === 1) { copyFileSync(`public/services/${name}.jpg`, `public/services/${s.slug}.jpg`); copyFileSync(`public/services/${name}-sm.jpg`, `public/services/${s.slug}-sm.jpg`); }
    console.log("ok  ", s.slug, VARIANTS > 1 ? `v${v}` : "");
  } catch (e) { console.log("FAIL", s.slug, VARIANTS > 1 ? `v${v}` : "", e.message.split("\n")[0]); }
}));
