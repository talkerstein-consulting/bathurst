import { test, expect } from "@playwright/test";

test("navbar stays visible on the client map", async ({ page }) => {
  test.setTimeout(90_000);   // the city data takes a while in dev
  await page.goto("/?dpr=1");   // dev-only: render at 1x, the test browser draws WebGL in software
  await page.waitForFunction(() => document.getElementById("stage")?.classList.contains("city"), null, { timeout: 30000 });
  for (let i = 1; i <= 8; i++) { await page.evaluate((y) => scrollTo(0, y), i * 200); await page.waitForTimeout(200); }   // scrolling down, step by step
  await page.waitForFunction(() => document.getElementById("stick")?.classList.contains("mapped"), null, { timeout: 15000 });
  await page.evaluate(() => scrollBy(0, 150)); await page.waitForTimeout(500);   // one more scroll down on the map
  await expect(page.locator("#stick")).not.toHaveClass(/nav-hidden/);
});
