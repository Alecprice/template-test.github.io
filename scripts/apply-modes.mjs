import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Mode patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('modes/appMode.ts', 'src/lib/appMode.ts')
await copyFile('modes/ModeSelector.tsx', 'src/components/ModeSelector.tsx')
await copyFile('modes/KidsModeSettings.tsx', 'src/components/KidsModeSettings.tsx')

let main = await readFile('src/main.tsx', 'utf8')
main = replaceOrFail(
  main,
  "import App from './App'",
  "import App from './App'\nimport { applyAppModeTheme, loadAppMode } from './lib/appMode'",
  'main mode import',
)
main = replaceOrFail(
  main,
  'registerSW({ immediate: true })',
  'applyAppModeTheme(loadAppMode())\nregisterSW({ immediate: true })',
  'main mode bootstrap',
)
await writeFile('src/main.tsx', main)

let app = await readFile('src/App.tsx', 'utf8')
app = replaceOrFail(
  app,
  "import { useAccountSync } from './lib/useAccountSync'",
  "import { useAccountSync } from './lib/useAccountSync'\nimport { applyAppModeTheme, loadAppMode, saveAppMode, type AppMode } from './lib/appMode'\nimport { KidsModeSettings } from './components/KidsModeSettings'",
  'App mode imports',
)
app = replaceOrFail(
  app,
  '  useWakeLock(keepAwake)\n\n  const account = useAccountSync({',
  `  useWakeLock(keepAwake)\n\n  const [appMode, setAppModeState] = useState<AppMode>(() => loadAppMode())\n  const setAppMode = (mode: AppMode) => setAppModeState(mode)\n\n  useEffect(() => {\n    saveAppMode(appMode)\n    applyAppModeTheme(appMode)\n  }, [appMode])\n\n  useEffect(() => {\n    if (appMode === 'kids' && tab !== 'remote' && tab !== 'settings') setTab('remote')\n  }, [appMode, tab])\n\n  const account = useAccountSync({`,
  'App mode state',
)
app = replaceOrFail(
  app,
  '    haptics,\n    keepAwake,\n    bridgeConfig,',
  '    haptics,\n    keepAwake,\n    appMode,\n    bridgeConfig,',
  'App mode account value',
)
app = replaceOrFail(
  app,
  '    setHaptics,\n    setKeepAwake,\n    setBridgeConfig: setBridgeConfigState,',
  '    setHaptics,\n    setKeepAwake,\n    setAppMode: setAppModeState,\n    setBridgeConfig: setBridgeConfigState,',
  'App mode account setter',
)
app = replaceOrFail(
  app,
  "          {tab === 'settings' && <SettingsView demoMode={demoMode} haptics={haptics} keepAwake={keepAwake} bridgeConfig={bridgeConfig} account={account} onDemoMode={setDemo} onHaptics={setHaptic} onKeepAwake={setAwake} onBridgeConfig={setBridgeConfig} onReset={reset} />}",
  "          {tab === 'settings' && (appMode === 'kids' ? <KidsModeSettings mode={appMode} onChange={setAppMode} /> : <SettingsView demoMode={demoMode} haptics={haptics} keepAwake={keepAwake} bridgeConfig={bridgeConfig} account={account} appMode={appMode} onAppMode={setAppMode} onDemoMode={setDemo} onHaptics={setHaptic} onKeepAwake={setAwake} onBridgeConfig={setBridgeConfig} onReset={reset} />)}",
  'App settings mode routing',
)
await writeFile('src/App.tsx', app)

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')
settings = replaceOrFail(
  settings,
  "import { PwaInstallCard } from './PwaInstallCard'",
  "import { PwaInstallCard } from './PwaInstallCard'\nimport { ModeSelector, type AppMode } from './ModeSelector'",
  'Settings mode import',
)
settings = replaceOrFail(
  settings,
  '  account: AccountPanelProps\n',
  '  account: AccountPanelProps\n  appMode: AppMode\n  onAppMode: (mode: AppMode) => void\n',
  'Settings mode props',
)
settings = replaceOrFail(
  settings,
  'export function SettingsView({ demoMode, haptics, keepAwake, bridgeConfig, account, onDemoMode, onHaptics, onKeepAwake, onBridgeConfig, onReset }: Props) {',
  'export function SettingsView({ demoMode, haptics, keepAwake, bridgeConfig, account, appMode, onAppMode, onDemoMode, onHaptics, onKeepAwake, onBridgeConfig, onReset }: Props) {',
  'Settings mode destructure',
)
settings = replaceOrFail(
  settings,
  '      <div className="settings-list">',
  '      <ModeSelector mode={appMode} onChange={onAppMode} />\n\n      <div className="settings-list">',
  'Settings mode selector placement',
)
await writeFile('src/components/SettingsView.tsx', settings)

let sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
sync = replaceOrFail(
  sync,
  "import { storage } from './storage'",
  "import { storage } from './storage'\nimport type { AppMode } from './appMode'",
  'sync mode import',
)
sync = replaceOrFail(
  sync,
  '    haptics: boolean\n    keepAwake: boolean\n',
  '    haptics: boolean\n    keepAwake: boolean\n    appMode: AppMode\n',
  'sync state mode type',
)
sync = replaceOrFail(
  sync,
  '  haptics: boolean\n  keepAwake: boolean\n  bridgeConfig: BridgeConfig\n',
  '  haptics: boolean\n  keepAwake: boolean\n  appMode: AppMode\n  bridgeConfig: BridgeConfig\n',
  'sync options mode value',
)
sync = replaceOrFail(
  sync,
  '  setHaptics: Dispatch<SetStateAction<boolean>>\n  setKeepAwake: Dispatch<SetStateAction<boolean>>\n  setBridgeConfig: Dispatch<SetStateAction<BridgeConfig>>\n',
  '  setHaptics: Dispatch<SetStateAction<boolean>>\n  setKeepAwake: Dispatch<SetStateAction<boolean>>\n  setAppMode: Dispatch<SetStateAction<AppMode>>\n  setBridgeConfig: Dispatch<SetStateAction<BridgeConfig>>\n',
  'sync options mode setter',
)
sync = replaceOrFail(
  sync,
  "function toAccountState(current: Pick<Options, 'devices' | 'activities' | 'activeDeviceId' | 'haptics' | 'keepAwake' | 'bridgeConfig'>): AccountStateV1 {",
  "function toAccountState(current: Pick<Options, 'devices' | 'activities' | 'activeDeviceId' | 'haptics' | 'keepAwake' | 'appMode' | 'bridgeConfig'>): AccountStateV1 {",
  'sync account state pick',
)
sync = replaceOrFail(
  sync,
  '      haptics: current.haptics,\n      keepAwake: current.keepAwake,\n',
  '      haptics: current.haptics,\n      keepAwake: current.keepAwake,\n      appMode: current.appMode,\n',
  'sync serialize mode',
)
sync = replaceOrFail(
  sync,
  '      haptics: raw.preferences?.haptics !== false,\n      keepAwake: raw.preferences?.keepAwake !== false,\n',
  "      haptics: raw.preferences?.haptics !== false,\n      keepAwake: raw.preferences?.keepAwake !== false,\n      appMode: raw.preferences?.appMode === 'kids' || raw.preferences?.appMode === 'light' || raw.preferences?.appMode === 'dark' ? raw.preferences.appMode : 'dark',\n",
  'sync parse mode',
)
sync = replaceOrFail(
  sync,
  '    current.setHaptics(state.preferences.haptics)\n    current.setKeepAwake(state.preferences.keepAwake)\n    current.setBridgeConfig(bridgeConfig)\n',
  '    current.setHaptics(state.preferences.haptics)\n    current.setKeepAwake(state.preferences.keepAwake)\n    current.setAppMode(state.preferences.appMode)\n    current.setBridgeConfig(bridgeConfig)\n',
  'sync hydrate mode',
)
sync = replaceOrFail(
  sync,
  "    localStorage.setItem('tv-phone:haptics', String(state.preferences.haptics))\n    localStorage.setItem('tv-phone:keep-awake', String(state.preferences.keepAwake))\n",
  "    localStorage.setItem('tv-phone:haptics', String(state.preferences.haptics))\n    localStorage.setItem('tv-phone:keep-awake', String(state.preferences.keepAwake))\n    localStorage.setItem('tv-phone:app-mode:v1', state.preferences.appMode)\n",
  'sync persist hydrated mode',
)
sync = replaceOrFail(
  sync,
  'options.haptics, options.keepAwake, options.bridgeConfig.url, options.bridgeConfig.token, syncNow])',
  'options.haptics, options.keepAwake, options.appMode, options.bridgeConfig.url, options.bridgeConfig.token, syncNow])',
  'sync mode dependency',
)
sync = replaceOrFail(
  sync,
  "      localStorage.removeItem('tv-phone:keep-awake')",
  "      localStorage.removeItem('tv-phone:keep-awake')\n      localStorage.removeItem('tv-phone:app-mode:v1')",
  'sync signout mode cleanup',
)
await writeFile('src/lib/useAccountSync.ts', sync)

let styles = await readFile('src/styles.css', 'utf8')
styles += `
/* v0.8 three-mode experience */
.mode-card { margin:0 0 18px; border:1px solid var(--line); border-radius:20px; background:var(--panel); padding:14px; box-shadow:0 12px 30px rgba(0,0,0,.08); }
.mode-card__heading { display:flex; align-items:center; gap:11px; margin-bottom:12px; }
.mode-card__heading > span:last-child { display:grid; gap:3px; }
.mode-card__heading strong { font-size:13px; }
.mode-card__heading small, .mode-detail { color:var(--muted); font-size:10px; line-height:1.45; }
.mode-detail { margin:9px 2px 0; }
.mode-segmented { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; padding:4px; border:1px solid var(--line); border-radius:15px; background:rgba(127,139,160,.07); }
.mode-segmented button { min-width:0; min-height:52px; border:0; border-radius:11px; background:transparent; color:var(--muted); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; cursor:pointer; font-size:9px; font-weight:850; }
.mode-segmented button svg { width:17px; height:17px; }
.mode-segmented button.active { background:linear-gradient(145deg,var(--accent),var(--accent-2)); color:#071018; box-shadow:0 7px 18px rgba(83,111,255,.18); }
.kids-shield { width:52px; height:52px; border-radius:17px; display:grid; place-items:center; background:linear-gradient(145deg,#6bdcff,#8b72ff); color:#071018; }
.kids-shield svg { width:25px; }
.kids-safe-note { margin-top:12px; border:1px solid rgba(58,170,220,.16); border-radius:17px; background:rgba(58,170,220,.06); padding:14px; display:grid; gap:5px; }
.kids-safe-note strong { font-size:12px; }
.kids-safe-note span { color:var(--muted); font-size:10px; line-height:1.5; }
.kids-safe-note--caution { border-color:rgba(234,166,55,.2); background:rgba(234,166,55,.07); }

html[data-app-mode='light'], html[data-app-mode='kids'] { --bg:#f5f7fb; --panel:#ffffff; --panel-2:#edf2f8; --line:rgba(25,39,64,.12); --muted:#657187; --accent:#43c7e8; --accent-2:#7266ff; color:#172033; background:#f5f7fb; }
html[data-app-mode='kids'] { --bg:#eef8ff; --panel:#ffffff; --panel-2:#e8f5ff; --line:rgba(44,87,130,.14); --muted:#5b6d82; --accent:#55d5f2; --accent-2:#8c78ff; }
html[data-app-mode='light'] body, html[data-app-mode='kids'] body { background:radial-gradient(circle at 50% -10%,#e5efff 0,var(--bg) 40%); color:#172033; }
html[data-app-mode='light'] .remote-button, html[data-app-mode='kids'] .remote-button,
html[data-app-mode='light'] .quick-controls button, html[data-app-mode='kids'] .quick-controls button,
html[data-app-mode='light'] .rocker-card, html[data-app-mode='kids'] .rocker-card,
html[data-app-mode='light'] .device-card, html[data-app-mode='kids'] .device-card,
html[data-app-mode='light'] .activity-card, html[data-app-mode='kids'] .activity-card,
html[data-app-mode='light'] .settings-list, html[data-app-mode='kids'] .settings-list,
html[data-app-mode='light'] .sheet, html[data-app-mode='kids'] .sheet,
html[data-app-mode='light'] .settings-panel, html[data-app-mode='kids'] .settings-panel,
html[data-app-mode='light'] .app-tile, html[data-app-mode='kids'] .app-tile,
html[data-app-mode='light'] .input-source-grid button, html[data-app-mode='kids'] .input-source-grid button { background:#fff; color:#172033; box-shadow:0 10px 25px rgba(40,67,105,.08); }
html[data-app-mode='light'] .dpad, html[data-app-mode='kids'] .dpad { background:radial-gradient(circle at 50% 45%,#ffffff,#e9f0f8 72%); box-shadow:inset 0 1px #fff,0 18px 42px rgba(48,72,105,.15); }
html[data-app-mode='light'] .dpad__select, html[data-app-mode='kids'] .dpad__select { background:linear-gradient(145deg,#ffffff,#e2e9f2); color:#172033; box-shadow:0 8px 20px rgba(42,66,100,.12); }
html[data-app-mode='light'] .connection-strip, html[data-app-mode='kids'] .connection-strip,
html[data-app-mode='light'] .live-state-card, html[data-app-mode='kids'] .live-state-card,
html[data-app-mode='light'] .remote-mode-tabs, html[data-app-mode='kids'] .remote-mode-tabs { background:rgba(255,255,255,.75); color:#5b687d; }
html[data-app-mode='light'] .remote-mode-tabs button.active, html[data-app-mode='kids'] .remote-mode-tabs button.active { background:#fff; color:#172033; }
html[data-app-mode='light'] .bottom-nav, html[data-app-mode='kids'] .bottom-nav { background:rgba(250,252,255,.94); border-color:rgba(25,39,64,.1); }
html[data-app-mode='light'] .bottom-nav button.active, html[data-app-mode='kids'] .bottom-nav button.active { color:#15617a; background:linear-gradient(180deg,rgba(67,199,232,.14),rgba(114,102,255,.05)); }
html[data-app-mode='light'] .sheet textarea, html[data-app-mode='kids'] .sheet textarea,
html[data-app-mode='light'] .form-stack input, html[data-app-mode='kids'] .form-stack input,
html[data-app-mode='light'] .form-stack select, html[data-app-mode='kids'] .form-stack select,
html[data-app-mode='light'] .bridge-inline-config input, html[data-app-mode='kids'] .bridge-inline-config input,
html[data-app-mode='light'] .settings-panel input, html[data-app-mode='kids'] .settings-panel input { background:#f6f8fc; color:#172033; border-color:rgba(25,39,64,.13); }
html[data-app-mode='light'] .button-secondary, html[data-app-mode='kids'] .button-secondary,
html[data-app-mode='light'] .voice-record-button, html[data-app-mode='kids'] .voice-record-button,
html[data-app-mode='light'] .voice-speak-button, html[data-app-mode='kids'] .voice-speak-button,
html[data-app-mode='light'] .keypad-tools button, html[data-app-mode='kids'] .keypad-tools button,
html[data-app-mode='light'] .keypad-grid button, html[data-app-mode='kids'] .keypad-grid button { background:#f3f6fb; color:#243047; }
html[data-app-mode='light'] .touchpad, html[data-app-mode='kids'] .touchpad { background:radial-gradient(circle at 50% 15%,#ffffff,#e7eef7 76%); color:#617086; }
html[data-app-mode='light'] .sheet-close, html[data-app-mode='kids'] .sheet-close { background:#eef2f7; color:#5c687d; }
html[data-app-mode='light'] .eyebrow, html[data-app-mode='kids'] .eyebrow { color:#64758d; }
html[data-app-mode='light'] .device-picker, html[data-app-mode='kids'] .device-picker { color:#172033; }
html[data-app-mode='light'] .remote-button--danger, html[data-app-mode='kids'] .remote-button--danger { color:#d64050; background:#fff2f3; }

html[data-app-mode='kids'] .bottom-nav { grid-template-columns:repeat(2,1fr); }
html[data-app-mode='kids'] .bottom-nav button:nth-child(2), html[data-app-mode='kids'] .bottom-nav button:nth-child(3),
html[data-app-mode='kids'] .remote-button--danger,
html[data-app-mode='kids'] .quick-controls,
html[data-app-mode='kids'] .connection-strip__host,
html[data-app-mode='kids'] .streaming-shortcuts__heading button,
html[data-app-mode='kids'] .live-state-card__age { display:none !important; }
html[data-app-mode='kids'] .remote-header::after { content:'Kids Safe'; flex:0 0 auto; border:1px solid rgba(73,160,207,.18); background:#fff; color:#39708d; border-radius:999px; padding:7px 10px; font-size:9px; font-weight:900; letter-spacing:.04em; }
html[data-app-mode='kids'] .dpad { width:min(84vw,330px); }
html[data-app-mode='kids'] .navigation-row, html[data-app-mode='kids'] .media-row { width:min(100%,390px); }
html[data-app-mode='kids'] .navigation-row .remote-button, html[data-app-mode='kids'] .media-row .remote-button { width:58px; height:58px; }
html[data-app-mode='kids'] .rocker-card { grid-template-rows:auto repeat(3,56px); }
html[data-app-mode='kids'] .streaming-chip { min-height:60px; min-width:112px; background:#fff; color:#213049; }
html[data-app-mode='kids'] .remote-page { padding-bottom:36px; }

@media (max-width:460px) { .mode-segmented button { min-height:58px; font-size:9px; } .mode-card { border-radius:18px; } }
`
await writeFile('src/styles.css', styles)

console.log('Three-mode experience patch applied')
