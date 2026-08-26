import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Support diagnostics patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('support/DiagnosticsCard.tsx', 'src/components/DiagnosticsCard.tsx')

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')
settings = replaceOrFail(
  settings,
  "import { SetupGuideCard } from './SetupGuideCard'",
  "import { SetupGuideCard } from './SetupGuideCard'\nimport { DiagnosticsCard } from './DiagnosticsCard'",
  'Settings diagnostics import',
)
settings = replaceOrFail(
  settings,
  '      <SetupGuideCard devices={devices} bridgeConfig={bridgeConfig} />\n\n      <div className="settings-list">',
  '      <SetupGuideCard devices={devices} bridgeConfig={bridgeConfig} />\n\n      <DiagnosticsCard devices={devices} bridgeConfig={bridgeConfig} appMode={appMode} account={account} />\n\n      <div className="settings-list">',
  'Settings diagnostics placement',
)
await writeFile('src/components/SettingsView.tsx', settings)

let styles = await readFile('src/styles.css', 'utf8')
if (!styles.includes('/* v0.8.10 account and support diagnostics */')) {
  styles += `
/* v0.8.10 account and support diagnostics */
.account-auth-form { display:grid; gap:12px; }
.account-password-field { position:relative; }
.account-password-field input { width:100%; padding-right:48px; }
.account-password-toggle { position:absolute; inset:4px 4px 4px auto; width:40px; border:0; border-radius:10px; background:transparent; color:var(--muted); display:grid; place-items:center; cursor:pointer; }
.account-password-toggle svg { width:17px; height:17px; }
.account-password-toggle:focus-visible { outline:3px solid color-mix(in srgb,var(--accent) 44%,transparent); outline-offset:1px; }
.account-caps-lock { display:block; margin-top:5px; color:#d5962e !important; }
.diagnostics-card { display:grid; gap:12px; }
.diagnostics-card__hero { display:flex; align-items:flex-start; gap:11px; }
.diagnostics-card__icon { width:40px; height:40px; flex:0 0 40px; display:grid; place-items:center; border-radius:13px; background:rgba(85,213,242,.1); color:var(--accent); }
.diagnostics-card__icon svg { width:20px; }
.diagnostics-card__hero > div:last-child { display:grid; gap:4px; }
.diagnostics-card__hero strong { font-size:12px; }
.diagnostics-card__hero span { color:var(--muted); font-size:10px; line-height:1.5; }
.diagnostics-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:7px; }
.diagnostics-grid span { min-height:34px; display:flex; align-items:center; gap:6px; padding:8px 9px; border-radius:12px; background:rgba(127,139,160,.08); color:var(--muted); font-size:9px; font-weight:800; }
.diagnostics-grid svg { width:13px; height:13px; color:#4ea979; flex:0 0 13px; }
.diagnostics-warning { padding:9px 10px; border:1px solid rgba(226,156,44,.24); border-radius:12px; background:rgba(226,156,44,.08); color:#c98d2c; font-size:9px; line-height:1.45; }
.diagnostics-copy { width:100%; display:flex; align-items:center; justify-content:center; gap:7px; }
.diagnostics-copy svg { width:15px; }
.diagnostics-privacy { display:flex; align-items:flex-start; gap:7px; color:var(--muted); font-size:9px; line-height:1.45; }
.diagnostics-privacy svg { width:14px; flex:0 0 14px; color:#4ea979; }
html[data-app-mode='light'] .diagnostics-card, html[data-app-mode='kids'] .diagnostics-card { background:#fff; }
@media (max-width:420px) { .diagnostics-grid { grid-template-columns:1fr; } }
`
  await writeFile('src/styles.css', styles)
}

console.log('Account UX and privacy-safe support diagnostics applied')
