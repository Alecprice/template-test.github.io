import { readFile } from 'node:fs/promises'

const settings = await readFile('src/components/SettingsView.tsx', 'utf8')
const guide = await readFile('src/components/SetupGuideCard.tsx', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

for (const marker of ['SetupGuideCard', '<SetupGuideCard devices={devices} bridgeConfig={bridgeConfig} />']) {
  if (!settings.includes(marker)) throw new Error(`Setup guide audit failed: Settings missing ${marker}`)
}

for (const marker of [
  'Connect TV Phone to your home network',
  'npm run bridge:setup',
  'npm run bridge:doctor',
  'npm run bridge:start',
  'Browser security is blocking this bridge URL',
  'Do not port-forward it',
  'navigator.clipboard.writeText',
]) {
  if (!guide.includes(marker)) throw new Error(`Setup guide audit failed: guide missing ${marker}`)
}

for (const marker of ['.setup-guide-steps', '.setup-guide-warning', '.setup-guide-copy', '@media (max-width:420px)']) {
  if (!styles.includes(marker)) throw new Error(`Setup guide audit failed: styles missing ${marker}`)
}

console.log('TV Phone real TV setup guide audit passed.')
