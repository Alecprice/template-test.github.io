import { readFile } from 'node:fs/promises'

const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
const panel = await readFile('src/components/AccountPanel.tsx', 'utf8')

for (const marker of [
  "const ACTIVE_ACCOUNT_KEY = 'tv-phone:active-account:v1'",
  "const REMOTE_BASE_PREFIX = 'tv-phone:account-remote-base:v1:'",
  'function clearSharedAccountState(current: Options)',
  'savePrivateCache(previousOwner, latestRef.current)',
  'clearSharedAccountState(latestRef.current)',
  'if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)',
  'isolateAccount(data.session?.user?.id)',
  'isolateAccount(session?.user?.id)',
  'remoteBaseRef.current = loadRemoteBase(user.id)',
  'const remote = await fetchRemoteState(user.id)',
  'if (remote.version > baseVersion)',
  'Another device has a newer cloud version. Nothing was overwritten.',
  'const loadCloudCopy = useCallback(async () => {',
  'saveRemoteBase(user.id, state, row.version)',
  'safeRemoveLocal(ACTIVE_ACCOUNT_KEY)',
]) {
  if (!sync.includes(marker)) throw new Error(`Account lifecycle audit failed: sync missing ${marker}`)
}

const remoteRead = sync.indexOf('const remote = await fetchRemoteState(user.id)')
const remoteVersionGuard = sync.indexOf('if (remote.version > baseVersion)', remoteRead)
const push = sync.indexOf('const row = await pushRemoteState(user.id, state, clientIdRef.current!)', remoteRead)
if (remoteRead < 0 || remoteVersionGuard < 0 || push < 0 || !(remoteRead < remoteVersionGuard && remoteVersionGuard < push)) {
  throw new Error('Account lifecycle audit failed: reconnect must check remote version before push')
}

for (const marker of [
  'loadCloudCopy: () => Promise<void>',
  "const syncConflict = props.status === 'error' && props.error.includes('newer cloud version')",
  'Load cloud copy',
]) {
  if (!panel.includes(marker)) throw new Error(`Account lifecycle audit failed: panel missing ${marker}`)
}

if (sync.includes('previousOwner && previousOwner !== nextUserId') && !sync.includes('savePrivateCache(previousOwner, latestRef.current)')) {
  throw new Error('Account lifecycle audit failed: account switch can clear state without preserving private cache')
}

console.log('TV Phone account isolation and reconnect conflict audit passed.')
