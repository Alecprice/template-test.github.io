import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Kids streaming patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('modes/kidsStreaming.ts', 'src/lib/kidsStreaming.ts')
await copyFile('modes/KidsStreamingSettings.tsx', 'src/components/KidsStreamingSettings.tsx')

let app = await readFile('src/App.tsx', 'utf8')
const modeImport = app.split('\n').find((line) => line.includes("from './lib/appMode'"))
if (!modeImport) throw new Error('Kids streaming patch failed: App mode import')
app = app.replace(modeImport, `${modeImport}\nimport { loadKidsStreamingIds, normalizeKidsStreamingIds, saveKidsStreamingIds } from './lib/kidsStreaming'`)
app = replaceOrFail(
  app,
  `  const [appMode, setAppModeState] = useState<AppMode>(() => loadAppMode())\n  const setAppMode = (mode: AppMode) => setAppModeState(mode)`,
  `  const [appMode, setAppModeState] = useState<AppMode>(() => loadAppMode())\n  const [kidsAllowedStreamingIds, setKidsAllowedStreamingIdsState] = useState<StreamingServiceId[]>(() => loadKidsStreamingIds())\n  const setAppMode = (mode: AppMode) => setAppModeState(mode)\n  const setKidsAllowedStreamingIds = (ids: StreamingServiceId[]) => setKidsAllowedStreamingIdsState(normalizeKidsStreamingIds(ids))`,
  'App Kids streaming state',
)
app = replaceOrFail(
  app,
  `  useEffect(() => {\n    saveAppMode(appMode)\n    applyAppModeTheme(appMode)\n  }, [appMode])`,
  `  useEffect(() => {\n    saveAppMode(appMode)\n    applyAppModeTheme(appMode)\n  }, [appMode])\n\n  useEffect(() => {\n    saveKidsStreamingIds(kidsAllowedStreamingIds)\n  }, [kidsAllowedStreamingIds])`,
  'App Kids streaming persistence',
)
app = replaceOrFail(
  app,
  `    appMode,\n    bridgeConfig,`,
  `    appMode,\n    kidsAllowedStreamingIds,\n    bridgeConfig,`,
  'account Kids streaming value',
)
app = replaceOrFail(
  app,
  `    setAppMode: setAppModeState,\n    setBridgeConfig: setBridgeConfigState,`,
  `    setAppMode: setAppModeState,\n    setKidsAllowedStreamingIds: setKidsAllowedStreamingIdsState,\n    setBridgeConfig: setBridgeConfigState,`,
  'account Kids streaming setter',
)
app = replaceOrFail(
  app,
  `    if (!activeDevice || quickLaunchingId || launchingAppId) return\n    const service = getStreamingService(serviceId)`,
  `    if (!activeDevice || quickLaunchingId || launchingAppId) return\n    if (appMode === 'kids' && !kidsAllowedStreamingIds.includes(serviceId)) return\n    const service = getStreamingService(serviceId)`,
  'Kids quick launch guard',
)
app = app.replaceAll(
  '<KidsModeSettings mode={appMode} onChange={setAppMode} />',
  '<KidsModeSettings mode={appMode} onChange={setAppMode} allowedStreamingIds={kidsAllowedStreamingIds} onAllowedStreamingIds={setKidsAllowedStreamingIds} />',
)
app = app.replaceAll(
  'appMode={appMode} onAppMode={setAppMode}',
  'appMode={appMode} onAppMode={setAppMode} kidsAllowedStreamingIds={kidsAllowedStreamingIds} onKidsAllowedStreamingIds={setKidsAllowedStreamingIds}',
)
app = replaceOrFail(
  app,
  'quickLaunchingId={quickLaunchingId} />',
  "quickLaunchingId={quickLaunchingId} quickServiceIds={appMode === 'kids' ? kidsAllowedStreamingIds : undefined} quickLaunchEditable={appMode !== 'kids'} />",
  'Remote Kids streaming props',
)
await writeFile('src/App.tsx', app)

let remote = await readFile('src/components/RemoteView.tsx', 'utf8')
remote = replaceOrFail(
  remote,
  `  quickLaunchingId?: StreamingServiceId\n}`,
  `  quickLaunchingId?: StreamingServiceId\n  quickServiceIds?: StreamingServiceId[]\n  quickLaunchEditable?: boolean\n}`,
  'Remote streaming props',
)
remote = replaceOrFail(
  remote,
  'onLaunchQuickApp, quickLaunchingId }: Props)',
  'onLaunchQuickApp, quickLaunchingId, quickServiceIds, quickLaunchEditable = true }: Props)',
  'Remote streaming destructure',
)
remote = replaceOrFail(
  remote,
  `  const sortedDevices = useMemo(() => [...devices].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || a.room.localeCompare(b.room) || a.name.localeCompare(b.name)), [devices])`,
  `  const sortedDevices = useMemo(() => [...devices].sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || a.room.localeCompare(b.room) || a.name.localeCompare(b.name)), [devices])\n  const visibleStreamingServices = useMemo(() => quickServiceIds ? streamingServices.filter((service) => quickServiceIds.includes(service.id)) : streamingServices, [quickServiceIds])`,
  'Remote visible streaming services',
)
remote = replaceOrFail(
  remote,
  '<div className="streaming-shortcuts__heading"><span>QUICK LAUNCH</span><button onClick={onOpenApps}>Edit / all apps</button></div>',
  `<div className="streaming-shortcuts__heading"><span>{visibleStreamingServices.length ? 'QUICK LAUNCH' : 'NO KIDS APPS'}</span>{quickLaunchEditable && <button onClick={onOpenApps}>Edit / all apps</button>}</div>`,
  'Remote streaming heading',
)
remote = replaceOrFail(
  remote,
  '{streamingServices.map((service) => <button key={service.id}',
  '{visibleStreamingServices.map((service) => <button key={service.id}',
  'Remote filtered streaming map',
)
await writeFile('src/components/RemoteView.tsx', remote)

let kids = await readFile('src/components/KidsModeSettings.tsx', 'utf8')
kids = replaceOrFail(
  kids,
  "import { ModeSelector, type AppMode } from './ModeSelector'",
  "import { ModeSelector, type AppMode } from './ModeSelector'\nimport { KidsStreamingSettings } from './KidsStreamingSettings'\nimport type { StreamingServiceId } from '../lib/streamingServices'",
  'Kids settings streaming imports',
)
kids = replaceOrFail(
  kids,
  `  onChange: (mode: AppMode) => void\n}`,
  `  onChange: (mode: AppMode) => void\n  allowedStreamingIds: StreamingServiceId[]\n  onAllowedStreamingIds: (ids: StreamingServiceId[]) => void\n}`,
  'Kids settings streaming props',
)
kids = replaceOrFail(
  kids,
  'export function KidsModeSettings({ mode, onChange }: Props) {',
  'export function KidsModeSettings({ mode, onChange, allowedStreamingIds, onAllowedStreamingIds }: Props) {',
  'Kids settings streaming destructure',
)
kids = replaceOrFail(
  kids,
  '          <ModeSelector mode={mode} onChange={onChange} compact />',
  '          <ModeSelector mode={mode} onChange={onChange} compact />\n          <KidsStreamingSettings allowedIds={allowedStreamingIds} onChange={onAllowedStreamingIds} compact />',
  'Kids unlocked streaming controls',
)
await writeFile('src/components/KidsModeSettings.tsx', kids)

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')
settings = replaceOrFail(
  settings,
  "import { ModeSelector, type AppMode } from './ModeSelector'",
  "import { ModeSelector, type AppMode } from './ModeSelector'\nimport { KidsStreamingSettings } from './KidsStreamingSettings'\nimport type { StreamingServiceId } from '../lib/streamingServices'",
  'Full settings streaming imports',
)
settings = replaceOrFail(
  settings,
  `  onAppMode: (mode: AppMode) => void\n`,
  `  onAppMode: (mode: AppMode) => void\n  kidsAllowedStreamingIds: StreamingServiceId[]\n  onKidsAllowedStreamingIds: (ids: StreamingServiceId[]) => void\n`,
  'Full settings streaming props',
)
const settingsSignature = settings.split('\n').find((line) => line.startsWith('export function SettingsView({'))
if (!settingsSignature || !settingsSignature.includes('appMode, onAppMode,')) throw new Error('Kids streaming patch failed: Settings signature')
settings = settings.replace(settingsSignature, settingsSignature.replace('appMode, onAppMode,', 'appMode, onAppMode, kidsAllowedStreamingIds, onKidsAllowedStreamingIds,'))
settings = replaceOrFail(
  settings,
  '      <ModeSelector mode={appMode} onChange={onAppMode} />',
  '      <ModeSelector mode={appMode} onChange={onAppMode} />\n\n      <KidsStreamingSettings allowedIds={kidsAllowedStreamingIds} onChange={onKidsAllowedStreamingIds} />',
  'Full settings streaming placement',
)
await writeFile('src/components/SettingsView.tsx', settings)

let sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
sync = replaceOrFail(
  sync,
  "import type { AppMode } from './appMode'",
  "import type { AppMode } from './appMode'\nimport { normalizeKidsStreamingIds, saveKidsStreamingIds } from './kidsStreaming'\nimport type { StreamingServiceId } from './streamingServices'",
  'sync Kids streaming imports',
)
sync = replaceOrFail(
  sync,
  `    appMode: AppMode\n  }`,
  `    appMode: AppMode\n    kidsAllowedStreamingIds: StreamingServiceId[]\n  }`,
  'sync Kids preference type',
)
sync = replaceOrFail(
  sync,
  `  appMode: AppMode\n  bridgeConfig: BridgeConfig`,
  `  appMode: AppMode\n  kidsAllowedStreamingIds: StreamingServiceId[]\n  bridgeConfig: BridgeConfig`,
  'sync Kids option value',
)
sync = replaceOrFail(
  sync,
  `  setAppMode: Dispatch<SetStateAction<AppMode>>\n  setBridgeConfig: Dispatch<SetStateAction<BridgeConfig>>`,
  `  setAppMode: Dispatch<SetStateAction<AppMode>>\n  setKidsAllowedStreamingIds: Dispatch<SetStateAction<StreamingServiceId[]>>\n  setBridgeConfig: Dispatch<SetStateAction<BridgeConfig>>`,
  'sync Kids option setter',
)
sync = replaceOrFail(
  sync,
  "'keepAwake' | 'appMode' | 'bridgeConfig'>",
  "'keepAwake' | 'appMode' | 'kidsAllowedStreamingIds' | 'bridgeConfig'>",
  'sync Kids account state pick',
)
sync = replaceOrFail(
  sync,
  `      appMode: current.appMode,\n`,
  `      appMode: current.appMode,\n      kidsAllowedStreamingIds: normalizeKidsStreamingIds(current.kidsAllowedStreamingIds),\n`,
  'sync serialize Kids streaming',
)
const parseModeLine = sync.split('\n').find((line) => line.includes("appMode: raw.preferences?.appMode === 'kids'"))
if (!parseModeLine) throw new Error('Kids streaming patch failed: sync parse mode line')
sync = sync.replace(parseModeLine, `${parseModeLine}\n      kidsAllowedStreamingIds: normalizeKidsStreamingIds(raw.preferences?.kidsAllowedStreamingIds),`)
sync = replaceOrFail(
  sync,
  `    current.setAppMode(state.preferences.appMode)\n    current.setBridgeConfig(bridgeConfig)`,
  `    current.setAppMode(state.preferences.appMode)\n    current.setKidsAllowedStreamingIds(state.preferences.kidsAllowedStreamingIds)\n    saveKidsStreamingIds(state.preferences.kidsAllowedStreamingIds)\n    current.setBridgeConfig(bridgeConfig)`,
  'sync hydrate Kids streaming',
)
const privateSaveLine = sync.split('\n').find((line) => line.includes('savePrivateCache(userId, { ...current') && line.includes('appMode: state.preferences.appMode'))
if (privateSaveLine && !privateSaveLine.includes('kidsAllowedStreamingIds')) {
  sync = sync.replace(privateSaveLine, privateSaveLine.replace('appMode: state.preferences.appMode,', 'appMode: state.preferences.appMode, kidsAllowedStreamingIds: state.preferences.kidsAllowedStreamingIds,'))
}
sync = replaceOrFail(
  sync,
  'options.appMode, options.bridgeConfig.url, options.bridgeConfig.token, syncNow])',
  'options.appMode, options.kidsAllowedStreamingIds, options.bridgeConfig.url, options.bridgeConfig.token, syncNow])',
  'sync Kids dependency',
)
const signoutModeCleanup = "safeRemoveLocal('tv-phone:app-mode:v1')"
if (!sync.includes(signoutModeCleanup)) throw new Error('Kids streaming patch failed: signout mode cleanup marker')
sync = sync.replace(signoutModeCleanup, `${signoutModeCleanup}\n      safeRemoveLocal('tv-phone:kids-streaming:v1')`)
await writeFile('src/lib/useAccountSync.ts', sync)

let styles = await readFile('src/styles.css', 'utf8')
styles += `
/* v0.8.13 parent-managed Kids Safe streaming */
.kids-streaming-settings { margin:0 0 18px; padding:14px; border:1px solid var(--line); border-radius:18px; background:var(--panel); display:grid; gap:12px; }
.kids-streaming-settings--compact { margin:0; background:rgba(127,139,160,.04); }
.kids-streaming-settings__heading { display:flex; align-items:flex-start; gap:10px; }
.kids-streaming-settings__heading > span { width:36px; height:36px; flex:0 0 36px; border-radius:11px; display:grid; place-items:center; background:rgba(85,213,242,.12); color:var(--accent); }
.kids-streaming-settings__heading svg { width:17px; }
.kids-streaming-settings__heading > div { display:grid; gap:3px; }
.kids-streaming-settings__heading strong { font-size:12px; }
.kids-streaming-settings__heading small, .kids-streaming-settings__note { color:var(--muted); font-size:9px; line-height:1.45; }
.kids-streaming-settings__actions { display:flex; gap:7px; }
.kids-streaming-settings__actions button { min-height:34px; padding:7px 10px; border:1px solid var(--line); border-radius:10px; background:transparent; color:var(--muted); font:inherit; font-size:9px; font-weight:850; cursor:pointer; }
.kids-streaming-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px; }
.kids-streaming-grid > button { min-height:48px; min-width:0; display:grid; grid-template-columns:30px minmax(0,1fr) 20px; align-items:center; gap:7px; padding:8px; border:1px solid var(--line); border-radius:13px; background:rgba(127,139,160,.05); color:var(--muted); font:inherit; font-size:9px; font-weight:850; text-align:left; cursor:pointer; }
.kids-streaming-grid > button.allowed { border-color:rgba(69,173,119,.28); background:rgba(69,173,119,.08); color:inherit; }
.kids-streaming-grid__badge { width:30px; height:30px; border-radius:9px; display:grid; place-items:center; background:rgba(127,139,160,.1); font-size:9px; font-weight:950; overflow:hidden; }
.kids-streaming-grid i { width:20px; height:20px; display:grid; place-items:center; border-radius:999px; background:rgba(127,139,160,.08); }
.kids-streaming-grid button.allowed i { background:rgba(69,173,119,.16); color:#4ea979; }
.kids-streaming-grid i svg { width:12px; }
html[data-app-mode='light'] .kids-streaming-settings, html[data-app-mode='kids'] .kids-streaming-settings { background:#fff; }
@media (max-width:390px) { .kids-streaming-grid { grid-template-columns:1fr; } }
`
await writeFile('src/styles.css', styles)

console.log('Parent-managed Kids Safe streaming allowlist applied')
