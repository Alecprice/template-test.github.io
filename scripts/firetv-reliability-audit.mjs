import fs from 'node:fs'

const failures = []
const read = (path) => fs.existsSync(path) ? fs.readFileSync(path, 'utf8') : ''

const doctor = read('src/components/TransportHealthCard.tsx')
for (const marker of ['mixedContentBlocked', "window.location.protocol === 'https:'", "^http:\\/\\/", 'need local pairing', 'bridge URL and bearer token stay local', 'Fire TV transport looks configured']) {
  if (!doctor.includes(marker)) failures.push(`Fire TV Connection Doctor missing: ${marker}`)
}

const settings = read('src/components/SettingsView.tsx')
for (const marker of ['devices: TvDevice[]', '<TransportHealthCard devices={devices} bridgeConfig={bridgeConfig} />']) {
  if (!settings.includes(marker)) failures.push(`Fire TV diagnostic integration missing: ${marker}`)
}

const app = read('src/App.tsx')
if (!/SettingsView[^\n]+devices=\{devices\}/.test(app)) failures.push('SettingsView is not receiving local device pairing state')

const styles = read('src/styles.css')
for (const marker of ['v0.8.3 Fire TV transport diagnostics', '.transport-health--error', '.transport-health--warn']) {
  if (!styles.includes(marker)) failures.push(`Fire TV diagnostic styling missing: ${marker}`)
}

if (failures.length) {
  console.error('TV Phone Fire TV reliability audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('TV Phone Fire TV reliability audit passed.')
