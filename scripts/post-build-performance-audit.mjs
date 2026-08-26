import { readdir, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const html = await readFile('dist/index.html', 'utf8')
if (html.includes('vendor-supabase')) throw new Error('Post-build performance audit failed: Supabase is still present in the initial HTML preload graph')

const assets = await readdir('dist/assets')
const supabaseChunk = assets.find((name) => name.startsWith('vendor-supabase-') && name.endsWith('.js'))
if (!supabaseChunk) throw new Error('Post-build performance audit failed: expected async Supabase vendor chunk was not emitted')
const supabaseBytes = (await stat(join('dist/assets', supabaseChunk))).size

const appChunk = assets.find((name) => /^index-.*\.js$/.test(name))
if (!appChunk) throw new Error('Post-build performance audit failed: app chunk not found')
const appBytes = (await stat(join('dist/assets', appChunk))).size
if (appBytes > 190_000) throw new Error(`Post-build performance audit failed: app chunk grew to ${appBytes} bytes`)

console.log(`TV Phone initial payload audit passed. App ${appBytes} bytes; Supabase ${supabaseBytes} bytes deferred.`)
