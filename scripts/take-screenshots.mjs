import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const screenshotsDir = path.join(rootDir, "docs", "screenshots");
const publicDir = path.join(rootDir, "public");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const executablePath = "C:\\Users\\hp\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe";

console.log("================================================================================");
console.log("             AMENDRY PLAYWRIGHT CHROMIUM SCREENSHOT CAPTURE                     ");
console.log("================================================================================");
console.log(`Using Chromium at: ${executablePath}`);

async function main() {
  const launchOptions = {
    headless: true,
  };
  if (fs.existsSync(executablePath)) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // HiDPI Retina crispness
  });
  const page = await context.newPage();

  const baseUrl = "http://localhost:5173";

  try {
    // 1. Landing Page / Hero Banner
    console.log("Capturing 00-landing-banner.png...");
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const bannerPath = path.join(screenshotsDir, "banner.png");
    await page.screenshot({ path: bannerPath, fullPage: false });
    // Also copy to public/banner.png
    fs.copyFileSync(bannerPath, path.join(publicDir, "banner.png"));
    console.log(`  [OK] Saved ${bannerPath}`);

    // 2. Operations Desk (/app)
    console.log("Navigating to /app (Operations Desk)...");
    await page.goto(`${baseUrl}/app`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const deskPath = path.join(screenshotsDir, "01-operations-desk.png");
    await page.screenshot({ path: deskPath, fullPage: false });
    console.log(`  [OK] Saved ${deskPath}`);

    // 3. Tender Workspace & Blast Radius (/app/tenders/demo_mta_station_upgrade)
    console.log("Navigating to /app/tenders/demo_mta_station_upgrade (Blast Radius & Changes)...");
    await page.goto(`${baseUrl}/app/tenders/demo_mta_station_upgrade`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    // Click "Changes & Blast Radius" tab
    const changesTab = page.locator("button", { hasText: /Changes & Blast Radius/i });
    if (await changesTab.isVisible()) {
      await changesTab.click();
      await page.waitForTimeout(1000);
    }
    const blastRadiusPath = path.join(screenshotsDir, "02-tender-blast-radius.png");
    await page.screenshot({ path: blastRadiusPath, fullPage: false });
    console.log(`  [OK] Saved ${blastRadiusPath}`);

    // 4. Judge Mode & Evaluator Surface (/judges)
    console.log("Navigating to /judges and seeding demo workspace...");
    await page.goto(`${baseUrl}/judges`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    const judgePath = path.join(screenshotsDir, "03-judge-evaluation.png");
    await page.screenshot({ path: judgePath, fullPage: false });
    console.log(`  [OK] Saved ${judgePath}`);

    // 4. Proof Room
    console.log("Navigating to /proof (Cryptographic Proof Room)...");
    await page.goto(`${baseUrl}/proof`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const proofPath = path.join(screenshotsDir, "04-proof-ledger.png");
    await page.screenshot({ path: proofPath, fullPage: false });
    console.log(`  [OK] Saved ${proofPath}`);

    console.log("\n================================================================================");
    console.log("ALL 5 HIGH-RESOLUTION SCREENSHOTS CAPTURED SUCCESSFULLY!");
    console.log("================================================================================\n");
  } catch (err) {
    console.error("Error capturing screenshots:", err);
  } finally {
    await browser.close();
  }
}

main();
