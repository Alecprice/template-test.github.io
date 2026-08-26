import { copyFile, readFile, writeFile } from 'node:fs/promises'

await copyFile('pwa/PwaInstallCard.tsx', 'src/components/PwaInstallCard.tsx')

let vite = await readFile('vite.config.ts', 'utf8')
if (vite.includes("globPatterns: ['**/*.{js,css,html,svg,png,ico}']")) {
  vite = vite.replace("globPatterns: ['**/*.{js,css,html,svg,png,ico}']", "globPatterns: ['**/*.{js,css,html,ico}']")
  await writeFile('vite.config.ts', vite)
}

let styles = await readFile('src/styles.css', 'utf8')
if (!styles.includes('/* v0.8.9 PWA lifecycle status */')) {
  styles += `
/* v0.8.9 PWA lifecycle status */
.pwa-runtime-status { display:grid; grid-template-columns:34px minmax(0,1fr); gap:9px; align-items:center; padding:10px; border:1px solid var(--line); border-radius:14px; background:rgba(127,139,160,.06); }
.pwa-runtime-status > div { width:34px; height:34px; display:grid; place-items:center; border-radius:11px; background:rgba(69,173,119,.1); color:#4ea979; }
.pwa-runtime-status > div svg { width:17px; }
.pwa-runtime-status > span { display:grid; gap:2px; }
.pwa-runtime-status strong { font-size:10px; }
.pwa-runtime-status small { color:var(--muted); font-size:9px; line-height:1.4; }
.pwa-runtime-status--offline { border-color:rgba(234,166,55,.2); }
.pwa-runtime-status--offline > div { background:rgba(234,166,55,.1); color:#d59225; }
.pwa-update-button { width:100%; display:flex; align-items:center; justify-content:center; gap:7px; }
.pwa-update-button svg { width:15px; }
.pwa-update-button .is-spinning { animation:pwa-spin .9s linear infinite; }
@keyframes pwa-spin { to { transform:rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .pwa-update-button .is-spinning { animation:none; } }
html[data-app-mode='light'] .pwa-runtime-status, html[data-app-mode='kids'] .pwa-runtime-status { background:#f7fafc; }
`
  await writeFile('src/styles.css', styles)
}

console.log('PWA lifecycle status and update controls applied')
