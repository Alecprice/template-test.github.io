import type { Activity, TvDevice } from '../types/remote'
import { normalizeAppMode, type AppMode } from './appMode'
import { normalizeKidsStreamingIds } from './kidsStreaming'
import type { StreamingServiceId } from './streamingServices'

export interface TvPhoneBackupV1 {
  schemaVersion: 1
  exportedAt: string
  devices: TvDevice[]
  activities: Activity[]
  activeDeviceId: string
  preferences: {
    haptics: boolean
    keepAwake: boolean
    appMode: AppMode
    kidsAllowedStreamingIds: StreamingServiceId[]
  }
}

const SECRET_KEYS = new Set(['token', 'bridgeToken', 'remoteCertificate', 'lastSeen'])

function cleanValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(cleanValue)
  if (!value || typeof value !== 'object') return value
  const source = value as Record<string, unknown>
  const cleaned: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(source)) {
    if (SECRET_KEYS.has(key)) continue
    if (key === 'connection') {
      cleaned[key] = 'disconnected'
      continue
    }
    cleaned[key] = cleanValue(entry)
  }
  return cleaned
}

function cleanDevices(value: unknown): TvDevice[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => cleanValue(entry) as TvDevice)
    .filter((device) => typeof device.id === 'string' && typeof device.name === 'string' && (device.kind === 'samsung' || device.kind === 'firetv' || device.kind === 'combo'))
}

function cleanActivities(value: unknown): Activity[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry) => entry && typeof entry === 'object').map((entry) => cleanValue(entry) as Activity)
}

export function createTvPhoneBackup(input: Omit<TvPhoneBackupV1, 'schemaVersion' | 'exportedAt'>): TvPhoneBackupV1 {
  const devices = cleanDevices(input.devices)
  const activeDeviceId = devices.some((device) => device.id === input.activeDeviceId) ? input.activeDeviceId : devices[0]?.id ?? ''
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    devices,
    activities: cleanActivities(input.activities),
    activeDeviceId,
    preferences: {
      haptics: input.preferences.haptics,
      keepAwake: input.preferences.keepAwake,
      appMode: normalizeAppMode(input.preferences.appMode),
      kidsAllowedStreamingIds: normalizeKidsStreamingIds(input.preferences.kidsAllowedStreamingIds),
    },
  }
}

export function parseTvPhoneBackup(value: unknown): TvPhoneBackupV1 {
  if (!value || typeof value !== 'object') throw new Error('That file is not a TV Phone backup.')
  const raw = value as Partial<TvPhoneBackupV1>
  if (raw.schemaVersion !== 1) throw new Error('This backup version is not supported.')
  const devices = cleanDevices(raw.devices)
  const activities = cleanActivities(raw.activities)
  const activeDeviceId = devices.some((device) => device.id === raw.activeDeviceId) ? raw.activeDeviceId! : devices[0]?.id ?? ''
  return {
    schemaVersion: 1,
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date(0).toISOString(),
    devices,
    activities,
    activeDeviceId,
    preferences: {
      haptics: raw.preferences?.haptics !== false,
      keepAwake: raw.preferences?.keepAwake !== false,
      appMode: normalizeAppMode(raw.preferences?.appMode),
      kidsAllowedStreamingIds: normalizeKidsStreamingIds(raw.preferences?.kidsAllowedStreamingIds),
    },
  }
}

export function backupContainsSecretKeys(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(backupContainsSecretKeys)
  if (!value || typeof value !== 'object') return false
  return Object.entries(value as Record<string, unknown>).some(([key, entry]) => SECRET_KEYS.has(key) || backupContainsSecretKeys(entry))
}
