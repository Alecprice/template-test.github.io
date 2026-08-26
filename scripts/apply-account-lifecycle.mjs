import { readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Account lifecycle patch failed: ${label}`)
  return source.replace(needle, replacement)
}

let sync = await readFile('src/lib/useAccountSync.ts', 'utf8')

sync = replaceOrFail(
  sync,
  `const PRIVATE_PREFIX = 'tv-phone:account-private:v1:'`,
  `const PRIVATE_PREFIX = 'tv-phone:account-private:v1:'\nconst REMOTE_BASE_PREFIX = 'tv-phone:account-remote-base:v1:'\nconst ACTIVE_ACCOUNT_KEY = 'tv-phone:active-account:v1'`,
  'account lifecycle storage keys',
)

const cacheHelpersMarker = `function privateKey(userId: string) { return \`${'${PRIVATE_PREFIX}${userId}'}\` }\nfunction cacheKey(userId: string) { return \`${'${CACHE_PREFIX}${userId}'}\` }`
sync = replaceOrFail(
  sync,
  cacheHelpersMarker,
  `${cacheHelpersMarker}\nfunction remoteBaseKey(userId: string) { return \`${'${REMOTE_BASE_PREFIX}${userId}'}\` }\n\ninterface RemoteBaseSnapshot { state: AccountStateV1; version: number }\n\nfunction loadRemoteBase(userId: string): RemoteBaseSnapshot | undefined {\n  const value = readJson<RemoteBaseSnapshot>(remoteBaseKey(userId))\n  return value && value.state?.schemaVersion === 1 && typeof value.version === 'number' ? value : undefined\n}\n\nfunction saveRemoteBase(userId: string, state: AccountStateV1, version: number) {\n  writeJson(remoteBaseKey(userId), { state, version } satisfies RemoteBaseSnapshot)\n}\n\nfunction sameAccountState(left: AccountStateV1, right: AccountStateV1) {\n  return JSON.stringify(left) === JSON.stringify(right)\n}\n\nfunction clearSharedAccountState(current: Options) {\n  const bridgeConfig: BridgeConfig = { url: '', token: '' }\n  current.setDevices([])\n  current.setActivities([])\n  current.setActiveDeviceId('')\n  current.setBridgeConfig(bridgeConfig)\n  storage.saveDevices([])\n  storage.saveActivities([])\n  storage.clearActiveDeviceId()\n  storage.saveBridgeConfig(bridgeConfig)\n}`,
  'remote base helpers',
)

sync = replaceOrFail(
  sync,
  `  const latestVersionRef = useRef(0)`,
  `  const latestVersionRef = useRef(0)\n  const remoteBaseRef = useRef<RemoteBaseSnapshot | undefined>(undefined)\n\n  const isolateAccount = useCallback((nextUserId?: string) => {\n    const previousOwner = safeGetLocal(ACTIVE_ACCOUNT_KEY)\n    if (previousOwner && previousOwner !== nextUserId) {\n      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)\n      savePrivateCache(previousOwner, latestRef.current)\n      clearSharedAccountState(latestRef.current)\n      hydratedUserRef.current = undefined\n      latestVersionRef.current = 0\n    }\n    if (nextUserId) {\n      safeSetLocal(ACTIVE_ACCOUNT_KEY, nextUserId)\n      remoteBaseRef.current = loadRemoteBase(nextUserId)\n    } else {\n      safeRemoveLocal(ACTIVE_ACCOUNT_KEY)\n      remoteBaseRef.current = undefined\n    }\n  }, [])`,
  'account isolation state',
)

sync = replaceOrFail(
  sync,
  `    const current = latestRef.current\n    const privateCache = loadPrivateCache(userId)`,
  `    const current = latestRef.current\n    if (typeof version === 'number') {\n      remoteBaseRef.current = { state, version }\n      saveRemoteBase(userId, state, version)\n    }\n    const privateCache = loadPrivateCache(userId)`,
  'record remote base on hydrate',
)

const syncStart = sync.indexOf('  const syncNow = useCallback(async () => {')
const syncEnd = sync.indexOf('\n  useEffect(() => {', syncStart)
if (syncStart < 0 || syncEnd < 0) throw new Error('Account lifecycle patch failed: syncNow block')
const safeSync = `  const syncNow = useCallback(async () => {\n    if (!user || hydratedUserRef.current !== user.id) return\n    const current = latestRef.current\n    const state = toAccountState(current)\n    writeJson(cacheKey(user.id), state)\n    savePrivateCache(user.id, current)\n    if (!navigator.onLine) {\n      setStatus('offline')\n      setMessage('Changes are saved on this device and will be checked against the cloud before reconnecting.')\n      return\n    }\n    setStatus('syncing')\n    setError('')\n    try {\n      const remote = await fetchRemoteState(user.id)\n      if (remote) {\n        const remoteState = parseAccountState(remote.state)\n        if (!remoteState) throw new Error('Cloud profile uses an unsupported data format')\n        const knownBase = remoteBaseRef.current ?? loadRemoteBase(user.id)\n        const baseVersion = knownBase?.version ?? latestVersionRef.current\n        if (remote.version > baseVersion) {\n          const localChanged = knownBase ? !sameAccountState(state, knownBase.state) : !sameAccountState(state, remoteState)\n          if (localChanged) {\n            setStatus('error')\n            setError('Another device has a newer cloud version. Nothing was overwritten.')\n            setMessage('Your unsynced changes are still on this device. Export a safe backup if you need them, then choose Load cloud copy to continue from the newer account version.')\n            return\n          }\n          applyState(user.id, remoteState, remote.updated_at, remote.version)\n          setStatus('synced')\n          setMessage('Loaded newer changes from another device')\n          return\n        }\n      }\n      const row = await pushRemoteState(user.id, state, clientIdRef.current!)\n      latestVersionRef.current = Math.max(latestVersionRef.current, row.version)\n      remoteBaseRef.current = { state, version: row.version }\n      saveRemoteBase(user.id, state, row.version)\n      setLastSyncedAt(Date.parse(row.updated_at))\n      setStatus('synced')\n      setMessage('')\n    } catch (syncError) {\n      setStatus(navigator.onLine ? 'error' : 'offline')\n      setError(syncError instanceof Error ? syncError.message : 'Cloud sync failed')\n    }\n  }, [user, applyState])\n\n  const loadCloudCopy = useCallback(async () => {\n    if (!user || !navigator.onLine) {\n      setStatus('offline')\n      setError('Connect to the internet before loading the cloud copy.')\n      return\n    }\n    setBusy(true)\n    setStatus('loading')\n    setError('')\n    try {\n      const remote = await fetchRemoteState(user.id)\n      if (!remote) throw new Error('No cloud profile exists for this account yet')\n      const state = parseAccountState(remote.state)\n      if (!state) throw new Error('Cloud profile uses an unsupported data format')\n      applyState(user.id, state, remote.updated_at, remote.version)\n      hydratedUserRef.current = user.id\n      setStatus('synced')\n      setMessage('Cloud copy loaded. Pairing credentials on this device were preserved when they still match the same TV.')\n    } catch (loadError) {\n      setStatus(navigator.onLine ? 'error' : 'offline')\n      setError(loadError instanceof Error ? loadError.message : 'Could not load the cloud copy')\n    } finally {\n      setBusy(false)\n    }\n  }, [user, applyState])\n`
sync = `${sync.slice(0, syncStart)}${safeSync}${sync.slice(syncEnd)}`

sync = replaceOrFail(
  sync,
  `        if (sessionError) setError(sessionError.message)\n        setUser(data.session?.user ?? null)`,
  `        if (sessionError) setError(sessionError.message)\n        isolateAccount(data.session?.user?.id)\n        setUser(data.session?.user ?? null)`,
  'initial session isolation',
)
sync = replaceOrFail(
  sync,
  `        const { data: authData } = client.auth.onAuthStateChange((_event, session) => {\n          if (!active) return\n          setUser(session?.user ?? null)`,
  `        const { data: authData } = client.auth.onAuthStateChange((_event, session) => {\n          if (!active) return\n          isolateAccount(session?.user?.id)\n          setUser(session?.user ?? null)`,
  'auth transition isolation',
)

sync = replaceOrFail(
  sync,
  `    let client: SupabaseClient | null = null\n    let channel: RealtimeChannel | null = null\n    let cancelled = false`,
  `    let client: SupabaseClient | null = null\n    let channel: RealtimeChannel | null = null\n    let cancelled = false\n    remoteBaseRef.current = loadRemoteBase(user.id)`,
  'load per-user remote base',
)

sync = replaceOrFail(
  sync,
  `          latestVersionRef.current = Math.max(latestVersionRef.current, created.version)\n          setLastSyncedAt(Date.parse(created.updated_at))`,
  `          latestVersionRef.current = Math.max(latestVersionRef.current, created.version)\n          remoteBaseRef.current = { state, version: created.version }\n          saveRemoteBase(user.id, state, created.version)\n          setLastSyncedAt(Date.parse(created.updated_at))`,
  'record newly created remote base',
)

sync = replaceOrFail(
  sync,
  `      safeRemoveLocal('tv-phone:demo')`,
  `      safeRemoveLocal('tv-phone:demo')\n      safeRemoveLocal(ACTIVE_ACCOUNT_KEY)`,
  'clear account ownership on sign out',
)

sync = replaceOrFail(
  sync,
  `    syncNow,\n    signIn,`,
  `    syncNow,\n    loadCloudCopy,\n    signIn,`,
  'return cloud recovery action',
)

await writeFile('src/lib/useAccountSync.ts', sync)

let panel = await readFile('src/components/AccountPanel.tsx', 'utf8')
panel = replaceOrFail(
  panel,
  `  syncNow: () => Promise<void>\n}`,
  `  syncNow: () => Promise<void>\n  loadCloudCopy: () => Promise<void>\n}`,
  'AccountPanel cloud recovery prop',
)
panel = replaceOrFail(
  panel,
  `  const [capsLock, setCapsLock] = useState(false)`,
  `  const [capsLock, setCapsLock] = useState(false)\n  const syncConflict = props.status === 'error' && props.error.includes('newer cloud version')`,
  'AccountPanel conflict state',
)
panel = replaceOrFail(
  panel,
  `              <button className="button-secondary" type="button" disabled={props.busy || props.status === 'syncing'} onClick={() => void props.syncNow()}><RefreshCw /> Sync now</button>\n              <button className="button-secondary" type="button" disabled={props.busy} onClick={() => void props.signOut()}><LogOut /> Sign out</button>`,
  `              <button className="button-secondary" type="button" disabled={props.busy || props.status === 'syncing'} onClick={() => void props.syncNow()}><RefreshCw /> Sync now</button>\n              {syncConflict && <button className="button-secondary" type="button" disabled={props.busy} onClick={() => void props.loadCloudCopy()}><Cloud /> Load cloud copy</button>}\n              <button className="button-secondary" type="button" disabled={props.busy} onClick={() => void props.signOut()}><LogOut /> Sign out</button>`,
  'AccountPanel conflict recovery button',
)
await writeFile('src/components/AccountPanel.tsx', panel)

console.log('Account isolation and reconnect conflict protection applied')
