import { test, expect } from "@playwright/test";

test.describe("AMENDRY Brand Navigation (Section 30)", () => {
  const routes = ["/app", "/proof", "/judges", "/login", "/signup"];

  for (const path of routes) {
    test(`Clicking AMENDRY brand on ${path} returns to landing page (/)`, async ({ page }) => {
      await page.goto(path);
      const brandLink = page.getByRole("link", { name: /AMENDRY home/i }).first();
      await expect(brandLink).toBeVisible();
      await brandLink.click();
      await expect(page).toHaveURL(/\/$/);
    });
  }
});
