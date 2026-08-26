import { Cloud, Eye, EyeOff, LogIn, LogOut, RefreshCw, ShieldCheck, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
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
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  syncNow: () => Promise<void>
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
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  const submitSignIn = (event: FormEvent) => {
    event.preventDefault()
    if (props.busy || !email.trim() || !password) return
    void props.signIn(email, password)
  }

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
              <button className="button-secondary" type="button" disabled={props.busy || props.status === 'syncing'} onClick={() => void props.syncNow()}><RefreshCw /> Sync now</button>
              <button className="button-secondary" type="button" disabled={props.busy} onClick={() => void props.signOut()}><LogOut /> Sign out</button>
            </div>
          </>
        ) : (
          <form className="account-auth-form" onSubmit={submitSignIn}>
            <label><span>Email</span><input type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
            <label>
              <span>Password</span>
              <div className="account-password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="8+ characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                  onKeyDown={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                  aria-describedby={capsLock ? 'account-caps-lock' : undefined}
                />
                <button type="button" className="account-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {capsLock && <small id="account-caps-lock" className="account-caps-lock" role="status">Caps Lock is on.</small>}
            </label>
            <div className="bridge-test-row">
              <button className="button-primary" type="submit" disabled={props.busy || !email.trim() || !password}><LogIn /> {props.busy ? 'Working…' : 'Sign in'}</button>
              <button className="button-secondary" type="button" disabled={props.busy || !email.trim() || password.length < 8} onClick={() => void props.signUp(email, password)}><UserRound /> Create account</button>
            </div>
            <small>Your current setup will become the starting profile when you create an account. Google/Apple login can be linked later without changing your saved TV Phone data.</small>
          </form>
        )}
        {props.message && <div className="security-note" role="status"><Cloud /><span>{props.message}</span></div>}
        {props.error && <div className="security-note" role="alert"><span><strong>Account error</strong><br />{props.error}</span></div>}
      </div>
    </>
  )
}
