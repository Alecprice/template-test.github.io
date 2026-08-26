import { readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Demo boundary patch failed: ${label}`)
  return source.replace(needle, replacement)
}

let app = await readFile('src/App.tsx', 'utf8')
app = replaceOrFail(
  app,
  `    keepAwake,\n    appMode,\n    kidsAllowedStreamingIds,`,
  `    keepAwake,\n    demoMode,\n    appMode,\n    kidsAllowedStreamingIds,`,
  'App account demo value',
)
app = replaceOrFail(
  app,
  `  const restoreBackup = (backup: TvPhoneBackupV1) => {\n    const nextActiveDeviceId =`,
  `  const restoreBackup = (backup: TvPhoneBackupV1) => {\n    setDemo(false)\n    const nextActiveDeviceId =`,
  'backup restore exits demo mode',
)
await writeFile('src/App.tsx', app)

let sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
sync = replaceOrFail(
  sync,
  `  keepAwake: boolean\n  appMode: AppMode\n  kidsAllowedStreamingIds: StreamingServiceId[]`,
  `  keepAwake: boolean\n  demoMode: boolean\n  appMode: AppMode\n  kidsAllowedStreamingIds: StreamingServiceId[]`,
  'sync demo option',
)
sync = replaceOrFail(
  sync,
  `'keepAwake' | 'appMode' | 'kidsAllowedStreamingIds' | 'bridgeConfig'>`,
  `'keepAwake' | 'demoMode' | 'appMode' | 'kidsAllowedStreamingIds' | 'bridgeConfig'>`,
  'sync account demo pick',
)

const demoStart = sync.indexOf(`  const demoDeviceIds = new Set(['samsung-living', 'fire-living', 'combo-living', 'fire-bedroom'])`)
const devicesStart = sync.indexOf('  const devices = untouchedDemo ? [] : sanitizedDevices', demoStart)
if (demoStart < 0 || devicesStart < 0) throw new Error('Demo boundary patch failed: existing demo fingerprint block')
const replacementBlock = `  const demoDeviceIds = new Set(['samsung-living', 'fire-living', 'combo-living', 'fire-bedroom'])\n  const demoActivityIds = new Set(['watch-fire', 'tv-only'])\n  const demoFingerprintMatches = sanitizedDevices.length === demoDeviceIds.size\n    && sanitizedDevices.every((device) => demoDeviceIds.has(device.id))\n    && current.activities.length === demoActivityIds.size\n    && current.activities.every((activity) => demoActivityIds.has(activity.id))\n  // demoMode is the primary provenance signal. The legacy fingerprint protects older\n  // local installs if a user turns demo mode off before replacing the sample data.\n  const untouchedDemo = current.demoMode || demoFingerprintMatches\n`
sync = `${sync.slice(0, demoStart)}${replacementBlock}${sync.slice(devicesStart)}`
sync = replaceOrFail(
  sync,
  'options.appMode, options.kidsAllowedStreamingIds, options.bridgeConfig.url, options.bridgeConfig.token, syncNow])',
  'options.demoMode, options.appMode, options.kidsAllowedStreamingIds, options.bridgeConfig.url, options.bridgeConfig.token, syncNow])',
  'sync demo dependency',
)
await writeFile('src/lib/useAccountSync.ts', sync)

console.log('Explicit demo/account sync boundary applied')
