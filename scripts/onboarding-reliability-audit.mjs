import { readFile } from 'node:fs/promises'

const app = await readFile('src/App.tsx', 'utf8')
const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

const requiredApp = [
  'app-shell--empty',
  'No TVs added yet',
  "setTab('settings')",
  'Parent controls',
  'empty-onboarding__settings',
  '<BottomNav active={tab} onChange={setTab} appMode={appMode} />',
]
for (const marker of requiredApp) {
  if (!app.includes(marker)) throw new Error(`Onboarding reliability audit failed: App missing ${marker}`)
}
if (app.includes('<main className="fatal-state"><h1>No devices</h1>')) {
  throw new Error('Onboarding reliability audit failed: legacy no-device fatal screen remains')
}

const requiredSync = [
  'untouchedDemo',
  "'samsung-living'",
  "'fire-living'",
  "'combo-living'",
  "'fire-bedroom'",
  "'watch-fire'",
  "'tv-only'",
  'const devices = untouchedDemo ? [] : sanitizedDevices',
  'const activities = untouchedDemo ? [] : current.activities',
  "url: untouchedDemo ? '' : current.bridgeConfig.url.trim()",
]
for (const marker of requiredSync) {
  if (!sync.includes(marker)) throw new Error(`Onboarding reliability audit failed: sync missing ${marker}`)
}
const requiredStyles = [
  '.empty-onboarding__settings',
  "html[data-app-mode='kids'] .empty-onboarding > .button-primary",
]
for (const marker of requiredStyles) {
  if (!styles.includes(marker)) throw new Error(`Onboarding reliability audit failed: styles missing ${marker}`)
}

console.log('TV Phone onboarding reliability audit passed.')
