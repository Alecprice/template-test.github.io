import { readFile } from 'node:fs/promises';

const FILES = [
  'src/App.tsx',
  'src/lib/storage.ts',
  'src/components/SettingsView.tsx',
  'src/types/remote.ts',
  'src/lib/streamingServices.ts',
];

for (const file of FILES) {
  const text = await readFile(file, 'utf8');
  console.log(`=== BEGIN ${file} ===`);
  text.split(/\r?\n/).forEach((line, index) => console.log(`${index + 1}: ${line}`));
  console.log(`=== END ${file} ===`);
}
