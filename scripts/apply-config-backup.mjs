import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Config backup patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('backup/configBackup.ts', 'src/lib/configBackup.ts')
await copyFile('backup/BackupCard.tsx', 'src/components/BackupCard.tsx')

let app = await readFile('src/App.tsx', 'utf8')
const kidsImport = app.split('\n').find((line) => line.includes("from './lib/kidsStreaming'"))
if (!kidsImport) throw new Error('Config backup patch failed: App Kids streaming import')
app = app.replace(kidsImport, `${kidsImport}\nimport type { TvPhoneBackupV1 } from './lib/configBackup'`)
app = replaceOrFail(
  app,
  `  const toggleFavorite = (id: string) => persistDevices(devices.map((device) => device.id === id ? { ...device, favorite: !device.favorite } : device))`,
  `  const restoreBackup = (backup: TvPhoneBackupV1) => {\n    const nextActiveDeviceId = backup.devices.some((device) => device.id === backup.activeDeviceId) ? backup.activeDeviceId : backup.devices[0]?.id ?? ''\n    setDevices(backup.devices)\n    storage.saveDevices(backup.devices)\n    setActivities(backup.activities)\n    storage.saveActivities(backup.activities)\n    setActiveDeviceId(nextActiveDeviceId)\n    if (nextActiveDeviceId) storage.saveActiveDeviceId(nextActiveDeviceId)\n    else storage.clearActiveDeviceId()\n    setHaptic(backup.preferences.haptics)\n    setAwake(backup.preferences.keepAwake)\n    setAppMode(backup.preferences.appMode)\n    setKidsAllowedStreamingIds(backup.preferences.kidsAllowedStreamingIds)\n    setApps([])\n    setAppsOpen(false)\n    setLiveStates({})\n    void manager.invalidate()\n    setStatusText(\`Backup restored. Re-pair TVs on this device when required.\`)\n  }\n\n  const toggleFavorite = (id: string) => persistDevices(devices.map((device) => device.id === id ? { ...device, favorite: !device.favorite } : device))`,
  'App restore handler',
)
app = app.split('\n').map((line) => {
  if (!line.includes('<SettingsView')) return line
  let next = line
  if (!next.includes('devices={devices}')) next = next.replace('bridgeConfig={bridgeConfig}', 'bridgeConfig={bridgeConfig} devices={devices}')
  if (!next.includes('activities={activities}')) next = next.replace('devices={devices}', 'devices={devices} activities={activities} activeDeviceId={activeDeviceId}')
  if (!next.includes('onRestoreBackup={restoreBackup}')) next = next.replace('onReset={reset}', 'onRestoreBackup={restoreBackup} onReset={reset}')
  return next
}).join('\n')
await writeFile('src/App.tsx', app)

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')
settings = replaceOrFail(
  settings,
  "import type { BridgeConfig, TvDevice } from '../types/remote'",
  "import type { Activity, BridgeConfig, TvDevice } from '../types/remote'",
  'Settings activity type import',
)
const diagnosticImport = settings.split('\n').find((line) => line.includes("from './DiagnosticsCard'"))
if (!diagnosticImport) throw new Error('Config backup patch failed: Settings diagnostics import')
settings = settings.replace(diagnosticImport, `${diagnosticImport}\nimport { BackupCard } from './BackupCard'\nimport type { TvPhoneBackupV1 } from '../lib/configBackup'`)
settings = replaceOrFail(
  settings,
  `  devices: TvDevice[]\n`,
  `  devices: TvDevice[]\n  activities: Activity[]\n  activeDeviceId: string\n  onRestoreBackup: (backup: TvPhoneBackupV1) => void\n`,
  'Settings backup props',
)
const signature = settings.split('\n').find((line) => line.startsWith('export function SettingsView({'))
if (!signature || !signature.includes('devices,')) throw new Error('Config backup patch failed: Settings signature')
settings = settings.replace(signature, signature.replace('devices,', 'devices, activities, activeDeviceId, onRestoreBackup,'))
settings = replaceOrFail(
  settings,
  '      <DiagnosticsCard devices={devices} bridgeConfig={bridgeConfig} appMode={appMode} account={account} />',
  `      <DiagnosticsCard devices={devices} bridgeConfig={bridgeConfig} appMode={appMode} account={account} />\n\n      <BackupCard devices={devices} activities={activities} activeDeviceId={activeDeviceId} haptics={haptics} keepAwake={keepAwake} appMode={appMode} kidsAllowedStreamingIds={kidsAllowedStreamingIds} onRestore={onRestoreBackup} />`,
  'Settings backup placement',
)
await writeFile('src/components/SettingsView.tsx', settings)

let styles = await readFile('src/styles.css', 'utf8')
styles += `
/* v0.8.14 safe configuration backup */
.backup-card { display:grid; gap:12px; }
.backup-card__hero { display:flex; align-items:flex-start; gap:11px; }
.backup-card__icon { width:40px; height:40px; flex:0 0 40px; border-radius:13px; display:grid; place-items:center; background:rgba(114,102,255,.1); color:var(--accent-2); }
.backup-card__icon svg { width:20px; }
.backup-card__hero > div:last-child { display:grid; gap:4px; }
.backup-card__hero strong { font-size:12px; }
.backup-card__hero span, .backup-card__privacy { color:var(--muted); font-size:9px; line-height:1.5; }
.backup-card__actions, .backup-preview__buttons { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
.backup-card__actions button, .backup-preview__buttons button { display:flex; align-items:center; justify-content:center; gap:7px; min-height:44px; }
.backup-card__actions svg, .backup-preview__buttons svg { width:15px; }
.backup-file-input { display:none !important; }
.backup-preview { padding:11px; border:1px solid rgba(69,173,119,.24); border-radius:14px; background:rgba(69,173,119,.07); display:grid; gap:10px; }
.backup-preview > div:first-child { display:grid; gap:3px; }
.backup-preview strong { font-size:11px; }
.backup-preview span { color:var(--muted); font-size:9px; }
.backup-card__privacy { display:flex; align-items:flex-start; gap:7px; padding:10px; border-radius:12px; background:rgba(127,139,160,.06); }
.backup-card__privacy svg { width:14px; flex:0 0 14px; color:#4ea979; }
.backup-message { color:#4ea979 !important; }
.backup-error { color:#df5d5d !important; }
html[data-app-mode='light'] .backup-card, html[data-app-mode='kids'] .backup-card { background:#fff; }
@media (max-width:440px) { .backup-card__actions, .backup-preview__buttons { grid-template-columns:1fr; } }
`
await writeFile('src/styles.css', styles)

console.log('Secret-stripped configuration backup applied')
