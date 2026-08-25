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
  "src/components/RemoteView.tsx",
  "vite.config.ts",
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

if (!fs.existsSync(path.join(root, "public/tv-phone.svg"))) {
  failures.push("Missing PWA asset: public/tv-phone.svg");
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

if (failures.length) {
  console.error("TV Phone project audit failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("TV Phone project audit passed.");
