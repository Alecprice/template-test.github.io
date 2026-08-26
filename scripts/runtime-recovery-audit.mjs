import { readFile } from 'node:fs/promises'

const main = await readFile('src/main.tsx', 'utf8')
const boundary = await readFile('src/components/AppErrorBoundary.tsx', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

for (const marker of ["import { AppErrorBoundary } from './components/AppErrorBoundary'", '<AppErrorBoundary><App /></AppErrorBoundary>']) {
  if (!main.includes(marker)) throw new Error(`Runtime recovery audit failed: main missing ${marker}`)
}
for (const marker of ['getDerivedStateFromError', 'componentDidCatch', 'navigator.serviceWorker.getRegistrations()', 'caches.keys()', 'Reload TV Phone', 'Repair cached app', 'does not clear local TV setup']) {
  if (!boundary.includes(marker)) throw new Error(`Runtime recovery audit failed: boundary missing ${marker}`)
}
for (const forbidden of ['localStorage.clear(', 'sessionStorage.clear(', 'indexedDB.deleteDatabase(']) {
  if (boundary.includes(forbidden)) throw new Error(`Runtime recovery audit failed: destructive recovery operation ${forbidden}`)
}
for (const marker of ['.runtime-recovery', '.runtime-recovery__actions', '@media (max-width:460px)']) {
  if (!styles.includes(marker)) throw new Error(`Runtime recovery audit failed: styles missing ${marker}`)
}

console.log('TV Phone top-level runtime recovery audit passed.')
