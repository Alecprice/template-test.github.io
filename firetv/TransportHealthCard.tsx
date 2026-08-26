import { AlertTriangle, CheckCircle2, Cloud, Router, ShieldAlert } from 'lucide-react'
import type { BridgeConfig, TvDevice } from '../src/types/remote'

interface Props {
  devices: TvDevice[]
  bridgeConfig: BridgeConfig
}

type HealthLevel = 'ok' | 'warn' | 'error' | 'info'

function hasLocalFireTvPairing(device: TvDevice) {
  if (device.kind !== 'firetv') return false
  return Boolean(device.bridgeToken || device.remoteCertificate)
}

export function TransportHealthCard({ devices, bridgeConfig }: Props) {
  const fireTvs = devices.filter((device) => device.kind === 'firetv')
  if (!fireTvs.length) return null

  const pairedHere = fireTvs.filter(hasLocalFireTvPairing).length
  const syncedOnly = fireTvs.length - pairedHere
  const bridgeUrl = bridgeConfig.url.trim()
  const bridgeToken = bridgeConfig.token.trim()
  const bridgeConfigured = Boolean(bridgeUrl && bridgeToken)
  const mixedContentBlocked = typeof window !== 'undefined'
    && window.location.protocol === 'https:'
    && /^http:\/\//i.test(bridgeUrl)

  let level: HealthLevel = 'ok'
  let title = 'Fire TV transport looks configured'
  let detail = `${pairedHere} of ${fireTvs.length} Fire TV device${fireTvs.length === 1 ? '' : 's'} have local pairing material on this browser.`

  if (mixedContentBlocked) {
    level = 'error'
    title = 'Browser is blocking the LAN bridge'
    detail = 'This app is running over HTTPS, but the configured bridge uses HTTP. Mobile browsers block that mixed-content request before it can reach your Fire TV. Use an HTTPS bridge endpoint or a native/local-network build.'
  } else if (!bridgeConfigured) {
    level = 'warn'
    title = 'LAN bridge is not configured on this device'
    detail = 'Your Fire TV list may have synced from your account, but the bridge URL and bearer token stay local to each phone or browser. Add them below on this device.'
  } else if (syncedOnly > 0) {
    level = 'warn'
    title = `${syncedOnly} Fire TV device${syncedOnly === 1 ? '' : 's'} need local pairing`
    detail = 'TV names and safe settings can sync between devices, but Fire TV certificates and bridge tokens intentionally do not. Pair the affected Fire TV on this phone/browser before expecting remote commands to work.'
  }

  const Icon = level === 'ok' ? CheckCircle2 : level === 'error' ? ShieldAlert : level === 'warn' ? AlertTriangle : Cloud

  return (
    <section className={`transport-health transport-health--${level}`} aria-live="polite">
      <div className="transport-health__icon"><Icon /></div>
      <div className="transport-health__body">
        <strong>{title}</strong>
        <p>{detail}</p>
        <div className="transport-health__facts">
          <span><Router /> Bridge {bridgeConfigured ? 'configured here' : 'missing here'}</span>
          <span><Cloud /> {fireTvs.length} Fire TV device{fireTvs.length === 1 ? '' : 's'} synced</span>
          <span><CheckCircle2 /> {pairedHere} locally paired</span>
        </div>
      </div>
    </section>
  )
}
