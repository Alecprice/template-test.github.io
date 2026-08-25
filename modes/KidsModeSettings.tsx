import { useEffect, useRef, useState } from 'react'
import { LockKeyhole, ShieldCheck, UnlockKeyhole } from 'lucide-react'
import { ModeSelector, type AppMode } from './ModeSelector'

interface Props {
  mode: AppMode
  onChange: (mode: AppMode) => void
}

const HOLD_MS = 1600
const UNLOCK_WINDOW_MS = 20_000

export function KidsModeSettings({ mode, onChange }: Props) {
  const holdTimer = useRef<number | undefined>(undefined)
  const unlockTimer = useRef<number | undefined>(undefined)
  const [holding, setHolding] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  const stopHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    holdTimer.current = undefined
    setHolding(false)
  }

  const lock = () => {
    if (unlockTimer.current) window.clearTimeout(unlockTimer.current)
    unlockTimer.current = undefined
    setUnlocked(false)
    stopHold()
  }

  const unlock = () => {
    stopHold()
    setUnlocked(true)
    if (unlockTimer.current) window.clearTimeout(unlockTimer.current)
    unlockTimer.current = window.setTimeout(() => setUnlocked(false), UNLOCK_WINDOW_MS)
  }

  const startHold = () => {
    if (unlocked || holdTimer.current) return
    setHolding(true)
    holdTimer.current = window.setTimeout(unlock, HOLD_MS)
  }

  useEffect(() => () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current)
    if (unlockTimer.current) window.clearTimeout(unlockTimer.current)
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
              <strong>Full modes unlocked</strong>
              <small>Choose a mode below. This panel locks again automatically after 20 seconds.</small>
            </div>
          </div>
          <ModeSelector mode={mode} onChange={onChange} compact />
          <button type="button" className="kids-lock-again" onClick={lock}><LockKeyhole /> Lock again</button>
        </div>
      ) : (
        <div className="kids-parent-panel">
          <div className="kids-parent-panel__status">
            <span><LockKeyhole /></span>
            <div>
              <strong>Parent controls locked</strong>
              <small>Press and hold to make Full Light and Full Dark available.</small>
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
          <small id="kids-unlock-help" className="kids-unlock-help">This prevents accidental mode changes. It is not a parental-control PIN or security boundary.</small>
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
