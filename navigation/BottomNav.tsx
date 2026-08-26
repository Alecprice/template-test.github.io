import { Home, Play, Settings, Tv } from 'lucide-react'
import type { AppMode } from '../lib/appMode'

export type AppTab = 'remote' | 'devices' | 'activities' | 'settings'

interface Props {
  active: AppTab
  onChange: (tab: AppTab) => void
  appMode?: AppMode
}

const tabs = [
  { id: 'remote' as const, label: 'Remote', Icon: Home },
  { id: 'devices' as const, label: 'Devices', Icon: Tv },
  { id: 'activities' as const, label: 'Activities', Icon: Play },
  { id: 'settings' as const, label: 'Settings', Icon: Settings },
]

export function BottomNav({ active, onChange, appMode = 'dark' }: Props) {
  const visibleTabs = appMode === 'kids'
    ? tabs.filter(({ id }) => id === 'remote' || id === 'settings')
    : tabs

  return (
    <nav
      className={`bottom-nav bottom-nav--${visibleTabs.length}`}
      aria-label="Primary navigation"
      data-visible-tabs={visibleTabs.length}
    >
      {visibleTabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={active === id ? 'active' : ''}
          aria-current={active === id ? 'page' : undefined}
          aria-label={label}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  )
}
