import { readFile } from 'node:fs/promises'

const lock = await readFile('src/lib/parentLock.ts', 'utf8')
const kids = await readFile('src/components/KidsModeSettings.tsx', 'utf8')
const styles = await readFile('src/styles.css', 'utf8')

for (const marker of [
  "tv-phone:kids-parent-lock:v1",
  "PBKDF2",
  "SHA-256",
  "160_000",
  "crypto.getRandomValues",
  "^\\d{4,8}$",
  "verifyParentPin",
  "clearParentPin",
]) {
  if (!lock.includes(marker)) throw new Error(`Parent lock audit failed: lock helper missing ${marker}`)
}

for (const marker of [
  'Parent PIN required',
  'Save parent PIN',
  'Remove PIN and use hold only',
  'MAX_PIN_ATTEMPTS = 5',
  'PIN_COOLDOWN_MS = 30_000',
  'verifyParentPin(pin)',
  'hasPin || unlocked',
  'PBKDF2-derived hash',
]) {
  if (!kids.includes(marker)) throw new Error(`Parent lock audit failed: Kids Safe UI missing ${marker}`)
}

if (!styles.includes('.kids-pin-unlock__row')) throw new Error('Parent lock audit failed: parent PIN responsive styles missing')
if (!styles.includes('@media (max-width:390px)')) throw new Error('Parent lock audit failed: small-phone PIN layout missing')

console.log('TV Phone parent lock audit passed.')
