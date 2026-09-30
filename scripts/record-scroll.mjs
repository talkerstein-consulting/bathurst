// Scrolling homepage clips for the client sidebars: node scripts/record-scroll.mjs [id ...]
// Records each client site (scripts/client-sites.json) gliding from the top down a few screens, then encodes
// public/clients/<id>/scroll.mp4 (960×600, silent, ~12 s loop) and scroll.jpg (its first frame, the poster). Needs ffmpeg.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";

const SITES = JSON.parse(readFileSync(new URL("./client-sites.json", import.meta.url)));
const only = process.argv.slice(2);
const W = 1280, H = 800, SECONDS = 12, DIST = H * 3.2;
const HIDE = `[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], #onetrust-consent-sdk, .cky-consent-container,
  #CybotCookiebotDialog, .cc-window, #hubspot-messages-iframe-container, iframe[title*="chat" i], #tidio-chat, .intercom-lightweight-app,
  .shopify-pc__banner, .pum-overlay, [class*="newsletter-popup" i], [class*="popup" i][role="dialog"], .needsclick[role="dialog"]
  { display: none !important; } html, body { overflow: auto !important; scroll-behavior: auto !important; }`;

// click through cookie notices and pop-ups the way a visitor would (accept / close), then Escape for the rest
const dismiss = (page) => page.evaluate(() => {
  const btns = [...document.querySelectorAll('button, a[role="button"], [role="button"], input[type="button"], .close, [class*="close" i]')];
  const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== "hidden"; };
  const hit = (e, re) => re.test(((e.innerText || e.value || "") + " " + (e.getAttribute("aria-label") || "") + " " + (e.title || "")).trim());
  for (const e of btns.filter(vis)) {
    if (hit(e, /^(accept( all)?( cookies)?|i accept|agree|i agree|allow( all)?|got it|ok(ay)?|decline|reject( all)?|dismiss|no,? thanks|close|×|✕)$/i)
        || (hit(e, /close|dismiss/i) && e.closest('[role="dialog"], [class*="popup" i], [class*="modal" i], [class*="cookie" i], [id*="cookie" i], [class*="consent" i]')))
      try { e.click(); } catch {}
  }
}).then(() => page.keyboard.press("Escape")).catch(() => {});

const browser = await chromium.launch();
for (const [id, url] of Object.entries(SITES)) {
  if (!url || (only.length && !only.includes(id))) continue;
  const dir = `public/clients/${id}`, tmp = `${dir}/.rec`; mkdirSync(tmp, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: tmp, size: { width: W, height: H } }, locale: "en-CA" });
  const page = await ctx.newPage();
  const t0 = Date.now();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => page.waitForLoadState("load"));
    await page.waitForTimeout(1200);
    await dismiss(page); await page.waitForTimeout(2500); await dismiss(page);   // pop-ups that arrive late
    await page.addStyleTag({ content: HIDE }).catch(() => {});
    // preload lazy images, back to the top, settle
    await page.evaluate(async (d) => { for (let y = 0; y < d; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); }, DIST);
    await page.waitForTimeout(1500);
    const start = (Date.now() - t0) / 1000;
    // an eased glide: hold, scroll, hold at the bottom
    await page.evaluate(({ d, s }) => new Promise((done) => {
      const max = Math.min(d, document.documentElement.scrollHeight - innerHeight), T = s * 1000, t0 = performance.now();
      const ease = (x) => (x < .12 ? 0 : x > .9 ? 1 : (1 - Math.cos(Math.PI * (x - .12) / .78)) / 2);
      const f = (t) => { const x = Math.min(1, (t - t0) / T); scrollTo(0, max * ease(x)); x < 1 ? requestAnimationFrame(f) : done(); };
      requestAnimationFrame(f);
    }), { d: DIST, s: SECONDS });
    await ctx.close();
    const webm = readdirSync(tmp).find((f) => f.endsWith(".webm"));
    execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", start.toFixed(2), "-t", String(SECONDS), "-i", `${tmp}/${webm}`, "-an",
      "-vf", "scale=960:600:flags=lanczos,fps=30", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${dir}/scroll.mp4`]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${dir}/scroll.mp4`, "-frames:v", "1", "-q:v", "4", `${dir}/scroll.jpg`]);
    console.log("ok  ", id);
  } catch (e) { console.log("FAIL", id, e.message.split("\n")[0]); await ctx.close().catch(() => {}); }
  rmSync(tmp, { recursive: true, force: true });
}
await browser.close();
