import { AlertTriangle, CheckCircle2, KeyRound, Network, Router, ShieldCheck, Tv } from 'lucide-react'
import { useMemo } from 'react'
import type { BridgeConfig, TvDevice } from '../types/remote'
import { isUntouchedSampleDevice } from '../lib/sampleProvenance'

type RecoveryLevel = 'ready' | 'action' | 'verify'

interface RecoveryItem {
  id: string
  name: string
  kind: TvDevice['kind']
  level: RecoveryLevel
  title: string
  detail: string
}

interface Props {
  devices: TvDevice[]
  bridgeConfig: BridgeConfig
}

function hasSamsungPairing(device: TvDevice) {
  return device.kind === 'samsung' && Boolean(device.token)
}

function hasFireTvPairing(device: TvDevice) {
  return device.kind === 'firetv' && Boolean(device.bridgeToken || device.remoteCertificate)
}

export function DeviceRecoveryCard({ devices, bridgeConfig }: Props) {
  const realDevices = useMemo(() => devices.filter((device) => !isUntouchedSampleDevice(device)), [devices])
  if (!realDevices.length) return null

  const bridgeUrl = bridgeConfig.url.trim()
  const bridgeReady = Boolean(bridgeUrl && bridgeConfig.token.trim())
  const mixedContentBlocked = typeof window !== 'undefined'
    && window.location.protocol === 'https:'
    && /^http:\/\//i.test(bridgeUrl)

  const items: RecoveryItem[] = realDevices.map((device) => {
    if (device.kind === 'samsung') {
      if (!hasSamsungPairing(device)) {
        return {
          id: device.id,
          name: device.name,
          kind: device.kind,
          level: 'action',
          title: 'Samsung pairing is missing on this device',
          detail: 'Open TV setup and pair this Samsung again. Approve the prompt on the TV. If the TV only changed IP addresses, update its network address first and keep the existing pairing token when it still works.',
        }
      }
      return {
        id: device.id,
        name: device.name,
        kind: device.kind,
        level: 'ready',
        title: 'Samsung pairing is stored locally',
        detail: 'If commands stop after a router or IP change, update the TV network address before re-pairing. A fully powered-off Samsung may need Wake-on-LAN before WebSocket commands can reconnect.',
      }
    }

    if (device.kind === 'firetv') {
      if (!bridgeReady) {
        return {
          id: device.id,
          name: device.name,
          kind: device.kind,
          level: 'action',
          title: 'Fire TV transport is missing on this device',
          detail: 'Configure the LAN bridge on this phone/browser first. Bridge URL and bearer token intentionally do not sync between devices.',
        }
      }
      if (mixedContentBlocked) {
        return {
          id: device.id,
          name: device.name,
          kind: device.kind,
          level: 'action',
          title: 'Browser security is blocking Fire TV transport',
          detail: 'This hosted HTTPS app cannot call the saved HTTP bridge. Use a secure bridge endpoint, local UI, or native/local-network build.',
        }
      }
      if (!hasFireTvPairing(device)) {
        return {
          id: device.id,
          name: device.name,
          kind: device.kind,
          level: 'action',
          title: 'Fire TV needs local pairing',
          detail: 'Pair this Fire TV again on this phone/browser. Remote certificates and device bridge credentials stay local and are never restored from cloud sync or a backup.',
        }
      }
      return {
        id: device.id,
        name: device.name,
        kind: device.kind,
        level: 'ready',
        title: 'Fire TV transport looks locally prepared',
        detail: 'If commands stop after a network change, verify the bridge computer and TV are still reachable on the same LAN before replacing pairing material.',
      }
    }

    if (device.kind === 'combo') {
      return {
        id: device.id,
        name: device.name,
        kind: device.kind,
        level: 'verify',
        title: 'Combined TV setup needs both transports verified',
        detail: 'A combined setup can partially fail even when the other side still works. Test the TV/display controls and streaming-device controls separately, then repair only the side that fails.',
      }
    }

    throw new Error('Unsupported TV kind')
  })

  const actionCount = items.filter((item) => item.level === 'action').length
  const verifyCount = items.filter((item) => item.level === 'verify').length
  const readyCount = items.length - actionCount - verifyCount

  return (
    <>
      <div className="settings-subheading">TV repair plan</div>
      <section className="settings-panel device-recovery-card">
        <div className="device-recovery-card__hero">
          <div className="device-recovery-card__hero-icon"><Network /></div>
          <div>
            <strong>{actionCount ? `${actionCount} TV setup${actionCount === 1 ? '' : 's'} need attention` : 'Local TV setup looks prepared'}</strong>
            <span>TV Phone checks local pairing and bridge prerequisites without displaying or exporting pairing secrets.</span>
          </div>
        </div>

        <div className="device-recovery-summary" aria-label="TV repair summary">
          <span className="ok"><CheckCircle2 /> {readyCount} ready</span>
          <span className={actionCount ? 'warn' : ''}><AlertTriangle /> {actionCount} repair</span>
          <span className={verifyCount ? 'verify' : ''}><Tv /> {verifyCount} verify</span>
        </div>

        <div className="device-recovery-list">
          {items.map((item) => {
            const Icon = item.level === 'ready' ? CheckCircle2 : item.kind === 'firetv' ? Router : item.level === 'verify' ? Tv : KeyRound
            return (
              <details key={item.id} className={`device-recovery-item device-recovery-item--${item.level}`} open={item.level === 'action'}>
                <summary>
                  <span className="device-recovery-item__icon"><Icon /></span>
                  <span><strong>{item.name}</strong><small>{item.title}</small></span>
                </summary>
                <p>{item.detail}</p>
              </details>
            )
          })}
        </div>

        <div className="device-recovery-note"><ShieldCheck /><span>Cloud sync and backups intentionally exclude Samsung tokens, Fire TV certificates, bridge bearer tokens, and live connection state. A restored TV may therefore need local pairing even when its name and settings are present.</span></div>
      </section>
    </>
  )
}
