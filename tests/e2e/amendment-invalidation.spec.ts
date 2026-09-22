import { test, expect } from "@playwright/test";

test.describe("AMENDRY Amendment Invalidation & Blast Radius", () => {
  test("Judges interface exposes blast radius visualizer controls", async ({ page }) => {
    await page.goto("/judges");

    // Check blast radius section exists
    await expect(page.locator("text=Live Revision Blast Radius & Invalidation")).toBeVisible();
    await expect(page.locator("text=Addendum 8 (Simulated Revision 9)")).toBeVisible();

    // Verify clause change diff details
    await expect(page.locator("text=Public Liability Insurance Raised")).toBeVisible();
    await expect(page.locator("text=STALE (Invalidated)")).toBeVisible();
  });
});
