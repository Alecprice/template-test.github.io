import { ShieldCheck } from 'lucide-react'
import { ModeSelector, type AppMode } from './ModeSelector'

interface Props {
  mode: AppMode
  onChange: (mode: AppMode) => void
}

export function KidsModeSettings({ mode, onChange }: Props) {
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

      <ModeSelector mode={mode} onChange={onChange} />

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
