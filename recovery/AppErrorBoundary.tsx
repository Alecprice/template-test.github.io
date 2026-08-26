import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ShieldCheck, Wrench } from 'lucide-react'

interface Props { children: ReactNode }
interface State { error: Error | null; repairing: boolean }

async function repairDownloadedApp() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }
  if ('caches' in window) {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  }
  window.location.reload()
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, repairing: false }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('TV Phone runtime error', error, info)
  }

  private repair = async () => {
    if (this.state.repairing) return
    this.setState({ repairing: true })
    try {
      await repairDownloadedApp()
    } catch (error) {
      console.error('TV Phone cache repair failed', error)
      this.setState({ repairing: false })
    }
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <main className="runtime-recovery" role="alert" aria-labelledby="runtime-recovery-title">
        <section className="runtime-recovery__card">
          <div className="runtime-recovery__icon"><AlertTriangle /></div>
          <div className="runtime-recovery__copy">
            <p className="eyebrow">RECOVERY MODE</p>
            <h1 id="runtime-recovery-title">TV Phone hit an unexpected error</h1>
            <p>Your saved TVs, pairing details, account data and preferences have not been cleared. Reload first; if the problem came from a stale installed-app cache, repair the downloaded app files.</p>
          </div>
          <div className="runtime-recovery__actions">
            <button type="button" className="button-primary" onClick={() => window.location.reload()}><RefreshCw /> Reload TV Phone</button>
            <button type="button" className="button-secondary" disabled={this.state.repairing} onClick={() => void this.repair()}><Wrench /> {this.state.repairing ? 'Repairing…' : 'Repair cached app'}</button>
          </div>
          <div className="runtime-recovery__safety"><ShieldCheck /><span>Repair cached app only removes downloaded PWA/service-worker files. It does not clear local TV setup, pairing credentials, account storage, backups or preferences.</span></div>
        </section>
      </main>
    )
  }
}
