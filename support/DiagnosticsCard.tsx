import { CheckCircle2, Clipboard, ClipboardCheck, ShieldCheck, Stethoscope } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TvDevice, BridgeConfig } from '../types/remote'
import type { AppMode } from '../lib/appMode'
import { isUntouchedSampleDevice } from '../lib/sampleProvenance'
import type { AccountPanelProps } from './AccountPanel'

interface Props {
  devices: TvDevice[]
  bridgeConfig: BridgeConfig
  appMode: AppMode
  account: AccountPanelProps
}

type StandaloneNavigator = Navigator & { standalone?: boolean }

function standaloneMode() {
  if (typeof window === 'undefined') return false
  return Boolean(window.matchMedia?.('(display-mode: standalone)').matches || (navigator as StandaloneNavigator).standalone)
}

export function DiagnosticsCard({ devices, bridgeConfig, appMode, account }: Props) {
  const [copied, setCopied] = useState(false)
  const bridgeUrl = bridgeConfig.url.trim()
  const bridgeConfigured = Boolean(bridgeUrl && bridgeConfig.token.trim())
  const bridgeProtocol = /^https:\/\//i.test(bridgeUrl) ? 'https' : /^http:\/\//i.test(bridgeUrl) ? 'http' : bridgeUrl ? 'other' : 'none'
  const mixedContentRisk = typeof window !== 'undefined' && window.location.protocol === 'https:' && bridgeProtocol === 'http'
  const realDevices = useMemo(() => devices.filter((device) => !isUntouchedSampleDevice(device)), [devices])
  const samsungCount = realDevices.filter((device) => device.kind === 'samsung').length
  const fireTvCount = realDevices.filter((device) => device.kind === 'firetv').length
  const comboCount = realDevices.filter((device) => device.kind === 'combo').length
  const samsungNeedsPairing = realDevices.filter((device) => device.kind === 'samsung' && !device.token).length
  const fireTvNeedsPairing = realDevices.filter((device) => device.kind === 'firetv' && !(device.bridgeToken || device.remoteCertificate)).length
  const fireTvTransportNeedsAttention = fireTvCount > 0 && (!bridgeConfigured || mixedContentRisk)
  const localRepairCandidates = samsungNeedsPairing + fireTvNeedsPairing + (fireTvTransportNeedsAttention ? fireTvCount : 0)

  const report = useMemo(() => ({
    generatedAt: new Date().toISOString(),
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    standalone: standaloneMode(),
    appMode,
    devices: {
      total: realDevices.length,
      samsung: samsungCount,
      fireTv: fireTvCount,
      combo: comboCount,
    },
    recovery: {
      samsungNeedsPairing,
      fireTvNeedsPairing,
      fireTvTransportNeedsAttention,
      combinedSetupsToVerify: comboCount,
      localRepairCandidates,
    },
    bridge: {
      configured: bridgeConfigured,
      protocol: bridgeProtocol,
      mixedContentRisk,
    },
    account: {
      cloudConfigured: account.configured,
      ready: account.ready,
      signedIn: account.signedIn,
      status: account.status,
    },
    privacy: 'TV names, rooms, addresses, URLs, tokens, certificates, passwords, PINs, and account email are excluded.',
  }), [account.configured, account.ready, account.signedIn, account.status, appMode, bridgeConfigured, bridgeProtocol, comboCount, fireTvCount, fireTvNeedsPairing, fireTvTransportNeedsAttention, localRepairCandidates, mixedContentRisk, realDevices.length, samsungCount, samsungNeedsPairing])

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(`TV Phone support diagnostics\n${JSON.stringify(report, null, 2)}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <div className="settings-subheading">Support diagnostics</div>
      <section className="settings-panel diagnostics-card">
        <div className="diagnostics-card__hero">
          <div className="diagnostics-card__icon"><Stethoscope /></div>
          <div><strong>Copy a safe troubleshooting snapshot</strong><span>Useful when a TV, bridge, account, or installed app is not behaving as expected.</span></div>
        </div>

        <div className="diagnostics-grid" aria-label="Current diagnostic summary">
          <span><CheckCircle2 /> {realDevices.length} real TV{realDevices.length === 1 ? '' : 's'} configured</span>
          <span><CheckCircle2 /> Bridge {bridgeConfigured ? 'configured' : 'not configured'}</span>
          <span><CheckCircle2 /> {localRepairCandidates ? `${localRepairCandidates} local repair signal${localRepairCandidates === 1 ? '' : 's'}` : 'No local repair signals'}</span>
          <span><CheckCircle2 /> Account {account.signedIn ? account.status : 'local only'}</span>
          <span><CheckCircle2 /> {typeof navigator !== 'undefined' && navigator.onLine ? 'Online' : 'Offline'}</span>
        </div>

        {mixedContentRisk && <div className="diagnostics-warning" role="status">Hosted HTTPS + an HTTP bridge is currently a mixed-content risk and may be blocked by the browser.</div>}

        <button type="button" className="button-secondary diagnostics-copy" onClick={() => void copyReport()}>
          {copied ? <ClipboardCheck /> : <Clipboard />}{copied ? 'Copied safe diagnostics' : 'Copy safe diagnostics'}
        </button>
        <div className="diagnostics-privacy"><ShieldCheck /><span>No TV names, rooms, IP/bridge URLs, tokens, certificates, passwords, parent PINs, or account email are copied.</span></div>
      </section>
    </>
  )
}
