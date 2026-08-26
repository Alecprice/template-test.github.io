import { readFile } from 'node:fs/promises'

const settings = await readFile('src/components/SettingsView.tsx', 'utf8')
const recovery = await readFile('src/components/DeviceRecoveryCard.tsx', 'utf8')
const guide = await readFile('src/components/SetupGuideCard.tsx', 'utf8')
const diagnostics = await readFile('src/components/DiagnosticsCard.tsx', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

for (const marker of [
  "import { DeviceRecoveryCard } from './DeviceRecoveryCard'",
  '<DeviceRecoveryCard devices={devices} bridgeConfig={bridgeConfig} />',
]) {
  if (!settings.includes(marker)) throw new Error(`Device recovery audit failed: Settings missing ${marker}`)
}

for (const marker of [
  "import { isUntouchedSampleDevice } from '../lib/sampleProvenance'",
  "device.kind === 'samsung'",
  "device.kind === 'firetv'",
  "device.kind === 'combo'",
  'Samsung pairing is missing on this device',
  'Fire TV needs local pairing',
  'Browser security is blocking Fire TV transport',
  'Combined TV setup needs both transports verified',
  'update the TV network address before re-pairing',
  'Cloud sync and backups intentionally exclude Samsung tokens',
]) {
  if (!recovery.includes(marker)) throw new Error(`Device recovery audit failed: recovery card missing ${marker}`)
}

if (guide.includes('DEMO_DEVICE_IDS')) throw new Error('Device recovery audit failed: setup guide still uses a hard-coded demo ID list')
for (const marker of ["isUntouchedSampleDevice", 'devices.filter((device) => !isUntouchedSampleDevice(device))']) {
  if (!guide.includes(marker)) throw new Error(`Device recovery audit failed: setup guide missing shared provenance marker ${marker}`)
}

for (const marker of [
  'samsungNeedsPairing',
  'fireTvNeedsPairing',
  'fireTvTransportNeedsAttention',
  'combinedSetupsToVerify',
  'localRepairCandidates',
]) {
  if (!diagnostics.includes(marker)) throw new Error(`Device recovery audit failed: safe diagnostics missing ${marker}`)
}
for (const forbidden of ['device.name', 'device.room', 'bridgeConfig.url,', 'bridgeConfig.token,', 'remoteCertificate:']) {
  if (diagnostics.includes(forbidden)) throw new Error(`Device recovery audit failed: diagnostics exposed sensitive detail through ${forbidden}`)
}

for (const marker of ['.device-recovery-card', '.device-recovery-item--action', '.device-recovery-summary', '@media (max-width:420px)']) {
  if (!styles.includes(marker)) throw new Error(`Device recovery audit failed: styles missing ${marker}`)
}

console.log('TV Phone real-device repair plan audit passed.')
