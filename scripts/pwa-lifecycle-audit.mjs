import { readFile } from 'node:fs/promises'

const card = await readFile('src/components/PwaInstallCard.tsx', 'utf8')
const vite = await readFile('vite.config.ts', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

for (const marker of [
  "window.addEventListener('online'",
  "window.addEventListener('offline'",
  "navigator.serviceWorker.getRegistration()",
  'registration.update()',
  'Check for app update',
  'Offline app shell is active',
  'Cloud sync and hosted network features resume',
]) {
  if (!card.includes(marker)) throw new Error(`PWA lifecycle audit failed: card missing ${marker}`)
}

if (!vite.includes("globPatterns: ['**/*.{js,css,html,ico}']")) throw new Error('PWA lifecycle audit failed: asset glob was not de-duplicated')
if (vite.includes("globPatterns: ['**/*.{js,css,html,svg,png,ico}']")) throw new Error('PWA lifecycle audit failed: icon glob duplication remains')

for (const marker of ['.pwa-runtime-status', '.pwa-update-button', 'prefers-reduced-motion']) {
  if (!styles.includes(marker)) throw new Error(`PWA lifecycle audit failed: styles missing ${marker}`)
}

console.log('TV Phone PWA lifecycle audit passed.')
