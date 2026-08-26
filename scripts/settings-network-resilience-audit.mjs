import { readFile } from 'node:fs/promises'

const settings = await readFile('src/components/SettingsView.tsx', 'utf8')

for (const marker of [
  'const controller = new AbortController()',
  'controller.abort(), 8_000',
  "signal: controller.signal",
  "error.name === 'AbortError'",
  'Bridge test timed out after 8 seconds',
  'window.clearTimeout(timeout)',
  "parsed.protocol !== 'http:' && parsed.protocol !== 'https:'",
  'Use a valid http:// or https:// bridge URL.',
  'Bridge returned HTTP ${response.status}',
  'maxLength={2048}',
  'autoCapitalize="none"',
  'spellCheck={false}',
  '<button type="button" className="button-secondary"',
]) {
  if (!settings.includes(marker)) throw new Error(`Settings network resilience audit failed: missing ${marker}`)
}
if (settings.includes("fetch(`${bridgeConfig.url.trim().replace(/\\/$/, '')}/health`, { cache: 'no-store' })")) {
  throw new Error('Settings network resilience audit failed: unbounded legacy bridge health request remains')
}

console.log('TV Phone Settings network resilience audit passed.')
