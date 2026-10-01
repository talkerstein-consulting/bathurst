// Client sidebar imagery: node scripts/snap-clients.mjs [id ...]
// For each client site (scripts/client-sites.json) this writes to public/clients/<id>/:
//   banner.webp       the site's own best wide photo (og:image or the largest photo on the first screens), 1200×675
//   site-1..4.webp    desktop screenshots down the page (hero, then one per screen), 1280×800
//   *-sm.webp         half-size copies for the sidebar tiles
// Cookie banners, chat widgets and pop-ups are hidden; scroll-in animations are nudged before each shot.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";

const SITES = JSON.parse(readFileSync(new URL("./client-sites.json", import.meta.url)));
const only = process.argv.slice(2);
const W = 1440, H = 900, SHOTS = 4;

const HIDE = `
  [id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i], [aria-label*="cookie" i],
  #onetrust-consent-sdk, .cky-consent-container, #CybotCookiebotDialog, .cc-window, #hubspot-messages-iframe-container,
  [class*="klaviyo" i][role="dialog"], .needsclick[role="dialog"], iframe[title*="chat" i], #tidio-chat, .intercom-lightweight-app,
  .shopify-pc__banner, shopify-forms-embed, .pum-overlay, [class*="newsletter-popup" i], [class*="popup" i][role="dialog"], [class*="announcement" i][class*="popup" i]
  { display: none !important; visibility: hidden !important; }
  html, body { overflow: auto !important; }`;

const save = async (buf, dir, name, w, h) => {
  await sharp(buf).resize(w, h, { fit: "cover", position: "attention" }).webp({ quality: 82 }).toFile(`${dir}/${name}.webp`);
  await sharp(buf).resize(w / 2, h / 2, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toFile(`${dir}/${name}-sm.webp`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, reducedMotion: "reduce", locale: "en-CA" });
for (const [id, url] of Object.entries(SITES)) {
  if (!url || (only.length && !only.includes(id))) continue;
  const dir = `public/clients/${id}`; mkdirSync(dir, { recursive: true });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => page.waitForLoadState("load"));
    await page.waitForTimeout(1500);
    await page.addStyleTag({ content: HIDE }).catch(async () => { await page.waitForLoadState("load"); await page.addStyleTag({ content: HIDE }); });
    await page.keyboard.press("Escape").catch(() => {});

    // walk the page once so lazy images and scroll-ins load, then shoot a screen at a time from the top
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < Math.min(total, H * SHOTS); y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(250); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(1500);
    const n = Math.max(1, Math.min(SHOTS, Math.floor(total / H)));
    for (let i = 0; i < n; i++) {
      await page.evaluate((y) => scrollTo(0, y), i * H); await page.waitForTimeout(i ? 900 : 1200);
      await save(await page.screenshot({ type: "png" }), dir, `site-${i + 1}`, 1280, 800);
    }

    // banner: og:image, else the largest photo (img or CSS background) on the first screens
    const cands = await page.evaluate(() => {
      const out = [];
      const og = document.querySelector('meta[property="og:image"]')?.content; if (og) out.push({ src: og, area: 1e9 });
      document.querySelectorAll("img").forEach((i) => { const r = i.getBoundingClientRect(); if (i.naturalWidth >= 900 && r.width > 300) out.push({ src: i.currentSrc || i.src, area: r.width * r.height }); });
      document.querySelectorAll("section, div, header").forEach((e) => { const m = getComputedStyle(e).backgroundImage.match(/url\("?([^")]+)"?\)/); const r = e.getBoundingClientRect();
        if (m && r.width > 600 && r.height > 300 && r.top < innerHeight * 3) out.push({ src: new URL(m[1], location.href).href, area: r.width * r.height }); });
      return out.sort((a, b) => b.area - a.area).map((c) => c.src);
    });
    let banner = false;
    for (const src of cands.slice(0, 6)) {
      try {
        const res = await page.request.get(src, { timeout: 20000 }); if (!res.ok()) continue;
        const buf = await res.body(); const m = await sharp(buf).metadata();
        if (!m.width || m.width < 800 || m.format === "svg") continue;
        await save(buf, dir, "banner", 1200, 675); banner = src; break;
      } catch {}
    }
    console.log("ok  ", id, `${n} shots`, banner ? `banner ← ${banner}` : "no banner");
  } catch (e) { console.log("FAIL", id, url, e.message.split("\n")[0]); }
  await page.close();
}
await browser.close();
