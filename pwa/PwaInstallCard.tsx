import { CheckCircle2, Download, RefreshCw, Share2, Smartphone, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type StandaloneNavigator = Navigator & { standalone?: boolean }

function isStandaloneMode() {
  return window.matchMedia?.('(display-mode: standalone)').matches || Boolean((navigator as StandaloneNavigator).standalone)
}

function isAppleMobile() {
  const ua = navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function PwaInstallCard() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(() => isStandaloneMode())
  const [online, setOnline] = useState(() => navigator.onLine)
  const [serviceWorkerReady, setServiceWorkerReady] = useState(() => Boolean(navigator.serviceWorker?.controller))
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [message, setMessage] = useState('')
  const appleMobile = useMemo(() => isAppleMobile(), [])

  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault()
      setPromptEvent(event as InstallPromptEvent)
    }
    const appInstalled = () => {
      setInstalled(true)
      setPromptEvent(null)
      setMessage('TV Phone is installed and will open like an app.')
    }
    const displayMode = window.matchMedia?.('(display-mode: standalone)')
    const displayChanged = () => setInstalled(isStandaloneMode())
    const wentOnline = () => setOnline(true)
    const wentOffline = () => setOnline(false)
    const controllerChanged = () => setServiceWorkerReady(Boolean(navigator.serviceWorker?.controller))

    window.addEventListener('beforeinstallprompt', beforeInstall)
    window.addEventListener('appinstalled', appInstalled)
    window.addEventListener('online', wentOnline)
    window.addEventListener('offline', wentOffline)
    navigator.serviceWorker?.addEventListener('controllerchange', controllerChanged)
    displayMode?.addEventListener?.('change', displayChanged)
    void navigator.serviceWorker?.ready.then(() => setServiceWorkerReady(Boolean(navigator.serviceWorker?.controller)))

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstall)
      window.removeEventListener('appinstalled', appInstalled)
      window.removeEventListener('online', wentOnline)
      window.removeEventListener('offline', wentOffline)
      navigator.serviceWorker?.removeEventListener('controllerchange', controllerChanged)
      displayMode?.removeEventListener?.('change', displayChanged)
    }
  }, [])

  const install = async () => {
    if (!promptEvent) return
    setMessage('')
    try {
      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
        setPromptEvent(null)
        setMessage('TV Phone was added to this device.')
      } else {
        setMessage('Install was dismissed. You can install it later from Settings.')
      }
    } catch {
      setMessage('Use your browser menu and choose Install app or Add to Home Screen.')
    }
  }

  const checkForUpdate = async () => {
    if (!('serviceWorker' in navigator) || checkingUpdate) return
    setCheckingUpdate(true)
    setMessage('')
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        setMessage('The offline app worker is not active yet. Reload once, then check again.')
        return
      }
      await registration.update()
      setMessage('Update check complete. TV Phone installs new app versions automatically.')
    } catch {
      setMessage('Could not check for an update right now. TV Phone will retry automatically.')
    } finally {
      setCheckingUpdate(false)
    }
  }

  return (
    <>
      <div className="settings-subheading">Install TV Phone</div>
      <div className="settings-panel pwa-install-card">
        {installed ? (
          <div className="settings-row settings-row--static">
            <div className="settings-icon"><CheckCircle2 /></div>
            <div><strong>Installed app mode</strong><span>TV Phone is running from your Home Screen/app launcher with standalone app chrome.</span></div>
          </div>
        ) : promptEvent ? (
          <>
            <div className="settings-row settings-row--static">
              <div className="settings-icon"><Download /></div>
              <div><strong>Install TV Phone</strong><span>Add it to this device for a full-screen, app-like remote with offline shell support.</span></div>
            </div>
            <button className="button-primary pwa-install-button" type="button" onClick={() => void install()}><Download /> Install app</button>
          </>
        ) : appleMobile ? (
          <div className="settings-row settings-row--static">
            <div className="settings-icon"><Share2 /></div>
            <div><strong>Add to your iPhone or iPad</strong><span>Open the browser Share menu, choose “Add to Home Screen,” then tap Add. Launch TV Phone from that new icon.</span></div>
          </div>
        ) : (
          <div className="settings-row settings-row--static">
            <div className="settings-icon"><Smartphone /></div>
            <div><strong>Install from your browser</strong><span>Use the browser menu and choose “Install app” or “Add to Home screen.” Android and desktop browsers can then launch TV Phone like an app.</span></div>
          </div>
        )}

        <div className={`pwa-runtime-status ${online ? 'pwa-runtime-status--online' : 'pwa-runtime-status--offline'}`} role="status">
          <div>{online ? <Wifi /> : <WifiOff />}</div>
          <span><strong>{online ? 'Network available' : 'Offline right now'}</strong><small>{online ? (serviceWorkerReady ? 'Offline app shell is active on this device.' : 'The app is online; offline shell activation is still finishing.') : 'The cached app shell can still open. Cloud sync and hosted network features resume when connectivity returns.'}</small></span>
        </div>

        {'serviceWorker' in navigator && (
          <button className="button-secondary pwa-update-button" type="button" onClick={() => void checkForUpdate()} disabled={checkingUpdate}>
            <RefreshCw className={checkingUpdate ? 'is-spinning' : ''} /> {checkingUpdate ? 'Checking…' : 'Check for app update'}
          </button>
        )}
        {message && <small className="pwa-install-message" aria-live="polite">{message}</small>}
      </div>
    </>
  )
}
