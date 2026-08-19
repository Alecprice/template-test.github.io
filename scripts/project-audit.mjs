import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = ["src/main.tsx","src/App.tsx","src/types/remote.ts","src/lib/adapters/samsungAdapter.ts","src/lib/adapters/fireTvAdapter.ts","bridge/server.mjs","vite.config.ts","capacitor.config.ts"];
const failures = [];
for (const rel of required) if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing required file: ${rel}`);
for (const rel of ["src", "bridge"]) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) continue;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (/\.(ts|tsx|js|mjs|css)$/.test(entry.name)) {
        const text = fs.readFileSync(full, "utf8");
        if (/\b(TODO|FIXME)\b/.test(text)) failures.push(`Unresolved TODO/FIXME in ${path.relative(root, full)}`);
      }
    }
  }
}
for (const rel of ["public/tv-phone.svg", "public/tv-phone-192.png", "public/tv-phone-512.png"]) if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing PWA asset: ${rel}`);
if (failures.length) {
  console.error("TV Phone project audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("TV Phone project audit passed.");
