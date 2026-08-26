import { readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Onboarding reliability patch failed: ${label}`)
  return source.replace(needle, replacement)
}

let app = await readFile('src/App.tsx', 'utf8')
const fatalStart = app.indexOf('<main className="fatal-state">')
const noDevicesIndex = app.indexOf('No devices', Math.max(0, fatalStart))
const fatalEnd = fatalStart >= 0 ? app.indexOf('</main>', noDevicesIndex) : -1
if (fatalStart < 0 || noDevicesIndex < 0 || fatalEnd < 0) {
  throw new Error('Onboarding reliability patch failed: zero-device state')
}
const originalFatal = app.slice(fatalStart, fatalEnd + '</main>'.length)
let emptyState = originalFatal
  .replace('<main className="fatal-state">', '<section className="fatal-state empty-onboarding" aria-labelledby="empty-onboarding-title">')
  .replace(/<h1>\s*No devices\s*<\/h1>/, '<p className="eyebrow">TV PHONE</p><h1 id="empty-onboarding-title">No TVs added yet</h1>')
  .replace(/<p>\s*Add a Samsung TV, Fire TV, or combined setup to start\.\s*<\/p>/, `<p>{appMode === 'kids' ? 'Ask an adult to switch to a Full mode before adding or configuring a TV.' : 'Add a Samsung TV, Fire TV, or combined setup to start using the remote.'}</p>`)
  .replace('</main>', `<button className="button-secondary empty-onboarding__settings" onClick={() => setTab('settings')}>{appMode === 'kids' ? 'Parent controls' : 'Open settings'}</button></section>`)
if (!emptyState.includes('No TVs added yet') || !emptyState.includes('empty-onboarding__settings')) {
  throw new Error('Onboarding reliability patch failed: empty state copy/actions')
}
const replacement = `<div className="app-shell app-shell--empty">
      <main className="main-content">
        {tab === 'settings' ? (
          appMode === 'kids'
            ? <KidsModeSettings mode={appMode} onChange={setAppMode} />
            : <SettingsView demoMode={demoMode} haptics={haptics} keepAwake={keepAwake} bridgeConfig={bridgeConfig} devices={devices} account={account} appMode={appMode} onAppMode={setAppMode} onDemoMode={setDemo} onHaptics={setHaptic} onKeepAwake={setAwake} onBridgeConfig={setBridgeConfig} onReset={reset} />
        ) : (
          ${emptyState}
        )}
      </main>
      <BottomNav active={tab} onChange={setTab} />
    </div>`
app = `${app.slice(0, fatalStart)}${replacement}${app.slice(fatalEnd + '</main>'.length)}`
await writeFile('src/App.tsx', app)

let sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
sync = replaceOrFail(
  sync,
  `function toAccountState(current: Pick<Options, 'devices' | 'activities' | 'activeDeviceId' | 'haptics' | 'keepAwake' | 'appMode' | 'bridgeConfig'>): AccountStateV1 {\n  const devices = current.devices.map(sanitizeDevice)\n  const validActive = devices.some((device) => device.id === current.activeDeviceId)\n    ? current.activeDeviceId\n    : devices[0]?.id ?? ''`,
  `function toAccountState(current: Pick<Options, 'devices' | 'activities' | 'activeDeviceId' | 'haptics' | 'keepAwake' | 'appMode' | 'bridgeConfig'>): AccountStateV1 {\n  const sanitizedDevices = current.devices.map(sanitizeDevice)\n  const demoDeviceIds = new Set(['samsung-living', 'fire-living', 'combo-living', 'fire-bedroom'])\n  const demoActivityIds = new Set(['watch-fire', 'tv-only'])\n  const untouchedDemo = typeof localStorage !== 'undefined'\n    && localStorage.getItem('tv-phone:demo') !== 'false'\n    && sanitizedDevices.length === demoDeviceIds.size\n    && sanitizedDevices.every((device) => demoDeviceIds.has(device.id))\n    && current.activities.length === demoActivityIds.size\n    && current.activities.every((activity) => demoActivityIds.has(activity.id))\n  const devices = untouchedDemo ? [] : sanitizedDevices\n  const activities = untouchedDemo ? [] : current.activities\n  const validActive = devices.some((device) => device.id === current.activeDeviceId)\n    ? current.activeDeviceId\n    : devices[0]?.id ?? ''`,
  'untouched demo detection',
)
sync = replaceOrFail(
  sync,
  `    activities: current.activities,\n    activeDeviceId: validActive,`,
  `    activities,\n    activeDeviceId: validActive,`,
  'clean demo activities',
)
sync = replaceOrFail(
  sync,
  `    bridge: {\n      url: current.bridgeConfig.url.trim(),\n    },`,
  `    bridge: {\n      url: untouchedDemo ? '' : current.bridgeConfig.url.trim(),\n    },`,
  'clean demo bridge',
)
await writeFile('src/lib/useAccountSync.ts', sync)

let styles = await readFile('src/styles.css', 'utf8')
styles += `
/* v0.8.4 empty onboarding reliability */
.app-shell--empty .main-content { display:grid; align-items:center; }
.empty-onboarding { width:min(100% - 28px,560px); margin:0 auto; min-height:0; border:1px solid var(--line); border-radius:24px; background:var(--panel); padding:28px 22px; text-align:center; box-shadow:0 18px 48px rgba(0,0,0,.12); }
.empty-onboarding .eyebrow { margin-bottom:8px; }
.empty-onboarding h1 { margin:0 0 8px; }
.empty-onboarding p:not(.eyebrow) { max-width:440px; margin:0 auto; color:var(--muted); line-height:1.55; }
.empty-onboarding > .button-primary, .empty-onboarding__settings { min-height:48px; min-width:138px; margin:20px 4px 0; }
html[data-app-mode='kids'] .empty-onboarding > .button-primary { display:none !important; }
html[data-app-mode='light'] .empty-onboarding, html[data-app-mode='kids'] .empty-onboarding { background:#fff; color:#172033; box-shadow:0 18px 48px rgba(40,67,105,.1); }
@media (max-width:480px) { .empty-onboarding { width:calc(100% - 20px); padding:24px 16px; border-radius:20px; } .empty-onboarding > .button-primary, .empty-onboarding__settings { width:100%; margin:9px 0 0; } }
`
await writeFile('src/styles.css', styles)

console.log('Onboarding reliability patch applied')
