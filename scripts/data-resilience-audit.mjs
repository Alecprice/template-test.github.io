import { readFile } from 'node:fs/promises'

const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')

const required = [
  'function safeGetLocal',
  'function safeSetLocal',
  'function safeRemoveLocal',
  'const latestVersionRef = useRef(0)',
  "version <= latestVersionRef.current",
  'latestVersionRef.current = Math.max(latestVersionRef.current, row.version)',
  'applyState(user.id, state, remote.updated_at, remote.version)',
  'applyState(user.id, state, row.updated_at, row.version)',
  "safeGetLocal('tv-phone:demo')",
  "safeSetLocal('tv-phone:haptics'",
  "safeSetLocal('tv-phone:keep-awake'",
]
for (const marker of required) {
  if (!sync.includes(marker)) throw new Error(`Data resilience audit failed: missing ${marker}`)
}

if (sync.includes("localStorage.removeItem('tv-phone:haptics')") || sync.includes("localStorage.removeItem('tv-phone:keep-awake')")) {
  throw new Error('Data resilience audit failed: unsafe preference removal remains')
}

const staleGuardIndex = sync.indexOf("row.version <= latestVersionRef.current")
const realtimeApplyIndex = sync.indexOf('applyState(user.id, state, row.updated_at, row.version)')
if (staleGuardIndex < 0 || realtimeApplyIndex < 0 || staleGuardIndex > realtimeApplyIndex) {
  throw new Error('Data resilience audit failed: realtime version guard must run before state application')
}

console.log('TV Phone data resilience audit passed.')
