import { Moon, ShieldCheck, Sun } from 'lucide-react'
import type { AppMode } from '../lib/appMode'

interface Props {
  mode: AppMode
  onChange: (mode: AppMode) => void
  compact?: boolean
}

const OPTIONS: Array<{ value: AppMode; label: string; detail: string }> = [
  { value: 'kids', label: 'Kids Safe', detail: 'Simplified remote with lower-risk controls.' },
  { value: 'light', label: 'Full Light', detail: 'All controls with a bright theme.' },
  { value: 'dark', label: 'Full Dark', detail: 'All controls with the dark theme.' },
]

function Icon({ mode }: { mode: AppMode }) {
  if (mode === 'kids') return <ShieldCheck />
  if (mode === 'light') return <Sun />
  return <Moon />
}

export function ModeSelector({ mode, onChange, compact = false }: Props) {
  return (
    <section className={`mode-card ${compact ? 'mode-card--compact' : ''}`} aria-labelledby="mode-heading">
      {!compact && (
        <div className="mode-card__heading">
          <span className="settings-icon"><Icon mode={mode} /></span>
          <span>
            <strong id="mode-heading">App mode</strong>
            <small>Choose the controls and appearance that fit this device.</small>
          </span>
        </div>
      )}
      <div className="mode-segmented" role="radiogroup" aria-label="TV Phone app mode">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={mode === option.value}
            className={mode === option.value ? 'active' : ''}
            onClick={() => onChange(option.value)}
          >
            <Icon mode={option.value} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      {!compact && <p className="mode-detail">{OPTIONS.find((option) => option.value === mode)?.detail}</p>}
    </section>
  )
}

export type { AppMode }
