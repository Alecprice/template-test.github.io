import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Fire TV reliability patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('firetv/TransportHealthCard.tsx', 'src/components/TransportHealthCard.tsx')

let app = await readFile('src/App.tsx', 'utf8')
const settingsLine = app.split('\n').find((line) => line.includes("tab === 'settings'") && line.includes('<SettingsView') && line.includes('appMode'))
if (!settingsLine) throw new Error('Fire TV reliability patch failed: SettingsView render line not found')
const replacementLine = settingsLine.replace('bridgeConfig={bridgeConfig}', 'bridgeConfig={bridgeConfig} devices={devices}')
app = app.replace(settingsLine, replacementLine)
await writeFile('src/App.tsx', app)

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')
settings = replaceOrFail(
  settings,
  "import type { BridgeConfig } from '../types/remote'",
  "import type { BridgeConfig, TvDevice } from '../types/remote'",
  'Settings device type import',
)
settings = replaceOrFail(
  settings,
  "import { ModeSelector, type AppMode } from './ModeSelector'",
  "import { ModeSelector, type AppMode } from './ModeSelector'\nimport { TransportHealthCard } from './TransportHealthCard'",
  'Settings connection doctor import',
)
settings = replaceOrFail(
  settings,
  '  bridgeConfig: BridgeConfig\n',
  '  bridgeConfig: BridgeConfig\n  devices: TvDevice[]\n',
  'Settings devices prop',
)
settings = replaceOrFail(
  settings,
  'export function SettingsView({ demoMode, haptics, keepAwake, bridgeConfig, account, appMode, onAppMode, onDemoMode, onHaptics, onKeepAwake, onBridgeConfig, onReset }: Props) {',
  'export function SettingsView({ demoMode, haptics, keepAwake, bridgeConfig, devices, account, appMode, onAppMode, onDemoMode, onHaptics, onKeepAwake, onBridgeConfig, onReset }: Props) {',
  'Settings devices destructure',
)
settings = replaceOrFail(
  settings,
  '      <ModeSelector mode={appMode} onChange={onAppMode} />\n\n      <div className="settings-list">',
  '      <ModeSelector mode={appMode} onChange={onAppMode} />\n\n      <TransportHealthCard devices={devices} bridgeConfig={bridgeConfig} />\n\n      <div className="settings-list">',
  'Connection doctor placement',
)
await writeFile('src/components/SettingsView.tsx', settings)

let styles = await readFile('src/styles.css', 'utf8')
if (!styles.includes('/* v0.8.3 Fire TV transport diagnostics */')) {
  styles += `\n/* v0.8.3 Fire TV transport diagnostics */\n.transport-health { margin:0 0 18px; padding:14px; border:1px solid var(--line); border-radius:18px; background:var(--panel); display:grid; grid-template-columns:40px minmax(0,1fr); gap:11px; box-shadow:0 12px 30px rgba(0,0,0,.06); }\n.transport-health__icon { width:40px; height:40px; border-radius:13px; display:grid; place-items:center; background:rgba(91,203,232,.1); color:var(--accent); }\n.transport-health__icon svg { width:20px; height:20px; }\n.transport-health__body { min-width:0; display:grid; gap:6px; }\n.transport-health__body strong { font-size:12px; }\n.transport-health__body p { margin:0; color:var(--muted); font-size:10px; line-height:1.5; }\n.transport-health__facts { display:flex; flex-wrap:wrap; gap:6px; margin-top:3px; }\n.transport-health__facts span { min-height:28px; display:inline-flex; align-items:center; gap:5px; padding:5px 8px; border-radius:999px; background:rgba(127,139,160,.08); color:var(--muted); font-size:9px; font-weight:800; }\n.transport-health__facts svg { width:12px; height:12px; }\n.transport-health--warn { border-color:rgba(234,166,55,.25); }\n.transport-health--warn .transport-health__icon { background:rgba(234,166,55,.1); color:#d59225; }\n.transport-health--error { border-color:rgba(232,92,92,.28); }\n.transport-health--error .transport-health__icon { background:rgba(232,92,92,.1); color:#df5d5d; }\nhtml[data-app-mode='light'] .transport-health, html[data-app-mode='kids'] .transport-health { background:#fff; }\n@media (max-width:420px) { .transport-health { grid-template-columns:34px minmax(0,1fr); } .transport-health__icon { width:34px; height:34px; border-radius:11px; } }\n`
  await writeFile('src/styles.css', styles)
}

console.log('Fire TV transport reliability diagnostics applied')
