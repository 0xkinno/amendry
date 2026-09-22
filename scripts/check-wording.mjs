import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("================================================================================");
console.log("               AMENDRY COPY INTEGRITY & SECRET SCANNER (P8.4)                   ");
console.log("================================================================================");

const FORBIDDEN_WORDS = [
  "revolutionary",
  "hallucination-free",
  "game-changer",
  "game changer",
  "silver bullet",
  "bulletproof",
  "100% automated",
  "fully automated without human",
  "magic AI",
];

const SECRET_PATTERNS = [
  /sk-proj-[a-zA-Z0-9_-]{30,}/,
  /fc-[a-zA-Z0-9_-]{20,}/,
  /am_[a-zA-Z0-9_-]{20,}/,
];

const IGNORE_DIRS = [
  "node_modules",
  ".git",
  ".references",
  "dist",
  ".system_generated",
  "scratch",
];

const IGNORE_FILES = [
  ".env.local",
  "check-wording.mjs",
];

let violationCount = 0;
let scannedFilesCount = 0;

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (IGNORE_DIRS.includes(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      if (IGNORE_FILES.includes(entry.name) || entry.name.endsWith(".png") || entry.name.endsWith(".jpg") || entry.name.endsWith(".ico")) {
        continue;
      }

      scannedFilesCount++;
      const content = fs.readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");

      // Check forbidden hype words
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const word of FORBIDDEN_WORDS) {
          const regex = new RegExp(`\\b${word}\\b`, "i");
          if (regex.test(line)) {
            console.error(`[FORBIDDEN WORD] "${word}" found in ${relPath}:${i + 1}`);
            console.error(`  > ${line.trim()}`);
            violationCount++;
          }
        }

        // Check uncommitted secrets
        for (const pattern of SECRET_PATTERNS) {
          if (pattern.test(line)) {
            console.error(`[SECRET EXPOSURE] Detected live API key format in ${relPath}:${i + 1}`);
            violationCount++;
          }
        }
      }
    }
  }
}

scanDirectory(rootDir);

console.log("\n================================================================================");
console.log(`SCANNED: ${scannedFilesCount} files`);
if (violationCount === 0) {
  console.log("SCAN RESULT: CLEAN (0 forbidden words, 0 plaintext secrets exposed)");
  console.log("================================================================================\n");
  process.exit(0);
} else {
  console.error(`SCAN RESULT: FAILED with ${violationCount} integrity violations.`);
  console.log("================================================================================\n");
  process.exit(1);
}
