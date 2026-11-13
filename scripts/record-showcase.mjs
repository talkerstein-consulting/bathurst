// Showcase videos: a client's live build operated on a phone (iPhone 13 size), each tap shown with a ripple while the view
// zooms in on the tapped element. node scripts/record-showcase.mjs [id ...]
//   → public/showcase/<id>.mp4 (H.264) + <id>.webm + <id>-poster.webp, played in a phone frame on the showcase card.
// Needs ffmpeg on PATH. The page is operated for real (Playwright clicks); nothing is submitted.
import { chromium, devices } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";

const OUT = "public/showcase", TMP = "scripts/.rec";
const only = process.argv.slice(2);

// in-page helpers: smooth scroll, zoom on an element (transform on <body>), a tap ripple in a fixed layer above the page
const HELPERS = () => {
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647";
  document.documentElement.appendChild(layer);
  document.body.style.transition = "transform .75s cubic-bezier(.45,0,.2,1)";
  document.body.style.willChange = "transform";
  document.documentElement.style.overflowX = "hidden"; document.body.style.overflowX = "hidden";
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  window.__scroll = (y, ms = 900) => new Promise((done) => {
    const from = scrollY, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / ms); scrollTo(0, from + (y - from) * ease(k)); k < 1 ? requestAnimationFrame(step) : done(); };
    requestAnimationFrame(step);
  });
  window.__zoom = (el, s) => {
    if (!el || s === 1) { document.body.style.transform = ""; return; }
    const r = el.getBoundingClientRect();
    document.body.style.transformOrigin = `${r.left + scrollX + r.width / 2}px ${r.top + scrollY + r.height / 2}px`;
    document.body.style.transform = `scale(${s})`;
  };
  window.__ripple = (el) => {
    const r = el.getBoundingClientRect(), d = document.createElement("i");
    d.style.cssText = `position:absolute;left:${r.left + r.width / 2 - 22}px;top:${r.top + r.height / 2 - 22}px;width:44px;height:44px;border-radius:50%;
      background:rgba(255,255,255,.55);border:3px solid rgba(20,20,30,.55);box-shadow:0 4px 14px rgba(0,0,0,.25);transform:scale(.4);opacity:0;
      transition:transform .35s ease, opacity .35s ease`;
    layer.appendChild(d);
    requestAnimationFrame(() => { d.style.transform = "scale(1)"; d.style.opacity = "1"; });
    setTimeout(() => { d.style.transform = "scale(1.6)"; d.style.opacity = "0"; }, 520);
    setTimeout(() => d.remove(), 1000);
  };
};

/** scroll so the element sits at `at` (0 top .. 1 bottom) of the screen */
const scrollToEl = (page, loc, at = 0.4, ms = 900) => loc.evaluate((el, [a, m]) => window.__scroll(el.getBoundingClientRect().top + scrollY - innerHeight * a + el.getBoundingClientRect().height / 2, m), [at, ms]);
/** zoom in on the element, tap it (ripple + real click), hold, zoom back out */
async function tap(page, loc, { zoom = 2, hold = 900 } = {}) {
  if (process.env.REC_DEBUG) console.log("  tap", String(loc));
  await loc.evaluate((el, s) => window.__zoom(el, s), zoom); await page.waitForTimeout(850);
  await loc.evaluate((el) => window.__ripple(el)); await page.waitForTimeout(180);
  await loc.click({ force: true }); await page.waitForTimeout(hold);
  await page.evaluate(() => { window.__zoom(null, 1); scrollTo(0, scrollY); }); await page.waitForTimeout(800);
}

const SCRIPTS = {
  /** Sam's Menswear: the 3D suit builder (the local sams-menswear repo, /suit-builder; run `npx astro dev --port 4321` there).
   *  On a phone: the jacket front and lapel, the cloth and its stripe, the tie, while the 3D suit follows */
  configurator: {
    url: process.env.SAMS_BUILDER || "http://127.0.0.1:4321/suit-builder",
    async run(page) {
      const app = page.locator('[aria-label="Custom suit builder in 3D"]');
      // wait out the loader ("Cutting the cloth…") and the first model
      await page.waitForFunction(() => document.querySelector("[data-loading]")?.hidden === true, null, { timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(1500);
      const head = await page.evaluate(() => document.querySelector("header")?.getBoundingClientRect().height || 72);
      const showSuit = async (h = 1300) => { await app.evaluate((el, hh) => window.__scroll(el.getBoundingClientRect().top + scrollY - hh - 8, 700), head); await page.waitForTimeout(h); };
      // buttons matched by their text with spacing, case and punctuation ignored ("D.B. Breasted" over two lines)
      const choice = (name, group) => (group ? page.locator(`[aria-label="${group}"] button`) : app.locator("button"))
        .filter({ hasText: new RegExp(name.split("").filter((c) => /[a-z0-9]/i.test(c)).join("[^a-z0-9]*"), "i") }).first();
      const next = app.getByRole("button", { name: /^next/i }).first();
      /** Next until the choice shows on the current step */
      const reach = async (loc) => { for (let i = 0; i < 6 && !(await loc.isVisible()); i++) { await tap(page, next, { zoom: 1.35, hold: 500 }); } };
      await showSuit(1800);
      await tap(page, choice("D.B. breasted"), { hold: 700 });
      await showSuit(1200);
      await tap(page, choice("Notch"), { hold: 700 });
      await showSuit(1400);
      const charcoal = choice("Charcoal", "Cloth colour");
      await reach(charcoal); await showSuit(600);
      await tap(page, charcoal, { hold: 700 });
      await showSuit(1300);
      const chalk = choice("Chalk stripe", "Weave and pattern");
      await reach(chalk);
      await tap(page, chalk, { hold: 700 });
      await showSuit(1400);
      const silver = choice("Silver", "Tie colour");
      await reach(silver);
      await tap(page, silver, { hold: 700 });
      await showSuit(2600);
    },
  },
  /** Carmel Transport: the container/booking tracker. Tap the field, enter the booking number, search */
  tracking: {
    url: "https://carmeltransport.com/booking-search/",
    async run(page) {
      const field = page.getByPlaceholder(/booking number/i).first();
      await scrollToEl(page, field, 0.5, 700); await page.waitForTimeout(1200);
      await field.evaluate((el) => window.__zoom(el, 2.1)); await page.waitForTimeout(850);
      await field.evaluate((el) => window.__ripple(el)); await page.waitForTimeout(200);
      await field.click({ force: true }); await page.waitForTimeout(400);
      await field.pressSequentially(process.env.CARMEL_NO || "CT-48213", { delay: 140 }); await page.waitForTimeout(600);
      await page.evaluate(() => window.__zoom(null, 1)); await page.waitForTimeout(800);
      const btn = page.getByRole("button", { name: /search/i }).first();
      await tap(page, btn, { zoom: 2.2, hold: 2600 });
      await page.waitForTimeout(2500);
    },
  },
};

mkdirSync(OUT, { recursive: true });
// the GPU (ANGLE on D3D11): the 3D suit builder is too heavy for the software renderer
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-gpu-rasterization"] });
for (const [id, s] of Object.entries(SCRIPTS)) {
  if (only.length && !only.includes(id)) continue;
  rmSync(TMP, { recursive: true, force: true }); mkdirSync(TMP, { recursive: true });
  const VIEW = { width: 390, height: 760 };   // the phone screen; the video is recorded at exactly this size
  const ctx = await browser.newContext({ ...devices["iPhone 13"], viewport: VIEW, locale: "en-CA", recordVideo: { dir: TMP, size: VIEW } });
  const page = await ctx.newPage();
  try {
    await page.goto(s.url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.addStyleTag({ content: `[id*="cookie" i],[class*="cookie" i],iframe[title*="chat" i],[class*="whatsapp" i],.joinchat{display:none!important}` }).catch(() => {});
    await page.evaluate(HELPERS);
    const t0 = Date.now();
    await page.evaluate(() => window.__scroll(0, 1));
    await s.run(page);
    const secs = (Date.now() - t0) / 1000;
    await ctx.close();
    const raw = `${TMP}/${readdirSync(TMP).find((f) => f.endsWith(".webm"))}`;
    // the recording starts at page open: keep the operated part (the last `secs`), as H.264 and VP9, plus a poster
    const ss = Math.max(0, Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", raw]).toString()) - secs);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", String(ss), "-i", raw, "-an", "-vf", "fps=30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "24", "-movflags", "+faststart", `${OUT}/${id}.mp4`]);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", String(ss), "-i", raw, "-an", "-vf", "fps=30", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", `${OUT}/${id}.webm`]);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-ss", String(ss + 1.5), "-i", raw, "-frames:v", "1", `${OUT}/${id}-poster.webp`]);
    console.log(id, "ok", secs.toFixed(1) + "s");
  } catch (e) { console.log(id, "ERR", e.message.split("\n")[0]); await ctx.close().catch(() => {}); }
}
await browser.close();
rmSync(TMP, { recursive: true, force: true });
