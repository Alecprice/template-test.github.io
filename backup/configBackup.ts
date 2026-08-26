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
const MAX_DEVICES = 64
const MAX_ACTIVITIES = 250
const MAX_ID_LENGTH = 160
const MAX_NAME_LENGTH = 200

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

function validText(value: unknown, max: number) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
}

function cleanDevices(value: unknown, strict = false): TvDevice[] {
  if (!Array.isArray(value)) {
    if (strict) throw new Error('Backup TVs must be a list.')
    return []
  }
  if (value.length > MAX_DEVICES) throw new Error(`Backup contains more than ${MAX_DEVICES} TVs.`)
  const seen = new Set<string>()
  const devices: TvDevice[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      if (strict) throw new Error('Backup contains an invalid TV entry.')
      continue
    }
    const device = cleanValue(entry) as TvDevice
    const valid = validText(device.id, MAX_ID_LENGTH)
      && validText(device.name, MAX_NAME_LENGTH)
      && typeof device.room === 'string'
      && (device.kind === 'samsung' || device.kind === 'firetv' || device.kind === 'combo')
    if (!valid) {
      if (strict) throw new Error('Backup contains a TV with missing or invalid fields.')
      continue
    }
    if (seen.has(device.id)) {
      if (strict) throw new Error(`Backup contains duplicate TV id “${device.id}”.`)
      continue
    }
    seen.add(device.id)
    devices.push(device)
  }
  return devices
}

function cleanActivities(value: unknown, strict = false): Activity[] {
  if (!Array.isArray(value)) {
    if (strict) throw new Error('Backup activities must be a list.')
    return []
  }
  if (value.length > MAX_ACTIVITIES) throw new Error(`Backup contains more than ${MAX_ACTIVITIES} activities.`)
  const seen = new Set<string>()
  const activities: Activity[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      if (strict) throw new Error('Backup contains an invalid activity entry.')
      continue
    }
    const activity = cleanValue(entry) as Activity
    if (!validText(activity.id, MAX_ID_LENGTH) || !validText(activity.name, MAX_NAME_LENGTH)) {
      if (strict) throw new Error('Backup contains an activity with missing or invalid fields.')
      continue
    }
    if (seen.has(activity.id)) {
      if (strict) throw new Error(`Backup contains duplicate activity id “${activity.id}”.`)
      continue
    }
    seen.add(activity.id)
    activities.push(activity)
  }
  return activities
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
  if (backupContainsSecretKeys(value)) throw new Error('That backup contains pairing or connection secrets and cannot be restored.')
  const raw = value as Partial<TvPhoneBackupV1>
  if (raw.schemaVersion !== 1) throw new Error('This backup version is not supported.')
  const devices = cleanDevices(raw.devices, true)
  const activities = cleanActivities(raw.activities, true)
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
