// Showcase card images: real feature screens from client builds, cropped to the feature itself.
// node scripts/snap-showcase.mjs [id ...]  →  public/showcase/<id>.webp (1600 wide) and <id>-sm.webp (800 wide), 16:10
// Each entry finds the feature's panel by a line of its own text, climbs to the framed panel around it, and crops that.
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const SHOTS = {
  // Hily's Sparkly Spa: the booking panel (steps on the left, the experience picker on the right)
  booking: { url: "https://hilysparklyspa.com/booking", clip: { x: 650, y: 130, width: 740, height: 660 }, bg: "#fdf4f1" },
  // Amazing Donuts: the bulk-order quote questionnaire
  quote: { url: "https://amazing-donuts.vercel.app/bulk-orders/", text: "Tell us about it", pad: 0, top: true },
  // Sam's Menswear: draw your suit (the sketch beside the cloth and detail choices)
  configurator: { url: "https://customsuitandshirt.com/design", clip: { x: 110, y: 790, width: 1220, height: 762 } },
  // Hily's Sparkly Spa: the customer's booking access
  portal: { url: "https://hilysparklyspa.com/dashboard", text: "Access your booking", pad: 40 },
  // Hily's Sparkly Spa: the digital waiver and signature
  approvals: { url: "https://hilysparklyspa.com/waiver-consent", clip: { x: 150, y: 160, width: 1150, height: 719 } },
  // Carmel Transport: the container and booking tracker
  tracking: { url: "https://carmeltransport.com/booking-search/", text: "Container/Booking Tracker", region: "hero", pad: 0 },
};
const W = 1440, H = 900, OUT = "public/showcase";
const HIDE = `[id*="cookie" i],[class*="cookie" i],#onetrust-consent-sdk,iframe[title*="chat" i],[class*="popup" i][role="dialog"],
  [class*="whatsapp" i],[href*="wa.me"],.joinchat{display:none!important}`;
const only = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, locale: "en-CA", reducedMotion: "reduce" });
for (const [id, s] of Object.entries(SHOTS)) {
  if (only.length && !only.includes(id)) continue;
  const page = await ctx.newPage();
  try {
    await page.goto(s.url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.addStyleTag({ content: HIDE }).catch(() => {});
    // walk the page once so lazy parts load
    for (let yy = 0; yy < 4000; yy += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(120); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(800);
    if (s.clip) {   // a measured crop, in page pixels at 1440 wide
      const buf = await page.screenshot({ type: "png", fullPage: true, clip: s.clip });
      // a panel that is not 16:10 sits centred on its own page colour (bg) instead of being cut
      const fit = s.bg ? { fit: "contain", background: s.bg } : { fit: "cover", position: "top" };
      await sharp(buf).resize(1600, 1000, fit).webp({ quality: 86 }).toFile(`${OUT}/${id}.webp`);
      await sharp(buf).resize(800, 500, fit).webp({ quality: 84 }).toFile(`${OUT}/${id}-sm.webp`);
      console.log(id, "ok (clip)"); await page.close(); continue;
    }
    // the panel: the nearest ancestor of the anchor text that is a framed box (border, shadow or its own background)
    const box = await page.evaluate(({ text, region }) => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node; while ((node = walker.nextNode())) if (node.textContent.trim().toLowerCase().includes(text.toLowerCase())) break;
      if (!node) return null;
      let el = node.parentElement;
      el.scrollIntoView({ block: "center" });
      const framed = (e) => { const c = getComputedStyle(e), r = e.getBoundingClientRect();
        return r.width > 380 && r.height > 220 && (c.boxShadow !== "none" || parseFloat(c.borderTopWidth) > 0 || (c.backgroundColor !== "rgba(0, 0, 0, 0)" && c.backgroundColor !== getComputedStyle(e.parentElement).backgroundColor)); };
      if (region === "design") { while (el && el.getBoundingClientRect().width < 1100) el = el.parentElement; }
      else if (region === "hero") { while (el && !(el.tagName === "SECTION" || el.getBoundingClientRect().height > 500)) el = el.parentElement; }
      else while (el && el !== document.body && !framed(el)) el = el.parentElement;
      const r = el.getBoundingClientRect();
      return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
    }, s);
    if (!box) throw new Error("anchor text not found");
    // crop: the panel plus padding, then 16:10 (from the top for tall panels, else centred)
    const p = s.pad ?? 0;
    let x = Math.max(0, box.x - p), y = Math.max(0, box.y - p), w = Math.min(W - x, box.w + 2 * p), h = box.h + 2 * p;
    const want = w / 1.6;
    if (h > want) { if (!s.top) y += (h - want) / 2; h = want; } else { const nw = Math.min(W, h * 1.6); x = Math.max(0, x - (nw - w) / 2); w = Math.min(nw, W - x); }
    await page.evaluate((top) => scrollTo(0, Math.max(0, top - 100)), y); await page.waitForTimeout(1200);
    const buf = await page.screenshot({ type: "png", fullPage: true, clip: { x, y, width: w, height: h } });
    await sharp(buf).resize(1600, 1000, { fit: "cover", position: "top" }).webp({ quality: 86 }).toFile(`${OUT}/${id}.webp`);
    await sharp(buf).resize(800, 500, { fit: "cover", position: "top" }).webp({ quality: 84 }).toFile(`${OUT}/${id}-sm.webp`);
    console.log(id, "ok", Math.round(w), "x", Math.round(h));
  } catch (e) { console.log(id, "ERR", e.message.split("\n")[0]); }
  await page.close();
}
await browser.close();
