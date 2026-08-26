import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Device recovery patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('recovery/DeviceRecoveryCard.tsx', 'src/components/DeviceRecoveryCard.tsx')

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')
settings = replaceOrFail(
  settings,
  "import { SetupGuideCard } from './SetupGuideCard'",
  "import { SetupGuideCard } from './SetupGuideCard'\nimport { DeviceRecoveryCard } from './DeviceRecoveryCard'",
  'Settings recovery import',
)
settings = replaceOrFail(
  settings,
  '      <SetupGuideCard devices={devices} bridgeConfig={bridgeConfig} />',
  '      <SetupGuideCard devices={devices} bridgeConfig={bridgeConfig} />\n\n      <DeviceRecoveryCard devices={devices} bridgeConfig={bridgeConfig} />',
  'Settings recovery placement',
)
await writeFile('src/components/SettingsView.tsx', settings)

let styles = await readFile('src/styles.css', 'utf8')
if (!styles.includes('/* v0.8.19 TV repair plan */')) {
  styles += `
/* v0.8.19 TV repair plan */
.device-recovery-card { display:grid; gap:13px; }
.device-recovery-card__hero { display:grid; grid-template-columns:40px minmax(0,1fr); gap:11px; align-items:start; }
.device-recovery-card__hero-icon { width:40px; height:40px; display:grid; place-items:center; border-radius:13px; background:rgba(85,213,242,.1); color:var(--accent); }
.device-recovery-card__hero-icon svg { width:19px; }
.device-recovery-card__hero > div:last-child { display:grid; gap:4px; }
.device-recovery-card__hero strong { font-size:12px; }
.device-recovery-card__hero span { color:var(--muted); font-size:9px; line-height:1.45; }
.device-recovery-summary { display:flex; flex-wrap:wrap; gap:6px; }
.device-recovery-summary span { min-height:30px; display:inline-flex; align-items:center; gap:5px; padding:5px 8px; border-radius:999px; background:rgba(127,139,160,.08); color:var(--muted); font-size:9px; font-weight:850; }
.device-recovery-summary span.ok { background:rgba(69,173,119,.1); color:#4ea979; }
.device-recovery-summary span.warn { background:rgba(232,92,92,.09); color:#d85e67; }
.device-recovery-summary span.verify { background:rgba(234,166,55,.1); color:#d59225; }
.device-recovery-summary svg { width:12px; height:12px; }
.device-recovery-list { display:grid; gap:8px; }
.device-recovery-item { border:1px solid var(--line); border-radius:14px; overflow:hidden; background:rgba(127,139,160,.04); }
.device-recovery-item--action { border-color:rgba(232,92,92,.2); background:rgba(232,92,92,.045); }
.device-recovery-item--verify { border-color:rgba(234,166,55,.18); background:rgba(234,166,55,.045); }
.device-recovery-item summary { list-style:none; min-height:54px; display:grid; grid-template-columns:32px minmax(0,1fr); gap:9px; align-items:center; padding:9px 10px; cursor:pointer; }
.device-recovery-item summary::-webkit-details-marker { display:none; }
.device-recovery-item__icon { width:32px; height:32px; display:grid; place-items:center; border-radius:10px; background:rgba(69,173,119,.1); color:#4ea979; }
.device-recovery-item--action .device-recovery-item__icon { background:rgba(232,92,92,.09); color:#d85e67; }
.device-recovery-item--verify .device-recovery-item__icon { background:rgba(234,166,55,.1); color:#d59225; }
.device-recovery-item__icon svg { width:15px; }
.device-recovery-item summary > span:last-child { display:grid; gap:2px; min-width:0; }
.device-recovery-item summary strong { font-size:10px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.device-recovery-item summary small { color:var(--muted); font-size:9px; line-height:1.35; }
.device-recovery-item p { margin:0; padding:0 10px 11px 51px; color:var(--muted); font-size:9px; line-height:1.5; }
.device-recovery-note { display:flex; gap:7px; align-items:flex-start; color:var(--muted); font-size:9px; line-height:1.45; }
.device-recovery-note svg { width:14px; flex:0 0 14px; color:#4ea979; }
html[data-app-mode='light'] .device-recovery-card, html[data-app-mode='kids'] .device-recovery-card { background:#fff; }
@media (max-width:420px) { .device-recovery-summary { display:grid; grid-template-columns:1fr; } .device-recovery-summary span { width:100%; } .device-recovery-item p { padding-left:10px; } }
`
  await writeFile('src/styles.css', styles)
}

console.log('Per-TV repair plan applied')
