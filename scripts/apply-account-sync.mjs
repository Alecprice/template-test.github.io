import { copyFile, readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Account sync patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await copyFile('account-sync/cloud.ts', 'src/lib/cloud.ts')
await copyFile('account-sync/useAccountSync.ts', 'src/lib/useAccountSync.ts')
await copyFile('account-sync/AccountPanel.tsx', 'src/components/AccountPanel.tsx')

let app = await readFile('src/App.tsx', 'utf8')
app = replaceOrFail(
  app,
  "import { storage } from './lib/storage'",
  "import { storage } from './lib/storage'\nimport { useAccountSync } from './lib/useAccountSync'",
  'App account-sync import',
)
app = replaceOrFail(
  app,
  '  useWakeLock(keepAwake)\n',
  `  useWakeLock(keepAwake)\n\n  const account = useAccountSync({\n    devices,\n    activities,\n    activeDeviceId,\n    haptics,\n    keepAwake,\n    bridgeConfig,\n    setDevices,\n    setActivities,\n    setActiveDeviceId,\n    setHaptics,\n    setKeepAwake,\n    setBridgeConfig: setBridgeConfigState,\n  })\n`,
  'App account-sync hook',
)
app = replaceOrFail(
  app,
  '  const manager = managerRef.current\n',
  `  const manager = managerRef.current\n\n  useEffect(() => {\n    if (!account.syncGeneration) return\n    void manager.invalidate()\n    setLiveStates({})\n  }, [account.syncGeneration, manager])\n`,
  'App adapter invalidation after cloud hydrate',
)
app = replaceOrFail(
  app,
  "        {tab === 'settings' && <SettingsView demoMode={demoMode} haptics={haptics} keepAwake={keepAwake} bridgeConfig={bridgeConfig} onDemoMode={setDemo} onHaptics={setHaptic} onKeepAwake={setAwake} onBridgeConfig={setBridgeConfig} onReset={reset} />}",
  "        {tab === 'settings' && <SettingsView demoMode={demoMode} haptics={haptics} keepAwake={keepAwake} bridgeConfig={bridgeConfig} account={account} onDemoMode={setDemo} onHaptics={setHaptic} onKeepAwake={setAwake} onBridgeConfig={setBridgeConfig} onReset={reset} />}",
  'Settings account prop',
)
await writeFile('src/App.tsx', app)

let settings = await readFile('src/components/SettingsView.tsx', 'utf8')
settings = replaceOrFail(
  settings,
  "import { useState } from 'react'\nimport type { BridgeConfig } from '../types/remote'",
  "import { useState } from 'react'\nimport type { BridgeConfig } from '../types/remote'\nimport { AccountPanel, type AccountPanelProps } from './AccountPanel'",
  'Settings account panel import',
)
settings = replaceOrFail(
  settings,
  '  bridgeConfig: BridgeConfig\n',
  '  bridgeConfig: BridgeConfig\n  account: AccountPanelProps\n',
  'Settings account prop type',
)
settings = replaceOrFail(
  settings,
  'export function SettingsView({ demoMode, haptics, keepAwake, bridgeConfig, onDemoMode, onHaptics, onKeepAwake, onBridgeConfig, onReset }: Props) {',
  'export function SettingsView({ demoMode, haptics, keepAwake, bridgeConfig, account, onDemoMode, onHaptics, onKeepAwake, onBridgeConfig, onReset }: Props) {',
  'Settings account prop destructure',
)
settings = replaceOrFail(
  settings,
  '      </div>\n\n      <div className="settings-subheading">LAN bridge</div>',
  '      </div>\n\n      <AccountPanel {...account} />\n\n      <div className="settings-subheading">LAN bridge</div>',
  'Settings account panel placement',
)
settings = replaceOrFail(
  settings,
  '<div className="security-note"><strong>Pairing credentials</strong><span>The web MVP stores device settings locally. Native production builds should move Samsung tokens and Fire TV certificates into Keychain/Keystore secure storage.</span></div>',
  '<div className="security-note"><strong>Pairing credentials stay on this device</strong><span>Your account syncs TV names, rooms, favorites, streaming shortcuts, activities, and shared preferences. Samsung pairing tokens, Fire TV certificates, bridge bearer tokens, live connection state, and last-seen data are not uploaded.</span></div>',
  'Settings pairing credential copy',
)
settings = replaceOrFail(
  settings,
  '<button className="danger-outline" onClick={onReset}><RotateCcw /> Reset all local data</button>',
  '<button className="danger-outline" onClick={onReset}><RotateCcw /> Clear this device’s local data</button>',
  'Settings reset copy',
)
await writeFile('src/components/SettingsView.tsx', settings)

console.log('Account sync patch applied')
