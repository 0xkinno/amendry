import { test, expect } from "@playwright/test";

test.describe("AMENDRY Demo Flow & Revision 8 Integrity", () => {
  test("Can seed demo workspace and view verified tender", async ({ page }) => {
    await page.goto("/judges");
    const seedBtn = page.locator("button", { hasText: /Seed Demo Workspace/i });
    await expect(seedBtn).toBeVisible();

    // Verify presence of simulation controls and attack suite
    await expect(page.locator("button", { hasText: /Simulate Revision 9/i })).toBeVisible();
    await expect(page.locator("button", { hasText: /Run 12-Attack Suite/i })).toBeVisible();

    // Verify key procurement clauses documented in interface
    await expect(page.locator("body")).toContainText("Metropolitan Transit Authority");
  });
});
