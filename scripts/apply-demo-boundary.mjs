import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Demo boundary patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('reliability/sampleProvenance.ts', 'src/lib/sampleProvenance.ts')

let app = await readFile('src/App.tsx', 'utf8')
app = replaceOrFail(
  app,
  "import { storage } from './lib/storage'",
  "import { storage } from './lib/storage'\nimport { stripUntouchedSampleActivities, stripUntouchedSampleDevices } from './lib/sampleProvenance'",
  'App sample provenance import',
)
app = replaceOrFail(
  app,
  `  const [demoMode, setDemoMode] = useState(() => localStorage.getItem('tv-phone:demo') !== 'false')`,
  `  const [demoMode, setDemoMode] = useState(() => {\n    const explicit = localStorage.getItem('tv-phone:demo')\n    if (explicit !== null) return explicit !== 'false'\n    return stripUntouchedSampleDevices(devices).length === 0\n  })`,
  'demo default follows saved real setup',
)
app = replaceOrFail(
  app,
  `  useEffect(() => {\n    if (!account.syncGeneration) return\n    void manager.invalidate()\n    setLiveStates({})\n  }, [account.syncGeneration, manager])`,
  `  useEffect(() => {\n    if (!account.syncGeneration) return\n    void manager.invalidate()\n    setLiveStates({})\n    if (demoMode && stripUntouchedSampleDevices(devices).length > 0) {\n      setDemoMode(false)\n      localStorage.setItem('tv-phone:demo', 'false')\n      setStatusText('Account setup loaded · real-device mode enabled')\n    }\n  }, [account.syncGeneration, manager, demoMode, devices])`,
  'cloud hydrate exits demo for real account data',
)
app = replaceOrFail(
  app,
  `  const addDevice = (device: TvDevice) => {\n    if (device.host && devices.some((item) => item.kind === device.kind && item.host === device.host)) { setStatusText('That TV is already in your device list'); return }\n    persistDevices([...devices, device]); setStatusText(\`${'${device.name}'} added. Test the connection from Devices.\`)\n  }`,
  `  const addDevice = (device: TvDevice) => {\n    const baseDevices = stripUntouchedSampleDevices(devices)\n    if (device.host && baseDevices.some((item) => item.kind === device.kind && item.host === device.host)) { setStatusText('That TV is already in your device list'); return }\n    if (demoMode) setDemo(false)\n    const next = [...baseDevices, device]\n    persistDevices(next)\n    persistActivities(stripUntouchedSampleActivities(activities))\n    setActiveDeviceId(device.id); storage.saveActiveDeviceId(device.id)\n    setStatusText(\`${'${device.name}'} added. Real-device mode enabled. Test the connection from Devices.\`)\n  }`,
  'adding a real TV exits sample demo',
)
app = replaceOrFail(
  app,
  `  const restoreBackup = (backup: TvPhoneBackupV1) => {\n    const nextActiveDeviceId =`,
  `  const restoreBackup = (backup: TvPhoneBackupV1) => {\n    if (demoMode) setDemo(false)\n    const nextActiveDeviceId =`,
  'backup restore exits demo mode',
)
app = replaceOrFail(
  app,
  `  const saveDevice = (device: TvDevice) => {\n    const exists = devices.some((item) => item.id === device.id)\n    const next = exists ? devices.map((item) => item.id === device.id ? device : item) : [...devices, device]\n    persistDevices(next); void manager.invalidate(device.id)`,
  `  const saveDevice = (device: TvDevice) => {\n    const baseDevices = stripUntouchedSampleDevices(devices)\n    const exists = baseDevices.some((item) => item.id === device.id)\n    const next = exists ? baseDevices.map((item) => item.id === device.id ? device : item) : [...baseDevices, device]\n    if (demoMode) setDemo(false)\n    persistDevices(next); persistActivities(stripUntouchedSampleActivities(activities)); void manager.invalidate(device.id)`,
  'editing a real TV exits sample demo',
)
app = replaceOrFail(
  app,
  `  const setDemo = (value: boolean) => {\n    setDemoMode(value); localStorage.setItem('tv-phone:demo', String(value)); void manager.invalidate(); setLiveStates({})\n    setDevices((current) => { const next = current.map((device) => ({ ...device, connection: 'disconnected' as const })); storage.saveDevices(next); return next })\n    setStatusText(value ? 'Demo mode enabled' : 'Real-device mode enabled')\n  }`,
  `  const setDemo = (value: boolean) => {\n    setDemoMode(value); localStorage.setItem('tv-phone:demo', String(value)); void manager.invalidate(); setLiveStates({})\n    if (value) {\n      setDevices((current) => { const next = current.map((device) => ({ ...device, connection: 'disconnected' as const })); storage.saveDevices(next); return next })\n    } else {\n      const nextDevices = stripUntouchedSampleDevices(devices).map((device) => ({ ...device, connection: 'disconnected' as const }))\n      const nextActivities = stripUntouchedSampleActivities(activities)\n      setDevices(nextDevices); storage.saveDevices(nextDevices)\n      setActivities(nextActivities); storage.saveActivities(nextActivities)\n      const nextActiveId = nextDevices.some((device) => device.id === activeDeviceId) ? activeDeviceId : nextDevices[0]?.id ?? ''\n      setActiveDeviceId(nextActiveId)\n      if (nextActiveId) storage.saveActiveDeviceId(nextActiveId); else storage.clearActiveDeviceId()\n    }\n    setStatusText(value ? 'Demo mode enabled' : 'Real-device mode enabled')\n  }`,
  'real mode strips untouched samples',
)
await writeFile('src/App.tsx', app)

let sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
sync = replaceOrFail(
  sync,
  "import { storage } from './storage'",
  "import { storage } from './storage'\nimport { stripUntouchedSampleActivities, stripUntouchedSampleDevices } from './sampleProvenance'",
  'sync sample provenance import',
)
const stateStart = sync.indexOf('  const sanitizedDevices = current.devices.map(sanitizeDevice)')
const validActiveStart = sync.indexOf('  const validActive =', stateStart)
if (stateStart < 0 || validActiveStart < 0) throw new Error('Demo boundary patch failed: account sample-state block')
const stateBlock = `  const devices = stripUntouchedSampleDevices(current.devices).map(sanitizeDevice)\n  const activities = stripUntouchedSampleActivities(current.activities)\n`
sync = `${sync.slice(0, stateStart)}${stateBlock}${sync.slice(validActiveStart)}`
sync = replaceOrFail(
  sync,
  `      url: untouchedDemo ? '' : current.bridgeConfig.url.trim(),`,
  `      url: current.bridgeConfig.url.trim(),`,
  'bridge URL is user configuration, not sample data',
)
await writeFile('src/lib/useAccountSync.ts', sync)

console.log('Shared sample provenance and real-mode transition applied')
