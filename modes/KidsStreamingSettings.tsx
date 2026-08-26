import { Check, ShieldCheck } from 'lucide-react'
import { streamingServices, type StreamingServiceId } from '../lib/streamingServices'

interface Props {
  allowedIds: StreamingServiceId[]
  onChange: (ids: StreamingServiceId[]) => void
  compact?: boolean
}

export function KidsStreamingSettings({ allowedIds, onChange, compact = false }: Props) {
  const allowed = new Set(allowedIds)
  const toggle = (id: StreamingServiceId) => {
    onChange(allowed.has(id) ? allowedIds.filter((item) => item !== id) : [...allowedIds, id])
  }

  return (
    <section className={`kids-streaming-settings ${compact ? 'kids-streaming-settings--compact' : ''}`} aria-labelledby="kids-streaming-title">
      <div className="kids-streaming-settings__heading">
        <span><ShieldCheck /></span>
        <div>
          <strong id="kids-streaming-title">Kids Safe apps</strong>
          <small>Choose which quick-launch streaming services appear while Kids Safe is active.</small>
        </div>
      </div>
      <div className="kids-streaming-settings__actions">
        <button type="button" onClick={() => onChange(streamingServices.map((service) => service.id))}>Allow all</button>
        <button type="button" onClick={() => onChange([])}>Hide all</button>
      </div>
      <div className="kids-streaming-grid" role="group" aria-label="Allowed Kids Safe streaming services">
        {streamingServices.map((service) => {
          const checked = allowed.has(service.id)
          return (
            <button
              key={service.id}
              type="button"
              className={checked ? 'allowed' : ''}
              aria-pressed={checked}
              onClick={() => toggle(service.id)}
            >
              <span className="kids-streaming-grid__badge">{service.badge}</span>
              <span>{service.name}</span>
              <i aria-hidden="true">{checked && <Check />}</i>
            </button>
          )
        })}
      </div>
      <small className="kids-streaming-settings__note">This only changes which shortcuts TV Phone shows. Use each TV and streaming service’s parental controls for ratings, purchases, profiles, and content restrictions.</small>
    </section>
  )
}
