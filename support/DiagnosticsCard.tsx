import { CheckCircle2, Clipboard, ClipboardCheck, ShieldCheck, Stethoscope } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { TvDevice, BridgeConfig } from '../types/remote'
import type { AppMode } from '../lib/appMode'
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
  const samsungCount = devices.filter((device) => device.kind === 'samsung').length
  const fireTvCount = devices.filter((device) => device.kind === 'firetv').length

  const report = useMemo(() => ({
    generatedAt: new Date().toISOString(),
    online: typeof navigator === 'undefined' ? true : navigator.onLine,
    standalone: standaloneMode(),
    appMode,
    devices: {
      total: devices.length,
      samsung: samsungCount,
      fireTv: fireTvCount,
      other: Math.max(0, devices.length - samsungCount - fireTvCount),
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
  }), [account.configured, account.ready, account.signedIn, account.status, appMode, bridgeConfigured, bridgeProtocol, devices.length, fireTvCount, mixedContentRisk, samsungCount])

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
          <span><CheckCircle2 /> {devices.length} TV{devices.length === 1 ? '' : 's'} configured</span>
          <span><CheckCircle2 /> Bridge {bridgeConfigured ? 'configured' : 'not configured'}</span>
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
