import { readFile, writeFile } from 'node:fs/promises'

const appPath = 'src/App.tsx'
let app = await readFile(appPath, 'utf8')
const settingsLine = app.split('\n').find((line) => line.includes("tab === 'settings'") && line.includes('<SettingsView'))
if (!settingsLine) throw new Error('Mode normalization failed: SettingsView render line not found')
const normalizedSettingsLine = "          {tab === 'settings' && <SettingsView demoMode={demoMode} haptics={haptics} keepAwake={keepAwake} bridgeConfig={bridgeConfig} account={account} onDemoMode={setDemo} onHaptics={setHaptic} onKeepAwake={setAwake} onBridgeConfig={setBridgeConfig} onReset={reset} />}"
app = app.replace(settingsLine, normalizedSettingsLine)
await writeFile(appPath, app)
console.log('Mode patch targets normalized')
