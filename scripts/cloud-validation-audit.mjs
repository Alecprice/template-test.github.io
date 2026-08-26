import { readFile } from 'node:fs/promises'

const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')

for (const marker of [
  'MAX_CLOUD_STATE_BYTES = 524_288',
  'MAX_CLOUD_DEVICES = 64',
  'MAX_CLOUD_ACTIVITIES = 250',
  'MAX_CLOUD_STEPS = 120',
  'MAX_CLOUD_BRIDGE_URL_LENGTH = 2_048',
  'devices.push(sanitizeDevice(entry as TvDevice))',
  'if (deviceIds.has(id)) return undefined',
  'if (activityIds.has(id)) return undefined',
  'if (!Array.isArray(steps) || steps.length > MAX_CLOUD_STEPS) return undefined',
  "kind !== 'samsung' && kind !== 'firetv' && kind !== 'combo'",
  'normalizeKidsStreamingIds(raw.preferences?.kidsAllowedStreamingIds)',
]) {
  if (!sync.includes(marker)) throw new Error(`Cloud validation audit failed: missing ${marker}`)
}

if (sync.includes('devices: raw.devices')) throw new Error('Cloud validation audit failed: raw cloud device array is still trusted directly')
if (!sync.includes("throw new Error('Cloud profile uses an unsupported data format')")) throw new Error('Cloud validation audit failed: invalid cloud states do not fail closed')

console.log('TV Phone defensive cloud-state validation audit passed.')
