// TCG's own Instagram reels for the trading-card row: node scripts/fetch-reels.mjs
// Opens each reel's public embed, saves the poster (public/reels/<id>.jpg), the video (public/reels/<id>.mp4, re-encoded
// small with ffmpeg) and the caption, and writes lib/bathurst/reels.json. Reel ids come from REELS in lib/bathurst/data.ts.
import { chromium } from "playwright";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";

const ids = [...readFileSync("lib/bathurst/data.ts", "utf8").match(/export const REELS = \[([^\]]+)\]/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
mkdirSync("public/reels", { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 540, height: 960 }, locale: "en-CA" });
const out = [];
for (const id of ids) {
  const page = await ctx.newPage();
  let video = null;
  page.on("response", (r) => { const u = r.url(); if (!video && /\.mp4(\?|$)/.test(u) && r.request().resourceType() === "media") video = u.replace(/&bytestart=\d+&byteend=\d+/, ""); });
  try {
    await page.goto(`https://www.instagram.com/reel/${id}/embed/captioned/`, { waitUntil: "networkidle", timeout: 45000 }).catch(() => {});
    const info = await page.evaluate(() => ({
      poster: document.querySelector(".EmbeddedMediaImage, img.EmbeddedMediaImage, video")?.getAttribute("src") || document.querySelector(".EmbeddedMediaImage")?.src || document.querySelector("video")?.poster || "",
      caption: (document.querySelector(".Caption")?.innerText || "").replace(/^\S+\s*/, "").replace(/\s+/g, " ").replace(/\s*View all \d+ comments?\s*$/i, "").replace(/\s*(#\S+\s*)+$/, "").trim(),
    }));
    // start playback so the player requests the file
    await page.locator(".EmbeddedMedia, .EmbeddedMediaVideo, [role=button]").first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(4000);
    if (!video) video = await page.evaluate(() => document.querySelector("video")?.currentSrc || "");
    if (info.poster) {
      const buf = Buffer.from(await (await fetch(info.poster)).arrayBuffer());
      await sharp(buf).resize(720, 1280, { fit: "cover" }).jpeg({ quality: 82 }).toFile(`public/reels/${id}.jpg`);
    }
    let hasVideo = false;
    if (video && !video.startsWith("blob:")) {
      const raw = `public/reels/${id}.raw.mp4`;
      writeFileSync(raw, Buffer.from(await (await fetch(video)).arrayBuffer()));
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", raw, "-vf", "scale=540:-2", "-c:v", "libx264", "-crf", "29", "-preset", "slow", "-c:a", "aac", "-b:a", "80k", "-movflags", "+faststart", `public/reels/${id}.mp4`]);
      rmSync(raw); hasVideo = true;
    }
    out.push({ id, caption: info.caption, poster: info.poster ? `/reels/${id}.jpg` : "", video: hasVideo ? `/reels/${id}.mp4` : "" });
    console.log(info.poster ? "ok  " : "NOPOSTER", id, hasVideo ? "video" : "NO VIDEO", "|", info.caption.slice(0, 60));
  } catch (e) { console.log("FAIL", id, e.message.split("\n")[0]); out.push({ id, caption: "", poster: "", video: "" }); }
  await page.close();
}
writeFileSync("lib/bathurst/reels.json", JSON.stringify(out, null, 2) + "\n");
await browser.close();
