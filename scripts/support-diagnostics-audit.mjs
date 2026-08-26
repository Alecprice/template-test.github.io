import { readFile } from 'node:fs/promises'

const diagnostics = await readFile('src/components/DiagnosticsCard.tsx', 'utf8')
const account = await readFile('src/components/AccountPanel.tsx', 'utf8')
const settings = await readFile('src/components/SettingsView.tsx', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

for (const marker of [
  'Copy safe diagnostics',
  'mixedContentRisk',
  "privacy: 'TV names, rooms, addresses, URLs, tokens, certificates, passwords, PINs, and account email are excluded.'",
  'account.signedIn',
  'bridgeProtocol',
]) {
  if (!diagnostics.includes(marker)) throw new Error(`Support diagnostics audit failed: diagnostics missing ${marker}`)
}
for (const forbidden of ['device.name', 'device.room', 'account.email}', 'bridgeConfig.url,', 'bridgeConfig.token,', 'remoteCertificate:', 'password:']) {
  if (diagnostics.includes(forbidden)) throw new Error(`Support diagnostics audit failed: sensitive field exposed via ${forbidden}`)
}
for (const marker of ['account-auth-form', 'account-password-toggle', "type={showPassword ? 'text' : 'password'}", "event.getModifierState('CapsLock')", 'onSubmit={submitSignIn}', 'role="alert"']) {
  if (!account.includes(marker)) throw new Error(`Support diagnostics audit failed: account UX missing ${marker}`)
}
if (!settings.includes('<DiagnosticsCard devices={devices} bridgeConfig={bridgeConfig} appMode={appMode} account={account} />')) {
  throw new Error('Support diagnostics audit failed: diagnostics card is not mounted in Settings')
}
for (const marker of ['.diagnostics-card', '.diagnostics-grid', '.account-password-toggle', '@media (max-width:420px)']) {
  if (!styles.includes(marker)) throw new Error(`Support diagnostics audit failed: styles missing ${marker}`)
}

console.log('TV Phone account UX and support diagnostics audit passed.')
