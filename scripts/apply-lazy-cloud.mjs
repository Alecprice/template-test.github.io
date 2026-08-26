import { readFile, writeFile } from 'node:fs/promises'

function replaceOrFail(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Lazy cloud patch failed: ${label}`)
  return source.replace(needle, replacement)
}

await writeFile('src/lib/cloud.ts', `import type { SupabaseClient } from '@supabase/supabase-js'\n\nconst url = import.meta.env.VITE_SUPABASE_URL?.trim()\nconst publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()\n\nexport const cloudConfigured = Boolean(url && publishableKey)\n\nlet clientPromise: Promise<SupabaseClient | null> | undefined\n\nexport function getSupabase() {\n  if (!cloudConfigured) return Promise.resolve(null)\n  if (!clientPromise) {\n    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(url!, publishableKey!, {\n      auth: {\n        autoRefreshToken: true,\n        persistSession: true,\n        detectSessionInUrl: true,\n      },\n    }))\n  }\n  return clientPromise\n}\n`)

let sync = await readFile('src/lib/useAccountSync.ts', 'utf8')
sync = replaceOrFail(
  sync,
  "import type { User } from '@supabase/supabase-js'",
  "import type { RealtimeChannel, SupabaseClient, User } from '@supabase/supabase-js'",
  'Supabase type imports',
)
sync = replaceOrFail(
  sync,
  "import { cloudConfigured, supabase } from './cloud'",
  "import { cloudConfigured, getSupabase } from './cloud'",
  'lazy cloud import',
)
sync = replaceOrFail(
  sync,
  `async function fetchRemoteState(userId: string): Promise<RemoteRow | null> {\n  if (!supabase) return null\n  const { data, error } = await supabase`,
  `async function fetchRemoteState(userId: string): Promise<RemoteRow | null> {\n  const supabase = await getSupabase()\n  if (!supabase) return null\n  const { data, error } = await supabase`,
  'remote fetch lazy client',
)
sync = replaceOrFail(
  sync,
  `async function pushRemoteState(userId: string, state: AccountStateV1, clientId: string): Promise<RemoteRow> {\n  if (!supabase) throw new Error('Cloud sync is not configured')\n  const { data, error } = await supabase`,
  `async function pushRemoteState(userId: string, state: AccountStateV1, clientId: string): Promise<RemoteRow> {\n  const supabase = await getSupabase()\n  if (!supabase) throw new Error('Cloud sync is not configured')\n  const { data, error } = await supabase`,
  'remote push lazy client',
)
sync = replaceOrFail(
  sync,
  `  const syncNow = useCallback(async () => {\n    if (!user || !supabase || hydratedUserRef.current !== user.id) return`,
  `  const syncNow = useCallback(async () => {\n    if (!user || hydratedUserRef.current !== user.id) return`,
  'sync guard without eager client',
)

const authEffect = /  useEffect\(\(\) => \{\n    if \(!supabase\) \{[\s\S]*?\n  \}, \[\]\)\n\n  useEffect\(\(\) => \{/
if (!authEffect.test(sync)) throw new Error('Lazy cloud patch failed: auth bootstrap effect')
sync = sync.replace(authEffect, `  useEffect(() => {\n    if (!cloudConfigured) {\n      setReady(true)\n      setStatus('local')\n      return\n    }\n    let active = true\n    let subscription: { unsubscribe: () => void } | undefined\n    let idleId: number | undefined\n    let timeoutId: number | undefined\n\n    const initialize = async () => {\n      try {\n        const client = await getSupabase()\n        if (!active || !client) return\n        const { data, error: sessionError } = await client.auth.getSession()\n        if (!active) return\n        if (sessionError) setError(sessionError.message)\n        setUser(data.session?.user ?? null)\n        setReady(true)\n        setStatus(data.session?.user ? 'loading' : 'local')\n        const { data: authData } = client.auth.onAuthStateChange((_event, session) => {\n          if (!active) return\n          setUser(session?.user ?? null)\n          setReady(true)\n          if (!session?.user) {\n            hydratedUserRef.current = undefined\n            latestVersionRef.current = 0\n            setStatus('local')\n          }\n        })\n        subscription = authData.subscription\n      } catch (loadError) {\n        if (!active) return\n        setReady(true)\n        setStatus('error')\n        setError(loadError instanceof Error ? loadError.message : 'Could not initialize cloud sync')\n      }\n    }\n\n    if ('requestIdleCallback' in window) {\n      idleId = window.requestIdleCallback(() => void initialize(), { timeout: 1200 })\n    } else {\n      timeoutId = window.setTimeout(() => void initialize(), 350)\n    }\n\n    return () => {\n      active = false\n      if (idleId !== undefined && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleId)\n      if (timeoutId !== undefined) window.clearTimeout(timeoutId)\n      subscription?.unsubscribe()\n    }\n  }, [])\n\n  useEffect(() => {`)

const userEffect = /  useEffect\(\(\) => \{\n    const client = supabase\n    if \(!user \|\| !client\) return[\s\S]*?\n  \}, \[user\?\.id, applyState\]\)/
if (!userEffect.test(sync)) throw new Error('Lazy cloud patch failed: per-user sync effect')
const oldUserEffect = sync.match(userEffect)?.[0]
if (!oldUserEffect) throw new Error('Lazy cloud patch failed: per-user sync effect capture')
const bodyStart = oldUserEffect.indexOf('    let cancelled = false')
const hydrateStart = oldUserEffect.indexOf('    const hydrate = async () => {')
const channelStart = oldUserEffect.indexOf('    const channel = client')
const cleanupStart = oldUserEffect.indexOf('    return () => {')
if ([bodyStart, hydrateStart, channelStart, cleanupStart].some((value) => value < 0)) throw new Error('Lazy cloud patch failed: per-user sync effect markers')
const preHydrate = oldUserEffect.slice(bodyStart, hydrateStart)
const hydrateBlock = oldUserEffect.slice(hydrateStart, channelStart)
const channelBlock = oldUserEffect.slice(channelStart, cleanupStart).replace('    const channel = client', '      channel = client')
const newUserEffect = `  useEffect(() => {\n    if (!user || !cloudConfigured) return\n    let client: SupabaseClient | null = null\n    let channel: RealtimeChannel | null = null\n${preHydrate}${hydrateBlock}    const start = async () => {\n      client = await getSupabase()\n      if (cancelled || !client) return\n      void hydrate()\n${channelBlock.replaceAll('\n    ', '\n  ')}    }\n\n    void start()\n\n    return () => {\n      cancelled = true\n      if (client && channel) void client.removeChannel(channel)\n    }\n  }, [user?.id, applyState])`
sync = sync.replace(oldUserEffect, newUserEffect)

for (const [label, oldText, newText] of [
  [
    'sign in lazy client',
    `  const signIn = useCallback(async (email: string, password: string) => {\n    if (!supabase) { setError('Cloud sync is not configured yet'); return }`,
    `  const signIn = useCallback(async (email: string, password: string) => {\n    const supabase = await getSupabase()\n    if (!supabase) { setError('Cloud sync is not configured yet'); return }`,
  ],
  [
    'sign up lazy client',
    `  const signUp = useCallback(async (email: string, password: string) => {\n    if (!supabase) { setError('Cloud sync is not configured yet'); return }`,
    `  const signUp = useCallback(async (email: string, password: string) => {\n    const supabase = await getSupabase()\n    if (!supabase) { setError('Cloud sync is not configured yet'); return }`,
  ],
  [
    'sign out lazy client',
    `  const signOut = useCallback(async () => {\n    if (!supabase) return`,
    `  const signOut = useCallback(async () => {\n    const supabase = await getSupabase()\n    if (!supabase) return`,
  ],
]) sync = replaceOrFail(sync, oldText, newText, label)

if (sync.includes("from './cloud'\n") && sync.includes(' supabase ')) {
  // Intentional local variables are allowed; only the exported eager singleton must be gone.
}
await writeFile('src/lib/useAccountSync.ts', sync)
console.log('Lazy Supabase startup applied')
