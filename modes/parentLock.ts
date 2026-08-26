const LOCK_KEY = 'tv-phone:kids-parent-lock:v1'
const ITERATIONS = 160_000

interface StoredParentLock {
  version: 1
  salt: string
  hash: string
  iterations: number
}

function encodeBase64(bytes: Uint8Array<ArrayBuffer>) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function decodeBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function readLock(): StoredParentLock | undefined {
  try {
    const raw = localStorage.getItem(LOCK_KEY)
    if (!raw) return undefined
    const parsed = JSON.parse(raw) as Partial<StoredParentLock>
    if (parsed.version !== 1 || typeof parsed.salt !== 'string' || typeof parsed.hash !== 'string') return undefined
    const iterations = typeof parsed.iterations === 'number' && parsed.iterations >= 100_000 ? parsed.iterations : ITERATIONS
    return { version: 1, salt: parsed.salt, hash: parsed.hash, iterations }
  } catch {
    return undefined
  }
}

function writeLock(value: StoredParentLock | undefined) {
  try {
    if (value) localStorage.setItem(LOCK_KEY, JSON.stringify(value))
    else localStorage.removeItem(LOCK_KEY)
    return true
  } catch {
    return false
  }
}

async function derivePin(pin: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  if (!globalThis.crypto?.subtle) throw new Error('Secure PIN storage is unavailable in this browser')
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: salt.buffer, iterations },
    material,
    256,
  )
  return encodeBase64(new Uint8Array(bits))
}

export function validateParentPin(pin: string) {
  if (!/^\d{4,8}$/.test(pin)) return 'Use a 4–8 digit PIN.'
  return ''
}

export function parentPinConfigured() {
  return Boolean(readLock())
}

export async function setParentPin(pin: string) {
  const validation = validateParentPin(pin)
  if (validation) throw new Error(validation)
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivePin(pin, salt, ITERATIONS)
  if (!writeLock({ version: 1, salt: encodeBase64(salt), hash, iterations: ITERATIONS })) {
    throw new Error('This browser could not save the parent PIN.')
  }
}

export async function verifyParentPin(pin: string) {
  const stored = readLock()
  if (!stored) return false
  const validation = validateParentPin(pin)
  if (validation) return false
  const actual = await derivePin(pin, decodeBase64(stored.salt), stored.iterations)
  if (actual.length !== stored.hash.length) return false
  let different = 0
  for (let index = 0; index < actual.length; index += 1) {
    different |= actual.charCodeAt(index) ^ stored.hash.charCodeAt(index)
  }
  return different === 0
}

export function clearParentPin() {
  return writeLock(undefined)
}
