import { Download, FileJson, RotateCcw, ShieldCheck, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent } from 'react'
import type { Activity, TvDevice } from '../types/remote'
import type { AppMode } from '../lib/appMode'
import type { StreamingServiceId } from '../lib/streamingServices'
import { backupContainsSecretKeys, createTvPhoneBackup, parseTvPhoneBackup, type TvPhoneBackupV1 } from '../lib/configBackup'

interface Props {
  devices: TvDevice[]
  activities: Activity[]
  activeDeviceId: string
  haptics: boolean
  keepAwake: boolean
  appMode: AppMode
  kidsAllowedStreamingIds: StreamingServiceId[]
  onRestore: (backup: TvPhoneBackupV1) => void
}

const MAX_BACKUP_BYTES = 1_000_000

function backupFilename() {
  const date = new Date().toISOString().slice(0, 10)
  return `tv-phone-backup-${date}.json`
}

export function BackupCard(props: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [pending, setPending] = useState<TvPhoneBackupV1 | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const exportBackup = () => {
    setError('')
    const backup = createTvPhoneBackup({
      devices: props.devices,
      activities: props.activities,
      activeDeviceId: props.activeDeviceId,
      preferences: {
        haptics: props.haptics,
        keepAwake: props.keepAwake,
        appMode: props.appMode,
        kidsAllowedStreamingIds: props.kidsAllowedStreamingIds,
      },
    })
    if (backupContainsSecretKeys(backup)) {
      setError('Backup safety check failed. No file was created.')
      return
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = backupFilename()
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    setMessage('Safe configuration backup created.')
  }

  const chooseBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    setError('')
    setMessage('')
    setPending(null)
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > MAX_BACKUP_BYTES) {
      setError('That backup is too large to be a TV Phone configuration file.')
      return
    }
    try {
      const raw = JSON.parse(await file.text()) as unknown
      if (backupContainsSecretKeys(raw)) throw new Error('That backup contains pairing or connection secrets and cannot be restored.')
      const parsed = parseTvPhoneBackup(raw)
      setPending(parsed)
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : 'Could not read that backup file.')
    }
  }

  const restore = () => {
    if (!pending) return
    props.onRestore(pending)
    setMessage(`Restored ${pending.devices.length} TV${pending.devices.length === 1 ? '' : 's'} and ${pending.activities.length} activit${pending.activities.length === 1 ? 'y' : 'ies'}. Pairing credentials were not restored.`)
    setPending(null)
  }

  return (
    <>
      <div className="settings-subheading">Backup & recovery</div>
      <section className="settings-panel backup-card">
        <div className="backup-card__hero">
          <div className="backup-card__icon"><FileJson /></div>
          <div><strong>Keep a portable copy of your setup</strong><span>Export TVs, activities, interface preferences, and Kids Safe choices. Pairing secrets are always removed.</span></div>
        </div>

        <div className="backup-card__actions">
          <button type="button" className="button-secondary" onClick={exportBackup}><Download /> Export safe backup</button>
          <button type="button" className="button-secondary" onClick={() => inputRef.current?.click()}><Upload /> Choose backup</button>
          <input ref={inputRef} className="backup-file-input" type="file" accept="application/json,.json" onChange={(event) => void chooseBackup(event)} />
        </div>

        {pending && (
          <div className="backup-preview" role="status">
            <div><strong>Ready to replace this device’s setup</strong><span>{pending.devices.length} TV{pending.devices.length === 1 ? '' : 's'} · {pending.activities.length} activit{pending.activities.length === 1 ? 'y' : 'ies'} · exported {new Date(pending.exportedAt).toLocaleDateString()}</span></div>
            <small className="backup-preview__warning">Restoring replaces the TVs and activities currently stored on this device. Export a backup first if you may need them later.</small>
            <div className="backup-preview__buttons">
              <button type="button" className="button-primary" onClick={restore}><RotateCcw /> Replace with this backup</button>
              <button type="button" className="button-secondary" onClick={() => setPending(null)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="backup-card__privacy"><ShieldCheck /><span><strong>Private file:</strong> TV names, rooms, network addresses and activity setup can be included so the backup is useful. Samsung tokens, Fire TV certificates, bridge bearer tokens, live connection state and last-seen data are stripped. Don’t post the backup publicly.</span></div>
        {message && <small className="backup-message" role="status">{message}</small>}
        {error && <small className="backup-error" role="alert">{error}</small>}
      </section>
    </>
  )
}
