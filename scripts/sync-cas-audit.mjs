import { readFile } from 'node:fs/promises'

const sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
const panel = await readFile('src/components/AccountPanel.tsx', 'utf8')

for (const marker of [
  "supabase.rpc('compare_and_swap_user_sync_state'",
  'p_expected_version: expectedVersion',
  'const expectedVersion = remote?.version ?? (remoteBaseRef.current?.version ?? latestVersionRef.current)',
  'if (!row) {',
  'Nothing was overwritten.',
  'const keepLocalCopy = useCallback(async () => {',
  'const expectedVersion = remote?.version ?? 0',
  'Kept this device copy and safely replaced the older cloud copy.',
  'keepLocalCopy,',
]) {
  if (!sync.includes(marker)) throw new Error(`Sync CAS audit failed: sync missing ${marker}`)
}

for (const marker of [
  'keepLocalCopy: () => Promise<void>',
  'Keep this device',
  'Load cloud copy',
]) {
  if (!panel.includes(marker)) throw new Error(`Sync CAS audit failed: panel missing ${marker}`)
}

if (sync.includes(".upsert({ user_id: userId, state, updated_by_device_id: clientId }")) {
  throw new Error('Sync CAS audit failed: blind upsert remains in generated account sync')
}

console.log('TV Phone database-enforced account sync CAS audit passed.')
