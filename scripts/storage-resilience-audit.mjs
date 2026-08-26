import { readFile } from 'node:fs/promises'

const helper = await readFile('src/lib/browserStorage.ts', 'utf8')
const storage = await readFile('src/lib/storage.ts', 'utf8')
const app = await readFile('src/App.tsx', 'utf8')
const mode = await readFile('src/lib/appMode.ts', 'utf8')
const kids = await readFile('src/lib/kidsStreaming.ts', 'utf8')
const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
const diagnostics = await readFile('src/components/DiagnosticsCard.tsx', 'utf8')

for (const marker of ['volatileStorage', 'safeLocalGet', 'safeLocalSet', 'safeLocalRemove', 'browserStoragePersistent', "storage.setItem(key, '1')"]) {
  if (!helper.includes(marker)) throw new Error(`Storage resilience audit failed: helper missing ${marker}`)
}
for (const [name, source] of [['storage.ts', storage], ['App.tsx', app], ['appMode.ts', mode], ['kidsStreaming.ts', kids]]) {
  if (source.includes('localStorage.getItem(') || source.includes('localStorage.setItem(') || source.includes('localStorage.removeItem(') || source.includes('window.localStorage.')) {
    throw new Error(`Storage resilience audit failed: unsafe direct localStorage access remains in ${name}`)
  }
}
for (const marker of ['safeLocalGet(', 'safeLocalSet(', 'safeLocalRemove(']) {
  if (!storage.includes(marker)) throw new Error(`Storage resilience audit failed: core storage missing ${marker}`)
}
if (sync.includes("localStorage.setItem('tv-phone:app-mode:v1'")) throw new Error('Storage resilience audit failed: account hydrate still has unsafe app-mode write')
for (const marker of ["Storage {persistentStorage ? 'persistent' : 'session only'}", 'Browser storage is unavailable or read-only', 'session-only']) {
  if (!diagnostics.includes(marker)) throw new Error(`Storage resilience audit failed: diagnostics missing ${marker}`)
}

console.log('TV Phone browser storage resilience audit passed.')
