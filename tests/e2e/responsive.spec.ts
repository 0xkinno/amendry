import { test, expect } from "@playwright/test";

test.describe("AMENDRY Responsive Layout & Viewports", () => {
  test("Mobile viewport renders responsive navigation and cards without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Verify brand logo and content wrap properly
    await expect(page.locator("body")).toContainText("AMENDRY");
    await expect(page.locator("a", { hasText: /See a live tender|Evaluation|Judge/i }).first()).toBeVisible();

    // Check no massive horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20); // Small margin for browser scrollbar
  });

  test("Tablet viewport renders operations desk cleanly", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/app");
    await expect(page.locator("body")).toContainText("Operations Desk");
  });
});
