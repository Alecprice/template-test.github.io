export type AppMode = 'kids' | 'light' | 'dark'

export const APP_MODE_KEY = 'tv-phone:app-mode:v1'

export function normalizeAppMode(value: unknown): AppMode {
  return value === 'kids' || value === 'light' || value === 'dark' ? value : 'dark'
}

export function loadAppMode(): AppMode {
  if (typeof window === 'undefined') return 'dark'
  return normalizeAppMode(window.localStorage.getItem(APP_MODE_KEY))
}

export function saveAppMode(mode: AppMode) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(APP_MODE_KEY, mode)
}

export function applyAppModeTheme(mode: AppMode) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.dataset.appMode = mode
  root.style.colorScheme = mode === 'dark' ? 'dark' : 'light'

  const themeColor = mode === 'dark' ? '#07090d' : mode === 'kids' ? '#eef8ff' : '#f5f7fb'
  const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  themeMeta?.setAttribute('content', themeColor)
  const schemeMeta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]')
  schemeMeta?.setAttribute('content', mode === 'dark' ? 'dark' : 'light')
}
