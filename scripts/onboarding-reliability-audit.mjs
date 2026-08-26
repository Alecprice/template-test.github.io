import { readFile } from 'node:fs/promises'

const app = await readFile('src/App.tsx', 'utf8')
const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

const requiredApp = [
  'app-shell--empty',
  'No TVs added yet',
  "setTab('settings')",
  "appMode !== 'kids'",
  'Parent controls',
  '<BottomNav active={tab} onChange={setTab} />',
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
if (!styles.includes('.empty-onboarding__actions')) throw new Error('Onboarding reliability audit failed: empty state styles missing')

console.log('TV Phone onboarding reliability audit passed.')
