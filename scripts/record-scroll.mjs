// Scrolling homepage clips for the client sidebars: node scripts/record-scroll.mjs [--mobile] [id ...]
// Records each client site (scripts/client-sites.json) gliding from the top down a few screens, then encodes
// public/clients/<id>/scroll.mp4 (960×600, silent, ~12 s loop) and scroll.jpg (its first frame, the poster). Needs ffmpeg.
// --mobile: the site as a phone sees it (390×844, touch, phone user agent) → scroll-m.mp4 (540×1168 portrait) + scroll-m.jpg,
//   rendered frame by frame at 2x, plus site-m-1..4.webp: one portrait snapshot per screen (720×1558, -sm 360×779).
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";

const SITES = JSON.parse(readFileSync(new URL("./client-sites.json", import.meta.url)));
const MOBILE = process.argv.includes("--mobile");
const only = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const W = MOBILE ? 390 : 1280, H = MOBILE ? 844 : 800, SECONDS = 12, DIST = H * 3.2;
const OUT = MOBILE ? "scroll-m" : "scroll", SCALE = MOBILE ? "540:1168" : "960:600";
const PHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const HIDE = `[id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], #onetrust-consent-sdk, .cky-consent-container,
  #CybotCookiebotDialog, .cc-window, #hubspot-messages-iframe-container, iframe[title*="chat" i], #tidio-chat, .intercom-lightweight-app,
  .shopify-pc__banner, shopify-forms-embed, .pum-overlay, [class*="newsletter-popup" i], [class*="popup" i][role="dialog"], .needsclick[role="dialog"]
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
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, locale: "en-CA",
    ...(MOBILE ? { deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: PHONE_UA }   // phones: rendered frame by frame (below), sharp at 2x
      : { recordVideo: { dir: tmp, size: { width: W, height: H } } }) });
  const page = await ctx.newPage();
  const t0 = Date.now();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => page.waitForLoadState("load"));
    await page.waitForTimeout(1200);
    await dismiss(page); await page.waitForTimeout(2500); await dismiss(page);   // pop-ups that arrive late
    // last resort for pop-ups with an unlabelled close icon: remove any fixed layer covering most of the screen
    // (a sign-up modal or its backdrop; a site header is short, so it stays)
    // kept up for the whole capture: some sign-up pop-ups come back on a timer or on scroll
    await page.evaluate(() => { const sweep = () => { for (const e of document.querySelectorAll("body *")) { const cs = getComputedStyle(e); if (cs.position !== "fixed") continue;
        const r = e.getBoundingClientRect(); if (r.width * r.height > innerWidth * innerHeight * .35 && r.height > innerHeight * .4) e.remove(); }
        document.querySelectorAll("shopify-forms-embed").forEach((e) => e.remove());   // Shopify Forms pop-ups render in a shadow root
        document.documentElement.style.overflow = document.body.style.overflow = "auto"; };
      sweep(); setInterval(sweep, 200); }).catch(() => {});
    await page.addStyleTag({ content: HIDE }).catch(() => {});
    // preload lazy images, back to the top, settle
    await page.evaluate(async (d) => { for (let y = 0; y < d; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); }, DIST);
    await page.waitForTimeout(1500);
    if (MOBILE) {
      // frame by frame: scroll to each eased position, let it paint, screenshot at the phone's 2x density; ffmpeg joins them
      const N = SECONDS * 30, max = await page.evaluate((d) => Math.min(d, document.documentElement.scrollHeight - innerHeight), DIST);
      // the snapshots: one per screen down the page (as many as it has, up to four)
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let k = 0; k < Math.max(1, Math.min(4, Math.floor(total / H))); k++) {
        await page.evaluate((y) => new Promise((r) => { scrollTo(0, y); setTimeout(r, 700); }), k * H);
        const png = await page.screenshot({ type: "png" });
        await sharp(png).resize(720, 1558, { fit: "cover", position: "top" }).webp({ quality: 82 }).toFile(`${dir}/site-m-${k + 1}.webp`);
        await sharp(png).resize(360, 779, { fit: "cover", position: "top" }).webp({ quality: 80 }).toFile(`${dir}/site-m-${k + 1}-sm.webp`);
      }
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(900);
      const ease = (x) => (x < .12 ? 0 : x > .9 ? 1 : (1 - Math.cos(Math.PI * (x - .12) / .78)) / 2);
      for (let i = 0; i < N; i++) {
        await page.evaluate((y) => new Promise((r) => { scrollTo(0, y); requestAnimationFrame(() => requestAnimationFrame(r)); }), Math.round(max * ease(i / (N - 1))));
        await page.screenshot({ path: `${tmp}/f${String(i).padStart(4, "0")}.jpg`, type: "jpeg", quality: 88 });
      }
      await ctx.close();
      execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", "30", "-i", `${tmp}/f%04d.jpg`, "-an", "-vf", `scale=${SCALE}:flags=lanczos`,
        "-c:v", "libx264", "-preset", "slow", "-crf", "29", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${dir}/${OUT}.mp4`]);
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${dir}/${OUT}.mp4`, "-frames:v", "1", "-q:v", "4", `${dir}/${OUT}.jpg`]);
      console.log("ok  ", id, OUT); rmSync(tmp, { recursive: true, force: true }); continue;
    }
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
      "-vf", `scale=${SCALE}:flags=lanczos,fps=30`, "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${dir}/${OUT}.mp4`]);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `${dir}/${OUT}.mp4`, "-frames:v", "1", "-q:v", "4", `${dir}/${OUT}.jpg`]);
    console.log("ok  ", id, OUT);
  } catch (e) { console.log("FAIL", id, e.message.split("\n")[0]); await ctx.close().catch(() => {}); }
  rmSync(tmp, { recursive: true, force: true });
}
await browser.close();
