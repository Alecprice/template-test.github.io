import type { Activity, TvDevice } from '../types/remote'
import { sampleActivities, sampleDevices } from './sampleData'

const TRANSIENT_DEVICE_KEYS = new Set([
  'connection',
  'lastSeen',
  'token',
  'bridgeToken',
  'remoteCertificate',
  'favorite',
  'favoriteAppIds',
])

function stableComparable(value: unknown, omitKeys?: Set<string>): unknown {
  if (Array.isArray(value)) return value.map((entry) => stableComparable(entry, omitKeys))
  if (!value || typeof value !== 'object') return value
  const source = value as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(source).sort()) {
    if (omitKeys?.has(key)) continue
    result[key] = stableComparable(source[key], omitKeys)
  }
  return result
}

function sameStableValue(left: unknown, right: unknown, omitKeys?: Set<string>) {
  return JSON.stringify(stableComparable(left, omitKeys)) === JSON.stringify(stableComparable(right, omitKeys))
}

const sampleDeviceById = new Map(sampleDevices.map((device) => [device.id, device] as const))
const sampleActivityById = new Map(sampleActivities.map((activity) => [activity.id, activity] as const))

export function isUntouchedSampleDevice(device: TvDevice) {
  const sample = sampleDeviceById.get(device.id)
  return Boolean(sample && sample.kind === device.kind && sameStableValue(sample, device, TRANSIENT_DEVICE_KEYS))
}

export function isUntouchedSampleActivity(activity: Activity) {
  const sample = sampleActivityById.get(activity.id)
  return Boolean(sample && sameStableValue(sample, activity))
}

export function stripUntouchedSampleDevices(devices: TvDevice[]) {
  return devices.filter((device) => !isUntouchedSampleDevice(device))
}

export function stripUntouchedSampleActivities(activities: Activity[]) {
  return activities.filter((activity) => !isUntouchedSampleActivity(activity))
}
