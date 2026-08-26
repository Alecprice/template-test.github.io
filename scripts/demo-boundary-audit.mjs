import { readFile } from 'node:fs/promises'

const app = await readFile('src/App.tsx', 'utf8')
const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
const provenance = await readFile('src/lib/sampleProvenance.ts', 'utf8')

for (const marker of [
  "from './lib/sampleProvenance'",
  "setStatusText('Account setup loaded · real-device mode enabled')",
  'const baseDevices = stripUntouchedSampleDevices(devices)',
  'if (demoMode) setDemo(false)',
  'const nextDevices = stripUntouchedSampleDevices(devices)',
  'persistActivities(stripUntouchedSampleActivities(activities))',
]) {
  if (!app.includes(marker)) throw new Error(`Demo boundary audit failed: App missing ${marker}`)
}
for (const marker of [
  "from './sampleProvenance'",
  'const devices = stripUntouchedSampleDevices(current.devices).map(sanitizeDevice)',
  'const activities = stripUntouchedSampleActivities(current.activities)',
  'url: current.bridgeConfig.url.trim()',
]) {
  if (!sync.includes(marker)) throw new Error(`Demo boundary audit failed: sync missing ${marker}`)
}
for (const marker of [
  "from './sampleData'",
  'TRANSIENT_DEVICE_KEYS',
  'stableComparable',
  'isUntouchedSampleDevice',
  'isUntouchedSampleActivity',
  'stripUntouchedSampleDevices',
  'stripUntouchedSampleActivities',
]) {
  if (!provenance.includes(marker)) throw new Error(`Demo boundary audit failed: provenance helper missing ${marker}`)
}
for (const forbidden of ['demoFingerprintMatches', 'const demoDeviceIds', 'const untouchedDemo']) {
  if (sync.includes(forbidden)) throw new Error(`Demo boundary audit failed: legacy heuristic remains: ${forbidden}`)
}

console.log('TV Phone sample provenance and real-mode transition audit passed.')
