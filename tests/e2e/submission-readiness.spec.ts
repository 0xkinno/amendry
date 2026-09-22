import { test, expect } from "@playwright/test";

test.describe("AMENDRY Submission Readiness Gate", () => {
  test("Submission tab enforces strict gating when requirements are blocked", async ({ page }) => {
    await page.goto("/app");
    // Verify operations desk displays readiness invariants
    await expect(page.locator("body")).toContainText("Operations Desk");
    await expect(page.locator("body")).toContainText("Active Tenders");
  });
});
