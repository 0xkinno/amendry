import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const envLocalPath = path.join(rootDir, ".env.local");

console.log("================================================================================");
console.log("             AMENDRY CONVEX ENVIRONMENT SYNCHRONIZER (P8.6)                     ");
console.log("================================================================================");

if (!fs.existsSync(envLocalPath)) {
  console.warn(`[WARN] .env.local not found at ${envLocalPath}. Skipping push.`);
  process.exit(0);
}

const envContent = fs.readFileSync(envLocalPath, "utf-8");
const lines = envContent.split("\n");
const keysToPush = ["OPENAI_API_KEY", "FIRECRAWL_API_KEY", "AGENTMAIL_API_KEY", "AGENTMAIL_WEBHOOK_SECRET"];

const parsedKeys = {};
for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx !== -1) {
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (keysToPush.includes(key) && val && !val.includes("YOUR_")) {
      parsedKeys[key] = val;
    }
  }
}

const keyNames = Object.keys(parsedKeys);
console.log(`Found ${keyNames.length} valid configuration keys in .env.local: [${keyNames.join(", ")}]`);

if (keyNames.length === 0) {
  console.log("No non-empty provider keys configured. Nothing to push.");
  process.exit(0);
}

// Push to convex deployment
let pushSuccess = true;
for (const [k, v] of Object.entries(parsedKeys)) {
  try {
    console.log(`Setting Convex environment variable: ${k}...`);
    // Escape value safely for shell execution
    execSync(`npx convex env set ${k}="${v.replace(/"/g, '\\"')}"`, {
      cwd: rootDir,
      stdio: "pipe",
      encoding: "utf-8",
    });
    console.log(`  [OK] ${k} set successfully.`);
  } catch (err) {
    console.warn(`  [NOTE] Could not push ${k} automatically (Convex deployment might be offline or requiring interactive login): ${err.message?.slice(0, 120)}`);
    pushSuccess = false;
  }
}

if (pushSuccess) {
  console.log("\nAll keys synchronized with Convex deployment successfully.");
} else {
  console.log("\n[NOTE] Environment push attempted. Local `.env.local` remains primary source of truth for dev server.");
}
console.log("================================================================================\n");
process.exit(0);
