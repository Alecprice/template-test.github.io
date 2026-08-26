import { readFile } from 'node:fs/promises'

const app = await readFile('src/App.tsx', 'utf8')
const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')

for (const marker of [
  'demoMode,\n    appMode,',
  'setDemo(false)',
]) {
  if (!app.includes(marker)) throw new Error(`Demo boundary audit failed: App missing ${marker}`)
}
for (const marker of [
  'demoMode: boolean',
  "'keepAwake' | 'demoMode' | 'appMode'",
  'const demoFingerprintMatches =',
  'const untouchedDemo = current.demoMode || demoFingerprintMatches',
  'const devices = untouchedDemo ? [] : sanitizedDevices',
  'const activities = untouchedDemo ? [] : current.activities',
  "url: untouchedDemo ? '' : current.bridgeConfig.url.trim()",
  'options.demoMode, options.appMode, options.kidsAllowedStreamingIds',
]) {
  if (!sync.includes(marker)) throw new Error(`Demo boundary audit failed: sync missing ${marker}`)
}
if (sync.includes("safeGetLocal('tv-phone:demo') !== 'false'")) {
  throw new Error('Demo boundary audit failed: cloud filtering still depends on the mutable demo preference flag')
}

console.log('TV Phone explicit demo/account boundary audit passed.')
