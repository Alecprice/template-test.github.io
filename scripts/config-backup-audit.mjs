import { readFile } from 'node:fs/promises'

const helper = await readFile('src/lib/configBackup.ts', 'utf8')
const card = await readFile('src/components/BackupCard.tsx', 'utf8')
const app = await readFile('src/App.tsx', 'utf8')
const settings = await readFile('src/components/SettingsView.tsx', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

for (const marker of [
  "new Set(['token', 'bridgeToken', 'remoteCertificate', 'lastSeen'])",
  "key === 'connection'",
  "cleaned[key] = 'disconnected'",
  'backupContainsSecretKeys',
  'parseTvPhoneBackup',
]) if (!helper.includes(marker)) throw new Error(`Config backup audit failed: helper missing ${marker}`)

for (const marker of ['MAX_BACKUP_BYTES = 1_000_000', 'Export safe backup', 'Restore this backup', 'Pairing credentials were not restored', 'backupContainsSecretKeys(backup)', 'backupContainsSecretKeys(parsed)']) {
  if (!card.includes(marker)) throw new Error(`Config backup audit failed: card missing ${marker}`)
}
if (card.includes('bridgeConfig.token') || card.includes('remoteCertificate}') || card.includes('device.token')) {
  throw new Error('Config backup audit failed: backup UI references a secret value')
}
for (const marker of ['const restoreBackup = (backup: TvPhoneBackupV1)', 'storage.saveDevices(backup.devices)', 'storage.saveActivities(backup.activities)', 'setKidsAllowedStreamingIds(backup.preferences.kidsAllowedStreamingIds)', 'void manager.invalidate()']) {
  if (!app.includes(marker)) throw new Error(`Config backup audit failed: App restore missing ${marker}`)
}
for (const marker of ['<BackupCard', 'activities: Activity[]', 'onRestoreBackup: (backup: TvPhoneBackupV1) => void']) {
  if (!settings.includes(marker)) throw new Error(`Config backup audit failed: Settings missing ${marker}`)
}
for (const marker of ['.backup-card', '.backup-preview', '.backup-file-input', '@media (max-width:440px)']) {
  if (!styles.includes(marker)) throw new Error(`Config backup audit failed: styles missing ${marker}`)
}

console.log('TV Phone safe configuration backup audit passed.')
