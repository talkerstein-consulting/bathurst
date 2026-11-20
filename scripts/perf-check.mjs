// Load-time check against a running server: node scripts/perf-check.mjs [url] [--mobile]
// Headless Chromium with Lighthouse-style throttling (slow 4G, 4x CPU on --mobile; cable + 1x on desktop).
// Prints first/largest contentful paint, long-task time before the map is ready, and the bytes fetched by then.
import { chromium } from "playwright";

const url = process.argv.find((a) => a.startsWith("http")) || "http://localhost:3100/";
const MOBILE = process.argv.includes("--mobile");
const NET = MOBILE ? { latency: 150, down: 1.6e6 / 8, up: 0.75e6 / 8, cpu: 4 } : { latency: 40, down: 10e6 / 8, up: 5e6 / 8, cpu: 1 };

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await browser.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("Network.enable");
await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: NET.latency, downloadThroughput: NET.down, uploadThroughput: NET.up });
await cdp.send("Emulation.setCPUThrottlingRate", { rate: NET.cpu });
const bytes = []; cdp.on("Network.loadingFinished", (e) => bytes.push([performance.now(), e.encodedDataLength]));
await page.addInitScript(() => {
  window.__lt = []; window.__lcp = 0;
  new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lt.push([e.startTime, e.duration]))).observe({ type: "longtask", buffered: true });
  new PerformanceObserver((l) => { const e = l.getEntries(); window.__lcp = e[e.length - 1].startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
});
const t0 = performance.now();
await page.goto(url, { waitUntil: "load" });
const loadMs = performance.now() - t0;
// the map is "ready" once the city layer has been added (the engine puts .city on #stage)
await page.waitForSelector("#stage.city", { timeout: 60000 }).catch(() => {});
const cityMs = performance.now() - t0;
await page.waitForTimeout(1500);
const m = await page.evaluate(() => ({
  fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0,
  lcp: window.__lcp,
  tbt: window.__lt.reduce((s, [, d]) => s + Math.max(0, d - 50), 0),
  longest: Math.max(0, ...window.__lt.map(([, d]) => d)),
  imgs: performance.getEntriesByType("resource").filter((r) => r.initiatorType === "img").length,
}));
const kb = (until) => Math.round(bytes.filter(([t]) => t - t0 <= until).reduce((s, [, b]) => s + b, 0) / 1024);
console.log(JSON.stringify({ mode: MOBILE ? "mobile (slow 4G, 4x CPU)" : "desktop (cable)", fcp: Math.round(m.fcp), lcp: Math.round(m.lcp), load: Math.round(loadMs), mapReady: Math.round(cityMs),
  totalBlockingMs: Math.round(m.tbt), longestTaskMs: Math.round(m.longest), kbAtLoad: kb(loadMs), kbAtMapReady: kb(cityMs), imagesFetched: m.imgs }, null, 1));
await browser.close();
