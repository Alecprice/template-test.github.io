import { readFile } from 'node:fs/promises'

const nav = await readFile('src/components/BottomNav.tsx', 'utf8')
const app = await readFile('src/App.tsx', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

const requiredNav = [
  "appMode === 'kids'",
  "id === 'remote' || id === 'settings'",
  "aria-current={active === id ? 'page' : undefined}",
  'data-visible-tabs={visibleTabs.length}',
  'type="button"',
]
for (const marker of requiredNav) {
  if (!nav.includes(marker)) throw new Error(`Navigation polish audit failed: BottomNav missing ${marker}`)
}
if ((app.match(/appMode=\{appMode\}/g) ?? []).length < 2) {
  throw new Error('Navigation polish audit failed: app mode not passed to both navigation renders')
}
if (styles.includes(".bottom-nav button:nth-child(2)") || styles.includes(".bottom-nav button:nth-child(3)")) {
  throw new Error('Navigation polish audit failed: brittle Kids Safe nth-child navigation remains')
}
for (const marker of ['.bottom-nav--2', '.bottom-nav--4', '.bottom-nav button:focus-visible']) {
  if (!styles.includes(marker)) throw new Error(`Navigation polish audit failed: styles missing ${marker}`)
}

console.log('TV Phone semantic navigation audit passed.')
