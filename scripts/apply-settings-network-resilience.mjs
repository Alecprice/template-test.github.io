import { readFile, writeFile } from 'node:fs/promises'

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')

const start = settings.indexOf('  const testBridge = async () => {')
const end = settings.indexOf('\n\n  return (', start)
if (start < 0 || end < 0) throw new Error('Settings network resilience patch failed: bridge test function')

const replacement = `  const testBridge = async () => {\n    const rawUrl = bridgeConfig.url.trim()\n    if (!rawUrl || testing) return\n    if (window.location.protocol === 'https:' && rawUrl.toLowerCase().startsWith('http://')) {\n      setBridgeStatus('Blocked by HTTPS mixed-content rules. Use the native app or local HTTP development.')\n      return\n    }\n\n    let healthUrl = ''\n    try {\n      const parsed = new URL(rawUrl)\n      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('unsupported protocol')\n      healthUrl = \`${'${parsed.toString().replace(/\\/$/, \'\')}'}\/health\`\n    } catch {\n      setBridgeStatus('Use a valid http:// or https:// bridge URL.')\n      return\n    }\n\n    const controller = new AbortController()\n    const timeout = window.setTimeout(() => controller.abort(), 8_000)\n    setTesting(true); setBridgeStatus('Testing…')\n    try {\n      const response = await fetch(healthUrl, { cache: 'no-store', signal: controller.signal })\n      const payload = await response.json().catch(() => null) as { version?: string; capabilities?: string[] } | null\n      if (!response.ok) throw new Error(\`Bridge returned HTTP \${response.status}\`)\n      setBridgeStatus(\`Connected\${payload?.version ? \` · v\${payload.version}\` : ''}\${payload?.capabilities?.includes('lan-discovery') ? ' · discovery ready' : ''}\`)\n    } catch (error) {\n      const message = error instanceof DOMException && error.name === 'AbortError'\n        ? 'Bridge test timed out after 8 seconds. Check the bridge address and that this device is on the same network.'\n        : error instanceof Error ? error.message : 'Bridge test failed'\n      setBridgeStatus(message)\n    } finally {\n      window.clearTimeout(timeout)\n      setTesting(false)\n    }\n  }`

settings = `${settings.slice(0, start)}${replacement}${settings.slice(end)}`
settings = settings.replace(
  '<input inputMode="url" placeholder="http://192.168.1.10:8787"',
  '<input inputMode="url" maxLength={2048} autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="http://192.168.1.10:8787"',
)
settings = settings.replace(
  '<div className="bridge-test-row"><button className="button-secondary"',
  '<div className="bridge-test-row"><button type="button" className="button-secondary"',
)

await writeFile('src/components/SettingsView.tsx', settings)
console.log('Settings bridge timeout and URL validation applied')
