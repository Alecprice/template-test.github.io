import { copyFile, readFile, writeFile } from 'node:fs/promises'

await copyFile('modes/parentLock.ts', 'src/lib/parentLock.ts')
await copyFile('modes/KidsModeSettings.tsx', 'src/components/KidsModeSettings.tsx')

let styles = await readFile('src/styles.css', 'utf8')
if (!styles.includes('/* v0.8.7 Kids Safe parent PIN */')) {
  styles += `
/* v0.8.7 Kids Safe parent PIN */
.kids-pin-manager { display:grid; gap:10px; padding:12px; border:1px solid var(--line); border-radius:16px; background:rgba(127,139,160,.05); }
.kids-pin-manager__heading { display:flex; align-items:flex-start; gap:9px; }
.kids-pin-manager__heading > svg { width:18px; flex:0 0 18px; margin-top:1px; color:var(--accent); }
.kids-pin-manager__heading > div { display:grid; gap:2px; }
.kids-pin-manager__heading strong { font-size:11px; }
.kids-pin-manager__heading small { color:var(--muted); font-size:9px; line-height:1.45; }
.kids-pin-form { display:grid; grid-template-columns:1fr 1fr auto; gap:8px; align-items:end; }
.kids-pin-form label, .kids-pin-unlock { display:grid; gap:5px; }
.kids-pin-form label > span, .kids-pin-unlock > label { color:var(--muted); font-size:9px; font-weight:850; letter-spacing:.02em; }
.kids-pin-form input, .kids-pin-unlock input { width:100%; min-height:44px; border:1px solid var(--line); border-radius:12px; padding:0 11px; background:var(--panel); color:inherit; font:inherit; font-size:16px; letter-spacing:.12em; }
.kids-pin-form .button-primary { min-height:44px; white-space:nowrap; }
.kids-pin-unlock__row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; }
.kids-pin-unlock__row .button-primary { min-width:96px; }
.kids-remove-pin { min-height:40px; border:1px solid rgba(232,92,92,.2); border-radius:12px; background:transparent; color:#d85e67; font:inherit; font-size:9px; font-weight:850; cursor:pointer; }
.kids-pin-message { padding:9px 10px; border-radius:11px; background:rgba(69,173,119,.1); color:#3b9668; font-size:9px; font-weight:800; line-height:1.4; }
.kids-pin-message--error { background:rgba(232,92,92,.1); color:#d85e67; }
.kids-pin-form input:focus-visible, .kids-pin-unlock input:focus-visible, .kids-remove-pin:focus-visible { outline:3px solid rgba(85,213,242,.45); outline-offset:2px; }
html[data-app-mode='light'] .kids-pin-manager, html[data-app-mode='kids'] .kids-pin-manager { background:#f7fafc; }
html[data-app-mode='light'] .kids-pin-form input, html[data-app-mode='light'] .kids-pin-unlock input,
html[data-app-mode='kids'] .kids-pin-form input, html[data-app-mode='kids'] .kids-pin-unlock input { background:#fff; color:#172033; }
@media (max-width:560px) { .kids-pin-form { grid-template-columns:1fr 1fr; } .kids-pin-form .button-primary { grid-column:1 / -1; } }
@media (max-width:390px) { .kids-pin-form { grid-template-columns:1fr; } .kids-pin-form .button-primary { grid-column:auto; } .kids-pin-unlock__row { grid-template-columns:1fr; } .kids-pin-unlock__row .button-primary { min-height:46px; } }
`
  await writeFile('src/styles.css', styles)
}

console.log('Kids Safe parent PIN polish applied')
