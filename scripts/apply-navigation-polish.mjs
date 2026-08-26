import { copyFile, readFile, writeFile } from 'node:fs/promises'

await copyFile('navigation/BottomNav.tsx', 'src/components/BottomNav.tsx')

let app = await readFile('src/App.tsx', 'utf8')
const oldNav = '<BottomNav active={tab} onChange={setTab} />'
const occurrences = app.split(oldNav).length - 1
if (occurrences < 2) throw new Error(`Navigation polish failed: expected two BottomNav renders, found ${occurrences}`)
app = app.replaceAll(oldNav, '<BottomNav active={tab} onChange={setTab} appMode={appMode} />')
await writeFile('src/App.tsx', app)

let styles = await readFile('src/styles.css', 'utf8')
const brittleSelector = "html[data-app-mode='kids'] .bottom-nav button:nth-child(2), html[data-app-mode='kids'] .bottom-nav button:nth-child(3),\n"
if (!styles.includes(brittleSelector)) throw new Error('Navigation polish failed: legacy Kids Safe position selector not found')
styles = styles.replace(brittleSelector, '')
styles += `
/* v0.8.5 semantic bottom navigation */
.bottom-nav--2 { grid-template-columns:repeat(2,minmax(0,1fr)); }
.bottom-nav--4 { grid-template-columns:repeat(4,minmax(0,1fr)); }
.bottom-nav button { touch-action:manipulation; -webkit-tap-highlight-color:transparent; }
.bottom-nav button:focus-visible { outline:3px solid var(--accent); outline-offset:-4px; border-radius:14px; }
.bottom-nav button[aria-current='page'] span { font-weight:900; }
@media (max-width:380px) { .bottom-nav button { min-width:0; } .bottom-nav button span { font-size:9px; } }
`
await writeFile('src/styles.css', styles)

console.log('Semantic navigation polish applied')
