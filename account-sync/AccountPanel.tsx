import { Cloud, LogIn, LogOut, RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import type { AccountSyncStatus } from '../lib/useAccountSync'

export interface AccountPanelProps {
  configured: boolean
  ready: boolean
  busy: boolean
  email: string
  signedIn: boolean
  status: AccountSyncStatus
  error: string
  message: string
  lastSyncedAt?: number
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
  onSignOut: () => Promise<void>
  onSyncNow: () => Promise<void>
}

function statusCopy(status: AccountSyncStatus) {
  if (status === 'loading') return 'Loading your account…'
  if (status === 'syncing') return 'Saving changes…'
  if (status === 'synced') return 'Up to date'
  if (status === 'offline') return 'Offline · using saved copy'
  if (status === 'error') return 'Sync needs attention'
  return 'Stored on this device'
}

export function AccountPanel(props: AccountPanelProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <>
      <div className="settings-subheading">Account & sync</div>
      <div className="settings-panel">
        {!props.configured ? (
          <div className="settings-row settings-row--static">
            <div className="settings-icon"><Cloud /></div>
            <div><strong>Cloud accounts are being connected</strong><span>Email/password support is built into this version. The cloud project keys still need to be attached to this deployment.</span></div>
          </div>
        ) : !props.ready ? (
          <div className="settings-row settings-row--static">
            <div className="settings-icon"><RefreshCw /></div>
            <div><strong>Checking your account</strong><span>Loading the saved session on this device.</span></div>
          </div>
        ) : props.signedIn ? (
          <>
            <div className="settings-row settings-row--static">
              <div className="settings-icon"><UserRound /></div>
              <div><strong>{props.email}</strong><span>{statusCopy(props.status)}{props.lastSyncedAt ? ` · Last sync ${new Date(props.lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</span></div>
            </div>
            <div className="security-note"><ShieldCheck /><span><strong>Your setup follows this account</strong><br />TV names, rooms, favorites, streaming shortcuts, activities, and shared preferences sync between devices. Pairing secrets stay on each device.</span></div>
            <div className="bridge-test-row">
              <button className="button-secondary" type="button" disabled={props.busy || props.status === 'syncing'} onClick={() => void props.onSyncNow()}><RefreshCw /> Sync now</button>
              <button className="button-secondary" type="button" disabled={props.busy} onClick={() => void props.onSignOut()}><LogOut /> Sign out</button>
            </div>
          </>
        ) : (
          <>
            <label><span>Email</span><input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label><span>Password</span><input type="password" autoComplete="current-password" placeholder="8+ characters" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <div className="bridge-test-row">
              <button className="button-primary" type="button" disabled={props.busy || !email.trim() || !password} onClick={() => void props.onSignIn(email, password)}><LogIn /> {props.busy ? 'Working…' : 'Sign in'}</button>
              <button className="button-secondary" type="button" disabled={props.busy || !email.trim() || password.length < 8} onClick={() => void props.onSignUp(email, password)}><UserRound /> Create account</button>
            </div>
            <small>Your current setup will become the starting profile when you create an account. Google/Apple login can be linked later without changing your saved TV Phone data.</small>
          </>
        )}
        {props.message && <div className="security-note"><Cloud /><span>{props.message}</span></div>}
        {props.error && <div className="security-note"><span><strong>Account error</strong><br />{props.error}</span></div>}
      </div>
    </>
  )
}
