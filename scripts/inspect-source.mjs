import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SEARCH_ROOTS = ['src', 'app', 'web', 'bridge'];
const TERMS = [
  'localStorage',
  'favorite',
  'streaming',
  'activity',
  'device',
  'settings',
  'theme',
  'Samsung',
  'Fire TV',
  'useState',
];

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(full));
    else if (/\.(?:ts|tsx|js|jsx|mjs|json)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const files = [];
for (const root of SEARCH_ROOTS) files.push(...await walk(join(ROOT, root)));

console.log('=== SOURCE FILES ===');
for (const file of files) console.log(relative(ROOT, file));

console.log('=== MATCHES ===');
for (const file of files) {
  let text;
  try { text = await readFile(file, 'utf8'); } catch { continue; }
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    if (!TERMS.some((term) => lines[i].toLowerCase().includes(term.toLowerCase()))) continue;
    const start = Math.max(0, i - 3);
    const end = Math.min(lines.length, i + 4);
    console.log(`--- ${relative(ROOT, file)}:${i + 1} ---`);
    for (let j = start; j < end; j += 1) console.log(`${j + 1}: ${lines[j]}`);
  }
}
