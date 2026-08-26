import { readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Sync CAS patch failed: ${label}`)
  return source.replace(needle, replacement)
}

let sync = await readFile('src/lib/useAccountSync.ts', 'utf8')

const pushStart = sync.indexOf('async function pushRemoteState(')
const pushEnd = sync.indexOf('\n}\n\nexport function useAccountSync', pushStart)
if (pushStart < 0 || pushEnd < 0) throw new Error('Sync CAS patch failed: pushRemoteState block')
sync = `${sync.slice(0, pushStart)}async function pushRemoteState(userId: string, state: AccountStateV1, clientId: string, expectedVersion: number): Promise<RemoteRow | null> {\n  if (!supabase) throw new Error('Cloud sync is not configured')\n  void userId\n  const { data, error } = await supabase.rpc('compare_and_swap_user_sync_state', {\n    p_expected_version: expectedVersion,\n    p_state: state,\n    p_updated_by_device_id: clientId,\n  })\n  if (error) throw error\n  if (!data) return null\n  return data as RemoteRow\n${sync.slice(pushEnd)}`

sync = replaceOrFail(
  sync,
  `      const row = await pushRemoteState(user.id, state, clientIdRef.current!)\n      latestVersionRef.current = Math.max(latestVersionRef.current, row.version)`,
  `      const expectedVersion = remote?.version ?? (remoteBaseRef.current?.version ?? latestVersionRef.current)\n      const row = await pushRemoteState(user.id, state, clientIdRef.current!, expectedVersion)\n      if (!row) {\n        setStatus('error')\n        setError('Another device has a newer cloud version. Nothing was overwritten.')\n        setMessage('Your changes are still saved on this device. Choose Keep this device or Load cloud copy.')\n        return\n      }\n      latestVersionRef.current = Math.max(latestVersionRef.current, row.version)`,
  'CAS scheduled sync',
)

sync = replaceOrFail(
  sync,
  `          const created = await pushRemoteState(user.id, state, clientIdRef.current!)\n          if (cancelled) return\n          latestVersionRef.current = Math.max(latestVersionRef.current, created.version)\n          remoteBaseRef.current = { state, version: created.version }\n          saveRemoteBase(user.id, state, created.version)\n          setLastSyncedAt(Date.parse(created.updated_at))`,
  `          const created = await pushRemoteState(user.id, state, clientIdRef.current!, 0)\n          if (cancelled) return\n          if (!created) {\n            const winner = await fetchRemoteState(user.id)\n            if (!winner) throw new Error('Cloud profile changed while the account was being created')\n            const winnerState = parseAccountState(winner.state)\n            if (!winnerState) throw new Error('Cloud profile uses an unsupported data format')\n            applyState(user.id, winnerState, winner.updated_at, winner.version)\n          } else {\n            latestVersionRef.current = Math.max(latestVersionRef.current, created.version)\n            remoteBaseRef.current = { state, version: created.version }\n            saveRemoteBase(user.id, state, created.version)\n            setLastSyncedAt(Date.parse(created.updated_at))\n          }`,
  'CAS first profile create',
)

const loadCloudEnd = `  }, [user, applyState])\n\n  useEffect(() => {`
if (!sync.includes(loadCloudEnd)) throw new Error('Sync CAS patch failed: load cloud callback boundary')
sync = sync.replace(loadCloudEnd, `  }, [user, applyState])\n\n  const keepLocalCopy = useCallback(async () => {\n    if (!user || !navigator.onLine) {\n      setStatus('offline')\n      setError('Connect to the internet before keeping this device copy.')\n      return\n    }\n    setBusy(true)\n    setStatus('syncing')\n    setError('')\n    try {\n      const current = latestRef.current\n      const state = toAccountState(current)\n      const remote = await fetchRemoteState(user.id)\n      const expectedVersion = remote?.version ?? 0\n      const row = await pushRemoteState(user.id, state, clientIdRef.current!, expectedVersion)\n      if (!row) {\n        setStatus('error')\n        setError('The cloud changed again before your choice could be saved. Nothing was overwritten.')\n        setMessage('Review the latest cloud copy or try Keep this device again.')\n        return\n      }\n      latestVersionRef.current = row.version\n      remoteBaseRef.current = { state, version: row.version }\n      saveRemoteBase(user.id, state, row.version)\n      writeJson(cacheKey(user.id), state)\n      savePrivateCache(user.id, current)\n      setLastSyncedAt(Date.parse(row.updated_at))\n      setStatus('synced')\n      setMessage('Kept this device copy and safely replaced the older cloud copy.')\n    } catch (keepError) {\n      setStatus(navigator.onLine ? 'error' : 'offline')\n      setError(keepError instanceof Error ? keepError.message : 'Could not keep this device copy')\n    } finally {\n      setBusy(false)\n    }\n  }, [user])\n\n  useEffect(() => {`)

sync = replaceOrFail(
  sync,
  `    syncNow,\n    loadCloudCopy,\n    signIn,`,
  `    syncNow,\n    loadCloudCopy,\n    keepLocalCopy,\n    signIn,`,
  'return keep local action',
)

await writeFile('src/lib/useAccountSync.ts', sync)

let panel = await readFile('src/components/AccountPanel.tsx', 'utf8')
panel = replaceOrFail(
  panel,
  `  loadCloudCopy: () => Promise<void>\n}`,
  `  loadCloudCopy: () => Promise<void>\n  keepLocalCopy: () => Promise<void>\n}`,
  'panel keep local prop',
)
panel = replaceOrFail(
  panel,
  `{syncConflict && <button className="button-secondary" type="button" disabled={props.busy} onClick={() => void props.loadCloudCopy()}><Cloud /> Load cloud copy</button>}`,
  `{syncConflict && <button className="button-secondary" type="button" disabled={props.busy} onClick={() => void props.keepLocalCopy()}><RefreshCw /> Keep this device</button>}\n              {syncConflict && <button className="button-secondary" type="button" disabled={props.busy} onClick={() => void props.loadCloudCopy()}><Cloud /> Load cloud copy</button>}`,
  'panel conflict choices',
)
await writeFile('src/components/AccountPanel.tsx', panel)

console.log('Database-enforced account sync compare-and-swap applied')
