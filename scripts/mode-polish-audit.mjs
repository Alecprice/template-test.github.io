import fs from 'node:fs'

const failures = []
const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''

const kids = read('src/components/KidsModeSettings.tsx')
for (const marker of ['HOLD_MS = 1600', 'UNLOCK_WINDOW_MS = 20_000', 'onPointerDown={startHold}', 'onKeyDown=', 'not a parental-control PIN or security boundary']) {
  if (!kids.includes(marker)) failures.push(`Kids Safe unlock guard missing: ${marker}`)
}

const html = read('index.html')
for (const marker of ['tv-phone-mode-bootstrap', 'tv-phone:app-mode:v1', 'document.documentElement.dataset.appMode']) {
  if (!html.includes(marker)) failures.push(`Early mode bootstrap missing: ${marker}`)
}

const styles = read('src/styles.css')
for (const marker of ['kids-unlock-progress', 'touch-action:none', 'prefers-reduced-motion', "html[data-app-mode='light'] input", "html[data-app-mode='kids'] input"]) {
  if (!styles.includes(marker)) failures.push(`Mode polish styling missing: ${marker}`)
}

if (failures.length) {
  console.error('TV Phone mode polish audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('TV Phone mode polish audit passed.')
