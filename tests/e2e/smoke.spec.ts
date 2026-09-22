import { test, expect } from "@playwright/test";

test.describe("AMENDRY Smoke Tests", () => {
  test("Landing page renders header, hero and judge mode links", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/AMENDRY/i);
    await expect(page.locator("body")).toContainText("AMENDRY");
    await expect(page.locator("a", { hasText: /See a live tender|Evaluation|Judge/i }).first()).toBeVisible();
    await expect(page.locator("a", { hasText: /Proof Room/i }).first()).toBeVisible();
  });

  test("Navigation across primary routes operates smoothly", async ({ page }) => {
    await page.goto("/app");
    await expect(page.locator("body")).toContainText("Operations Desk");

    await page.goto("/proof");
    await expect(page.locator("body")).toContainText("Proof Room");
    await expect(page.locator("body")).toContainText("Offline Proof Verifier");

    await page.goto("/judges");
    await expect(page.locator("body")).toContainText("Judge & Evaluator Mode");
    await expect(page.locator("button", { hasText: /Seed Demo Workspace/i })).toBeVisible();
  });
});
