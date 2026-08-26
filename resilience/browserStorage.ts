const volatileStorage = new Map<string, string>()
let writable: boolean | undefined

function localStorageObject() {
  if (typeof window === 'undefined') return undefined
  try { return window.localStorage } catch { writable = false; return undefined }
}

export function safeLocalGet(key: string) {
  const storage = localStorageObject()
  if (!storage) return volatileStorage.get(key) ?? null
  try {
    const value = storage.getItem(key)
    if (value !== null) volatileStorage.set(key, value)
    return value ?? volatileStorage.get(key) ?? null
  } catch {
    writable = false
    return volatileStorage.get(key) ?? null
  }
}

export function safeLocalSet(key: string, value: string) {
  volatileStorage.set(key, value)
  const storage = localStorageObject()
  if (!storage) return false
  try {
    storage.setItem(key, value)
    writable = true
    return true
  } catch {
    writable = false
    return false
  }
}

export function safeLocalRemove(key: string) {
  volatileStorage.delete(key)
  const storage = localStorageObject()
  if (!storage) return false
  try {
    storage.removeItem(key)
    writable = true
    return true
  } catch {
    writable = false
    return false
  }
}

export function browserStoragePersistent() {
  if (writable !== undefined) return writable
  const storage = localStorageObject()
  if (!storage) return false
  const key = `tv-phone:storage-probe:${Date.now()}`
  try {
    storage.setItem(key, '1')
    storage.removeItem(key)
    writable = true
  } catch {
    writable = false
  }
  return writable
}
