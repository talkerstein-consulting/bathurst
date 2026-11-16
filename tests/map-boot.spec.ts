import { test, expect } from "@playwright/test";
test("map boots without errors", async ({ page }) => {
  test.setTimeout(90_000);
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto("/?dpr=1");   // dev-only: render at 1x, the test browser draws WebGL in software
  await page.waitForFunction(() => document.getElementById("stage")?.classList.contains("city"), null, { timeout: 30000 });
  await page.mouse.wheel(0, 3000); await page.waitForTimeout(3000);
  expect(errs).toEqual([]);
});
