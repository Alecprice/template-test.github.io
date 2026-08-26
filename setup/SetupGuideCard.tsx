import { AlertTriangle, Clipboard, ClipboardCheck, Laptop, Router, ShieldCheck, Smartphone, Tv } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { BridgeConfig, TvDevice } from '../types/remote'
import { isUntouchedSampleDevice } from '../lib/sampleProvenance'

interface Props {
  devices: TvDevice[]
  bridgeConfig: BridgeConfig
}

const SETUP_COMMANDS = `npm install
npm run bridge:setup
npm run bridge:doctor
npm run bridge:start`

type CopyState = 'idle' | 'copied' | 'error'

export function SetupGuideCard({ devices, bridgeConfig }: Props) {
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const bridgeUrl = bridgeConfig.url.trim()
  const bridgeToken = bridgeConfig.token.trim()
  const bridgeReady = Boolean(bridgeUrl && bridgeToken)
  const hostedHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const localHttpBridge = /^http:\/\//i.test(bridgeUrl)
  const blockedByBrowser = hostedHttps && localHttpBridge
  const realDevices = useMemo(() => devices.filter((device) => !isUntouchedSampleDevice(device)), [devices])

  const copyCommands = async () => {
    try {
      await navigator.clipboard.writeText(SETUP_COMMANDS)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('error')
    }
  }

  return (
    <>
      <div className="settings-subheading">Real TV setup</div>
      <section className="settings-panel setup-guide-card">
        <div className="setup-guide-card__hero">
          <div className="setup-guide-card__hero-icon"><Router /></div>
          <div>
            <strong>Connect TV Phone to your home network</strong>
            <span>The hosted app is the remote UI. A small LAN helper on a Mac/PC, or the native build, carries commands to TVs on your private Wi-Fi.</span>
          </div>
        </div>

        <div className="setup-guide-status" aria-label="Real TV setup status">
          <span className={bridgeReady ? 'ok' : ''}><Router /> {bridgeReady ? 'Bridge saved here' : 'Bridge not configured'}</span>
          <span className={realDevices.length ? 'ok' : ''}><Tv /> {realDevices.length ? `${realDevices.length} TV${realDevices.length === 1 ? '' : 's'} added` : 'No real TVs added'}</span>
          <span><Smartphone /> {hostedHttps ? 'Hosted web app' : 'Local/native context'}</span>
        </div>

        {blockedByBrowser && (
          <div className="setup-guide-warning" role="alert">
            <ShieldCheck />
            <div><strong>Browser security is blocking this bridge URL</strong><span>This page uses HTTPS while the saved bridge uses HTTP. Use a secure bridge endpoint, local development UI, or the native app build for direct local-network control.</span></div>
          </div>
        )}

        <ol className="setup-guide-steps">
          <li><span>1</span><div><strong>Run the LAN helper</strong><small>Use a Mac or PC on the same Wi-Fi as the phone and TVs. Keep it on while using the web remote.</small></div></li>
          <li><span>2</span><div><strong>Save the bridge on this device</strong><small>Enter that computer’s LAN bridge address and bearer token in the LAN bridge section below. Tokens stay local to this phone/browser.</small></div></li>
          <li><span>3</span><div><strong>Add and pair each TV once</strong><small>Approve Samsung’s pairing prompt or complete Fire TV pairing. TV names can sync; pairing secrets intentionally do not.</small></div></li>
        </ol>

        <details className="setup-guide-advanced">
          <summary><Laptop /> Helper computer commands</summary>
          <pre><code>{SETUP_COMMANDS}</code></pre>
          <button type="button" className="button-secondary setup-guide-copy" onClick={() => void copyCommands()}>
            {copyState === 'copied' ? <ClipboardCheck /> : copyState === 'error' ? <AlertTriangle /> : <Clipboard />}
            {copyState === 'copied' ? 'Copied' : copyState === 'error' ? 'Copy failed — select commands above' : 'Copy commands'}
          </button>
        </details>

        <div className="setup-guide-security"><ShieldCheck /><span>Keep the bridge private to your home network. Do not port-forward it or share its bearer token.</span></div>
      </section>
    </>
  )
}
