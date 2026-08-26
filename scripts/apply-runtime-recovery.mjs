import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Runtime recovery patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('recovery/AppErrorBoundary.tsx', 'src/components/AppErrorBoundary.tsx')

let main = await readFile('src/main.tsx', 'utf8')
main = replaceOrFail(
  main,
  "import App from './App'",
  "import App from './App'\nimport { AppErrorBoundary } from './components/AppErrorBoundary'",
  'main error boundary import',
)
main = replaceOrFail(
  main,
  '<App />',
  '<AppErrorBoundary><App /></AppErrorBoundary>',
  'main app boundary',
)
await writeFile('src/main.tsx', main)

let styles = await readFile('src/styles.css', 'utf8')
styles += `
/* v0.8.21 top-level runtime recovery */
.runtime-recovery { min-height:100dvh; display:grid; place-items:center; padding:24px; background:radial-gradient(circle at 50% 0%,rgba(114,102,255,.16),transparent 42%),var(--bg); color:inherit; }
.runtime-recovery__card { width:min(520px,100%); display:grid; gap:16px; padding:22px; border:1px solid var(--line); border-radius:24px; background:var(--panel); box-shadow:0 24px 70px rgba(0,0,0,.22); }
.runtime-recovery__icon { width:48px; height:48px; border-radius:16px; display:grid; place-items:center; background:rgba(234,166,55,.12); color:#d59225; }
.runtime-recovery__icon svg { width:23px; }
.runtime-recovery__copy { display:grid; gap:7px; }
.runtime-recovery__copy h1 { margin:0; font-size:22px; line-height:1.15; }
.runtime-recovery__copy p:not(.eyebrow) { margin:0; color:var(--muted); font-size:11px; line-height:1.55; }
.runtime-recovery__actions { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
.runtime-recovery__actions button { min-height:48px; display:flex; align-items:center; justify-content:center; gap:8px; }
.runtime-recovery__actions svg { width:16px; }
.runtime-recovery__safety { display:flex; align-items:flex-start; gap:8px; padding:11px; border-radius:13px; background:rgba(69,173,119,.08); color:var(--muted); font-size:9px; line-height:1.5; }
.runtime-recovery__safety svg { width:15px; flex:0 0 15px; color:#4ea979; }
html[data-app-mode='light'] .runtime-recovery__card, html[data-app-mode='kids'] .runtime-recovery__card { background:#fff; }
@media (max-width:460px) { .runtime-recovery { padding:14px; } .runtime-recovery__card { padding:18px; border-radius:20px; } .runtime-recovery__actions { grid-template-columns:1fr; } }
`
await writeFile('src/styles.css', styles)

console.log('Top-level runtime recovery boundary applied')
