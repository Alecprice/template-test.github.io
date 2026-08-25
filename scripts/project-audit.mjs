import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "src/main.tsx",
  "src/App.tsx",
  "src/types/remote.ts",
  "src/lib/adapters/samsungAdapter.ts",
  "src/lib/adapters/fireTvAdapter.ts",
  "src/lib/cloud.ts",
  "src/lib/useAccountSync.ts",
  "src/lib/useSpeechRecognition.ts",
  "src/lib/useSpeechSynthesis.ts",
  "src/components/AccountPanel.tsx",
  "src/components/PwaInstallCard.tsx",
  "src/components/RemoteView.tsx",
  "index.html",
  "vite.config.ts",
  "public/tv-phone.svg",
  "public/tv-phone-180.png",
  "public/tv-phone-192.png",
  "public/tv-phone-512.png",
  "public/tv-phone-maskable-512.png",
];
const failures = [];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`Missing required file: ${rel}`);
}

for (const rel of ["src"]) {
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

const remotePath = path.join(root, "src/components/RemoteView.tsx");
if (fs.existsSync(remotePath)) {
  const remote = fs.readFileSync(remotePath, "utf8");
  for (const marker of ["Dictate text", "Read aloud", "Stop speaking", "Send to TV", "useSpeechSynthesis"]) {
    if (!remote.includes(marker)) failures.push(`Remote voice tools missing marker: ${marker}`);
  }
}

const synthesisPath = path.join(root, "src/lib/useSpeechSynthesis.ts");
if (fs.existsSync(synthesisPath)) {
  const synthesis = fs.readFileSync(synthesisPath, "utf8");
  for (const marker of ["speechSynthesis.cancel()", "SpeechSynthesisUtterance", "utterance.onend", "utterance.onerror"]) {
    if (!synthesis.includes(marker)) failures.push(`Speech synthesis safety wiring missing: ${marker}`);
  }
}

const indexPath = path.join(root, "index.html");
if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, "utf8");
  for (const marker of ["viewport-fit=cover", "apple-mobile-web-app-capable", "apple-mobile-web-app-title", "apple-touch-icon", "tv-phone-180.png"]) {
    if (!html.includes(marker)) failures.push(`iPhone PWA metadata missing: ${marker}`);
  }
}

const vitePath = path.join(root, "vite.config.ts");
if (fs.existsSync(vitePath)) {
  const vite = fs.readFileSync(vitePath, "utf8");
  for (const marker of ["registerType: 'autoUpdate'", "display: 'standalone'", "tv-phone-192.png", "tv-phone-512.png", "tv-phone-maskable-512.png", "purpose: 'maskable'", "cleanupOutdatedCaches: true"]) {
    if (!vite.includes(marker)) failures.push(`Installable PWA config missing: ${marker}`);
  }
}

const settingsPath = path.join(root, "src/components/SettingsView.tsx");
if (fs.existsSync(settingsPath)) {
  const settings = fs.readFileSync(settingsPath, "utf8");
  if (!settings.includes("<PwaInstallCard />")) failures.push("Settings is missing the PWA install card");
}

const stylesPath = path.join(root, "src/styles.css");
if (fs.existsSync(stylesPath)) {
  const styles = fs.readFileSync(stylesPath, "utf8");
  for (const marker of ["@media (min-width:820px) and (pointer:coarse)", "@media (min-width:900px) and (min-height:700px)", "overscroll-behavior:none", "touch-action:manipulation"]) {
    if (!styles.includes(marker)) failures.push(`Tablet/native interaction styling missing: ${marker}`);
  }
}

if (failures.length) {
  console.error("TV Phone project audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("TV Phone project audit passed.");
