import { readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Data resilience patch failed: ${label}`)
  return source.replace(needle, replacement)
}

let sync = await readFile('src/lib/useAccountSync.ts', 'utf8')

sync = replaceOrFail(
  sync,
  `function writeJson(key: string, value: unknown) {\n  localStorage.setItem(key, JSON.stringify(value))\n}\n\nfunction getClientId() {\n  const existing = localStorage.getItem(CLIENT_ID_KEY)\n  if (existing) return existing\n  const id = typeof crypto.randomUUID === 'function'\n    ? crypto.randomUUID()\n    : \`client-\${Date.now()}-\${Math.random().toString(36).slice(2)}\`\n  localStorage.setItem(CLIENT_ID_KEY, id)\n  return id\n}`,
  `function safeGetLocal(key: string) {\n  try { return localStorage.getItem(key) } catch { return null }\n}\n\nfunction safeSetLocal(key: string, value: string) {\n  try { localStorage.setItem(key, value); return true } catch { return false }\n}\n\nfunction safeRemoveLocal(key: string) {\n  try { localStorage.removeItem(key) } catch {}\n}\n\nfunction writeJson(key: string, value: unknown) {\n  return safeSetLocal(key, JSON.stringify(value))\n}\n\nfunction getClientId() {\n  const existing = safeGetLocal(CLIENT_ID_KEY)\n  if (existing) return existing\n  const id = typeof crypto.randomUUID === 'function'\n    ? crypto.randomUUID()\n    : \`client-\${Date.now()}-\${Math.random().toString(36).slice(2)}\`\n  safeSetLocal(CLIENT_ID_KEY, id)\n  return id\n}`,
  'safe browser storage helpers',
)

sync = replaceOrFail(
  sync,
  "    && localStorage.getItem('tv-phone:demo') !== 'false'",
  "    && safeGetLocal('tv-phone:demo') !== 'false'",
  'safe demo mode read',
)
sync = replaceOrFail(
  sync,
  `    localStorage.setItem('tv-phone:haptics', String(state.preferences.haptics))\n    localStorage.setItem('tv-phone:keep-awake', String(state.preferences.keepAwake))`,
  `    safeSetLocal('tv-phone:haptics', String(state.preferences.haptics))\n    safeSetLocal('tv-phone:keep-awake', String(state.preferences.keepAwake))`,
  'safe preference writes',
)

sync = replaceOrFail(
  sync,
  `  const saveTimerRef = useRef<number | undefined>(undefined)`,
  `  const saveTimerRef = useRef<number | undefined>(undefined)\n  const latestVersionRef = useRef(0)`,
  'latest sync version ref',
)
sync = replaceOrFail(
  sync,
  `  const applyState = useCallback((userId: string, state: AccountStateV1, updatedAt?: string) => {\n    const current = latestRef.current`,
  `  const applyState = useCallback((userId: string, state: AccountStateV1, updatedAt?: string, version?: number) => {\n    if (typeof version === 'number' && version <= latestVersionRef.current) return false\n    if (typeof version === 'number') latestVersionRef.current = version\n    const current = latestRef.current`,
  'stale state guard',
)
sync = replaceOrFail(
  sync,
  `    if (updatedAt) setLastSyncedAt(Date.parse(updatedAt))\n    setSyncGeneration((value) => value + 1)\n  }, [])`,
  `    if (updatedAt) setLastSyncedAt(Date.parse(updatedAt))\n    setSyncGeneration((value) => value + 1)\n    return true\n  }, [])`,
  'apply state result',
)
sync = replaceOrFail(
  sync,
  `      const row = await pushRemoteState(user.id, state, clientIdRef.current!)\n      setLastSyncedAt(Date.parse(row.updated_at))`,
  `      const row = await pushRemoteState(user.id, state, clientIdRef.current!)\n      latestVersionRef.current = Math.max(latestVersionRef.current, row.version)\n      setLastSyncedAt(Date.parse(row.updated_at))`,
  'sync write version tracking',
)
sync = replaceOrFail(
  sync,
  `    if (!user || !client) return\n    let cancelled = false`,
  `    if (!user || !client) return\n    latestVersionRef.current = 0\n    let cancelled = false`,
  'reset version for user hydrate',
)
sync = replaceOrFail(
  sync,
  `          applyState(user.id, state, remote.updated_at)`,
  `          applyState(user.id, state, remote.updated_at, remote.version)`,
  'initial remote version',
)
sync = replaceOrFail(
  sync,
  `          const created = await pushRemoteState(user.id, state, clientIdRef.current!)\n          if (cancelled) return\n          setLastSyncedAt(Date.parse(created.updated_at))`,
  `          const created = await pushRemoteState(user.id, state, clientIdRef.current!)\n          if (cancelled) return\n          latestVersionRef.current = Math.max(latestVersionRef.current, created.version)\n          setLastSyncedAt(Date.parse(created.updated_at))`,
  'created profile version',
)
sync = replaceOrFail(
  sync,
  `        if (!row.state || row.updated_by_device_id === clientIdRef.current) return\n        const state = parseAccountState(row.state)\n        if (!state) return\n        applyState(user.id, state, row.updated_at)\n        setStatus('synced')\n        setMessage('Updated from another device')`,
  `        if (!row.state || row.updated_by_device_id === clientIdRef.current) return\n        if (typeof row.version !== 'number' || row.version <= latestVersionRef.current) return\n        const state = parseAccountState(row.state)\n        if (!state) return\n        const applied = applyState(user.id, state, row.updated_at, row.version)\n        if (!applied) return\n        setStatus('synced')\n        setMessage('Updated from another device')`,
  'realtime stale event rejection',
)
sync = replaceOrFail(
  sync,
  `      if (!session?.user) {\n        hydratedUserRef.current = undefined\n        setStatus('local')`,
  `      if (!session?.user) {\n        hydratedUserRef.current = undefined\n        latestVersionRef.current = 0\n        setStatus('local')`,
  'version reset on sign out',
)

sync = sync.replaceAll("localStorage.removeItem('tv-phone:haptics')", "safeRemoveLocal('tv-phone:haptics')")
sync = sync.replaceAll("localStorage.removeItem('tv-phone:keep-awake')", "safeRemoveLocal('tv-phone:keep-awake')")
sync = sync.replaceAll("localStorage.removeItem('tv-phone:app-mode:v1')", "safeRemoveLocal('tv-phone:app-mode:v1')")
sync = sync.replaceAll("localStorage.removeItem('tv-phone:demo')", "safeRemoveLocal('tv-phone:demo')")

await writeFile('src/lib/useAccountSync.ts', sync)
console.log('Account sync data resilience applied')
