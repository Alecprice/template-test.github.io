import { streamingServices, type StreamingServiceId } from '../src/lib/streamingServices'

const KEY = 'tv-phone:kids-streaming:v1'

export function allKidsStreamingIds(): StreamingServiceId[] {
  return streamingServices.map((service) => service.id)
}

export function normalizeKidsStreamingIds(value: unknown): StreamingServiceId[] {
  const valid = new Set<StreamingServiceId>(allKidsStreamingIds())
  if (!Array.isArray(value)) return allKidsStreamingIds()
  const seen = new Set<StreamingServiceId>()
  const normalized: StreamingServiceId[] = []
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const id = entry as StreamingServiceId
    if (!valid.has(id) || seen.has(id)) continue
    seen.add(id)
    normalized.push(id)
  }
  return normalized
}

export function loadKidsStreamingIds(): StreamingServiceId[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw === null) return allKidsStreamingIds()
    return normalizeKidsStreamingIds(JSON.parse(raw))
  } catch {
    return allKidsStreamingIds()
  }
}

export function saveKidsStreamingIds(ids: StreamingServiceId[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(normalizeKidsStreamingIds(ids)))
  } catch {}
}

export const KIDS_STREAMING_STORAGE_KEY = KEY
