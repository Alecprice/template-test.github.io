import { readFile } from 'node:fs/promises'

const config = JSON.parse(await readFile('vercel.json', 'utf8'))
const rules = Array.isArray(config.headers) ? config.headers : []

function headerValue(source, key) {
  const rule = rules.find((entry) => entry.source === source)
  const header = rule?.headers?.find((entry) => entry.key === key)
  return header?.value
}

const globalRequired = new Map([
  ['X-Content-Type-Options', 'nosniff'],
  ['X-Frame-Options', 'DENY'],
  ['Referrer-Policy', 'no-referrer'],
  ['X-DNS-Prefetch-Control', 'off'],
])
for (const [key, value] of globalRequired) {
  if (headerValue('/(.*)', key) !== value) throw new Error(`Delivery security audit failed: ${key}`)
}
const policy = headerValue('/(.*)', 'Permissions-Policy') ?? ''
for (const marker of ['camera=()', 'geolocation=()', 'payment=()', 'usb=()', 'serial=()']) {
  if (!policy.includes(marker)) throw new Error(`Delivery security audit failed: Permissions-Policy missing ${marker}`)
}
if (policy.includes('microphone=()')) throw new Error('Delivery security audit failed: microphone must remain available for dictation')

const csp = headerValue('/(.*)', 'Content-Security-Policy') ?? ''
for (const marker of ["frame-ancestors 'none'", "object-src 'none'", "base-uri 'self'", "form-action 'self'"]) {
  if (!csp.includes(marker)) throw new Error(`Delivery security audit failed: CSP missing ${marker}`)
}
if (csp.includes('connect-src')) throw new Error('Delivery security audit failed: do not restrict LAN/Supabase connections without an explicit compatibility pass')

if (headerValue('/assets/(.*)', 'Cache-Control') !== 'public, max-age=31536000, immutable') {
  throw new Error('Delivery security audit failed: hashed assets are not immutable')
}
if (headerValue('/sw.js', 'Cache-Control') !== 'no-cache, no-store, must-revalidate') {
  throw new Error('Delivery security audit failed: service worker caching is unsafe')
}
if (headerValue('/manifest.webmanifest', 'Cache-Control') !== 'public, max-age=0, must-revalidate') {
  throw new Error('Delivery security audit failed: manifest must revalidate')
}

console.log('TV Phone static delivery security audit passed.')
