import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Setup guide patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('setup/SetupGuideCard.tsx', 'src/components/SetupGuideCard.tsx')

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')
settings = replaceOrFail(
  settings,
  "import { TransportHealthCard } from './TransportHealthCard'",
  "import { TransportHealthCard } from './TransportHealthCard'\nimport { SetupGuideCard } from './SetupGuideCard'",
  'Settings setup guide import',
)
settings = replaceOrFail(
  settings,
  '      <TransportHealthCard devices={devices} bridgeConfig={bridgeConfig} />\n\n      <div className="settings-list">',
  '      <TransportHealthCard devices={devices} bridgeConfig={bridgeConfig} />\n\n      <SetupGuideCard devices={devices} bridgeConfig={bridgeConfig} />\n\n      <div className="settings-list">',
  'Settings setup guide placement',
)
await writeFile('src/components/SettingsView.tsx', settings)

let styles = await readFile('src/styles.css', 'utf8')
if (!styles.includes('/* v0.8.8 real TV setup guide */')) {
  styles += `
/* v0.8.8 real TV setup guide */
.setup-guide-card { display:grid; gap:14px; }
.setup-guide-card__hero { display:flex; gap:11px; align-items:flex-start; }
.setup-guide-card__hero-icon { width:40px; height:40px; flex:0 0 40px; display:grid; place-items:center; border-radius:13px; background:rgba(85,213,242,.1); color:var(--accent); }
.setup-guide-card__hero-icon svg { width:20px; }
.setup-guide-card__hero > div:last-child { display:grid; gap:4px; }
.setup-guide-card__hero strong { font-size:12px; }
.setup-guide-card__hero span { color:var(--muted); font-size:10px; line-height:1.5; }
.setup-guide-status { display:flex; flex-wrap:wrap; gap:6px; }
.setup-guide-status span { min-height:30px; display:inline-flex; align-items:center; gap:5px; padding:5px 8px; border-radius:999px; background:rgba(127,139,160,.08); color:var(--muted); font-size:9px; font-weight:800; }
.setup-guide-status span.ok { background:rgba(69,173,119,.1); color:#4ea979; }
.setup-guide-status svg { width:12px; height:12px; }
.setup-guide-warning { display:grid; grid-template-columns:28px minmax(0,1fr); gap:9px; padding:11px; border:1px solid rgba(232,92,92,.2); border-radius:14px; background:rgba(232,92,92,.07); }
.setup-guide-warning > svg { width:18px; color:#d85e67; margin-top:1px; }
.setup-guide-warning > div { display:grid; gap:3px; }
.setup-guide-warning strong { font-size:10px; }
.setup-guide-warning span { color:var(--muted); font-size:9px; line-height:1.45; }
.setup-guide-steps { list-style:none; margin:0; padding:0; display:grid; gap:9px; }
.setup-guide-steps li { display:grid; grid-template-columns:28px minmax(0,1fr); gap:9px; align-items:start; }
.setup-guide-steps li > span { width:28px; height:28px; display:grid; place-items:center; border-radius:10px; background:rgba(85,213,242,.1); color:var(--accent); font-size:9px; font-weight:900; }
.setup-guide-steps li > div { display:grid; gap:2px; padding-top:1px; }
.setup-guide-steps strong { font-size:10px; }
.setup-guide-steps small { color:var(--muted); font-size:9px; line-height:1.45; }
.setup-guide-advanced { border-top:1px solid var(--line); padding-top:10px; }
.setup-guide-advanced summary { display:flex; align-items:center; gap:7px; cursor:pointer; color:inherit; font-size:10px; font-weight:850; }
.setup-guide-advanced summary svg { width:15px; }
.setup-guide-advanced pre { overflow:auto; margin:10px 0 8px; padding:11px; border-radius:12px; background:#090c13; color:#d7e2f0; font-size:10px; line-height:1.55; }
.setup-guide-copy { width:100%; display:flex; align-items:center; justify-content:center; gap:7px; }
.setup-guide-copy svg { width:15px; }
.setup-guide-security { display:flex; align-items:flex-start; gap:7px; color:var(--muted); font-size:9px; line-height:1.45; }
.setup-guide-security svg { width:14px; flex:0 0 14px; color:#4ea979; }
html[data-app-mode='light'] .setup-guide-card, html[data-app-mode='kids'] .setup-guide-card { background:#fff; }
@media (max-width:420px) { .setup-guide-status { display:grid; grid-template-columns:1fr; } .setup-guide-status span { width:100%; justify-content:flex-start; } }
`
  await writeFile('src/styles.css', styles)
}

console.log('Real TV setup guide applied')
