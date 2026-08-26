import { readFile } from 'node:fs/promises'

const app = await readFile('src/App.tsx', 'utf8')
const remote = await readFile('src/components/RemoteView.tsx', 'utf8')
const kids = await readFile('src/components/KidsModeSettings.tsx', 'utf8')
const settings = await readFile('src/components/SettingsView.tsx', 'utf8')
const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
const helper = await readFile('src/lib/kidsStreaming.ts', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

for (const marker of [
  'kidsAllowedStreamingIds',
  "appMode === 'kids' && !kidsAllowedStreamingIds.includes(serviceId)",
  "quickServiceIds={appMode === 'kids' ? kidsAllowedStreamingIds : undefined}",
  "quickLaunchEditable={appMode !== 'kids'}",
]) if (!app.includes(marker)) throw new Error(`Kids streaming audit failed: App missing ${marker}`)

for (const marker of ['visibleStreamingServices', 'quickServiceIds?: StreamingServiceId[]', 'quickLaunchEditable?: boolean', 'NO KIDS APPS']) {
  if (!remote.includes(marker)) throw new Error(`Kids streaming audit failed: Remote missing ${marker}`)
}
if (remote.includes('{streamingServices.map((service) => <button key={service.id}')) {
  throw new Error('Kids streaming audit failed: Remote still renders the unfiltered streaming list')
}

for (const marker of ['KidsStreamingSettings', 'allowedStreamingIds', 'onAllowedStreamingIds']) {
  if (!kids.includes(marker)) throw new Error(`Kids streaming audit failed: Kids settings missing ${marker}`)
}
for (const marker of ['KidsStreamingSettings', 'kidsAllowedStreamingIds', 'onKidsAllowedStreamingIds']) {
  if (!settings.includes(marker)) throw new Error(`Kids streaming audit failed: Full settings missing ${marker}`)
}
for (const marker of ['kidsAllowedStreamingIds: StreamingServiceId[]', 'normalizeKidsStreamingIds(raw.preferences?.kidsAllowedStreamingIds)', 'setKidsAllowedStreamingIds', "safeRemoveLocal('tv-phone:kids-streaming:v1')"]) {
  if (!sync.includes(marker)) throw new Error(`Kids streaming audit failed: sync missing ${marker}`)
}
for (const marker of ['return allKidsStreamingIds()', 'Array.isArray(value)', 'tv-phone:kids-streaming:v1']) {
  if (!helper.includes(marker)) throw new Error(`Kids streaming audit failed: helper missing ${marker}`)
}
for (const marker of ['.kids-streaming-settings', '.kids-streaming-grid', '@media (max-width:390px)']) {
  if (!styles.includes(marker)) throw new Error(`Kids streaming audit failed: styles missing ${marker}`)
}

console.log('TV Phone Kids Safe streaming allowlist audit passed.')
