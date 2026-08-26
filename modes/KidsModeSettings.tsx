import { useEffect, useRef, useState, type FormEvent } from 'react'
import { KeyRound, LockKeyhole, ShieldCheck, UnlockKeyhole } from 'lucide-react'
import { ModeSelector, type AppMode } from './ModeSelector'
import {
  clearParentPin,
  parentPinConfigured,
  setParentPin,
  validateParentPin,
  verifyParentPin,
} from '../lib/parentLock'

interface Props {
  mode: AppMode
  onChange: (mode: AppMode) => void
}

const HOLD_MS = 1600
const UNLOCK_WINDOW_MS = 20_000
const MAX_PIN_ATTEMPTS = 5
const PIN_COOLDOWN_MS = 30_000

export function KidsModeSettings({ mode, onChange }: Props) {
  const holdTimer = useRef<number | undefined>(undefined)
  const unlockTimer = useRef<number | undefined>(undefined)
  const cooldownTimer = useRef<number | undefined>(undefined)
  const [holding, setHolding] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [hasPin, setHasPin] = useState(() => parentPinConfigured())
  const [pin, setPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinNotice, setPinNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)

  const stopHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    holdTimer.current = undefined
    setHolding(false)
  }

  const lock = () => {
    if (unlockTimer.current) window.clearTimeout(unlockTimer.current)
    unlockTimer.current = undefined
    setUnlocked(false)
    setPin('')
    setPinError('')
    setPinNotice('')
    stopHold()
  }

  const unlock = () => {
    stopHold()
    setUnlocked(true)
    setPin('')
    setPinError('')
    setFailedAttempts(0)
    if (unlockTimer.current) window.clearTimeout(unlockTimer.current)
    unlockTimer.current = window.setTimeout(() => setUnlocked(false), UNLOCK_WINDOW_MS)
  }

  const startHold = () => {
    if (hasPin || unlocked || holdTimer.current) return
    setHolding(true)
    holdTimer.current = window.setTimeout(unlock, HOLD_MS)
  }

  const unlockWithPin = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || Date.now() < cooldownUntil) return
    const validation = validateParentPin(pin)
    if (validation) {
      setPinError(validation)
      return
    }
    setBusy(true)
    setPinError('')
    try {
      if (await verifyParentPin(pin)) {
        unlock()
        return
      }
      const nextAttempts = failedAttempts + 1
      setFailedAttempts(nextAttempts)
      setPin('')
      if (nextAttempts >= MAX_PIN_ATTEMPTS) {
        const until = Date.now() + PIN_COOLDOWN_MS
        setCooldownUntil(until)
        setCooldownSeconds(Math.ceil(PIN_COOLDOWN_MS / 1000))
        setFailedAttempts(0)
        setPinError('Too many attempts. Parent PIN entry is temporarily paused.')
      } else {
        setPinError(`Incorrect PIN. ${MAX_PIN_ATTEMPTS - nextAttempts} ${MAX_PIN_ATTEMPTS - nextAttempts === 1 ? 'try' : 'tries'} before a short pause.`)
      }
    } catch (error) {
      setPinError(error instanceof Error ? error.message : 'Could not verify the parent PIN.')
    } finally {
      setBusy(false)
    }
  }

  const saveNewPin = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    const validation = validateParentPin(newPin)
    if (validation) {
      setPinError(validation)
      return
    }
    if (newPin !== confirmPin) {
      setPinError('PINs do not match.')
      return
    }
    setBusy(true)
    setPinError('')
    setPinNotice('')
    try {
      await setParentPin(newPin)
      setHasPin(true)
      setNewPin('')
      setConfirmPin('')
      setPinNotice('Parent PIN saved on this device.')
    } catch (error) {
      setPinError(error instanceof Error ? error.message : 'Could not save the parent PIN.')
    } finally {
      setBusy(false)
    }
  }

  const removePin = () => {
    if (!clearParentPin()) {
      setPinError('This browser could not remove the saved parent PIN.')
      return
    }
    setHasPin(false)
    setNewPin('')
    setConfirmPin('')
    setPinError('')
    setPinNotice('Parent PIN removed. Press-and-hold unlock is active again.')
  }

  useEffect(() => {
    if (!cooldownUntil) return
    const update = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setCooldownSeconds(remaining)
      if (!remaining) {
        setCooldownUntil(0)
        setPinError('')
        if (cooldownTimer.current) window.clearInterval(cooldownTimer.current)
        cooldownTimer.current = undefined
      }
    }
    update()
    cooldownTimer.current = window.setInterval(update, 1000)
    return () => {
      if (cooldownTimer.current) window.clearInterval(cooldownTimer.current)
      cooldownTimer.current = undefined
    }
  }, [cooldownUntil])

  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    if (unlockTimer.current) window.clearTimeout(unlockTimer.current)
    if (cooldownTimer.current) window.clearInterval(cooldownTimer.current)
  }, [])

  return (
    <section className="content-page kids-settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SIMPLIFIED MODE</p>
          <h1>Kids Safe</h1>
          <p>Fewer controls, bigger targets, and less chance of changing TV or app setup by accident.</p>
        </div>
        <span className="kids-shield"><ShieldCheck /></span>
      </div>

      {unlocked ? (
        <div className="kids-parent-panel" role="status">
          <div className="kids-parent-panel__status">
            <span><UnlockKeyhole /></span>
            <div>
              <strong>Parent controls unlocked</strong>
              <small>Choose a mode or manage the parent PIN. This panel locks again automatically after 20 seconds.</small>
            </div>
          </div>
          <ModeSelector mode={mode} onChange={onChange} compact />

          <div className="kids-pin-manager">
            <div className="kids-pin-manager__heading">
              <KeyRound />
              <div>
                <strong>{hasPin ? 'Change parent PIN' : 'Add a parent PIN'}</strong>
                <small>{hasPin ? 'Replace the PIN used to leave Kids Safe on this device.' : 'A PIN prevents press-and-hold from unlocking Full modes.'}</small>
              </div>
            </div>
            <form className="kids-pin-form" onSubmit={saveNewPin}>
              <label>
                <span>{hasPin ? 'New PIN' : 'PIN'}</span>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  pattern="[0-9]*"
                  minLength={4}
                  maxLength={8}
                  value={newPin}
                  onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="4–8 digits"
                />
              </label>
              <label>
                <span>Confirm PIN</span>
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="new-password"
                  pattern="[0-9]*"
                  minLength={4}
                  maxLength={8}
                  value={confirmPin}
                  onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Repeat PIN"
                />
              </label>
              <button type="submit" className="button-primary" disabled={busy}>{busy ? 'Saving…' : hasPin ? 'Replace PIN' : 'Save parent PIN'}</button>
            </form>
            {hasPin && <button type="button" className="kids-remove-pin" onClick={removePin} disabled={busy}>Remove PIN and use hold only</button>}
          </div>

          {(pinError || pinNotice) && <div className={pinError ? 'kids-pin-message kids-pin-message--error' : 'kids-pin-message'} role={pinError ? 'alert' : 'status'}>{pinError || pinNotice}</div>}
          <button type="button" className="kids-lock-again" onClick={lock}><LockKeyhole /> Lock again</button>
        </div>
      ) : hasPin ? (
        <div className="kids-parent-panel">
          <div className="kids-parent-panel__status">
            <span><LockKeyhole /></span>
            <div>
              <strong>Parent PIN required</strong>
              <small>Enter the PIN saved on this device to make Full Light and Full Dark available.</small>
            </div>
          </div>
          <form className="kids-pin-unlock" onSubmit={unlockWithPin}>
            <label htmlFor="kids-parent-pin">Parent PIN</label>
            <div className="kids-pin-unlock__row">
              <input
                id="kids-parent-pin"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                pattern="[0-9]*"
                minLength={4}
                maxLength={8}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Enter PIN"
                disabled={busy || cooldownSeconds > 0}
                autoFocus
              />
              <button type="submit" className="button-primary" disabled={busy || cooldownSeconds > 0 || pin.length < 4}>{busy ? 'Checking…' : cooldownSeconds > 0 ? `${cooldownSeconds}s` : 'Unlock'}</button>
            </div>
          </form>
          {pinError && <div className="kids-pin-message kids-pin-message--error" role="alert">{pinError}</div>}
          <small className="kids-unlock-help">The PIN is stored only on this device using a salted PBKDF2-derived hash. It is an app-mode lock, not a replacement for TV or streaming-service parental controls.</small>
        </div>
      ) : (
        <div className="kids-parent-panel">
          <div className="kids-parent-panel__status">
            <span><LockKeyhole /></span>
            <div>
              <strong>Parent controls locked</strong>
              <small>Press and hold to make Full Light and Full Dark available, then optionally add a parent PIN.</small>
            </div>
          </div>
          <button
            type="button"
            className={`kids-unlock-button ${holding ? 'holding' : ''}`}
            aria-describedby="kids-unlock-help"
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerCancel={stopHold}
            onPointerLeave={stopHold}
            onKeyDown={(event) => {
              if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
                event.preventDefault()
                startHold()
              }
            }}
            onKeyUp={(event) => {
              if (event.key === ' ' || event.key === 'Enter') stopHold()
            }}
          >
            <span className="kids-unlock-button__progress" aria-hidden="true" />
            <LockKeyhole />
            <span>{holding ? 'Keep holding…' : 'Hold for parent controls'}</span>
          </button>
          <small id="kids-unlock-help" className="kids-unlock-help">This prevents accidental mode changes. Add a parent PIN after unlocking if you want the hold gesture disabled.</small>
        </div>
      )}

      <div className="kids-safe-note">
        <strong>What Kids Safe changes</strong>
        <span>TV setup, Activities, power, advanced quick controls, voice/text tools, and management actions are hidden. Navigation, playback, volume/channel controls, and configured streaming shortcuts remain available.</span>
      </div>
      <div className="kids-safe-note kids-safe-note--caution">
        <strong>Content limits still come from the TV</strong>
        <span>This mode reduces accidental controls inside TV Phone. Use the television, Fire TV, and streaming-service parental controls for PINs, ratings, purchases, and content restrictions.</span>
      </div>
    </section>
  )
}
