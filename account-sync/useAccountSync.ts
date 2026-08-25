import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Activity, BridgeConfig, TvDevice } from '../src/types/remote'
import { storage } from '../src/lib/storage'
import { cloudConfigured, supabase } from './cloud'

export type AccountSyncStatus = 'local' | 'loading' | 'syncing' | 'synced' | 'offline' | 'error'

export interface AccountStateV1 {
  schemaVersion: 1
  devices: TvDevice[]
  activities: Activity[]
  activeDeviceId: string
  preferences: {
    haptics: boolean
    keepAwake: boolean
  }
  bridge: {
    url: string
  }
}

interface RemoteRow {
  state: unknown
  version: number
  updated_at: string
  updated_by_device_id: string | null
}

interface AccountPrivateCache {
  devices: TvDevice[]
  bridgeToken: string
}

interface Options {
  devices: TvDevice[]
  activities: Activity[]
  activeDeviceId: string
  haptics: boolean
  keepAwake: boolean
  bridgeConfig: BridgeConfig
  setDevices: Dispatch<SetStateAction<TvDevice[]>>
  setActivities: Dispatch<SetStateAction<Activity[]>>
  setActiveDeviceId: Dispatch<SetStateAction<string>>
  setHaptics: Dispatch<SetStateAction<boolean>>
  setKeepAwake: Dispatch<SetStateAction<boolean>>
  setBridgeConfig: Dispatch<SetStateAction<BridgeConfig>>
}

const CLIENT_ID_KEY = 'tv-phone:client-id:v1'
const CACHE_PREFIX = 'tv-phone:account-cache:v1:'
const PRIVATE_PREFIX = 'tv-phone:account-private:v1:'

function readJson<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : undefined
  } catch {
    return undefined
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getClientId() {
  const existing = localStorage.getItem(CLIENT_ID_KEY)
  if (existing) return existing
  const id = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `client-${Date.now()}-${Math.random().toString(36).slice(2)}`
  localStorage.setItem(CLIENT_ID_KEY, id)
  return id
}

function sanitizeDevice(device: TvDevice): TvDevice {
  const copy = { ...device, connection: 'disconnected' as const } as TvDevice & Record<string, unknown>
  delete copy.lastSeen
  delete copy.token
  delete copy.bridgeToken
  delete copy.remoteCertificate
  return copy as TvDevice
}

function toAccountState(current: Pick<Options, 'devices' | 'activities' | 'activeDeviceId' | 'haptics' | 'keepAwake' | 'bridgeConfig'>): AccountStateV1 {
  const devices = current.devices.map(sanitizeDevice)
  const validActive = devices.some((device) => device.id === current.activeDeviceId)
    ? current.activeDeviceId
    : devices[0]?.id ?? ''
  return {
    schemaVersion: 1,
    devices,
    activities: current.activities,
    activeDeviceId: validActive,
    preferences: {
      haptics: current.haptics,
      keepAwake: current.keepAwake,
    },
    bridge: {
      url: current.bridgeConfig.url.trim(),
    },
  }
}

function parseAccountState(value: unknown): AccountStateV1 | undefined {
  if (!value || typeof value !== 'object') return undefined
  const raw = value as Partial<AccountStateV1>
  if (raw.schemaVersion !== 1 || !Array.isArray(raw.devices) || !Array.isArray(raw.activities)) return undefined
  return {
    schemaVersion: 1,
    devices: raw.devices,
    activities: raw.activities,
    activeDeviceId: typeof raw.activeDeviceId === 'string' ? raw.activeDeviceId : raw.devices[0]?.id ?? '',
    preferences: {
      haptics: raw.preferences?.haptics !== false,
      keepAwake: raw.preferences?.keepAwake !== false,
    },
    bridge: {
      url: typeof raw.bridge?.url === 'string' ? raw.bridge.url : '',
    },
  }
}

function privateKey(userId: string) { return `${PRIVATE_PREFIX}${userId}` }
function cacheKey(userId: string) { return `${CACHE_PREFIX}${userId}` }

function savePrivateCache(userId: string, current: Options) {
  const value: AccountPrivateCache = {
    devices: current.devices,
    bridgeToken: current.bridgeConfig.token,
  }
  writeJson(privateKey(userId), value)
}

function loadPrivateCache(userId: string): AccountPrivateCache | undefined {
  const value = readJson<AccountPrivateCache>(privateKey(userId))
  return value && Array.isArray(value.devices) ? value : undefined
}

function mergeLocalSecrets(cloudDevices: TvDevice[], localDevices: TvDevice[]) {
  return cloudDevices.map((cloud) => {
    const local = localDevices.find((item) => item.id === cloud.id && item.kind === cloud.kind)
    const merged = { ...cloud, connection: 'disconnected' as const } as TvDevice & Record<string, unknown>
    delete merged.lastSeen
    if (!local) return merged as TvDevice
    if (cloud.kind === 'samsung' && local.kind === 'samsung') {
      if (local.token) merged.token = local.token
      if (local.bridgeToken) merged.bridgeToken = local.bridgeToken
    }
    if (cloud.kind === 'firetv' && local.kind === 'firetv') {
      if (local.bridgeToken) merged.bridgeToken = local.bridgeToken
      if (local.remoteCertificate) merged.remoteCertificate = local.remoteCertificate
    }
    return merged as TvDevice
  })
}

async function fetchRemoteState(userId: string): Promise<RemoteRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_sync_state')
    .select('state,version,updated_at,updated_by_device_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as RemoteRow | null
}

async function pushRemoteState(userId: string, state: AccountStateV1, clientId: string): Promise<RemoteRow> {
  if (!supabase) throw new Error('Cloud sync is not configured')
  const { data, error } = await supabase
    .from('user_sync_state')
    .upsert({ user_id: userId, state, updated_by_device_id: clientId }, { onConflict: 'user_id' })
    .select('state,version,updated_at,updated_by_device_id')
    .single()
  if (error) throw error
  return data as RemoteRow
}

export function useAccountSync(options: Options) {
  const latestRef = useRef(options)
  latestRef.current = options
  const clientIdRef = useRef<string | null>(null)
  if (!clientIdRef.current) clientIdRef.current = getClientId()

  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!cloudConfigured)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<AccountSyncStatus>(cloudConfigured ? 'loading' : 'local')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [lastSyncedAt, setLastSyncedAt] = useState<number>()
  const [syncGeneration, setSyncGeneration] = useState(0)
  const hydratedUserRef = useRef<string>()
  const skipNextSaveRef = useRef(false)
  const saveTimerRef = useRef<number>()

  const applyState = useCallback((userId: string, state: AccountStateV1, updatedAt?: string) => {
    const current = latestRef.current
    const privateCache = loadPrivateCache(userId)
    const localDevices = privateCache?.devices ?? current.devices
    const devices = mergeLocalSecrets(state.devices, localDevices)
    const activeDeviceId = devices.some((device) => device.id === state.activeDeviceId)
      ? state.activeDeviceId
      : devices[0]?.id ?? ''
    const bridgeConfig = { url: state.bridge.url, token: privateCache?.bridgeToken ?? current.bridgeConfig.token }

    skipNextSaveRef.current = true
    current.setDevices(devices)
    current.setActivities(state.activities)
    current.setActiveDeviceId(activeDeviceId)
    current.setHaptics(state.preferences.haptics)
    current.setKeepAwake(state.preferences.keepAwake)
    current.setBridgeConfig(bridgeConfig)

    storage.saveDevices(devices)
    storage.saveActivities(state.activities)
    if (activeDeviceId) storage.saveActiveDeviceId(activeDeviceId)
    else storage.clearActiveDeviceId()
    storage.saveBridgeConfig(bridgeConfig)
    localStorage.setItem('tv-phone:haptics', String(state.preferences.haptics))
    localStorage.setItem('tv-phone:keep-awake', String(state.preferences.keepAwake))
    writeJson(cacheKey(userId), state)
    savePrivateCache(userId, { ...current, devices, activities: state.activities, activeDeviceId, haptics: state.preferences.haptics, keepAwake: state.preferences.keepAwake, bridgeConfig })
    if (updatedAt) setLastSyncedAt(Date.parse(updatedAt))
    setSyncGeneration((value) => value + 1)
  }, [])

  const syncNow = useCallback(async () => {
    if (!user || !supabase || hydratedUserRef.current !== user.id) return
    const current = latestRef.current
    const state = toAccountState(current)
    writeJson(cacheKey(user.id), state)
    savePrivateCache(user.id, current)
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }
    setStatus('syncing')
    setError('')
    try {
      const row = await pushRemoteState(user.id, state, clientIdRef.current!)
      setLastSyncedAt(Date.parse(row.updated_at))
      setStatus('synced')
    } catch (syncError) {
      setStatus(navigator.onLine ? 'error' : 'offline')
      setError(syncError instanceof Error ? syncError.message : 'Cloud sync failed')
    }
  }, [user])

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      setStatus('local')
      return
    }
    let active = true
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) setError(sessionError.message)
      setUser(data.session?.user ?? null)
      setReady(true)
      setStatus(data.session?.user ? 'loading' : 'local')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user ?? null)
      setReady(true)
      if (!session?.user) {
        hydratedUserRef.current = undefined
        setStatus('local')
      }
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user || !supabase) return
    let cancelled = false
    setStatus('loading')
    setError('')

    const hydrate = async () => {
      try {
        const remote = await fetchRemoteState(user.id)
        if (cancelled) return
        if (remote) {
          const state = parseAccountState(remote.state)
          if (!state) throw new Error('Cloud profile uses an unsupported data format')
          applyState(user.id, state, remote.updated_at)
        } else {
          const state = toAccountState(latestRef.current)
          writeJson(cacheKey(user.id), state)
          savePrivateCache(user.id, latestRef.current)
          const created = await pushRemoteState(user.id, state, clientIdRef.current!)
          if (cancelled) return
          setLastSyncedAt(Date.parse(created.updated_at))
        }
        hydratedUserRef.current = user.id
        setStatus(navigator.onLine ? 'synced' : 'offline')
      } catch (hydrateError) {
        if (cancelled) return
        const cached = parseAccountState(readJson<unknown>(cacheKey(user.id)))
        if (cached) {
          applyState(user.id, cached)
          hydratedUserRef.current = user.id
          setStatus('offline')
          setMessage('Using the last saved copy on this device. Changes will upload when sync is available.')
        } else {
          setStatus(navigator.onLine ? 'error' : 'offline')
          setError(hydrateError instanceof Error ? hydrateError.message : 'Could not load your cloud profile')
        }
      }
    }

    void hydrate()

    const channel = supabase
      .channel(`tv-phone-user-sync-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sync_state', filter: `user_id=eq.${user.id}` }, (payload) => {
        const row = payload.new as Partial<RemoteRow> & { user_id?: string }
        if (!row.state || row.updated_by_device_id === clientIdRef.current) return
        const state = parseAccountState(row.state)
        if (!state) return
        applyState(user.id, state, row.updated_at)
        setStatus('synced')
        setMessage('Updated from another device')
      })
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channel)
    }
  }, [user?.id, applyState])

  useEffect(() => {
    if (!user || hydratedUserRef.current !== user.id) return
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false
      return
    }
    const current = latestRef.current
    writeJson(cacheKey(user.id), toAccountState(current))
    savePrivateCache(user.id, current)
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => void syncNow(), 700)
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [user?.id, options.devices, options.activities, options.activeDeviceId, options.haptics, options.keepAwake, options.bridgeConfig.url, options.bridgeConfig.token, syncNow])

  useEffect(() => {
    if (!user) return
    const online = () => void syncNow()
    window.addEventListener('online', online)
    return () => window.removeEventListener('online', online)
  }, [user?.id, syncNow])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) { setError('Cloud sync is not configured yet'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (authError) throw authError
      setStatus('loading')
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Sign in failed')
    } finally { setBusy(false) }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    if (!supabase) { setError('Cloud sync is not configured yet'); return }
    if (password.length < 8) { setError('Use at least 8 characters for your password'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password })
      if (authError) throw authError
      if (!data.session) setMessage('Account created. Check your email to confirm it, then sign in on any device.')
      else setMessage('Account created. Your current TV Phone setup is being attached to it.')
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Account creation failed')
    } finally { setBusy(false) }
  }, [])

  const signOut = useCallback(async () => {
    if (!supabase) return
    setBusy(true); setError('')
    try {
      if (user) savePrivateCache(user.id, latestRef.current)
      const { error: authError } = await supabase.auth.signOut()
      if (authError) throw authError
      storage.reset()
      localStorage.removeItem('tv-phone:haptics')
      localStorage.removeItem('tv-phone:keep-awake')
      localStorage.removeItem('tv-phone:demo')
      window.location.reload()
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Sign out failed')
      setBusy(false)
    }
  }, [user])

  return {
    configured: cloudConfigured,
    ready,
    busy,
    email: user?.email ?? '',
    signedIn: Boolean(user),
    status,
    error,
    message,
    lastSyncedAt,
    syncGeneration,
    signIn,
    signUp,
    signOut,
    syncNow,
  }
}
