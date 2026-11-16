import { test, expect } from "@playwright/test";

test("home loads without console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("#terminal")).toBeVisible();   // the heading is split into animated letters
  expect(errors).toEqual([]);
});

test("book page loads", async ({ page }) => {
  await page.goto("/book");
  await expect(page.locator("form").first()).toBeVisible();
});

test("hero assessment carries the URL to the form", async ({ page }) => {
  await page.goto("/");
  await page.locator("#al-url").fill("example.com");
  await page.getByRole("button", { name: "Analyze My Website" }).click();
  await expect(page).toHaveURL(/\/book\?.*website=(https%3A%2F%2F)?example\.com/);
  await expect(page.locator('input[name="website"]')).toHaveValue(/example\.com$/, { timeout: 20_000 });
});

test("homepage sections 03–07 are present", async ({ page }) => {
  await page.goto("/");
  for (const id of ["assess", "results", "solution", "engagement", "final-cta"]) await expect(page.locator(`#${id}`)).toHaveCount(1);
});
