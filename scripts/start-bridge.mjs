import fs from "node:fs";
import path from "node:path";
const envPath = path.join(process.cwd(), "bridge", ".env");
if (!fs.existsSync(envPath)) {
  console.error("bridge/.env is missing. Run: npm run bridge:setup");
  process.exit(1);
}
for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith("#")) continue;
  const idx = line.indexOf("=");
  if (idx < 1) continue;
  const key = line.slice(0, idx).trim();
  let value = line.slice(idx + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  if (!(key in process.env)) process.env[key] = value;
}
await import("../bridge/server.mjs");
